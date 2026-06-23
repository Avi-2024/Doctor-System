/**
 * Patient Records Validators
 * Validates append-only patient record API input.
 */

const { body, param, query } = require('express-validator');
const { validate } = require('../../common/middleware/validate');
const { PATIENT_RECORD_STATUS, PATIENT_RECORD_TYPE } = require('./patientRecords.constants');

const jsonSize = (maxBytes) => (value) => {
  if (value == null) return true;
  return Buffer.byteLength(JSON.stringify(value), 'utf8') <= maxBytes;
};

const listRecordsValidators = [
  query('page').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional({ nullable: true }).isInt({ min: 1, max: 100 }).toInt(),
  query('patientId').optional({ nullable: true }).isUUID(4),
  query('recordType').optional({ nullable: true }).isIn(Object.values(PATIENT_RECORD_TYPE)),
  query('status').optional({ nullable: true }).isIn(Object.values(PATIENT_RECORD_STATUS)),
  validate,
];

const createRecordValidators = [
  body('patientId').isUUID(4),
  body('recordType').isIn(Object.values(PATIENT_RECORD_TYPE)),
  body('title').isString().trim().isLength({ min: 2, max: 190 }),
  body('recordData').isObject().custom(jsonSize(50000)),
  body('recordedAt').optional({ nullable: true }).isISO8601(),
  body('attachmentCount').optional({ nullable: true }).isInt({ min: 0, max: 0 }).toInt(),
  validate,
];

const recordIdParamValidators = [
  param('id').isUUID(4),
  validate,
];

const archiveRecordValidators = [
  param('id').isUUID(4),
  body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  validate,
];

module.exports = {
  archiveRecordValidators,
  createRecordValidators,
  listRecordsValidators,
  recordIdParamValidators,
};
