/**
 * RBAC Validators
 * Validates Sprint 2 RBAC API input.
 */

const { body, param, query } = require('express-validator');
const { validate } = require('../../common/middleware/validate');
const { RBAC_SCOPE } = require('./rbac.constants');

const roleCodePattern = /^[a-z][a-z0-9_.-]{1,99}$/;
const permissionKeyPattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_.]*$/;

const noInputValidators = [];

const createRoleValidators = [
  body('clinicId').optional({ nullable: true }).isUUID(4),
  body('name').isString().trim().isLength({ min: 2, max: 190 }),
  body('code').optional({ nullable: true }).isString().trim().matches(roleCodePattern),
  body('description').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  body('permissions').optional({ nullable: true }).isArray({ max: 100 }),
  body('permissions.*.key').optional({ nullable: true }).isString().trim().matches(permissionKeyPattern),
  body('permissions.*.scope').optional({ nullable: true }).isIn(Object.values(RBAC_SCOPE)),
  validate,
];

const assignUserRoleValidators = [
  body('clinicId').optional({ nullable: true }).isUUID(4),
  body('userId').isUUID(4),
  body('roleId').isUUID(4),
  validate,
];

const revokeUserRoleValidators = [
  param('id').isUUID(4),
  query('clinicId').optional({ nullable: true }).isUUID(4),
  validate,
];

module.exports = {
  assignUserRoleValidators,
  createRoleValidators,
  listPermissionsValidators: noInputValidators,
  listRolesValidators: noInputValidators,
  revokeUserRoleValidators,
};
