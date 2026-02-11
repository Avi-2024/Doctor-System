const mongoose = require('mongoose');

const allowedPaymentModes = ['cash', 'upi', 'card'];

const validateCreateBilling = (req, res, next) => {
  const { clinicId, patientId, appointmentId, visitId, opdFee, procedures, notes } = req.body;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return res.status(400).json({ message: 'Valid clinicId is required' });
  }

  if (!patientId || !mongoose.isValidObjectId(patientId)) {
    return res.status(400).json({ message: 'Valid patientId is required' });
  }

  if (appointmentId && !mongoose.isValidObjectId(appointmentId)) {
    return res.status(400).json({ message: 'appointmentId must be a valid ObjectId' });
  }

  if (visitId && !mongoose.isValidObjectId(visitId)) {
    return res.status(400).json({ message: 'visitId must be a valid ObjectId' });
  }

  if (typeof opdFee !== 'number' || opdFee < 0) {
    return res.status(400).json({ message: 'opdFee must be a non-negative number' });
  }

  if (procedures && !Array.isArray(procedures)) {
    return res.status(400).json({ message: 'procedures must be an array' });
  }

  if (Array.isArray(procedures)) {
    for (const procedure of procedures) {
      if (!procedure.description || typeof procedure.description !== 'string') {
        return res.status(400).json({ message: 'procedure.description is required' });
      }
      if (typeof procedure.fee !== 'number' || procedure.fee < 0) {
        return res.status(400).json({ message: 'procedure.fee must be a non-negative number' });
      }
      if (procedure.quantity !== undefined && (!Number.isInteger(procedure.quantity) || procedure.quantity < 1)) {
        return res.status(400).json({ message: 'procedure.quantity must be an integer >= 1' });
      }
    }
  }

  if (notes && notes.length > 500) {
    return res.status(400).json({ message: 'notes exceeds max length 500' });
  }

  return next();
};

const validateCollectPayment = (req, res, next) => {
  const { billingId } = req.params;
  const { amount, mode, transactionRef, paidAt, notes } = req.body;

  if (!billingId || !mongoose.isValidObjectId(billingId)) {
    return res.status(400).json({ message: 'Valid billingId is required' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'amount must be a positive number' });
  }

  if (!mode || !allowedPaymentModes.includes(mode.toLowerCase())) {
    return res.status(400).json({ message: 'mode must be one of cash, upi, card' });
  }

  if (transactionRef && typeof transactionRef !== 'string') {
    return res.status(400).json({ message: 'transactionRef must be a string' });
  }

  if (paidAt && Number.isNaN(new Date(paidAt).getTime())) {
    return res.status(400).json({ message: 'paidAt must be a valid date' });
  }

  if (notes && notes.length > 500) {
    return res.status(400).json({ message: 'notes exceeds max length 500' });
  }

  return next();
};

const validateReportQuery = (req, res, next) => {
  const { clinicId } = req.query;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return res.status(400).json({ message: 'Valid clinicId query parameter is required' });
  }

  return next();
};

module.exports = {
  validateCreateBilling,
  validateCollectPayment,
  validateReportQuery,
};
