/**
 * Branches Routes
 * Registers clinic branch endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { branchCreateRules, branchUpdateRules } = require('./branches.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Clinic branch',
  table: 'clinic_branches',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  readPermissions: [PERMISSIONS.CLINICS_MANAGE],
  writePermissions: [PERMISSIONS.CLINICS_MANAGE],
  columns: ['id', 'clinic_id', 'name', 'contact', 'address', 'is_primary', 'is_active', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['name'],
  filterable: ['is_primary', 'is_active'],
  jsonFields: ['contact', 'address'],
  createRules: branchCreateRules,
  updateRules: branchUpdateRules,
});

module.exports = moduleDefinition.router;
