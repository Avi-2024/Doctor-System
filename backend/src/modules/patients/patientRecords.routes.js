/**
 * Patient Records Routes
 * Registers patient history record endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { patientRecordCreateRules, patientRecordUpdateRules } = require('./patients.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Patient record',
  table: 'patient_records',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  writeRoles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR],
  readPermissions: [PERMISSIONS.PATIENTS_READ],
  writePermissions: [PERMISSIONS.PATIENTS_WRITE],
  columns: ['id', 'clinic_id', 'patient_id', 'record_type', 'record_data', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['patient_id', 'record_type'],
  jsonFields: ['record_data'],
  references: { patient_id: 'patients' },
  createRules: patientRecordCreateRules,
  updateRules: patientRecordUpdateRules,
});

module.exports = moduleDefinition.router;
