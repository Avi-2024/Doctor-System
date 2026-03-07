/**
 * WhatsApp template helpers.
 * Flow comments:
 * - Each clinic uses its own WhatsApp number (resolved by incoming metadata.to).
 * - Auto-replies are selected based on whether clinic is currently open/closed.
 * - After successful booking, confirmation template is sent back to patient.
 */

const buildOpenAutoReply = ({ clinicName }) =>
  `Welcome to ${clinicName}.\nPlease send booking message in format:\nBOOK|PATIENT:<patientId>|DOCTOR:<doctorId>|DATE:YYYY-MM-DD|START:HH:MM|END:HH:MM|REASON:<text>`;

const buildClosedAutoReply = ({ clinicName, nextOpenText }) =>
  `${clinicName} is currently closed. ${nextOpenText ? `Next opening: ${nextOpenText}.` : ''}\nYou can still send booking request and we will process it.`;

const buildInvalidBookingReply = () =>
  'Invalid booking format. Use: BOOK|PATIENT:<patientId>|DOCTOR:<doctorId>|DATE:YYYY-MM-DD|START:HH:MM|END:HH:MM|REASON:<text>';

const buildAppointmentConfirmation = ({ clinicName, appointmentDate, startTime, endTime, bookingContext }) =>
  `Appointment confirmed at ${clinicName}.\nDate: ${appointmentDate}\nTime: ${startTime}-${endTime}\nContext: ${bookingContext === 'hospital_time' ? 'Hospital Time' : 'Clinic Time'}`;

module.exports = {
  buildOpenAutoReply,
  buildClosedAutoReply,
  buildInvalidBookingReply,
  buildAppointmentConfirmation,
};
