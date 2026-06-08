/**
 * Appointments Routes
 * Registers appointment workflow endpoints.
 */

const express = require('express');
const controller = require('./appointments.controller');
const { bookingRules, transitionRules } = require('./appointments.validator');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { paginationRules } = require('../../common/validators/pagination.validator');

const router = express.Router();
const readGuards = [requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.APPOINTMENTS_READ)];
const writeGuards = [requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.APPOINTMENTS_WRITE)];

router.post('/', writeGuards, bookingRules, validate, asyncHandler(controller.book));
router.get('/', readGuards, paginationRules, validate, asyncHandler(controller.list));
router.patch('/:id/:action', writeGuards, transitionRules, validate, asyncHandler(controller.transition));

module.exports = router;
