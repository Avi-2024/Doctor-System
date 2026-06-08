/**
 * Storage Routes
 * Registers secure attachment endpoints.
 */

const express = require('express');
const multer = require('multer');
const controller = require('./storage.controller');
const { uploadRules, signedUrlRules } = require('./storage.validator');
const { env } = require('../../config/env');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { ApiError } = require('../../common/errors/ApiError');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');
const { paginationRules } = require('../../common/validators/pagination.validator');

const allowedTypes = new Set(env.UPLOAD_ALLOWED_MIME_TYPES.split(','));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, callback) => callback(allowedTypes.has(file.mimetype) ? null : new ApiError(415, 'Unsupported file type'), allowedTypes.has(file.mimetype)),
});
const router = express.Router();
const guards = [requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.DOCTOR, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.STORAGE_MANAGE)];
router.post('/attachments', guards, upload.single('file'), uploadRules, validate, asyncHandler(controller.upload));
router.get('/attachments/:id/url', guards, signedUrlRules, validate, asyncHandler(controller.signedUrl));
router.get('/attachments', guards, paginationRules, validate, asyncHandler(controller.list));

module.exports = router;
