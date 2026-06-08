/**
 * Appointment Status Constants
 * Defines appointment lifecycle states.
 */

const APPOINTMENT_STATUS = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  CHECKED_IN: 'CHECKED_IN',
  IN_CONSULTATION: 'IN_CONSULTATION',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
});

module.exports = { APPOINTMENT_STATUS };
