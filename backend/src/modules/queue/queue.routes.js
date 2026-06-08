/**
 * Queue Routes
 * Registers queue workflow endpoints.
 */

const express = require('express');
const controller = require('./queue.controller');
const { checkInRules, callNextRules, transitionRules } = require('./queue.validator');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { paginationRules } = require('../../common/validators/pagination.validator');

const router = express.Router();
const guards = [requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.QUEUE_MANAGE)];
router.post('/check-in', guards, checkInRules, validate, asyncHandler(controller.checkIn));
router.post('/call-next', guards, callNextRules, validate, asyncHandler(controller.callNext));
router.patch('/:id/:action', guards, transitionRules, validate, asyncHandler(controller.transition));
router.get('/', guards, paginationRules, validate, asyncHandler(controller.list));

module.exports = router;
