const { NOTIFICATION_EVENTS } = require('./notification.constants');

const templates = {
  [NOTIFICATION_EVENTS.NEW_APPOINTMENT]: ({ patientName, doctorName, appointmentDate, startTime }) => ({
    title: 'New Appointment',
    text: `New appointment booked for ${patientName} with Dr. ${doctorName} on ${appointmentDate} at ${startTime}.`,
  }),
  [NOTIFICATION_EVENTS.PATIENT_WAITING]: ({ patientName, doctorName }) => ({
    title: 'Patient Waiting',
    text: `${patientName} is marked waiting for consultation with Dr. ${doctorName}.`,
  }),
  [NOTIFICATION_EVENTS.DOCTOR_HOSPITAL_TIME_BOOKING]: ({ patientName, appointmentDate, startTime }) => ({
    title: 'Hospital-time Booking Alert',
    text: `A hospital-time appointment was booked for ${patientName} on ${appointmentDate} at ${startTime}.`,
  }),
  [NOTIFICATION_EVENTS.FOLLOW_UP_REMINDER]: ({ patientName, followUpDate }) => ({
    title: 'Follow-up Reminder',
    text: `Reminder: ${patientName} has a follow-up due on ${followUpDate}.`,
  }),
  [NOTIFICATION_EVENTS.PAYMENT_PENDING]: ({ patientName, amountDue, invoiceNumber }) => ({
    title: 'Payment Pending',
    text: `Pending payment for ${patientName}: ₹${amountDue} (Invoice ${invoiceNumber}).`,
  }),
};

const resolveTemplate = (event, context = {}) => {
  const resolver = templates[event];
  if (!resolver) {
    return {
      title: 'Notification',
      text: context.message || 'You have a new notification.',
    };
  }

  return resolver(context);
};

module.exports = {
  resolveTemplate,
};
