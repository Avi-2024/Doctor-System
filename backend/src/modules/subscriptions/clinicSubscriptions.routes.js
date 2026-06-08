/**
 * Clinic Subscriptions Routes
 * Registers tenant subscription endpoints.
 */

const express = require('express');
const controller = require('./subscriptions.controller');
const { createResourceModule } = require('../../common/modules/resourceFactory');
const { ROLES } = require('../../common/constants/roles');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { subscriptionCreateRules, subscriptionUpdateRules } = require('./subscriptions.validator');

const moduleDefinition = createResourceModule({
  name: 'Clinic subscription',
  table: 'clinic_subscriptions',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  writeRoles: [ROLES.SUPER_ADMIN],
  readPermissions: [PERMISSIONS.SUBSCRIPTIONS_MANAGE],
  writePermissions: [PERMISSIONS.SUBSCRIPTIONS_MANAGE],
  columns: ['id', 'clinic_id', 'plan_id', 'status', 'starts_at', 'ends_at', 'usage_data', 'created_by', 'updated_by', 'is_deleted'],
  filterable: ['plan_id', 'status'],
  jsonFields: ['usage_data'],
  references: { plan_id: { table: 'subscription_plans', global: true } },
  createRules: subscriptionCreateRules,
  updateRules: subscriptionUpdateRules,
});

const router = express.Router();
router.get('/current/usage', requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER), allowPermissions(PERMISSIONS.SUBSCRIPTIONS_MANAGE), asyncHandler(controller.getUsage));
router.use('/', moduleDefinition.router);

module.exports = router;
