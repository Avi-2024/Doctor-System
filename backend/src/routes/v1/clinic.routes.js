const express = require('express');
const clinicController = require('../../controllers/clinic/clinic.controller');
const { validateClinicOnboarding, validateClinicIdParam } = require('../../middleware/validation/clinic.validation');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { allowRoles } = require('../../middleware/rbac/roleGuard.middleware');
const { ROLES } = require('../../utils/constants/roles');
const { auditLogger } = require('../../middleware/audit/auditLogger.middleware');

const router = express.Router();

router.post('/onboard', validateClinicOnboarding, auditLogger({ action: 'CLINIC_ONBOARD', resourceType: 'clinic', logOnlySuccess: true }), clinicController.onboardClinic);

router.get(
  '/:clinicId/onboarding-status',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF),
  validateClinicIdParam,
  clinicController.getClinicOnboardingStatus
);

module.exports = router;
