/**
 * Users Routes
 * Sprint 2 user API surface.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { requireAuditedPermission } = require('../rbac/rbac.middleware');
const { createUsersController } = require('./users.controller');
const { createUsersService } = require('./users.service');
const { meValidators } = require('./users.validator');

const createUsersRouter = ({
  authService = createAuthService(),
  service = createUsersService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createUsersController({ service });

  router.get('/me', requireAuth, requireAuditedPermission('users.me.read'), meValidators, asyncHandler(controller.me));

  return router;
};

module.exports = { createUsersRouter };
