/**
 * Settings Routes
 * Defines protected scoped settings endpoints.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { requireAuditedPermission } = require('../rbac/rbac.middleware');
const { createSettingsController } = require('./settings.controller');
const { createSettingsService } = require('./settings.service');
const {
  archiveSettingValidators,
  listSettingsValidators,
  settingKeyParamValidators,
  upsertSettingValidators,
} = require('./settings.validator');

// Creates the protected settings router.
const createSettingsRouter = ({
  authService = createAuthService(),
  service = createSettingsService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createSettingsController({ service });

  // Guards one route with a named RBAC permission.
  const guard = (permission) => requireAuditedPermission(permission, {
    denialRecorder: service.recordAuthorizationDenied,
  });

  router.get('/', requireAuth, guard('settings.read'), listSettingsValidators, asyncHandler(controller.list));
  router.get('/:key', requireAuth, guard('settings.read'), settingKeyParamValidators, asyncHandler(controller.detail));
  router.put('/:key', requireAuth, guard('settings.update'), upsertSettingValidators, asyncHandler(controller.upsert));
  router.delete('/:key', requireAuth, guard('settings.update'), archiveSettingValidators, asyncHandler(controller.archive));

  return router;
};

module.exports = { createSettingsRouter };
