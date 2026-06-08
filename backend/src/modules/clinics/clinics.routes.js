/**
 * Clinics Routes
 * Registers clinic endpoints.
 */

const express = require('express');
const controller = require('./clinics.controller');
const { onboardRules, profileUpdateRules, statusUpdateRules, clinicIdRules } = require('./clinics.validator');
const { createResourceModule } = require('../../common/modules/resourceFactory');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');

const router = express.Router();
const resource = createResourceModule({
  name: 'Clinic',
  table: 'clinics',
  roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],
  readPermissions: [PERMISSIONS.CLINICS_MANAGE],
  platformListAll: true,
  columns: ['id', 'clinic_id', 'name', 'code', 'status', 'contact', 'address', 'branding', 'timezone', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['name', 'code'],
  filterable: ['status'],
  jsonFields: ['contact', 'address', 'branding'],
  allowCreate: false,
  allowUpdate: false,
  allowDelete: false,
});

router.post('/onboard',
  onboardRules,
  validate,
  asyncHandler(controller.onboard),
);
router.patch('/current', requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER), allowPermissions(PERMISSIONS.CLINICS_MANAGE), profileUpdateRules, validate, asyncHandler(controller.updateProfile));
router.patch('/:id/status', requireAuth, allowRoles(ROLES.SUPER_ADMIN), allowPermissions(PERMISSIONS.CLINICS_MANAGE), statusUpdateRules, validate, asyncHandler(controller.updateStatus));
router.delete('/:id', requireAuth, allowRoles(ROLES.SUPER_ADMIN), allowPermissions(PERMISSIONS.CLINICS_MANAGE), clinicIdRules, validate, asyncHandler(controller.remove));
router.use('/', resource.router);

module.exports = router;
