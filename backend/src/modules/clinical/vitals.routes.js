/**
 * Vitals Routes
 * Registers patient vital endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { vitalCreateRules, vitalUpdateRules } = require('./clinical.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Vital',
  table: 'vitals',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  readPermissions: [PERMISSIONS.CLINICAL_READ],
  writePermissions: [PERMISSIONS.CLINICAL_WRITE],
  columns: ['id', 'clinic_id', 'patient_id', 'consultation_id', 'vital_data', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['patient_id', 'consultation_id'],
  jsonFields: ['vital_data'],
  references: { patient_id: 'patients', consultation_id: 'consultations' },
  createRules: vitalCreateRules,
  updateRules: vitalUpdateRules,
});

module.exports = moduleDefinition.router;
