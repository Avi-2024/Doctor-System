/**
 * RBAC Routes
 * Sprint 2 protected RBAC API surface.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { createRbacController } = require('./rbac.controller');
const { requireAuditedPermission } = require('./rbac.middleware');
const { createRbacService } = require('./rbac.service');
const {
  assignUserRoleValidators,
  createRoleValidators,
  listPermissionsValidators,
  listRolesValidators,
  revokeUserRoleValidators,
} = require('./rbac.validator');

const createRbacRouter = ({
  authService = createAuthService(),
  service = createRbacService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createRbacController({ service });
  const guard = (permission) => requireAuditedPermission(permission, {
    denialRecorder: service.recordAuthorizationDenied,
  });

  router.get('/permissions', requireAuth, guard('rbac.permissions.read'), listPermissionsValidators, asyncHandler(controller.listPermissions));
  router.get('/roles', requireAuth, guard('rbac.roles.read'), listRolesValidators, asyncHandler(controller.listRoles));
  router.post('/roles', requireAuth, guard('rbac.roles.create'), createRoleValidators, asyncHandler(controller.createRole));
  router.post('/user-roles', requireAuth, guard('rbac.user_roles.assign'), assignUserRoleValidators, asyncHandler(controller.assignUserRole));
  router.delete('/user-roles/:id', requireAuth, guard('rbac.user_roles.revoke'), revokeUserRoleValidators, asyncHandler(controller.revokeUserRole));

  return router;
};

module.exports = { createRbacRouter };
