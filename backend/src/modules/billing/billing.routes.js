/**
 * Billing Routes
 * Registers invoice and payment endpoints.
 */

const express = require('express');
const controller = require('./billing.controller');
const { createInvoiceRules, recordPaymentRules, invoiceIdRules } = require('./billing.validator');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { paginationRules } = require('../../common/validators/pagination.validator');

const router = express.Router();
const guards = [requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.BILLING_MANAGE)];
router.post('/invoices', guards, createInvoiceRules, validate, asyncHandler(controller.createInvoice));
router.get('/invoices', guards, paginationRules, validate, asyncHandler(controller.listInvoices));
router.get('/invoices/:id', guards, invoiceIdRules, validate, asyncHandler(controller.getInvoice));
router.post('/payments', guards, recordPaymentRules, validate, asyncHandler(controller.recordPayment));
router.get('/payments', guards, paginationRules, validate, asyncHandler(controller.listPayments));

module.exports = router;
