/**
 * Appointments Validator
 * Validates appointment workflow payloads.
 */

const { body, param } = require('express-validator');

const bookingRules = [
  body('patientId').isUUID(),
  body('doctorId').isUUID(),
  body('branchId').optional({ nullable: true }).isUUID(),
  body('appointmentDate').isISO8601(),
  body('startTime').matches(/^\d{2}:\d{2}$/),
  body('endTime').matches(/^\d{2}:\d{2}$/),
];
const transitionRules = [
  param('id').isUUID(),
  param('action').isIn(['cancel', 'checkIn', 'startConsultation', 'complete', 'noShow']),
  body('cancellationReason').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

module.exports = { bookingRules, transitionRules };
