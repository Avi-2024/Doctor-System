const mongoose = require('mongoose');
const subscriptionService = require('../../services/subscription/subscription.service');
const { verifyWebhookSignature } = require('../../services/subscription/razorpay.service');

const createOrUpdateClinicSubscription = async (req, res, next) => {
  try {
    const { clinicId, plan, status, startsAt, expiresAt } = req.body;

    if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
      return res.status(400).json({ message: 'Valid clinicId is required' });
    }

    if (!plan || !['BASIC', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return res.status(400).json({ message: 'plan must be one of BASIC, PRO, ENTERPRISE' });
    }

    if (!expiresAt) {
      return res.status(400).json({ message: 'expiresAt is required' });
    }

    const subscription = await subscriptionService.upsertClinicSubscription({
      clinicId,
      plan,
      status,
      startsAt,
      expiresAt,
    });

    return res.status(200).json({ message: 'Subscription saved', subscription });
  } catch (error) {
    return next(error);
  }
};

const createRazorpaySubscription = async (req, res, next) => {
  try {
    const { clinicId, plan, customerId } = req.body;

    if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
      return res.status(400).json({ message: 'Valid clinicId is required' });
    }

    if (!plan || !['BASIC', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return res.status(400).json({ message: 'plan must be one of BASIC, PRO, ENTERPRISE' });
    }

    if (!customerId) {
      return res.status(400).json({ message: 'customerId is required' });
    }

    const data = await subscriptionService.createRazorpaySubscriptionForClinic({
      clinicId,
      plan,
      customerId,
    });

    return res.status(201).json({
      message: 'Razorpay subscription created',
      ...data,
    });
  } catch (error) {
    return next(error);
  }
};

const getClinicSubscription = async (req, res, next) => {
  try {
    const clinicId = req.params.clinicId || req.query.clinicId || req.auth?.clinicId;

    if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
      return res.status(400).json({ message: 'Valid clinicId is required' });
    }

    const subscription = await subscriptionService.getClinicSubscription(clinicId);
    return res.status(200).json({ subscription });
  } catch (error) {
    return next(error);
  }
};

const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ message: 'Missing Razorpay webhook signature or secret' });
    }

    const payloadString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const valid = verifyWebhookSignature({
      payload: payloadString,
      signature,
      secret: webhookSecret,
    });

    if (!valid) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const eventPayload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await subscriptionService.handleRazorpayWebhookEvent(eventPayload);

    return res.status(200).json({ message: 'Webhook processed', result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrUpdateClinicSubscription,
  createRazorpaySubscription,
  getClinicSubscription,
  razorpayWebhook,
};
