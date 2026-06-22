/**
 * Auth Validators
 * Validates Sprint 1 Auth API inputs.
 */

const { body } = require('express-validator');
const { validate } = require('../../common/middleware/validate');

const loginValidators = [
  body('clinicId').optional({ nullable: true }).isUUID().withMessage('clinicId must be a UUID'),
  body('email').isEmail().withMessage('email must be valid').bail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 128 }).withMessage('password is required'),
  validate,
];

const refreshValidators = [];
const logoutValidators = [];
const meValidators = [];

module.exports = {
  loginValidators,
  logoutValidators,
  meValidators,
  refreshValidators,
};
