/**
 * Resource Router
 * Registers reusable tenant CRUD endpoints.
 */

const express = require('express');
const { body, param } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { attachTenant } = require('../middleware/tenant');
const { allowRoles, allowPermissions } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const { paginationRules } = require('../validators/pagination.validator');

// Create resource router.
const createResourceRouter = (config, controller) => {
  const router = express.Router();
  const guards = [requireAuth, attachTenant, allowRoles(...config.roles), ...(config.readPermissions ? [allowPermissions(...config.readPermissions)] : [])];
  const writeGuards = [requireAuth, attachTenant, allowRoles(...(config.writeRoles || config.roles)), ...(config.writePermissions ? [allowPermissions(...config.writePermissions)] : [])];
  const idRule = param('id').isUUID();

  if (!config.readOnly && config.allowCreate !== false) router.post('/', writeGuards, body().isObject(), ...(config.createRules || []), validate, asyncHandler(controller.create));
  router.get('/', guards, paginationRules, validate, asyncHandler(controller.list));
  router.get('/:id', guards, idRule, validate, asyncHandler(controller.get));
  if (!config.readOnly && config.allowUpdate !== false) router.patch('/:id', writeGuards, idRule, body().isObject(), ...(config.updateRules || []), validate, asyncHandler(controller.update));
  if (!config.readOnly && config.allowDelete !== false) router.delete('/:id', writeGuards, idRule, validate, asyncHandler(controller.remove));

  return router;
};

module.exports = { createResourceRouter };
