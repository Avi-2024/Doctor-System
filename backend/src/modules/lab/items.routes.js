/**
 * Lab Order Items Routes
 * Registers normalized lab order item endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { orderItemCreateRules, orderItemUpdateRules } = require('./lab.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const moduleDefinition = createResourceModule({
  name: 'Lab order item',
  table: 'lab_order_items',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  readPermissions: [PERMISSIONS.LAB_MANAGE],
  writePermissions: [PERMISSIONS.LAB_MANAGE],
  columns: ['id', 'clinic_id', 'lab_order_id', 'lab_test_id', 'test_name', 'price', 'status', 'result_data', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['test_name'],
  filterable: ['lab_order_id', 'lab_test_id', 'status'],
  jsonFields: ['result_data'],
  references: { lab_order_id: 'lab_orders', lab_test_id: 'lab_tests' },
  createRules: orderItemCreateRules,
  updateRules: orderItemUpdateRules,
});

module.exports = moduleDefinition.router;
