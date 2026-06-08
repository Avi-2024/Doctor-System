/**
 * Auth Validator
 * Validates authentication payloads.
 */

const { body } = require('express-validator');

const loginRules = [
  body('clinicId').optional({ nullable: true }).isUUID(),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
];

const refreshRules = [body('refreshToken').optional().isString()];
const requestResetRules = [body('clinicId').optional({ nullable: true }).isUUID(), body('email').isEmail().normalizeEmail()];
const confirmResetRules = [body('token').isString().notEmpty(), body('password').isStrongPassword({ minLength: 8, minNumbers: 1 })];

module.exports = { loginRules, refreshRules, requestResetRules, confirmResetRules };
