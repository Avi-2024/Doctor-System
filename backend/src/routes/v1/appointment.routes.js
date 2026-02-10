const express = require('express');
const appointmentController = require('../../controllers/appointment/appointment.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { allowRoles } = require('../../middleware/rbac/roleGuard.middleware');
const { ROLES } = require('../../utils/constants/roles');
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
  appointmentController.upsertDoctorSchedule
);

router.post(
  '/book',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF, ROLES.DOCTOR),
  validateBookAppointment,
  appointmentController.bookAppointment
);

router.patch(
  '/:appointmentId/status',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF, ROLES.DOCTOR),
  validateUpdateAppointmentStatus,
  appointmentController.updateAppointmentStatus
);

module.exports = router;
