const express = require('express');
const appointmentController = require('../../controllers/appointment/appointment.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { allowRoles } = require('../../middleware/rbac/roleGuard.middleware');
const { ROLES } = require('../../utils/constants/roles');
const { auditLogger } = require('../../middleware/audit/auditLogger.middleware');
const {
  validateUpsertDoctorSchedule,
  validateBookAppointment,
  validateUpdateAppointmentStatus,
} = require('../../middleware/validation/appointment.validation');

const router = express.Router();

router.post(
  '/schedules',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF),
  validateUpsertDoctorSchedule,
  auditLogger({ action: 'APPOINTMENT_SCHEDULE_UPSERT', resourceType: 'doctor_schedule', logOnlySuccess: true }),
  appointmentController.upsertDoctorSchedule
);

router.post(
  '/book',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF, ROLES.DOCTOR),
  validateBookAppointment,
  auditLogger({ action: 'APPOINTMENT_BOOK', resourceType: 'appointment', logOnlySuccess: true }),
  appointmentController.bookAppointment
);

router.patch(
  '/:appointmentId/status',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF, ROLES.DOCTOR),
  validateUpdateAppointmentStatus,
  auditLogger({ action: 'APPOINTMENT_STATUS_UPDATE', resourceType: 'appointment', logOnlySuccess: true }),
  appointmentController.updateAppointmentStatus
);

module.exports = router;
