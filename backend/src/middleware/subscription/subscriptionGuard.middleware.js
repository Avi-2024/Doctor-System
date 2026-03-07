const Subscription = require('../../models/Subscription.model');
const User = require('../../models/User.model');
const Patient = require('../../models/Patient.model');
const Notification = require('../../models/Notification.model');

const getMonthWindow = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const assertActiveSubscription = async (clinicId) => {
  const subscription = await Subscription.findOne({ clinicId });
  if (!subscription) {
    const error = new Error('Subscription not found for clinic');
    error.statusCode = 402;
    throw error;
  }

  const now = new Date();
  if (subscription.status !== 'active' || now > new Date(subscription.expiresAt)) {
    const error = new Error('Subscription expired or inactive. Feature is blocked.');
    error.statusCode = 402;
    throw error;
  }

  return subscription;
};

const getUsageStats = async (clinicId) => {
  const { start, end } = getMonthWindow();

  const [doctorsCount, patientsCount, whatsappMessagesCount] = await Promise.all([
    User.countDocuments({ clinicId, role: 'DOCTOR', isActive: true }),
    Patient.countDocuments({ clinicId, createdAt: { $gte: start, $lte: end } }),
    Notification.countDocuments({ clinicId, channel: 'whatsapp', createdAt: { $gte: start, $lte: end } }),
  ]);

  return {
    doctorsCount,
    patientsCount,
    whatsappMessagesCount,
  };
};

const enforceSubscriptionActive = async (req, res, next) => {
  try {
    const clinicId = req.auth?.clinicId || req.body?.clinicId || req.query?.clinicId || req.params?.clinicId;
    if (!clinicId) return res.status(400).json({ message: 'clinicId is required to validate subscription' });

    req.subscription = await assertActiveSubscription(clinicId);
    return next();
  } catch (error) {
    return next(error);
  }
};

const enforcePlanLimit = (limitType) => async (req, res, next) => {
  try {
    const clinicId = req.auth?.clinicId || req.body?.clinicId || req.query?.clinicId || req.params?.clinicId;
    if (!clinicId) return res.status(400).json({ message: 'clinicId is required to validate limits' });

    const subscription = await assertActiveSubscription(clinicId);
    const usage = await getUsageStats(clinicId);

    const limitMap = {
      doctors: {
        used: usage.doctorsCount,
        max: subscription.limits.maxDoctors,
        message: 'Doctor limit reached for current subscription plan',
      },
      patients: {
        used: usage.patientsCount,
        max: subscription.limits.maxPatientsPerMonth,
        message: 'Monthly patient limit reached for current subscription plan',
      },
      whatsapp: {
        used: usage.whatsappMessagesCount,
        max: subscription.limits.maxWhatsappMessagesPerMonth,
        message: 'Monthly WhatsApp message limit reached for current subscription plan',
      },
    };

    const limit = limitMap[limitType];
    if (!limit) {
      return res.status(500).json({ message: 'Invalid plan limit middleware configuration' });
    }

    if (limit.used >= limit.max) {
      return res.status(402).json({
        message: limit.message,
        usage: { used: limit.used, max: limit.max, plan: subscription.plan },
      });
    }

    req.subscription = subscription;
    req.planUsage = usage;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  enforceSubscriptionActive,
  enforcePlanLimit,
};
