/**
 * Reports Repository
 * Executes tenant reporting queries.
 */

const { prisma } = require('../../database/prisma');

// Build inclusive day range.
const buildDateRange = (from, to) => ({
  start: new Date(`${from}T00:00:00.000Z`),
  end: new Date(`${to}T23:59:59.999Z`),
});

// Calculate booked minutes.
const minutesBetween = (startTime, endTime) => {
  const [startHour, startMinute] = String(startTime).split(':').map(Number);
  const [endHour, endMinute] = String(endTime).split(':').map(Number);
  return Math.max((endHour * 60 + endMinute) - (startHour * 60 + startMinute), 0);
};

// Fetch clinic summary metrics.
const getSummary = async ({ clinicId, from, to }) => {
  const range = buildDateRange(from, to);
  const [patients, appointments, noShows, revenue, dues] = await Promise.all([
    prisma.patients.count({ where: { clinic_id: clinicId, is_deleted: false, created_at: { gte: range.start, lte: range.end } } }),
    prisma.appointments.count({ where: { clinic_id: clinicId, is_deleted: false, appointment_date: { gte: range.start, lte: range.end } } }),
    prisma.appointments.count({ where: { clinic_id: clinicId, is_deleted: false, status: 'NO_SHOW', appointment_date: { gte: range.start, lte: range.end } } }),
    prisma.payments.aggregate({ where: { clinic_id: clinicId, is_deleted: false, paid_at: { gte: range.start, lte: range.end } }, _sum: { amount: true } }),
    prisma.invoices.aggregate({ where: { clinic_id: clinicId, is_deleted: false }, _sum: { due_amount: true } }),
  ]);
  return { patients, appointments, noShows, revenue: revenue._sum.amount || 0, dues: dues._sum.due_amount || 0 };
};

// Fetch doctor utilization metrics.
const getDoctorUtilization = async ({ clinicId, from, to }) => {
  const range = buildDateRange(from, to);
  const [doctors, appointments] = await Promise.all([
    prisma.users.findMany({ where: { clinic_id: clinicId, role: 'DOCTOR', is_active: true, is_deleted: false }, select: { id: true, full_name: true }, orderBy: { full_name: 'asc' } }),
    prisma.appointments.findMany({
      where: { clinic_id: clinicId, is_deleted: false, appointment_date: { gte: range.start, lte: range.end } },
      select: { doctor_id: true, status: true, start_time: true, end_time: true },
    }),
  ]);
  const grouped = new Map();
  appointments.forEach((appointment) => {
    const current = grouped.get(appointment.doctor_id) || { appointments: 0, completed: 0, no_shows: 0, booked_minutes: 0 };
    current.appointments += 1;
    if (appointment.status === 'COMPLETED') current.completed += 1;
    if (appointment.status === 'NO_SHOW') current.no_shows += 1;
    current.booked_minutes += minutesBetween(appointment.start_time, appointment.end_time);
    grouped.set(appointment.doctor_id, current);
  });
  return doctors.map((doctor) => ({ doctor_id: doctor.id, doctor_name: doctor.full_name, ...(grouped.get(doctor.id) || { appointments: 0, completed: 0, no_shows: 0, booked_minutes: 0 }) }))
    .sort((left, right) => right.appointments - left.appointments || left.doctor_name.localeCompare(right.doctor_name));
};

module.exports = { getSummary, getDoctorUtilization };
