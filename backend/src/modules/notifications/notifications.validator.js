/**
 * Notifications Validator
 * Validates reminder and notification requests.
 */

const { body, param } = require('express-validator');
const { NOTIFICATION_CHANNELS } = require('../../common/constants/notificationChannels');

const reminderRules = [
  body('channel').isIn([NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.WHATSAPP]),
  body('recipient').isString().trim().notEmpty(),
  body('message').isString().trim().notEmpty(),
  body('patientId').optional({ nullable: true }).isUUID(),
  body('payload').optional().isObject(),
  body('scheduledFor').optional({ nullable: true }).isISO8601(),
];
const notificationIdRules = [param('id').isUUID()];

module.exports = { reminderRules, notificationIdRules };
