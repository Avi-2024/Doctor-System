/**
 * Queue Service
 * Manages waiting-room tokens and transitions.
 */

const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { ApiError } = require('../../common/errors/ApiError');
const repository = require('./queue.repository');
const { validateReferences } = require('../../common/services/reference.service');
const { QUEUE_STATUS } = require('../../common/constants/queueStatus');

// Convert date input to UTC midnight.
const toDateOnly = (value) => new Date(`${value}T00:00:00.000Z`);

// Check patient into queue.
const checkIn = async (payload, context) => runInTransaction(async (connection) => {
  await validateReferences(
    { patient_id: payload.patientId, doctor_id: payload.doctorId, appointment_id: payload.appointmentId },
    context.clinicId,
    { patient_id: 'patients', doctor_id: { table: 'users', where: "role = 'DOCTOR' AND is_active = TRUE" }, appointment_id: 'appointments' },
    connection,
  );
  const token = await repository.nextToken(context.clinicId, payload.queueDate, connection);
  return repository.create({
    clinic_id: context.clinicId,
    patient_id: payload.patientId,
    doctor_id: payload.doctorId,
    appointment_id: payload.appointmentId || null,
    queue_date: toDateOnly(payload.queueDate),
    token_number: token,
    priority: payload.priority || 0,
    status: QUEUE_STATUS.WAITING,
    created_by: context.userId,
    updated_by: context.userId,
  }, connection);
});

// Call next patient.
const callNext = async (payload, context) => runInTransaction(async (connection) => {
  const record = await repository.callNext(context.clinicId, payload.doctorId, payload.queueDate, context.userId, connection);
  if (!record) throw new ApiError(404, 'No waiting patient found');
  return record;
});

// Transition queue entry.
const transition = async (id, action, context) => runInTransaction(async (connection) => {
  const current = await repository.findById(id, context.clinicId, connection);
  if (!current) throw new ApiError(404, 'Queue entry not found');
  const rules = {
    start: { from: [QUEUE_STATUS.CALLED], status: QUEUE_STATUS.IN_PROGRESS },
    complete: { from: [QUEUE_STATUS.IN_PROGRESS], status: QUEUE_STATUS.COMPLETED },
    noShow: { from: [QUEUE_STATUS.WAITING, QUEUE_STATUS.CALLED], status: QUEUE_STATUS.NO_SHOW },
    skip: { from: [QUEUE_STATUS.WAITING, QUEUE_STATUS.CALLED], status: QUEUE_STATUS.SKIPPED },
  };
  const rule = rules[action];
  if (!rule || !rule.from.includes(current.status)) throw new ApiError(409, 'Invalid queue transition');
  return repository.updateById(id, context.clinicId, {
    status: rule.status,
    completed_at: action === 'complete' ? new Date() : current.completed_at,
    updated_by: context.userId,
  }, connection);
});

// List tenant queue entries.
const list = async (requestQuery, context) => repository.list(context.clinicId, requestQuery);

module.exports = { checkIn, callNext, transition, list };
