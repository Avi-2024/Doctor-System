/**
 * Patients Routes
 * Defines protected clinic-scoped patient registry endpoints.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { requireAuditedPermission } = require('../rbac/rbac.middleware');
const { createPatientsController } = require('./patients.controller');
const { createPatientsService } = require('./patients.service');
const {
  archivePatientValidators,
  listPatientsValidators,
  patientIdParamValidators,
  registerPatientValidators,
  searchPatientsValidators,
  updatePatientValidators,
} = require('./patients.validator');

// Creates the protected patients router.
const createPatientsRouter = ({
  authService = createAuthService(),
  service = createPatientsService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createPatientsController({ service });

  // Guards one route with a named RBAC permission.
  const guard = (permission) => requireAuditedPermission(permission);

  router.get('/', requireAuth, guard('patients.read'), listPatientsValidators, asyncHandler(controller.list));
  router.get('/search', requireAuth, guard('patients.read'), searchPatientsValidators, asyncHandler(controller.search));
  router.post('/', requireAuth, guard('patients.create'), registerPatientValidators, asyncHandler(controller.register));
  router.get('/:id', requireAuth, guard('patients.read'), patientIdParamValidators, asyncHandler(controller.detail));
  router.patch('/:id', requireAuth, guard('patients.update'), updatePatientValidators, asyncHandler(controller.update));
  router.delete('/:id', requireAuth, guard('patients.archive'), archivePatientValidators, asyncHandler(controller.archive));
  router.post('/:id/restore', requireAuth, guard('patients.restore'), archivePatientValidators, asyncHandler(controller.restore));

  return router;
};

module.exports = { createPatientsRouter };
