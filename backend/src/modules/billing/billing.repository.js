/**
 * Billing Repository
 * Handles transactional invoices and payments.
 */

const { prisma } = require('../../database/prisma');
const { createBaseRepository } = require('../../common/repositories/BaseRepository');
const { createId } = require('../../common/utils/ids');

const invoices = createBaseRepository({
  table: 'invoices',
  columns: ['id', 'clinic_id', 'invoice_number', 'patient_id', 'subtotal', 'discount', 'tax', 'total_amount', 'paid_amount', 'due_amount', 'status', 'items', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['invoice_number'],
  filterable: ['patient_id', 'status'],
  jsonFields: ['items'],
});

const payments = createBaseRepository({
  table: 'payments',
  columns: ['id', 'clinic_id', 'invoice_id', 'receipt_number', 'amount', 'method', 'reference_number', 'paid_at', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['receipt_number', 'reference_number'],
  filterable: ['invoice_id', 'method'],
});

// Lock invoice for payment.
const lockInvoice = async (id, clinicId, connection) => {
  return (connection || prisma).invoices.findFirst({ where: { id, clinic_id: clinicId, is_deleted: false } });
};

// Create normalized invoice items.
const createInvoiceItems = async (invoiceId, clinicId, items, actorId, connection) => {
  const records = [];
  for (const item of items) {
    const record = {
      id: createId(),
      clinicId,
      invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.total,
      actorId,
    };
    await (connection || prisma).invoice_items.create({
      data: {
        id: record.id,
        clinic_id: record.clinicId,
        invoice_id: record.invoiceId,
        description: record.description,
        quantity: record.quantity,
        unit_price: record.unitPrice,
        total_amount: record.totalAmount,
        created_by: record.actorId,
        updated_by: record.actorId,
      },
    });
    records.push({ id: record.id, invoice_id: invoiceId, description: record.description, quantity: record.quantity, unit_price: record.unitPrice, total_amount: record.totalAmount });
  }
  return records;
};

// Find invoice with normalized items.
const findInvoiceWithItems = async (id, clinicId, connection) => {
  const invoice = await invoices.findById(id, clinicId, connection);
  if (!invoice) return null;
  const items = await (connection || prisma).invoice_items.findMany({
    where: { clinic_id: clinicId, invoice_id: id, is_deleted: false },
    select: { id: true, invoice_id: true, description: true, quantity: true, unit_price: true, total_amount: true },
    orderBy: { created_at: 'asc' },
  });
  return { ...invoice, items };
};

module.exports = { invoices, payments, lockInvoice, createInvoiceItems, findInvoiceWithItems };
