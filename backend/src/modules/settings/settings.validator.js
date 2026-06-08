/**
 * Settings Validator
 * Validates tenant setting payloads.
 */

const { body } = require('express-validator');
const { ROLES } = require('../../common/constants/roles');

// Restrict platform settings.
const validateScope = (value, { req }) => {
  if (value === 'PLATFORM' && req.auth.role !== ROLES.SUPER_ADMIN) throw new Error('Platform setting requires super admin');
  return true;
};

const settingCreateRules = [body('setting_key').isString().trim().notEmpty(), body('scope').optional().isIn(['PLATFORM', 'CLINIC']).custom(validateScope)];
const settingUpdateRules = [body('setting_value').optional({ nullable: true }).isObject(), body('scope').optional().isIn(['PLATFORM', 'CLINIC']).custom(validateScope)];

module.exports = { settingCreateRules, settingUpdateRules };
