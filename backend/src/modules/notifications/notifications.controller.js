/**
 * Notifications Controller
 * Handles tenant notification requests.
 */

const service = require('./notifications.service');
const { successResponse } = require('../../common/utils/response');
const { recordAudit } = require('../audit/audit.service');

// Build notification context.
const context = (req) => ({ clinicId: req.tenant.clinicId, userId: req.auth.userId });

// Queue reminder.
const queueReminder = async (req, res) => {
  const result = await service.queueReminder(req.body, context(req));
  const record = result.notification || result;
  await recordAudit({ req, action: 'QUEUE_REMINDER', moduleName: 'Notification', entityType: 'Notification', entityId: record.id, after: record });
  return successResponse(res, 'Reminder queued', result, undefined, 201);
};

// Mark notification read.
const markRead = async (req, res) => successResponse(res, 'Notification marked read', await service.markRead(req.params.id, context(req)));

// Get notification.
const getById = async (req, res) => successResponse(res, 'Notification fetched', await service.getById(req.params.id, context(req)));

// List notifications.
const list = async (req, res) => {
  const result = await service.list(req.query, context(req));
  return successResponse(res, 'Notification list fetched', { items: result.items }, result.meta);
};

module.exports = { queueReminder, markRead, getById, list };
