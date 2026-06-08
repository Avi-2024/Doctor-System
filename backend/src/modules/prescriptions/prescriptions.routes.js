/**
 * Prescriptions Routes
 * Registers prescription endpoints.
 */

const express = require('express');
const controller = require('./prescriptions.controller');
const { createResourceModule } = require('../../common/modules/resourceFactory');
const { prescriptionCreateRules, prescriptionUpdateRules, prescriptionIdRules } = require('./prescriptions.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');

const moduleDefinition = createResourceModule({
  name: 'Prescription',
  table: 'prescriptions',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR],
  readPermissions: [PERMISSIONS.PRESCRIPTIONS_MANAGE],
  writePermissions: [PERMISSIONS.PRESCRIPTIONS_MANAGE],
  columns: ['id', 'clinic_id', 'patient_id', 'doctor_id', 'consultation_id', 'diagnosis', 'medicines', 'advice', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['diagnosis', 'advice'],
  filterable: ['patient_id', 'doctor_id', 'consultation_id'],
  jsonFields: ['medicines'],
  references: { patient_id: 'patients', doctor_id: { table: 'users', where: "role = 'DOCTOR' AND is_active = TRUE" }, consultation_id: 'consultations' },
  createRules: prescriptionCreateRules,
  updateRules: prescriptionUpdateRules,
});

const router = express.Router();
router.get('/:id/export', requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR), allowPermissions(PERMISSIONS.PRESCRIPTIONS_MANAGE), prescriptionIdRules, validate, asyncHandler(controller.exportPrescription));
router.use('/', moduleDefinition.router);

module.exports = router;
