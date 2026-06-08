/**
 * Lab Reports Routes
 * Registers lab report endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { reportCreateRules, reportUpdateRules } = require('./lab.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Lab report',
  table: 'lab_reports',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  readPermissions: [PERMISSIONS.LAB_MANAGE],
  writePermissions: [PERMISSIONS.LAB_MANAGE],
  columns: ['id', 'clinic_id', 'lab_order_id', 'patient_id', 'attachment_id', 'result_data', 'reviewed_by', 'reviewed_at', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['lab_order_id', 'patient_id', 'reviewed_by'],
  jsonFields: ['result_data'],
  references: { lab_order_id: 'lab_orders', patient_id: 'patients', attachment_id: 'attachments', reviewed_by: 'users' },
  createRules: reportCreateRules,
  updateRules: reportUpdateRules,
});

module.exports = moduleDefinition.router;
