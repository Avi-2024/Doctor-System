/**
 * Settings Validators
 * Validates scoped settings API input.
 */

const { body, param, query } = require('express-validator');
const { validate } = require('../../common/middleware/validate');
const { ALLOWED_SETTING_KEYS, SETTING_SCOPE } = require('./settings.constants');

const listSettingsValidators = [
  query('scope').optional({ nullable: true }).isIn(Object.values(SETTING_SCOPE)),
  query('page').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional({ nullable: true }).isInt({ min: 1, max: 100 }).toInt(),
  validate,
];

const settingKeyParamValidators = [
  param('key').isString().trim().isIn(ALLOWED_SETTING_KEYS),
  query('scope').optional({ nullable: true }).isIn(Object.values(SETTING_SCOPE)),
  query('branchId').optional({ nullable: true }).isUUID(4),
  query('userId').optional({ nullable: true }).isUUID(4),
  validate,
];

const upsertSettingValidators = [
  param('key').isString().trim().isIn(ALLOWED_SETTING_KEYS),
  body('scope').isIn(Object.values(SETTING_SCOPE)),
  body('branchId').optional({ nullable: true }).isUUID(4),
  body('userId').optional({ nullable: true }).isUUID(4),
  body('value').exists().custom((value) => JSON.stringify(value).length <= 20_000),
  body('isEncrypted').optional({ nullable: true }).isBoolean().toBoolean(),
  body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  validate,
];

const archiveSettingValidators = [
  param('key').isString().trim().isIn(ALLOWED_SETTING_KEYS),
  body('scope').isIn(Object.values(SETTING_SCOPE)),
  body('branchId').optional({ nullable: true }).isUUID(4),
  body('userId').optional({ nullable: true }).isUUID(4),
  body('reason').isString().trim().isLength({ min: 3, max: 500 }),
  validate,
];

module.exports = {
  archiveSettingValidators,
  listSettingsValidators,
  settingKeyParamValidators,
  upsertSettingValidators,
};
