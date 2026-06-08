/**
 * WhatsApp Repository
 * Persists WhatsApp messages and notifications.
 */

const { prisma } = require('../../database/prisma');
const { createBaseRepository } = require('../../common/repositories/BaseRepository');
const { createId } = require('../../common/utils/ids');

const notifications = createBaseRepository({
  table: 'notifications',
  columns: ['id', 'clinic_id', 'channel', 'recipient', 'message', 'payload', 'status', 'scheduled_for', 'provider_message_id', 'attempts', 'last_error', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['channel', 'status'],
  jsonFields: ['payload'],
});
const messages = createBaseRepository({
  table: 'whatsapp_messages',
  columns: ['id', 'clinic_id', 'notification_id', 'patient_id', 'direction', 'sender', 'recipient', 'message_type', 'message_body', 'provider_message_id', 'status', 'payload', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['patient_id', 'direction', 'status'],
  jsonFields: ['payload'],
});

// Find account by provider phone identifier.
const findAccountByPhoneNumberId = async (phoneNumberId, connection) => {
  return (connection || prisma).whatsapp_accounts.findFirst({ where: { phone_number_id: phoneNumberId, is_active: true, is_deleted: false } });
};

// Find active tenant account.
const findActiveAccount = async (clinicId, connection) => {
  return (connection || prisma).whatsapp_accounts.findFirst({ where: { clinic_id: clinicId, is_active: true, is_deleted: false } });
};

// Insert idempotent inbound message.
const insertInboundMessage = async (message, connection) => {
  try {
    await (connection || prisma).whatsapp_messages.create({
      data: {
        id: createId(),
        clinic_id: message.clinicId,
        direction: 'INBOUND',
        sender: message.sender,
        recipient: message.recipient,
        message_type: message.messageType,
        message_body: message.messageBody,
        provider_message_id: message.providerMessageId,
        status: 'RECEIVED',
        payload: JSON.parse(message.payload),
      },
    });
    return { affectedRows: 1 };
  } catch (error) {
    if (error.code === 'P2002') return { affectedRows: 0 };
    throw error;
  }
};

// Update provider message delivery.
const updateMessageDelivery = async (clinicId, providerMessageId, status, connection) => (connection || prisma).whatsapp_messages.updateMany({
  where: { clinic_id: clinicId, provider_message_id: providerMessageId, is_deleted: false },
  data: { status },
});

// Update notification delivery.
const updateNotificationDelivery = async (clinicId, providerMessageId, status, connection) => (connection || prisma).notifications.updateMany({
  where: { clinic_id: clinicId, provider_message_id: providerMessageId, is_deleted: false },
  data: { status },
});

// Claim queued notification.
const claimNotification = async (notificationId, clinicId, userId, connection) => (connection || prisma).notifications.updateMany({
  where: { id: notificationId, clinic_id: clinicId, status: 'QUEUED', is_deleted: false, OR: [{ scheduled_for: null }, { scheduled_for: { lte: new Date() } }] },
  data: { status: 'PROCESSING', attempts: { increment: 1 }, updated_by: userId },
});

// Find message by notification.
const findMessageByNotificationId = async (notificationId, clinicId, connection) => {
  return (connection || prisma).whatsapp_messages.findFirst({ where: { notification_id: notificationId, clinic_id: clinicId, is_deleted: false }, select: { id: true } });
};

// Recover stale processing notifications.
const recoverStaleMessages = async ({ maxAttempts, cutoff }) => {
  const client = prisma;
  await client.notifications.updateMany({
    where: { channel: 'WHATSAPP', status: 'PROCESSING', attempts: { gte: maxAttempts }, is_deleted: false, updated_at: { lt: cutoff } },
    data: { status: 'FAILED', last_error: 'Processing timeout' },
  });
  return client.notifications.updateMany({
    where: { channel: 'WHATSAPP', status: 'PROCESSING', attempts: { lt: maxAttempts }, is_deleted: false, updated_at: { lt: cutoff } },
    data: { status: 'QUEUED', scheduled_for: new Date(), last_error: 'Processing timeout' },
  });
};

// List due outbound notifications.
const listDueMessages = async ({ maxAttempts, limit }) => {
  const boundedLimit = Math.min(Math.max(Number(limit) || 1, 1), 500);
  return prisma.notifications.findMany({
    where: { channel: 'WHATSAPP', status: 'QUEUED', attempts: { lt: maxAttempts }, is_deleted: false, OR: [{ scheduled_for: null }, { scheduled_for: { lte: new Date() } }] },
    select: { id: true, clinic_id: true },
    orderBy: [{ scheduled_for: 'asc' }, { created_at: 'asc' }],
    take: boundedLimit,
  });
};

module.exports = {
  notifications,
  messages,
  findAccountByPhoneNumberId,
  findActiveAccount,
  insertInboundMessage,
  updateMessageDelivery,
  updateNotificationDelivery,
  claimNotification,
  findMessageByNotificationId,
  recoverStaleMessages,
  listDueMessages,
};
