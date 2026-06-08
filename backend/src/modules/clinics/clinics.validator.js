/**
 * Clinics Validator
 * Validates clinic onboarding payloads.
 */

const { body, param } = require('express-validator');

const onboardRules = [
  body('clinic.name').isString().trim().isLength({ min: 2, max: 160 }),
  body('clinic.code').isString().trim().isLength({ min: 2, max: 40 }),
  body('owner.fullName').isString().trim().isLength({ min: 2, max: 120 }),
  body('owner.email').isEmail().normalizeEmail(),
  body('owner.password').isStrongPassword({ minLength: 8, minNumbers: 1 }),
];

const profileUpdateRules = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 160 }),
  body('contact').optional({ nullable: true }).isObject(),
  body('address').optional({ nullable: true }).isObject(),
  body('branding').optional({ nullable: true }).isObject(),
  body('timezone').optional().isString().trim().notEmpty(),
];
const statusUpdateRules = [param('id').isUUID(), body('status').isIn(['ACTIVE', 'SUSPENDED', 'INACTIVE'])];
const clinicIdRules = [param('id').isUUID()];

module.exports = { onboardRules, profileUpdateRules, statusUpdateRules, clinicIdRules };
