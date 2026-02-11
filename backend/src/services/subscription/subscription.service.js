const Subscription = require('../../models/Subscription.model');
const Clinic = require('../../models/Clinic.model');
const { SUBSCRIPTION_PLANS } = require('../../utils/constants/subscriptionPlans');
const { createRazorpaySubscription } = require('./razorpay.service');

const getPlanConfig = (plan) => {
  const config = SUBSCRIPTION_PLANS[plan];
  if (!config) {
    const error = new Error('Invalid subscription plan');
    error.statusCode = 400;
    throw error;
  }
  return config;
};

const upsertClinicSubscription = async ({ clinicId, plan, status = 'active', startsAt, expiresAt }) => {
  const planConfig = getPlanConfig(plan);

  const subscription = await Subscription.findOneAndUpdate(
    { clinicId },
    {
      clinicId,
      plan,
      status,
      startsAt: startsAt || new Date(),
      expiresAt,
      limits: {
        maxDoctors: planConfig.maxDoctors,
        maxPatientsPerMonth: planConfig.maxPatientsPerMonth,
        maxWhatsappMessagesPerMonth: planConfig.maxWhatsappMessagesPerMonth,
      },
    },
    { new: true, upsert: true }
  );

  await Clinic.findByIdAndUpdate(clinicId, {
    subscriptionStatus: status,
    planName: plan,
  });

  return subscription;
};

const createRazorpaySubscriptionForClinic = async ({ clinicId, plan, customerId }) => {
  const planIdEnvMap = {
    BASIC: process.env.RAZORPAY_PLAN_ID_BASIC,
    PRO: process.env.RAZORPAY_PLAN_ID_PRO,
    ENTERPRISE: process.env.RAZORPAY_PLAN_ID_ENTERPRISE,
  };

  const planId = planIdEnvMap[plan];
  if (!planId) {
    const error = new Error(`Razorpay plan id not configured for ${plan}`);
    error.statusCode = 500;
    throw error;
  }

  const razorpaySub = await createRazorpaySubscription({
    customerId,
    planId,
    totalCount: 12,
    notes: { clinicId: String(clinicId), plan },
  });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.findOneAndUpdate(
    { clinicId },
    {
      $set: {
        plan,
        status: 'active',
        expiresAt,
        razorpay: {
          customerId,
          subscriptionId: razorpaySub.id,
          planId,
          shortUrl: razorpaySub.short_url,
        },
      },
      $setOnInsert: {
        startsAt: new Date(),
        limits: getPlanConfig(plan),
      },
    },
    { upsert: true, new: true }
  );

  await Clinic.findByIdAndUpdate(clinicId, {
    subscriptionStatus: 'active',
    planName: plan,
  });

  return { subscription, razorpaySubscription: razorpaySub };
};

const handleRazorpayWebhookEvent = async (event) => {
  const eventType = event?.event;
  const payload = event?.payload || {};

  const subscriptionEntity = payload.subscription?.entity;
  if (!subscriptionEntity) {
    return { ignored: true, reason: 'No subscription entity' };
  }

  const razorpaySubscriptionId = subscriptionEntity.id;
  const status = subscriptionEntity.status;

  const subscription = await Subscription.findOne({ 'razorpay.subscriptionId': razorpaySubscriptionId });
  if (!subscription) {
    return { ignored: true, reason: 'Subscription mapping not found' };
  }

  const statusMap = {
    active: 'active',
    cancelled: 'cancelled',
    halted: 'past_due',
    pending: 'past_due',
    completed: 'active',
  };

  const mappedStatus = statusMap[status] || subscription.status;
  subscription.status = mappedStatus;
  subscription.metadata = {
    ...(subscription.metadata || {}),
    lastWebhookEvent: eventType,
  };

  if (subscriptionEntity.current_end) {
    subscription.expiresAt = new Date(subscriptionEntity.current_end * 1000);
  }

  await subscription.save();

  await Clinic.findByIdAndUpdate(subscription.clinicId, {
    subscriptionStatus: mappedStatus,
    planName: subscription.plan,
  });

  return {
    handled: true,
    clinicId: subscription.clinicId,
    subscriptionId: subscription._id,
    status: mappedStatus,
    eventType,
  };
};

const getClinicSubscription = async (clinicId) => {
  const subscription = await Subscription.findOne({ clinicId });
  if (!subscription) {
    const error = new Error('Subscription not found');
    error.statusCode = 404;
    throw error;
  }
  return subscription;
};

module.exports = {
  upsertClinicSubscription,
  createRazorpaySubscriptionForClinic,
  handleRazorpayWebhookEvent,
  getClinicSubscription,
};
