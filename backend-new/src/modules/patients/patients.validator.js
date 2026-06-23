/**
 * Patients Validators
 * Validates patient registry API input.
 */

const { body, header, param, query } = require('express-validator');
const { validate } = require('../../common/middleware/validate');
const { PATIENT_GENDER, PATIENT_STATUS } = require('./patients.constants');

const jsonSize = (maxBytes) => (value) => {
  if (value == null) return true;
  return Buffer.byteLength(JSON.stringify(value), 'utf8') <= maxBytes;
};

const dateNotFuture = (value) => {
  if (!value) return true;
  return new Date(value).getTime() <= Date.now();
};

const listPatientsValidators = [
  query('page').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional({ nullable: true }).isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 190 }),
  query('status').optional({ nullable: true }).isIn(Object.values(PATIENT_STATUS)),
  validate,
];

const searchPatientsValidators = [
  query('page').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional({ nullable: true }).isInt({ min: 1, max: 25 }).toInt(),
  query('search').isString().trim().isLength({ min: 2, max: 190 }),
  validate,
];

const registerPatientValidators = [
  header('idempotency-key').isString().trim().isLength({ min: 8, max: 190 }),
  body('fullName').isString().trim().isLength({ min: 2, max: 190 }),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ min: 6, max: 40 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('gender').optional({ nullable: true }).isIn(Object.values(PATIENT_GENDER)),
  body('dateOfBirth').optional({ nullable: true }).isISO8601().custom(dateNotFuture),
  body('bloodGroup').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body('demographics').optional({ nullable: true }).isObject().custom(jsonSize(20000)),
  body('medicalSummary').not().exists().withMessage('medicalSummary updates require patient record history'),
  validate,
];

const patientIdParamValidators = [
  param('id').isUUID(4),
  validate,
];

const updatePatientValidators = [
  param('id').isUUID(4),
  body('fullName').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 190 }),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ min: 6, max: 40 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('gender').optional({ nullable: true }).isIn(Object.values(PATIENT_GENDER)),
  body('dateOfBirth').optional({ nullable: true }).isISO8601().custom(dateNotFuture),
  body('bloodGroup').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body('demographics').optional({ nullable: true }).isObject().custom(jsonSize(20000)),
  body('medicalSummary').optional({ nullable: true }).isObject().custom(jsonSize(20000)),
  validate,
];

const archivePatientValidators = [
  param('id').isUUID(4),
  body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  validate,
];

module.exports = {
  archivePatientValidators,
  listPatientsValidators,
  patientIdParamValidators,
  registerPatientValidators,
  searchPatientsValidators,
  updatePatientValidators,
};
