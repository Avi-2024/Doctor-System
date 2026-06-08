/**
 * WhatsApp Accounts Routes
 * Registers clinic WhatsApp account endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { accountCreateRules, accountUpdateRules } = require('./whatsapp.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'WhatsApp account',
  table: 'whatsapp_accounts',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  readPermissions: [PERMISSIONS.WHATSAPP_MANAGE],
  writePermissions: [PERMISSIONS.WHATSAPP_MANAGE],
  columns: ['id', 'clinic_id', 'phone_number_id', 'business_account_id', 'display_phone_number', 'is_active', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['is_active'],
  createRules: accountCreateRules,
  updateRules: accountUpdateRules,
});

module.exports = moduleDefinition.router;
