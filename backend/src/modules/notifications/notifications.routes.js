/**
 * Notifications Routes
 * Registers immutable notification records.
 */

const express = require('express');
const controller = require('./notifications.controller');
const { reminderRules, notificationIdRules } = require('./notifications.validator');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { paginationRules } = require('../../common/validators/pagination.validator');

const router = express.Router();
const guards = [requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)];

router.post('/reminders', guards, reminderRules, validate, asyncHandler(controller.queueReminder));
router.get('/', guards, paginationRules, validate, asyncHandler(controller.list));
router.get('/:id', guards, notificationIdRules, validate, asyncHandler(controller.getById));
router.patch('/:id/read', guards, notificationIdRules, validate, asyncHandler(controller.markRead));

module.exports = router;
