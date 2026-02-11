const express = require('express');
const superAdminController = require('../../controllers/admin/superAdmin.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { requireSuperAdmin } = require('../../middleware/auth/superAdmin.middleware');

const router = express.Router();

router.use(jwtAuth, requireSuperAdmin);

router.get('/clinics', superAdminController.listClinics);
router.get('/clinics/:clinicId', superAdminController.getClinicSummary);
router.patch('/clinics/:clinicId/status', superAdminController.updateClinicActiveStatus);
router.get('/revenue-overview', superAdminController.getPlatformRevenueOverview);

module.exports = router;
