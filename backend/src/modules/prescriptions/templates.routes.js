/**
 * Prescription Templates Routes
 * Registers reusable prescription templates.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { templateCreateRules, templateUpdateRules } = require('./prescriptions.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Prescription template',
  table: 'prescription_templates',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR],
  readPermissions: [PERMISSIONS.PRESCRIPTIONS_MANAGE],
  writePermissions: [PERMISSIONS.PRESCRIPTIONS_MANAGE],
  columns: ['id', 'clinic_id', 'doctor_id', 'name', 'template_data', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['name'],
  filterable: ['doctor_id'],
  jsonFields: ['template_data'],
  references: { doctor_id: { table: 'users', where: "role = 'DOCTOR' AND is_active = TRUE" } },
  createRules: templateCreateRules,
  updateRules: templateUpdateRules,
});

module.exports = moduleDefinition.router;
