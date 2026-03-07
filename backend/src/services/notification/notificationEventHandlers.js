const { emitEvent } = require('./notificationEngine.service');
const { NOTIFICATION_EVENTS, NOTIFICATION_CHANNELS } = require('./notification.constants');

const handleNewAppointment = async ({ clinicId, recipients, context }) =>
  emitEvent({
    clinicId,
    event: NOTIFICATION_EVENTS.NEW_APPOINTMENT,
    recipients,
    context,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.WHATSAPP],
  });

const handlePatientWaiting = async ({ clinicId, recipients, context }) =>
  emitEvent({
    clinicId,
    event: NOTIFICATION_EVENTS.PATIENT_WAITING,
    recipients,
    context,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
  });

const handleDoctorHospitalTimeBooking = async ({ clinicId, recipients, context }) =>
  emitEvent({
    clinicId,
    event: NOTIFICATION_EVENTS.DOCTOR_HOSPITAL_TIME_BOOKING,
    recipients,
    context,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.WHATSAPP],
  });

const handleFollowUpReminder = async ({ clinicId, recipients, context }) =>
  emitEvent({
    clinicId,
    event: NOTIFICATION_EVENTS.FOLLOW_UP_REMINDER,
    recipients,
    context,
    channels: [NOTIFICATION_CHANNELS.WHATSAPP, NOTIFICATION_CHANNELS.SMS],
  });

const handlePaymentPending = async ({ clinicId, recipients, context }) =>
  emitEvent({
    clinicId,
    event: NOTIFICATION_EVENTS.PAYMENT_PENDING,
    recipients,
    context,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.WHATSAPP],
  });

module.exports = {
  handleNewAppointment,
  handlePatientWaiting,
  handleDoctorHospitalTimeBooking,
  handleFollowUpReminder,
  handlePaymentPending,
};
