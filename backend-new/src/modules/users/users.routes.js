/**
 * Users Routes
 * User API surface for current user, staff, invitations, and branch assignments.
 */

const { Router } = require('express');
const { requireAllowedOrigin } = require('../../common/middleware/csrf');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { requireAuditedPermission } = require('../rbac/rbac.middleware');
const { createUsersController } = require('./users.controller');
const { createUsersService } = require('./users.service');
const {
  acceptInvitationValidators,
  branchAssignmentIdValidators,
  branchAssignmentValidators,
  createUserValidators,
  invitationIdParamValidators,
  inviteUserValidators,
  listInvitationsValidators,
  listUsersValidators,
  meValidators,
  updateUserValidators,
  userStatusChangeValidators,
  userIdParamValidators,
} = require('./users.validator');

// Creates the public users router for invitation acceptance.
const createUsersPublicRouter = ({
  service = createUsersService(),
  originGuard = requireAllowedOrigin(),
} = {}) => {
  const router = Router();
  const controller = createUsersController({ service });

  router.post('/invitations/accept', originGuard, acceptInvitationValidators, asyncHandler(controller.acceptInvitation));

  return router;
};

// Creates the protected users router.
const createUsersRouter = ({
  authService = createAuthService(),
  service = createUsersService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createUsersController({ service });
  const guard = (permission) => requireAuditedPermission(permission);

  router.get('/me', requireAuth, guard('users.me.read'), meValidators, asyncHandler(controller.me));
  router.get('/', requireAuth, guard('users.read'), listUsersValidators, asyncHandler(controller.list));
  router.post('/', requireAuth, guard('users.create'), createUserValidators, asyncHandler(controller.create));
  router.post('/invite', requireAuth, guard('users.invite'), inviteUserValidators, asyncHandler(controller.invite));
  router.get('/invitations', requireAuth, guard('users.invite'), listInvitationsValidators, asyncHandler(controller.listInvitations));
  router.post('/invitations/:id/revoke', requireAuth, guard('users.invite.revoke'), invitationIdParamValidators, asyncHandler(controller.revokeInvitation));
  router.post('/invitations/:id/resend', requireAuth, guard('users.invite'), invitationIdParamValidators, asyncHandler(controller.resendInvitation));
  router.get('/:id/branches', requireAuth, guard('users.branch_assign'), userIdParamValidators, asyncHandler(controller.listBranchAssignments));
  router.post('/:id/branches', requireAuth, guard('users.branch_assign'), branchAssignmentValidators, asyncHandler(controller.assignBranch));
  router.delete('/:id/branches/:assignmentId', requireAuth, guard('users.branch_assign'), branchAssignmentIdValidators, asyncHandler(controller.revokeBranchAssignment));
  router.post('/:id/branches/:assignmentId/primary', requireAuth, guard('users.branch_assign'), branchAssignmentIdValidators, asyncHandler(controller.setPrimaryBranchAssignment));
  router.post('/:id/deactivate', requireAuth, guard('users.deactivate'), userStatusChangeValidators, asyncHandler(controller.deactivate));
  router.post('/:id/reactivate', requireAuth, guard('users.reactivate'), userStatusChangeValidators, asyncHandler(controller.reactivate));
  router.get('/:id', requireAuth, guard('users.read'), userIdParamValidators, asyncHandler(controller.detail));
  router.patch('/:id', requireAuth, guard('users.update'), updateUserValidators, asyncHandler(controller.update));

  return router;
};

module.exports = { createUsersPublicRouter, createUsersRouter };
