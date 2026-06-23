/**
 * Clinics Routes
 * Defines protected tenant administration endpoints.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { requireAuditedPermission } = require('../rbac/rbac.middleware');
const { createClinicsController } = require('./clinics.controller');
const { createClinicsService } = require('./clinics.service');
const {
  changeClinicStatusValidators,
  clinicIdParamValidators,
  createClinicValidators,
  listClinicsValidators,
  updateClinicValidators,
} = require('./clinics.validator');

// Creates the protected clinics router.
const createClinicsRouter = ({
  authService = createAuthService(),
  service = createClinicsService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createClinicsController({ service });

  // Guards one route with a named RBAC permission.
  const guard = (permission) => requireAuditedPermission(permission, {
    denialRecorder: service.recordAuthorizationDenied,
  });

  router.get('/', requireAuth, guard('clinics.read'), listClinicsValidators, asyncHandler(controller.list));
  router.post('/', requireAuth, guard('clinics.create'), createClinicValidators, asyncHandler(controller.create));
  router.get('/current', requireAuth, guard('clinics.read'), asyncHandler(controller.current));
  router.get('/:id', requireAuth, guard('clinics.read'), clinicIdParamValidators, asyncHandler(controller.detail));
  router.patch('/:id', requireAuth, guard('clinics.update'), updateClinicValidators, asyncHandler(controller.update));
  router.patch('/:id/status', requireAuth, guard('clinics.update'), changeClinicStatusValidators, asyncHandler(controller.status));

  return router;
};

module.exports = { createClinicsRouter };
