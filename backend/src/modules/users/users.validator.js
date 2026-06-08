/**
 * Users Validator
 * Validates user and invitation payloads.
 */

const { body, param } = require('express-validator');
const { ROLES } = require('../../common/constants/roles');

const assignableRoles = [ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.PATIENT];

const createUserRules = [
  body('fullName').isString().trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isStrongPassword({ minLength: 8, minNumbers: 1 }),
  body('role').isIn(Object.values(ROLES)),
  body('permissions').optional().isArray(),
];

const updateUserRules = [
  param('id').isUUID(),
  body('role').optional().isIn(Object.values(ROLES)),
  body('permissions').optional().isArray(),
  body('isActive').optional().isBoolean(),
];

const inviteUserRules = [
  body('fullName').isString().trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body('role').isIn(assignableRoles),
  body('permissions').optional().isArray(),
];

const acceptInvitationRules = [
  body('token').isString().isLength({ min: 32, max: 256 }),
  body('password').isStrongPassword({ minLength: 8, minNumbers: 1 }),
];

const invitationIdRules = [param('id').isUUID()];
module.exports = {
  createUserRules,
  updateUserRules,
  inviteUserRules,
  acceptInvitationRules,
  invitationIdRules,
};
