/**
 * WhatsApp Service
 * Verifies Meta webhooks and queues messages.
 */

const crypto = require('crypto');
const { env } = require('../../config/env');
const { ApiError } = require('../../common/errors/ApiError');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { assertUsageAvailable } = require('../subscriptions/subscriptions.service');
const repository = require('./whatsapp.repository');

// Verify webhook signature.
const verifySignature = (rawBody, signature) => {
  const expected = `sha256=${crypto.createHmac('sha256', env.WHATSAPP_APP_SECRET).update(rawBody).digest('hex')}`;
  if (!signature || expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) throw new ApiError(401, 'Invalid WhatsApp webhook signature');
};

// Normalize Meta message type.
const normalizeMessageType = (type) => {
  if (type === 'interactive') return 'INTERACTIVE';
  if (['image', 'audio', 'video', 'document', 'sticker'].includes(type)) return 'MEDIA';
  return 'TEXT';
};

// Build Meta outbound payload.
const buildOutboundPayload = (notification) => {
  const payload = notification.payload || {};
  if (payload.templateName) {
    return {
      messaging_product: 'whatsapp',
      to: notification.recipient,
      type: 'template',
      template: {
        name: payload.templateName,
        language: { code: payload.languageCode || 'en_US' },
        ...(payload.components?.length ? { components: payload.components } : {}),
      },
    };
  }
  return { messaging_product: 'whatsapp', to: notification.recipient, type: 'text', text: { body: notification.message } };
};

// Process signed Meta webhook payload.
const processWebhook = async (payload) => runInTransaction(async (connection) => {
  let received = 0;
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) continue;
      const account = await repository.findAccountByPhoneNumberId(phoneNumberId, connection);
      if (!account) continue;

      for (const message of value.messages || []) {
        const result = await repository.insertInboundMessage({
          clinicId: account.clinic_id,
          sender: message.from,
          recipient: account.display_phone_number,
          messageType: normalizeMessageType(message.type),
          messageBody: message.text?.body || '',
          providerMessageId: message.id,
          payload: JSON.stringify(message),
        }, connection);
        received += result.affectedRows;
      }

      for (const delivery of value.statuses || []) {
        const status = String(delivery.status || '').toUpperCase();
        if (!['SENT', 'DELIVERED', 'READ', 'FAILED'].includes(status)) continue;
        await repository.updateMessageDelivery(account.clinic_id, delivery.id, status, connection);
        await repository.updateNotificationDelivery(account.clinic_id, delivery.id, status, connection);
      }
    }
  }
  return { received };
});

// Queue outbound WhatsApp message.
const queueMessage = async (payload, context) => runInTransaction(async (connection) => {
  await assertUsageAvailable({ clinicId: context.clinicId, metric: 'monthlyWhatsAppMessages', connection });
  const account = await repository.findActiveAccount(context.clinicId, connection);
  if (!account) throw new ApiError(409, 'Active WhatsApp account required');
  const notification = await repository.notifications.create({
    clinic_id: context.clinicId,
    channel: 'WHATSAPP',
    recipient: payload.recipient,
    message: payload.message || `Template: ${payload.templateName}`,
    payload: { ...(payload.payload || {}), ...(payload.templateName ? { templateName: payload.templateName, languageCode: payload.languageCode || 'en_US', components: payload.components || [] } : {}) },
    status: 'QUEUED',
    scheduled_for: payload.scheduledFor || null,
    attempts: 0,
    created_by: context.userId,
    updated_by: context.userId,
  }, connection);
  const history = await repository.messages.create({
    clinic_id: context.clinicId,
    notification_id: notification.id,
    patient_id: payload.patientId || null,
    direction: 'OUTBOUND',
    sender: account.display_phone_number,
    recipient: payload.recipient,
    message_type: payload.templateName ? 'TEMPLATE' : 'TEXT',
    message_body: payload.message || payload.templateName,
    status: 'QUEUED',
    payload: payload.payload || {},
    created_by: context.userId,
    updated_by: context.userId,
  }, connection);
  return { notification, history };
});

// Record retryable delivery failure.
const markDeliveryFailure = async (notification, context, error) => {
  const exhausted = notification.attempts >= env.NOTIFICATION_MAX_ATTEMPTS;
  const delaySeconds = Math.min(env.NOTIFICATION_RETRY_BASE_SECONDS * (2 ** Math.max(notification.attempts - 1, 0)), 3600);
  await repository.notifications.updateById(notification.id, context.clinicId, {
    status: exhausted ? 'FAILED' : 'QUEUED',
    scheduled_for: exhausted ? notification.scheduled_for : new Date(Date.now() + delaySeconds * 1000),
    last_error: String(error.message || 'WhatsApp delivery failed').slice(0, 1000),
    updated_by: context.userId,
  });
};

// Send queued WhatsApp notification.
const sendMessage = async (notificationId, context) => {
  if (!env.WHATSAPP_ACCESS_TOKEN) throw new ApiError(500, 'WhatsApp access token is not configured');
  const claimed = await runInTransaction(async (connection) => {
    const claim = await repository.claimNotification(notificationId, context.clinicId, context.userId, connection);
    if (!claim.count) throw new ApiError(404, 'Queued notification not found');
    const notification = await repository.notifications.findById(notificationId, context.clinicId, connection);
    const account = await repository.findActiveAccount(context.clinicId, connection);
    if (!account) throw new ApiError(409, 'Active WhatsApp account required');
    return { notification, account };
  });

  let result;
  try {
    const response = await fetch(`${env.WHATSAPP_API_BASE_URL}/${claimed.account.phone_number_id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildOutboundPayload(claimed.notification)),
    });
    const responseText = await response.text();
    result = responseText ? JSON.parse(responseText) : {};
    if (!response.ok) throw new ApiError(502, result.error?.message || 'WhatsApp delivery failed');
  } catch (error) {
    await markDeliveryFailure(claimed.notification, context, error);
    throw error instanceof ApiError ? error : new ApiError(502, 'WhatsApp delivery failed');
  }
  const providerId = result.messages?.[0]?.id || null;
  await repository.notifications.updateById(claimed.notification.id, context.clinicId, { status: 'SENT', provider_message_id: providerId, scheduled_for: null, last_error: null, updated_by: context.userId });
  const message = await repository.findMessageByNotificationId(notificationId, context.clinicId);
  if (message) await repository.messages.updateById(message.id, context.clinicId, { status: 'SENT', provider_message_id: providerId, updated_by: context.userId });
  return { notificationId, providerMessageId: providerId };
};

// Recover stale processing notifications.
const recoverStaleMessages = async () => repository.recoverStaleMessages({
  maxAttempts: env.NOTIFICATION_MAX_ATTEMPTS,
  cutoff: new Date(Date.now() - env.NOTIFICATION_PROCESSING_TIMEOUT_SECONDS * 1000),
});

// List due WhatsApp notifications.
const listDueMessages = async () => repository.listDueMessages({ maxAttempts: env.NOTIFICATION_MAX_ATTEMPTS, limit: env.NOTIFICATION_BATCH_SIZE });

module.exports = { verifySignature, processWebhook, queueMessage, sendMessage, recoverStaleMessages, listDueMessages, buildOutboundPayload };
