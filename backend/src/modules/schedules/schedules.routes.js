/**
 * Schedules Routes
 * Registers doctor schedule endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { scheduleCreateRules, scheduleUpdateRules } = require('./schedules.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Doctor schedule',
  table: 'doctor_schedules',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  readPermissions: [PERMISSIONS.APPOINTMENTS_READ],
  writePermissions: [PERMISSIONS.APPOINTMENTS_WRITE],
  columns: ['id', 'clinic_id', 'doctor_id', 'branch_id', 'weekly_schedule', 'timezone', 'is_active', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['doctor_id', 'branch_id', 'is_active'],
  jsonFields: ['weekly_schedule'],
  references: { doctor_id: { table: 'users', where: "role = 'DOCTOR' AND is_active = TRUE" }, branch_id: 'clinic_branches' },
  createRules: scheduleCreateRules,
  updateRules: scheduleUpdateRules,
});

module.exports = moduleDefinition.router;
