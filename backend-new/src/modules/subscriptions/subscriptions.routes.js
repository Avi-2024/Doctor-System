/**
 * Subscriptions Routes
 * Defines protected minimal subscription endpoints.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { requireAuditedPermission } = require('../rbac/rbac.middleware');
const { createSubscriptionsController } = require('./subscriptions.controller');
const { createSubscriptionsService } = require('./subscriptions.service');
const { currentSubscriptionValidators } = require('./subscriptions.validator');

// Creates the protected subscriptions router.
const createSubscriptionsRouter = ({
  authService = createAuthService(),
  service = createSubscriptionsService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createSubscriptionsController({ service });

  // Guards one route with a named RBAC permission.
  const guard = (permission) => requireAuditedPermission(permission, {
    denialRecorder: service.recordAuthorizationDenied,
  });

  router.get('/current', requireAuth, guard('subscriptions.read'), currentSubscriptionValidators, asyncHandler(controller.current));

  return router;
};

module.exports = { createSubscriptionsRouter };
