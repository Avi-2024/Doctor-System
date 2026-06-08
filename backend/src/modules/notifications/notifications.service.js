/**
 * Notifications Service
 * Manages in-app and WhatsApp reminders.
 */

const repository = require('./notifications.repository');
const whatsappService = require('../whatsapp/whatsapp.service');
const { ApiError } = require('../../common/errors/ApiError');
const { NOTIFICATION_CHANNELS } = require('../../common/constants/notificationChannels');

// Queue tenant reminder.
const queueReminder = async (payload, context) => {
  if (payload.channel === NOTIFICATION_CHANNELS.WHATSAPP) {
    return whatsappService.queueMessage({
      recipient: payload.recipient,
      message: payload.message,
      patientId: payload.patientId,
      scheduledFor: payload.scheduledFor,
      payload: payload.payload,
    }, context);
  }
  return repository.create({
    clinic_id: context.clinicId,
    channel: NOTIFICATION_CHANNELS.IN_APP,
    recipient: payload.recipient,
    message: payload.message,
    payload: payload.payload || {},
    status: 'QUEUED',
    scheduled_for: payload.scheduledFor || null,
    attempts: 0,
    created_by: context.userId,
    updated_by: context.userId,
  });
};

// Mark in-app notification read.
const markRead = async (id, context) => {
  const notification = await repository.findById(id, context.clinicId);
  if (!notification || notification.channel !== NOTIFICATION_CHANNELS.IN_APP) throw new ApiError(404, 'In-app notification not found');
  return repository.updateById(id, context.clinicId, { status: 'READ', updated_by: context.userId });
};

// Get tenant notification.
const getById = async (id, context) => {
  const notification = await repository.findById(id, context.clinicId);
  if (!notification) throw new ApiError(404, 'Notification not found');
  return notification;
};

// List tenant notifications.
const list = async (requestQuery, context) => repository.list(context.clinicId, requestQuery);

module.exports = { queueReminder, markRead, getById, list };
