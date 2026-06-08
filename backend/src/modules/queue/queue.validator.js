/**
 * Queue Validator
 * Validates queue workflow payloads.
 */

const { body, param } = require('express-validator');

const checkInRules = [body('patientId').isUUID(), body('doctorId').isUUID(), body('appointmentId').optional({ nullable: true }).isUUID(), body('queueDate').isISO8601()];
const callNextRules = [body('doctorId').isUUID(), body('queueDate').isISO8601()];
const transitionRules = [param('id').isUUID(), param('action').isIn(['start', 'complete', 'noShow', 'skip'])];

module.exports = { checkInRules, callNextRules, transitionRules };
