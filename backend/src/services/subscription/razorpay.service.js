const crypto = require('crypto');
const Razorpay = require('razorpay');

const createRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay credentials are not configured');
    error.statusCode = 500;
    throw error;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const createRazorpaySubscription = async ({ customerId, planId, totalCount = 12, notes = {} }) => {
  const razorpay = createRazorpayClient();

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: totalCount,
    customer_id: customerId,
    notes,
  });

  return subscription;
};

const verifyWebhookSignature = ({ payload, signature, secret }) => {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return expected === signature;
};

module.exports = {
  createRazorpaySubscription,
  verifyWebhookSignature,
};
