/**
 * Appointments Controller
 * Handles appointment actions.
 */

const service = require('./appointments.service');
const { successResponse } = require('../../common/utils/response');

// Book appointment.
const book = async (req, res) => {
  const record = await service.book(req.body, { clinicId: req.tenant.clinicId, userId: req.auth.userId, req });
  return successResponse(res, 'Appointment booked', record, undefined, 201);
};

// List appointments.
const list = async (req, res) => {
  const result = await service.list(req.query, { clinicId: req.tenant.clinicId });
  return successResponse(res, 'Appointment list fetched', { items: result.items }, result.meta);
};

// Transition appointment.
const transition = async (req, res) => {
  const record = await service.transition(req.params.id, req.params.action, req.body, { clinicId: req.tenant.clinicId, userId: req.auth.userId, req });
  return successResponse(res, 'Appointment updated', record);
};

module.exports = { book, list, transition };
