/**
 * Billing Validator
 * Validates invoice and payment payloads.
 */

const { body, param } = require('express-validator');

const createInvoiceRules = [
  body('invoiceNumber').isString().trim().notEmpty(),
  body('patientId').optional({ nullable: true }).isUUID(),
  body('items').isArray({ min: 1 }),
  body('items.*.description').isString().trim().notEmpty(),
  body('items.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.unitPrice').isFloat({ min: 0 }).toFloat(),
  body('discount').optional().isFloat({ min: 0 }).toFloat(),
  body('tax').optional().isFloat({ min: 0 }).toFloat(),
];
const recordPaymentRules = [
  body('invoiceId').isUUID(),
  body('amount').isFloat({ gt: 0 }).toFloat(),
  body('method').isIn(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'RAZORPAY']),
];
const invoiceIdRules = [param('id').isUUID()];

module.exports = { createInvoiceRules, recordPaymentRules, invoiceIdRules };
