/**
 * Users Validators
 * Validates current-user, staff, invitation, and branch assignment input.
 */

const { body, param, query } = require('express-validator');
const { validate } = require('../../common/middleware/validate');
const { USER_STATUS } = require('../auth/auth.constants');

const staffStatusValues = [USER_STATUS.ACTIVE, USER_STATUS.PENDING, USER_STATUS.SUSPENDED, USER_STATUS.DEACTIVATED];

const listUsersValidators = [
  query('page').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional({ nullable: true }).isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional({ nullable: true }).isString().trim().isLength({ max: 190 }),
  query('status').optional({ nullable: true }).isIn(staffStatusValues),
  validate,
];

const userIdParamValidators = [
  param('id').isUUID(4),
  validate,
];

const userStatusChangeValidators = [
  param('id').isUUID(4),
  body('reason').isString().trim().isLength({ min: 3, max: 500 }),
  validate,
];

const createUserValidators = [
  body('fullName').isString().trim().isLength({ min: 2, max: 190 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('password').isString().isLength({ min: 8, max: 128 }),
  body('status').optional({ nullable: true }).isIn([USER_STATUS.ACTIVE, USER_STATUS.PENDING]),
  body('profile').optional({ nullable: true }).isObject().custom((value) => JSON.stringify(value).length <= 20_000),
  validate,
];

const updateUserValidators = [
  param('id').isUUID(4),
  body('fullName').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 190 }),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('profile').optional({ nullable: true }).isObject().custom((value) => JSON.stringify(value).length <= 20_000),
  validate,
];

const inviteUserValidators = [
  body('fullName').isString().trim().isLength({ min: 2, max: 190 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('expiresInDays').optional({ nullable: true }).isInt({ min: 1, max: 30 }).toInt(),
  validate,
];

const listInvitationsValidators = [
  query('page').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional({ nullable: true }).isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional({ nullable: true }).isIn(['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED']),
  validate,
];

const invitationIdParamValidators = [
  param('id').isUUID(4),
  validate,
];

const acceptInvitationValidators = [
  body('token').isString().trim().isLength({ min: 32, max: 512 }),
  body('password').isString().isLength({ min: 8, max: 128 }),
  validate,
];

const branchAssignmentValidators = [
  param('id').isUUID(4),
  body('branchId').isUUID(4),
  body('isPrimary').optional({ nullable: true }).isBoolean().toBoolean(),
  validate,
];

const branchAssignmentIdValidators = [
  param('id').isUUID(4),
  param('assignmentId').isUUID(4),
  validate,
];

module.exports = {
  acceptInvitationValidators,
  branchAssignmentIdValidators,
  branchAssignmentValidators,
  createUserValidators,
  invitationIdParamValidators,
  inviteUserValidators,
  listInvitationsValidators,
  listUsersValidators,
  meValidators: [],
  updateUserValidators,
  userStatusChangeValidators,
  userIdParamValidators,
};
