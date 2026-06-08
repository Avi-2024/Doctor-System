/**
 * Doctor Leaves Routes
 * Registers doctor leave endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { leaveCreateRules, leaveUpdateRules } = require('./schedules.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Doctor leave',
  table: 'doctor_leaves',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  readPermissions: [PERMISSIONS.APPOINTMENTS_READ],
  writePermissions: [PERMISSIONS.APPOINTMENTS_WRITE],
  columns: ['id', 'clinic_id', 'doctor_id', 'starts_at', 'ends_at', 'reason', 'status', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['doctor_id', 'status'],
  references: { doctor_id: { table: 'users', where: "role = 'DOCTOR' AND is_active = TRUE" } },
  createRules: leaveCreateRules,
  updateRules: leaveUpdateRules,
});

module.exports = moduleDefinition.router;
