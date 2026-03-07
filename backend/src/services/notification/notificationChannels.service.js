const Notification = require('../../models/Notification.model');

const sendWhatsAppText = async ({ to, text }) => {
  const apiBase = process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com/v21.0';
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { sent: false, skipped: true, reason: 'Missing WhatsApp configuration' };
  }

  const response = await fetch(`${apiBase}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { sent: false, error: data.error?.message || 'Failed to send WhatsApp text' };
  }

  return { sent: true, provider: 'whatsapp', response: data };
};

const dispatchInApp = async ({ clinicId, eventType, recipient, payload }) =>
  Notification.create({
    clinicId,
    type: eventType,
    channel: 'in_app',
    recipient,
    payload,
    status: 'sent',
    sentAt: new Date(),
  });

const dispatchWhatsApp = async ({ clinicId, eventType, recipient, payload }) => {
  const providerRes = await sendWhatsAppText({ to: recipient, text: payload.text });

  return Notification.create({
    clinicId,
    type: eventType,
    channel: 'whatsapp',
    recipient,
    payload,
    status: providerRes.sent ? 'sent' : 'failed',
    failureReason: providerRes.error,
    sentAt: providerRes.sent ? new Date() : undefined,
  });
};

const dispatchSms = async ({ clinicId, eventType, recipient, payload }) => {
  const smsEnabled = process.env.SMS_ENABLED === 'true';

  return Notification.create({
    clinicId,
    type: eventType,
    channel: 'sms',
    recipient,
    payload,
    status: smsEnabled ? 'queued' : 'failed',
    failureReason: smsEnabled ? undefined : 'SMS provider not configured',
  });
};

module.exports = {
  dispatchInApp,
  dispatchWhatsApp,
  dispatchSms,
};
