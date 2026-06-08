/**
 * Users Routes
 * Registers secure user endpoints.
 */

const express = require('express');
const controller = require('./users.controller');
const {
  createUserRules,
  updateUserRules,
  inviteUserRules,
  acceptInvitationRules,
  invitationIdRules,
} = require('./users.validator');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { paginationRules } = require('../../common/validators/pagination.validator');

const router = express.Router();
const guards = [requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER), allowPermissions(PERMISSIONS.USERS_MANAGE)];

router.post('/', guards,
  createUserRules,
  validate,
  asyncHandler(controller.create),
);
router.post('/invitations/accept', acceptInvitationRules, validate, asyncHandler(controller.acceptInvitation));
router.post('/invitations', guards, inviteUserRules, validate, asyncHandler(controller.invite));
router.get('/invitations', guards, paginationRules, validate, asyncHandler(controller.listInvitations));
router.delete('/invitations/:id', guards, invitationIdRules, validate, asyncHandler(controller.revokeInvitation));
router.get('/', guards, paginationRules, validate, asyncHandler(controller.list));
router.patch('/:id', guards, updateUserRules, validate, asyncHandler(controller.update));
router.delete('/:id', guards, invitationIdRules, validate, asyncHandler(controller.remove));

module.exports = router;
