const appointmentService = require('../../services/appointment/appointment.service');

const upsertDoctorSchedule = async (req, res, next) => {
  try {
    const { clinicId, doctorId, scheduleType, locationName, timezone, weeklySchedule } = req.body;

    const schedule = await appointmentService.upsertDoctorSchedule({
      clinicId,
      doctorId,
      scheduleType,
      locationName,
      timezone,
      weeklySchedule,
      actorUserId: req.auth?.userId,
    });

    return res.status(200).json({
      message: 'Doctor schedule saved successfully',
      schedule,
    });
  } catch (error) {
    return next(error);
  }
};

const bookAppointment = async (req, res, next) => {
  try {
    const { clinicId, doctorId, patientId, appointmentDate, startTime, endTime, source, reason, type } = req.body;

    const appointment = await appointmentService.bookAppointment({
      clinicId,
      doctorId,
      patientId,
      bookedBy: req.auth?.userId,
      appointmentDate,
      startTime,
      endTime,
      source,
      reason,
      type,
    });

    return res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    return next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status, cancellationReason } = req.body;

    const appointment = await appointmentService.updateAppointmentStatus({
      clinicId: req.auth.clinicId,
      appointmentId,
      status,
      cancellationReason,
    });

    return res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  upsertDoctorSchedule,
  bookAppointment,
  updateAppointmentStatus,
};
