/**
 * Billing Controller
 * Maps invoice and payment requests.
 */

const service = require('./billing.service');
const { successResponse } = require('../../common/utils/response');
const { recordAudit } = require('../audit/audit.service');

// Build billing service context.
const context = (req) => ({ clinicId: req.tenant.clinicId, userId: req.auth.userId });

// Create invoice.
const createInvoice = async (req, res) => {
  const invoice = await service.createInvoice(req.body, context(req));
  await recordAudit({ req, action: 'CREATE_INVOICE', moduleName: 'Billing', entityType: 'Invoice', entityId: invoice.id, after: invoice });
  return successResponse(res, 'Invoice created', invoice, undefined, 201);
};

// List invoices.
const listInvoices = async (req, res) => {
  const result = await service.listInvoices(req.query, context(req));
  return successResponse(res, 'Invoice list fetched', { items: result.items }, result.meta);
};

// Get invoice details.
const getInvoice = async (req, res) => successResponse(res, 'Invoice fetched', await service.getInvoice(req.params.id, context(req)));

// Record payment.
const recordPayment = async (req, res) => {
  const result = await service.recordPayment(req.body, context(req));
  await recordAudit({ req, action: 'RECORD_PAYMENT', moduleName: 'Billing', entityType: 'Payment', entityId: result.payment.id, after: result.payment });
  return successResponse(res, 'Payment recorded', result, undefined, 201);
};

// List payments.
const listPayments = async (req, res) => {
  const result = await service.listPayments(req.query, context(req));
  return successResponse(res, 'Payment list fetched', { items: result.items }, result.meta);
};

module.exports = { createInvoice, listInvoices, getInvoice, recordPayment, listPayments };
