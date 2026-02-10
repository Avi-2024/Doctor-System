const Billing = require('../../models/Billing.model');
const Payment = require('../../models/Payment.model');

const buildInvoiceNumber = () => {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INV-${ts}-${rand}`;
};

const normalizeProcedures = (procedures = []) =>
  procedures.map((item) => {
    const quantity = item.quantity || 1;
    const unitPrice = item.fee;
    const lineTotal = quantity * unitPrice;

    return {
      description: item.description,
      quantity,
      unitPrice,
      discount: 0,
      taxPercent: 0,
      lineTotal,
      feeType: 'procedure',
    };
  });

const createBilling = async ({ clinicId, patientId, appointmentId, visitId, opdFee, procedures = [], notes, createdBy }) => {
  const opdItem = {
    description: 'OPD Consultation Fee',
    quantity: 1,
    unitPrice: opdFee,
    discount: 0,
    taxPercent: 0,
    lineTotal: opdFee,
    feeType: 'opd',
  };

  const procedureItems = normalizeProcedures(procedures);
  const items = [opdItem, ...procedureItems];

  const subTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const grandTotal = subTotal;

  const invoiceNumber = buildInvoiceNumber();

  const billing = await Billing.create({
    clinicId,
    invoiceNumber,
    patientId,
    appointmentId,
    visitId,
    createdBy,
    items,
    subTotal,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal,
    amountPaid: 0,
    amountDue: grandTotal,
    status: 'issued',
    paymentStatus: 'due',
    dueDate: new Date(),
    notes,
  });

  return billing;
};

const collectPayment = async ({ clinicId, billingId, amount, mode, transactionRef, paidAt, notes, receivedBy }) => {
  const billing = await Billing.findOne({ _id: billingId, clinicId });

  if (!billing) {
    const error = new Error('Billing record not found');
    error.statusCode = 404;
    throw error;
  }

  if (billing.status === 'cancelled') {
    const error = new Error('Cannot collect payment for cancelled invoice');
    error.statusCode = 409;
    throw error;
  }

  if (amount > billing.amountDue) {
    const error = new Error('Payment amount exceeds due amount');
    error.statusCode = 409;
    throw error;
  }

  const payment = await Payment.create({
    clinicId,
    billingId: billing._id,
    patientId: billing.patientId,
    receivedBy,
    amount,
    method: mode.toLowerCase(),
    status: 'success',
    transactionRef,
    paidAt: paidAt ? new Date(paidAt) : new Date(),
    notes,
  });

  billing.amountPaid += amount;
  billing.amountDue = Math.max(0, billing.grandTotal - billing.amountPaid);

  if (billing.amountDue === 0) {
    billing.status = 'paid';
    billing.paymentStatus = 'paid';
  } else {
    billing.status = 'partially_paid';
    billing.paymentStatus = 'due';
  }

  await billing.save();

  return { billing, payment };
};

const getDailyReport = async ({ clinicId, date }) => {
  const start = new Date(date || new Date());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const [billingAgg, paymentAgg] = await Promise.all([
    Billing.aggregate([
      {
        $match: {
          clinicId,
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          invoices: { $sum: 1 },
          totalBilled: { $sum: '$grandTotal' },
          totalDue: { $sum: '$amountDue' },
          totalCollectedField: { $sum: '$amountPaid' },
        },
      },
    ]),
    Payment.aggregate([
      {
        $match: {
          clinicId,
          status: 'success',
          paidAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$method',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = billingAgg[0] || {
    invoices: 0,
    totalBilled: 0,
    totalDue: 0,
    totalCollectedField: 0,
  };

  return {
    reportType: 'daily',
    date: start.toISOString().slice(0, 10),
    summary,
    paymentModeBreakdown: paymentAgg,
  };
};

const getMonthlyReport = async ({ clinicId, month, year }) => {
  const y = Number(year);
  const m = Number(month);

  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const [billingAgg, paymentAgg] = await Promise.all([
    Billing.aggregate([
      {
        $match: {
          clinicId,
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          invoices: { $sum: 1 },
          totalBilled: { $sum: '$grandTotal' },
          totalDue: { $sum: '$amountDue' },
          totalCollectedField: { $sum: '$amountPaid' },
        },
      },
    ]),
    Payment.aggregate([
      {
        $match: {
          clinicId,
          status: 'success',
          paidAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$method',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = billingAgg[0] || {
    invoices: 0,
    totalBilled: 0,
    totalDue: 0,
    totalCollectedField: 0,
  };

  return {
    reportType: 'monthly',
    month: m,
    year: y,
    summary,
    paymentModeBreakdown: paymentAgg,
  };
};

module.exports = {
  createBilling,
  collectPayment,
  getDailyReport,
  getMonthlyReport,
};
