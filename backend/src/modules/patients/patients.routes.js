/**
 * Patients Routes
 * Registers patient management endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { patientCreateRules, patientUpdateRules } = require('./patients.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Patient',
  table: 'patients',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  readPermissions: [PERMISSIONS.PATIENTS_READ],
  writePermissions: [PERMISSIONS.PATIENTS_WRITE],
  columns: ['id', 'clinic_id', 'patient_code', 'full_name', 'phone', 'email', 'gender', 'date_of_birth', 'blood_group', 'demographics', 'medical_summary', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['patient_code', 'full_name', 'phone', 'email'],
  filterable: ['gender', 'blood_group'],
  jsonFields: ['demographics', 'medical_summary'],
  usageMetric: 'patients',
  createRules: patientCreateRules,
  updateRules: patientUpdateRules,
});

module.exports = moduleDefinition.router;
