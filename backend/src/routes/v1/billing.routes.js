const express = require('express');
const billingController = require('../../controllers/billing/billing.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { allowRoles } = require('../../middleware/rbac/roleGuard.middleware');
const { ROLES } = require('../../utils/constants/roles');
const {
  validateCreateBilling,
  validateCollectPayment,
  validateReportQuery,
} = require('../../middleware/validation/billing.validation');

const router = express.Router();

router.post(
  '/',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF),
  validateCreateBilling,
  billingController.createBilling
);

router.post(
  '/:billingId/payments',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF),
  validateCollectPayment,
  billingController.collectPayment
);

router.get(
  '/reports/daily',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF),
  validateReportQuery,
  billingController.getDailyReport
);

router.get(
  '/reports/monthly',
  jwtAuth,
  allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF),
  validateReportQuery,
  billingController.getMonthlyReport
);

module.exports = router;
