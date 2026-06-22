/**
 * Auth Routes
 * Sprint 1 authentication API surface.
 */

const { Router } = require('express');
const { createCsrfProtection, requireAllowedOrigin } = require('../../common/middleware/csrf');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthController } = require('./auth.controller');
const { createAuthMiddleware } = require('./auth.middleware');
const { createAuthService } = require('./auth.service');
const {
  loginValidators,
  logoutValidators,
  meValidators,
  refreshValidators,
} = require('./auth.validator');

const createAuthRouter = ({
  service = createAuthService(),
  csrfProtection = createCsrfProtection(),
  originGuard = requireAllowedOrigin(),
} = {}) => {
  const router = Router();
  const controller = createAuthController({ service });
  const requireAuth = createAuthMiddleware({ service });

  router.post('/login', originGuard, loginValidators, asyncHandler(controller.login));
  router.post('/refresh', csrfProtection, refreshValidators, asyncHandler(controller.refresh));
  router.post('/logout', csrfProtection, logoutValidators, asyncHandler(controller.logout));
  router.get('/me', meValidators, requireAuth, asyncHandler(controller.me));

  return router;
};

module.exports = { createAuthRouter };
