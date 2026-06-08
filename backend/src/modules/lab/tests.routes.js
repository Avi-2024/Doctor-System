/**
 * Lab Tests Routes
 * Registers lab catalog endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { testCreateRules, testUpdateRules } = require('./lab.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Lab test',
  table: 'lab_tests',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  writeRoles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  readPermissions: [PERMISSIONS.LAB_MANAGE],
  writePermissions: [PERMISSIONS.LAB_MANAGE],
  columns: ['id', 'clinic_id', 'code', 'name', 'category', 'price', 'is_active', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['code', 'name', 'category'],
  filterable: ['category', 'is_active'],
  createRules: testCreateRules,
  updateRules: testUpdateRules,
});

module.exports = moduleDefinition.router;
