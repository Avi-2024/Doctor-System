/**
 * WhatsApp Messages Routes
 * Registers immutable message history.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'WhatsApp message',
  table: 'whatsapp_messages',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  readPermissions: [PERMISSIONS.WHATSAPP_MANAGE],
  columns: ['id', 'clinic_id', 'notification_id', 'patient_id', 'direction', 'sender', 'recipient', 'message_type', 'message_body', 'provider_message_id', 'status', 'payload', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['patient_id', 'direction', 'status'],
  jsonFields: ['payload'],
  readOnly: true,
});

module.exports = moduleDefinition.router;
