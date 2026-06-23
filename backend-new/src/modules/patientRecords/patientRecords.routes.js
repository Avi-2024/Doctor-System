/**
 * Patient Records Routes
 * Defines protected append-only patient record endpoints.
 */

const { Router } = require('express');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { createAuthMiddleware } = require('../auth/auth.middleware');
const { createAuthService } = require('../auth/auth.service');
const { requireAuditedPermission } = require('../rbac/rbac.middleware');
const { createPatientRecordsController } = require('./patientRecords.controller');
const { createPatientRecordsService } = require('./patientRecords.service');
const {
  archiveRecordValidators,
  createRecordValidators,
  listRecordsValidators,
  recordIdParamValidators,
} = require('./patientRecords.validator');

// Creates the protected patient records router.
const createPatientRecordsRouter = ({
  authService = createAuthService(),
  service = createPatientRecordsService(),
} = {}) => {
  const router = Router();
  const requireAuth = createAuthMiddleware({ service: authService });
  const controller = createPatientRecordsController({ service });

  // Guards one route with a named RBAC permission.
  const guard = (permission) => requireAuditedPermission(permission);

  router.get('/', requireAuth, guard('patient_records.read'), listRecordsValidators, asyncHandler(controller.list));
  router.post('/', requireAuth, guard('patient_records.create'), createRecordValidators, asyncHandler(controller.create));
  router.get('/:id', requireAuth, guard('patient_records.read'), recordIdParamValidators, asyncHandler(controller.detail));
  router.delete('/:id', requireAuth, guard('patient_records.archive'), archiveRecordValidators, asyncHandler(controller.archive));

  return router;
};

module.exports = { createPatientRecordsRouter };
