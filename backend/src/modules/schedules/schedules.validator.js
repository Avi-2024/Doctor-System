/**
 * Schedules Validator
 * Validates doctor schedule and leave payloads.
 */

const { body } = require('express-validator');

const scheduleCreateRules = [body('doctor_id').isUUID(), body('weekly_schedule').isArray({ min: 1 })];
const scheduleUpdateRules = [body('weekly_schedule').optional().isArray({ min: 1 }), body('timezone').optional().isString().trim().notEmpty(), body('is_active').optional().isBoolean()];
const leaveCreateRules = [body('doctor_id').isUUID(), body('starts_at').isISO8601(), body('ends_at').isISO8601()];
const leaveUpdateRules = [body('starts_at').optional().isISO8601(), body('ends_at').optional().isISO8601(), body('status').optional().isIn(['REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'])];

module.exports = { scheduleCreateRules, scheduleUpdateRules, leaveCreateRules, leaveUpdateRules };
