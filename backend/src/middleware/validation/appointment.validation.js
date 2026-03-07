const mongoose = require('mongoose');

const isValidTimeHHMM = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const validateWeeklySchedule = (weeklySchedule) => {
  if (!Array.isArray(weeklySchedule) || weeklySchedule.length !== 7) {
    return 'weeklySchedule must contain 7 day entries';
  }

  for (const day of weeklySchedule) {
    if (typeof day.dayOfWeek !== 'number' || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      return 'dayOfWeek must be between 0 and 6';
    }

    if (!Array.isArray(day.slots)) {
      return 'day.slots must be an array';
    }

    for (const slot of day.slots) {
      if (!isValidTimeHHMM(slot.startTime) || !isValidTimeHHMM(slot.endTime)) {
        return 'slot startTime and endTime must be in HH:MM format';
      }

      if (slot.startTime >= slot.endTime) {
        return 'slot startTime must be less than endTime';
      }
    }
  }

  return null;
};

const validateUpsertDoctorSchedule = (req, res, next) => {
  const { clinicId, doctorId, scheduleType, locationName, timezone, weeklySchedule } = req.body;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return res.status(400).json({ message: 'Valid clinicId is required' });
  }

  if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
    return res.status(400).json({ message: 'Valid doctorId is required' });
  }

  if (!scheduleType || !['clinic', 'hospital'].includes(scheduleType)) {
    return res.status(400).json({ message: 'scheduleType must be clinic or hospital' });
  }

  if (!locationName || locationName.trim().length < 2) {
    return res.status(400).json({ message: 'locationName is required' });
  }

  if (!timezone || typeof timezone !== 'string') {
    return res.status(400).json({ message: 'timezone is required' });
  }

  const scheduleError = validateWeeklySchedule(weeklySchedule);
  if (scheduleError) {
    return res.status(400).json({ message: scheduleError });
  }

  return next();
};

const validateBookAppointment = (req, res, next) => {
  const { clinicId, doctorId, patientId, appointmentDate, startTime, endTime, source, reason } = req.body;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return res.status(400).json({ message: 'Valid clinicId is required' });
  }

  if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
    return res.status(400).json({ message: 'Valid doctorId is required' });
  }

  if (!patientId || !mongoose.isValidObjectId(patientId)) {
    return res.status(400).json({ message: 'Valid patientId is required' });
  }

  if (!appointmentDate || Number.isNaN(new Date(appointmentDate).getTime())) {
    return res.status(400).json({ message: 'Valid appointmentDate is required' });
  }

  if (!startTime || !endTime || !isValidTimeHHMM(startTime) || !isValidTimeHHMM(endTime)) {
    return res.status(400).json({ message: 'startTime and endTime must be valid HH:MM strings' });
  }

  if (startTime >= endTime) {
    return res.status(400).json({ message: 'startTime must be less than endTime' });
  }

  if (source && !['walkin', 'phone', 'whatsapp', 'web', 'staff'].includes(source)) {
    return res.status(400).json({ message: 'source is invalid' });
  }

  if (reason && reason.length > 500) {
    return res.status(400).json({ message: 'reason exceeds max length 500' });
  }

  return next();
};

const validateUpdateAppointmentStatus = (req, res, next) => {
  const { appointmentId } = req.params;
  const { status, cancellationReason } = req.body;

  if (!appointmentId || !mongoose.isValidObjectId(appointmentId)) {
    return res.status(400).json({ message: 'Valid appointmentId is required' });
  }

  if (!status || !['booked', 'waiting', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'status must be one of booked, waiting, completed, cancelled' });
  }

  if (status === 'cancelled' && (!cancellationReason || cancellationReason.trim().length < 3)) {
    return res.status(400).json({ message: 'cancellationReason is required when status is cancelled' });
  }

  return next();
};

module.exports = {
  validateUpsertDoctorSchedule,
  validateBookAppointment,
  validateUpdateAppointmentStatus,
};
