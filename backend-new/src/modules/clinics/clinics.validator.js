/**
 * Clinics Validators
 * Validates tenant onboarding and lifecycle API input.
 */

const { body, param, query } = require('express-validator');
const { validate } = require('../../common/middleware/validate');
const { CLINIC_STATUS } = require('./clinics.constants');

const codePattern = /^[a-z][a-z0-9_-]{1,79}$/;
const safeJson = { max: 20_000 };

const paginationValidators = [
  query('page').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional({ nullable: true }).isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional({ nullable: true }).isString().trim().isLength({ max: 190 }),
];

const listClinicsValidators = [
  ...paginationValidators,
  query('status').optional({ nullable: true }).isIn(Object.values(CLINIC_STATUS)),
  validate,
];

const createClinicValidators = [
  body('code').isString().trim().matches(codePattern),
  body('name').isString().trim().isLength({ min: 2, max: 190 }),
  body('timezone').optional({ nullable: true }).isString().trim().isLength({ min: 1, max: 80 }),
  body('contact').optional({ nullable: true }).isObject(),
  body('address').optional({ nullable: true }).isObject(),
  body('branding').optional({ nullable: true }).isObject().custom((value) => JSON.stringify(value).length <= safeJson.max),
  body('owner.fullName').isString().trim().isLength({ min: 2, max: 190 }),
  body('owner.email').isEmail().normalizeEmail(),
  body('owner.phone').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('owner.password').isString().isLength({ min: 8, max: 128 }),
  body('branch.branchCode').optional({ nullable: true }).isString().trim().matches(codePattern),
  body('branch.name').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 190 }),
  body('branch.timezone').optional({ nullable: true }).isString().trim().isLength({ min: 1, max: 80 }),
  body('settings').optional({ nullable: true }).isObject(),
  validate,
];

const clinicIdParamValidators = [
  param('id').isUUID(4),
  validate,
];

const updateClinicValidators = [
  param('id').isUUID(4),
  body('name').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 190 }),
  body('timezone').optional({ nullable: true }).isString().trim().isLength({ min: 1, max: 80 }),
  body('contact').optional({ nullable: true }).isObject(),
  body('address').optional({ nullable: true }).isObject(),
  body('branding').optional({ nullable: true }).isObject().custom((value) => JSON.stringify(value).length <= safeJson.max),
  validate,
];

const changeClinicStatusValidators = [
  param('id').isUUID(4),
  body('status').isIn(Object.values(CLINIC_STATUS)),
  body('reason').isString().trim().isLength({ min: 3, max: 500 }),
  validate,
];

module.exports = {
  changeClinicStatusValidators,
  clinicIdParamValidators,
  createClinicValidators,
  listClinicsValidators,
  updateClinicValidators,
};
