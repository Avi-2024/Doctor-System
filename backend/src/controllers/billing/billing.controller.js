const mongoose = require('mongoose');
const billingService = require('../../services/billing/billing.service');

const createBilling = async (req, res, next) => {
  try {
    const { clinicId, patientId, appointmentId, visitId, opdFee, procedures, notes } = req.body;

    const billing = await billingService.createBilling({
      clinicId: new mongoose.Types.ObjectId(clinicId),
      patientId: new mongoose.Types.ObjectId(patientId),
      appointmentId: appointmentId ? new mongoose.Types.ObjectId(appointmentId) : undefined,
      visitId: visitId ? new mongoose.Types.ObjectId(visitId) : undefined,
      opdFee,
      procedures,
      notes,
      createdBy: req.auth.userId,
    });

    return res.status(201).json({
      message: 'Billing created successfully',
      billing,
    });
  } catch (error) {
    return next(error);
  }
};

const collectPayment = async (req, res, next) => {
  try {
    const { billingId } = req.params;
    const { amount, mode, transactionRef, paidAt, notes } = req.body;

    const data = await billingService.collectPayment({
      clinicId: req.auth.clinicId,
      billingId: new mongoose.Types.ObjectId(billingId),
      amount,
      mode,
      transactionRef,
      paidAt,
      notes,
      receivedBy: req.auth.userId,
    });

    return res.status(200).json({
      message: 'Payment collected successfully',
      ...data,
    });
  } catch (error) {
    return next(error);
  }
};

const getDailyReport = async (req, res, next) => {
  try {
    const { clinicId, date } = req.query;

    const report = await billingService.getDailyReport({
      clinicId: new mongoose.Types.ObjectId(clinicId),
      date,
    });

    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { clinicId, month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'month and year are required' });
    }

    const report = await billingService.getMonthlyReport({
      clinicId: new mongoose.Types.ObjectId(clinicId),
      month,
      year,
    });

    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBilling,
  collectPayment,
  getDailyReport,
  getMonthlyReport,
};
