/**
 * Appointments Repository
 * Handles conflict-safe appointment persistence.
 */

const { prisma } = require('../../database/prisma');
const { createBaseRepository } = require('../../common/repositories/BaseRepository');

const base = createBaseRepository({
  table: 'appointments',
  columns: ['id', 'clinic_id', 'patient_id', 'doctor_id', 'branch_id', 'appointment_date', 'start_time', 'end_time', 'status', 'source', 'reason', 'cancellation_reason', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['reason', 'source'],
  filterable: ['patient_id', 'doctor_id', 'status', 'appointment_date'],
});

// Find overlapping appointment.
const findConflict = async ({ clinicId, doctorId, date, startTime, endTime, excludeId }, connection) => {
  return (connection || prisma).appointments.findFirst({
    where: {
      clinic_id: clinicId,
      doctor_id: doctorId,
      appointment_date: new Date(`${date}T00:00:00.000Z`),
      start_time: { lt: endTime },
      end_time: { gt: startTime },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      is_deleted: false,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
};

// Find doctor weekly schedule.
const findDoctorSchedule = async (clinicId, doctorId, connection) => {
  return (connection || prisma).doctor_schedules.findFirst({
    where: { clinic_id: clinicId, doctor_id: doctorId, is_active: true, is_deleted: false },
    select: { weekly_schedule: true },
  });
};

// Find conflicting doctor leave.
const findLeaveConflict = async ({ clinicId, doctorId, date, startTime, endTime }, connection) => {
  return (connection || prisma).doctor_leaves.findFirst({
    where: {
      clinic_id: clinicId,
      doctor_id: doctorId,
      status: 'APPROVED',
      is_deleted: false,
      starts_at: { lt: new Date(`${date}T${endTime}:00.000Z`) },
      ends_at: { gt: new Date(`${date}T${startTime}:00.000Z`) },
    },
    select: { id: true },
  });
};

module.exports = { ...base, findConflict, findDoctorSchedule, findLeaveConflict };
