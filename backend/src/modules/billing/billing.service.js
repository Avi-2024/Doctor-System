/**
 * Billing Service
 * Calculates invoices and records payments.
 */

const crypto = require('crypto');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { ApiError } = require('../../common/errors/ApiError');
const repository = require('./billing.repository');
const { validateReferences } = require('../../common/services/reference.service');
const { PAYMENT_STATUS } = require('../../common/constants/paymentStatus');

// Round currency value.
const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// Calculate trusted invoice totals.
const calculateInvoice = ({ items, discount = 0, tax = 0 }) => {
  if (Number(discount) < 0 || Number(tax) < 0) throw new ApiError(422, 'Discount and tax cannot be negative');
  const calculatedItems = items.map((item) => {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice);
    if (quantity <= 0 || unitPrice < 0) throw new ApiError(422, 'Invoice item values must be positive');
    return { ...item, quantity, unitPrice: money(unitPrice), total: money(quantity * unitPrice) };
  });
  const subtotal = money(calculatedItems.reduce((sum, item) => sum + item.total, 0));
  if (discount > subtotal) throw new ApiError(422, 'Discount cannot exceed subtotal');
  const total = money(subtotal - Number(discount) + Number(tax));
  if (total < 0) throw new ApiError(422, 'Invoice total cannot be negative');
  return { items: calculatedItems, subtotal, total };
};

// Create invoice.
const createInvoice = async (payload, context) => runInTransaction(async (connection) => {
  await validateReferences({ patient_id: payload.patientId }, context.clinicId, { patient_id: 'patients' }, connection);
  const calculated = calculateInvoice(payload);
  const invoice = await repository.invoices.create({
    clinic_id: context.clinicId,
    invoice_number: payload.invoiceNumber,
    patient_id: payload.patientId || null,
    subtotal: calculated.subtotal,
    discount: payload.discount || 0,
    tax: payload.tax || 0,
    total_amount: calculated.total,
    paid_amount: 0,
    due_amount: calculated.total,
    status: PAYMENT_STATUS.UNPAID,
    items: calculated.items,
    created_by: context.userId,
    updated_by: context.userId,
  }, connection);
  const items = await repository.createInvoiceItems(invoice.id, context.clinicId, calculated.items, context.userId, connection);
  return { ...invoice, items };
});

// Record payment.
const recordPayment = async (payload, context) => runInTransaction(async (connection) => {
  const invoice = await repository.lockInvoice(payload.invoiceId, context.clinicId, connection);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  const amount = money(payload.amount);
  if (amount <= 0 || amount > invoice.due_amount) throw new ApiError(422, 'Invalid payment amount');
  const payment = await repository.payments.create({
    clinic_id: context.clinicId,
    invoice_id: invoice.id,
    receipt_number: `RCT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    amount,
    method: payload.method,
    reference_number: payload.referenceNumber || null,
    paid_at: payload.paidAt || new Date(),
    created_by: context.userId,
    updated_by: context.userId,
  }, connection);
  const paid = money(invoice.paid_amount + amount);
  const due = money(invoice.total_amount - paid);
  const updatedInvoice = await repository.invoices.updateById(invoice.id, context.clinicId, {
    paid_amount: paid,
    due_amount: due,
    status: due === 0 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIALLY_PAID,
    updated_by: context.userId,
  }, connection);
  return { payment, invoice: updatedInvoice };
});

// List tenant invoices.
const listInvoices = async (requestQuery, context) => repository.invoices.list(context.clinicId, requestQuery);

// List tenant payments.
const listPayments = async (requestQuery, context) => repository.payments.list(context.clinicId, requestQuery);

// Get invoice details.
const getInvoice = async (id, context) => {
  const invoice = await repository.findInvoiceWithItems(id, context.clinicId);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  return invoice;
};

module.exports = { calculateInvoice, createInvoice, recordPayment, listInvoices, listPayments, getInvoice };
