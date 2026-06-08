/**
 * Lab Routes
 * Registers laboratory order endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { orderCreateRules, orderUpdateRules } = require('./lab.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Lab order',
  table: 'lab_orders',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  readPermissions: [PERMISSIONS.LAB_MANAGE],
  writePermissions: [PERMISSIONS.LAB_MANAGE],
  columns: ['id', 'clinic_id', 'order_number', 'patient_id', 'doctor_id', 'status', 'items', 'report_attachment_id', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['order_number'],
  filterable: ['patient_id', 'doctor_id', 'status'],
  jsonFields: ['items'],
  references: { patient_id: 'patients', doctor_id: { table: 'users', where: "role = 'DOCTOR' AND is_active = TRUE" }, report_attachment_id: 'attachments' },
  createRules: orderCreateRules,
  updateRules: orderUpdateRules,
});

module.exports = moduleDefinition.router;
