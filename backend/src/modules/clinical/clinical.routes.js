/**
 * Clinical Routes
 * Registers consultation endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { consultationCreateRules, consultationUpdateRules } = require('./clinical.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Consultation',
  table: 'consultations',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR],
  readPermissions: [PERMISSIONS.CLINICAL_READ],
  writePermissions: [PERMISSIONS.CLINICAL_WRITE],
  columns: ['id', 'clinic_id', 'patient_id', 'doctor_id', 'appointment_id', 'status', 'clinical_data', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['patient_id', 'doctor_id', 'appointment_id', 'status'],
  jsonFields: ['clinical_data'],
  references: { patient_id: 'patients', doctor_id: { table: 'users', where: "role = 'DOCTOR' AND is_active = TRUE" }, appointment_id: 'appointments' },
  createRules: consultationCreateRules,
  updateRules: consultationUpdateRules,
});

module.exports = moduleDefinition.router;
