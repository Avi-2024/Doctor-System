/**
 * WhatsApp Templates Routes
 * Registers tenant message template endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { templateCreateRules, templateUpdateRules } = require('./whatsapp.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'WhatsApp template',
  table: 'whatsapp_templates',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.RECEPTIONIST],
  readPermissions: [PERMISSIONS.WHATSAPP_MANAGE],
  writePermissions: [PERMISSIONS.WHATSAPP_MANAGE],
  columns: ['id', 'clinic_id', 'name', 'provider_template_name', 'language_code', 'category', 'status', 'components', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['name', 'provider_template_name'],
  filterable: ['category', 'status', 'language_code'],
  jsonFields: ['components'],
  createRules: templateCreateRules,
  updateRules: templateUpdateRules,
});

module.exports = moduleDefinition.router;
