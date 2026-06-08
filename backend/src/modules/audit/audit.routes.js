/**
 * Audit Routes
 * Registers immutable audit log reads.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Audit log',
  table: 'audit_logs',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  readPermissions: [PERMISSIONS.AUDIT_READ],
  columns: ['id', 'clinic_id', 'actor_user_id', 'action', 'module_name', 'entity_type', 'entity_id', 'request_id', 'before_data', 'after_data', 'metadata', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['actor_user_id', 'action', 'module_name', 'entity_type'],
  jsonFields: ['before_data', 'after_data', 'metadata'],
  readOnly: true,
});

module.exports = moduleDefinition.router;
