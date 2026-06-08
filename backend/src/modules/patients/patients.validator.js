/**
 * Patients Validator
 * Validates patient and history payloads.
 */

const { body } = require('express-validator');

const recordTypes = ['FAMILY_MEMBER', 'MEDICAL_HISTORY', 'ALLERGY', 'DOCUMENT'];

const patientCreateRules = [
  body('patient_code').isString().trim().notEmpty(),
  body('full_name').isString().trim().isLength({ min: 2, max: 140 }),
  body('phone').isString().trim().isLength({ min: 5, max: 20 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
];
const patientUpdateRules = [
  body('full_name').optional().isString().trim().isLength({ min: 2, max: 140 }),
  body('phone').optional().isString().trim().isLength({ min: 5, max: 20 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('demographics').optional({ nullable: true }).isObject(),
  body('medical_summary').optional({ nullable: true }).isObject(),
];
const patientRecordCreateRules = [body('patient_id').isUUID(), body('record_type').isIn(recordTypes), body('record_data').isObject()];
const patientRecordUpdateRules = [body('record_type').optional().isIn(recordTypes), body('record_data').optional().isObject()];

module.exports = { patientCreateRules, patientUpdateRules, patientRecordCreateRules, patientRecordUpdateRules };
