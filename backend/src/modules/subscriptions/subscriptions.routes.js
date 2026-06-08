/**
 * Subscriptions Routes
 * Registers SaaS subscription endpoints.
 */

const { createResourceModule } = require('../../common/modules/resourceFactory');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { planCreateRules, planUpdateRules } = require('./subscriptions.validator');

const plans = createResourceModule({
  name: 'Subscription plan',
  table: 'subscription_plans',
  roles: [ROLES.SUPER_ADMIN],
  readPermissions: [PERMISSIONS.SUBSCRIPTIONS_MANAGE],
  writePermissions: [PERMISSIONS.SUBSCRIPTIONS_MANAGE],
  platformOnly: true,
  columns: ['id', 'clinic_id', 'code', 'name', 'monthly_price', 'yearly_price', 'limits', 'features', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['code', 'name'],
  jsonFields: ['limits', 'features'],
  createRules: planCreateRules,
  updateRules: planUpdateRules,
});

module.exports = plans.router;
