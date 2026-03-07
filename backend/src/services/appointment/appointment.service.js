const Appointment = require('../../models/Appointment.model');
const DoctorSchedule = require('../../models/DoctorSchedule.model');
const Notification = require('../../models/Notification.model');
const User = require('../../models/User.model');

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => Math.max(aStart, bStart) < Math.min(aEnd, bEnd);

const findMatchingScheduleType = async ({ clinicId, doctorId, appointmentDate, startTime, endTime }) => {
  const date = new Date(appointmentDate);
  const dayOfWeek = date.getDay();

  const schedules = await DoctorSchedule.find({ clinicId, doctorId, isActive: true });

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  for (const schedule of schedules) {
    const daySchedule = schedule.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek && d.isAvailable);
    if (!daySchedule) continue;

    const matchedSlot = daySchedule.slots.find((slot) => {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      return start >= slotStart && end <= slotEnd;
    });

    if (matchedSlot) {
      return schedule.scheduleType;
    }
  }

  return null;
};

const upsertDoctorSchedule = async ({ clinicId, doctorId, scheduleType, locationName, timezone, weeklySchedule, actorUserId }) => {
  const doctor = await User.findOne({ _id: doctorId, clinicId, role: 'DOCTOR', isActive: true });
  if (!doctor) {
    const error = new Error('Doctor not found in this clinic');
    error.statusCode = 404;
    throw error;
  }

  const updated = await DoctorSchedule.findOneAndUpdate(
    { clinicId, doctorId, scheduleType },
    {
      clinicId,
      doctorId,
      scheduleType,
      locationName,
      timezone,
      weeklySchedule,
      isActive: true,
      updatedBy: actorUserId,
      $setOnInsert: { createdBy: actorUserId },
    },
    { new: true, upsert: true }
  );

  return updated;
};

const bookAppointment = async ({ clinicId, doctorId, patientId, bookedBy, appointmentDate, startTime, endTime, source, reason, type }) => {
  const scheduleType = await findMatchingScheduleType({ clinicId, doctorId, appointmentDate, startTime, endTime });

  if (!scheduleType) {
    const error = new Error('Requested slot is outside doctor clinic/hospital schedule');
    error.statusCode = 409;
    throw error;
  }

  const apptDate = new Date(appointmentDate);

  const existingAppointments = await Appointment.find({
    clinicId,
    doctorId,
    appointmentDate: apptDate,
    status: { $in: ['booked', 'waiting'] },
  });

  const reqStart = toMinutes(startTime);
  const reqEnd = toMinutes(endTime);

  const hasConflict = existingAppointments.some((item) =>
    overlaps(reqStart, reqEnd, toMinutes(item.startTime), toMinutes(item.endTime))
  );

  if (hasConflict) {
    const error = new Error('Doctor already has an appointment in the selected slot');
    error.statusCode = 409;
    throw error;
  }

  const appointment = await Appointment.create({
    clinicId,
    patientId,
    doctorId,
    bookedBy,
    source: source || 'staff',
    appointmentDate: apptDate,
    startTime,
    endTime,
    type: type || 'new',
    status: 'booked',
    bookingContext: scheduleType === 'hospital' ? 'hospital_time' : 'clinic_time',
    reason,
  });

  if (scheduleType === 'hospital') {
    const doctor = await User.findById(doctorId).select('email phone fullName');
    await Notification.create({
      clinicId,
      userId: doctorId,
      patientId,
      appointmentId: appointment._id,
      type: 'hospital_time_booking_alert',
      channel: 'in_app',
      recipient: doctor?.email || doctor?.phone || doctor?.fullName || 'doctor',
      payload: {
        message: 'A patient booked an appointment during your hospital time',
        appointmentId: appointment._id,
        appointmentDate: apptDate,
        startTime,
        endTime,
      },
      status: 'queued',
    });
  }

  return appointment;
};

const updateAppointmentStatus = async ({ clinicId, appointmentId, status, cancellationReason }) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, clinicId });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  appointment.status = status;
  if (status === 'cancelled') {
    appointment.cancellationReason = cancellationReason;
  }

  await appointment.save();
  return appointment;
};

module.exports = {
  upsertDoctorSchedule,
  bookAppointment,
  updateAppointmentStatus,
};
