/**
 * Reports Routes
 * Registers tenant report endpoints.
 */

const express = require('express');
const controller = require('./reports.controller');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { validate } = require('../../common/middleware/validate');
const { dateRangeRules } = require('./reports.validator');

const router = express.Router();
const guards = [requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.REPORTS_READ)];

router.get('/summary', guards, dateRangeRules, validate, asyncHandler(controller.getSummary));
router.get('/doctor-utilization', guards, dateRangeRules, validate, asyncHandler(controller.getDoctorUtilization));

module.exports = router;
