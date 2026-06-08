/**
 * Appointments Service
 * Manages appointment booking lifecycle.
 */

const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { ApiError } = require('../../common/errors/ApiError');
const repository = require('./appointments.repository');
const { validateReferences } = require('../../common/services/reference.service');
const { assertUsageAvailable } = require('../subscriptions/subscriptions.service');
const { APPOINTMENT_STATUS } = require('../../common/constants/appointmentStatus');
const { recordAudit } = require('../audit/audit.service');

// Validate appointment range.
const validateRange = (startTime, endTime) => {
  if (startTime >= endTime) throw new ApiError(422, 'endTime must be after startTime');
};

// Convert date input to UTC midnight.
const toDateOnly = (value) => new Date(`${value}T00:00:00.000Z`);

// Validate doctor schedule and leave.
const validateAvailability = async (payload, clinicId, connection) => {
  const schedule = await repository.findDoctorSchedule(clinicId, payload.doctorId, connection);
  if (schedule) {
    const weekly = typeof schedule.weekly_schedule === 'string' ? JSON.parse(schedule.weekly_schedule) : schedule.weekly_schedule;
    const day = weekly.find((entry) => entry.dayOfWeek === new Date(`${payload.appointmentDate}T00:00:00Z`).getUTCDay());
    const available = day?.isOpen && day.slots?.some((slot) => slot.start <= payload.startTime && slot.end >= payload.endTime);
    if (!available) throw new ApiError(409, 'Doctor is unavailable for selected slot');
  }
  const leave = await repository.findLeaveConflict({ clinicId, doctorId: payload.doctorId, date: payload.appointmentDate, startTime: payload.startTime, endTime: payload.endTime }, connection);
  if (leave) throw new ApiError(409, 'Doctor is on leave for selected slot');
};

// Book appointment.
const book = async (payload, context) => runInTransaction(async (connection) => {
  validateRange(payload.startTime, payload.endTime);
  await assertUsageAvailable({ clinicId: context.clinicId, metric: 'monthlyAppointments', connection });
  await validateReferences(
    { patient_id: payload.patientId, doctor_id: payload.doctorId, branch_id: payload.branchId },
    context.clinicId,
    { patient_id: 'patients', doctor_id: { table: 'users', where: "role = 'DOCTOR' AND is_active = TRUE" }, branch_id: 'clinic_branches' },
    connection,
  );
  await validateAvailability(payload, context.clinicId, connection);
  const conflict = await repository.findConflict({
    clinicId: context.clinicId,
    doctorId: payload.doctorId,
    date: payload.appointmentDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
  }, connection);
  if (conflict) throw new ApiError(409, 'Doctor already has an appointment for selected slot');
  const record = await repository.create({
    clinic_id: context.clinicId,
    patient_id: payload.patientId,
    doctor_id: payload.doctorId,
    branch_id: payload.branchId || null,
    appointment_date: toDateOnly(payload.appointmentDate),
    start_time: payload.startTime,
    end_time: payload.endTime,
    status: APPOINTMENT_STATUS.SCHEDULED,
    source: payload.source || 'WALKIN',
    reason: payload.reason || null,
    created_by: context.userId,
    updated_by: context.userId,
  }, connection);
  await recordAudit({ req: context.req, action: 'BOOK', moduleName: 'Appointment', entityType: 'Appointment', entityId: record.id, after: record }, connection);
  return record;
});

// Transition appointment.
const transition = async (id, action, payload, context) => runInTransaction(async (connection) => {
  const current = await repository.findById(id, context.clinicId, connection);
  if (!current) throw new ApiError(404, 'Appointment not found');
  const rules = {
    cancel: { from: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CHECKED_IN], status: APPOINTMENT_STATUS.CANCELLED },
    checkIn: { from: [APPOINTMENT_STATUS.SCHEDULED], status: APPOINTMENT_STATUS.CHECKED_IN },
    startConsultation: { from: [APPOINTMENT_STATUS.CHECKED_IN], status: APPOINTMENT_STATUS.IN_CONSULTATION },
    complete: { from: [APPOINTMENT_STATUS.IN_CONSULTATION], status: APPOINTMENT_STATUS.COMPLETED },
    noShow: { from: [APPOINTMENT_STATUS.SCHEDULED], status: APPOINTMENT_STATUS.NO_SHOW },
  };
  const rule = rules[action];
  if (!rule || !rule.from.includes(current.status)) throw new ApiError(409, 'Invalid appointment transition');
  const record = await repository.updateById(id, context.clinicId, {
    status: rule.status,
    cancellation_reason: action === 'cancel' ? payload.cancellationReason : current.cancellation_reason,
    updated_by: context.userId,
  }, connection);
  await recordAudit({ req: context.req, action: `APPOINTMENT_${action.toUpperCase()}`, moduleName: 'Appointment', entityType: 'Appointment', entityId: record.id, before: current, after: record }, connection);
  return record;
});

// List tenant appointments.
const list = async (requestQuery, context) => repository.list(context.clinicId, requestQuery);

module.exports = { book, transition, list };
