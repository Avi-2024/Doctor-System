/**
 * Queue Controller
 * Maps queue workflow requests.
 */

const service = require('./queue.service');
const { successResponse } = require('../../common/utils/response');
const { emitClinicEvent } = require('../../config/socket');

// Build queue service context.
const context = (req) => ({ clinicId: req.tenant.clinicId, userId: req.auth.userId });

// Check patient into queue.
const checkIn = async (req, res) => {
  const record = await service.checkIn(req.body, context(req));
  emitClinicEvent(req.tenant.clinicId, 'queue:created', record);
  return successResponse(res, 'Patient checked in', record, undefined, 201);
};

// Call next waiting patient.
const callNext = async (req, res) => {
  const record = await service.callNext(req.body, context(req));
  emitClinicEvent(req.tenant.clinicId, 'queue:updated', record);
  return successResponse(res, 'Next patient called', record);
};

// Transition queue entry.
const transition = async (req, res) => {
  const record = await service.transition(req.params.id, req.params.action, context(req));
  emitClinicEvent(req.tenant.clinicId, 'queue:updated', record);
  return successResponse(res, 'Queue updated', record);
};

// List queue entries.
const list = async (req, res) => {
  const result = await service.list(req.query, context(req));
  return successResponse(res, 'Queue list fetched', { items: result.items }, result.meta);
};

module.exports = { checkIn, callNext, transition, list };
