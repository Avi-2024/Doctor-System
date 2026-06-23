/**
 * Branches Routes
 * Defines protected tenant branch endpoints.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { requireAuditedPermission } = require('../rbac/rbac.middleware');
const { createBranchesController } = require('./branches.controller');
const { createBranchesService } = require('./branches.service');
const {
  branchIdParamValidators,
  changeBranchStatusValidators,
  createBranchValidators,
  listBranchesValidators,
  updateBranchValidators,
} = require('./branches.validator');

// Creates the protected branches router.
const createBranchesRouter = ({
  authService = createAuthService(),
  service = createBranchesService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createBranchesController({ service });

  // Guards one route with a named RBAC permission.
  const guard = (permission) => requireAuditedPermission(permission, {
    denialRecorder: service.recordAuthorizationDenied,
  });

  router.get('/', requireAuth, guard('branches.read'), listBranchesValidators, asyncHandler(controller.list));
  router.post('/', requireAuth, guard('branches.create'), createBranchValidators, asyncHandler(controller.create));
  router.get('/:id', requireAuth, guard('branches.read'), branchIdParamValidators, asyncHandler(controller.detail));
  router.patch('/:id', requireAuth, guard('branches.update'), updateBranchValidators, asyncHandler(controller.update));
  router.patch('/:id/status', requireAuth, guard('branches.update'), changeBranchStatusValidators, asyncHandler(controller.status));

  return router;
};

module.exports = { createBranchesRouter };
