/**
 * WhatsApp Routes
 * Registers Meta webhook and queue endpoints.
 */

const express = require('express');
const controller = require('./whatsapp.controller');
const { queueMessageRules, sendMessageRules } = require('./whatsapp.validator');
const { requireAuth } = require('../../common/middleware/auth');
const { attachTenant } = require('../../common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../../common/middleware/rbac');
const { validate } = require('../../common/middleware/validate');
const { asyncHandler } = require('../../common/utils/asyncHandler');
const { ROLES } = require('../../common/constants/roles');
const { PERMISSIONS } = require('../../common/constants/permissions');

const router = express.Router();

router.get('/webhook', asyncHandler(controller.verifyWebhook));
router.post('/webhook', asyncHandler(controller.receiveWebhook));
router.post('/messages',
  requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.WHATSAPP_MANAGE),
  queueMessageRules, validate, asyncHandler(controller.queueMessage),
);
router.post('/messages/:id/send',
  requireAuth, attachTenant, allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.RECEPTIONIST), allowPermissions(PERMISSIONS.WHATSAPP_MANAGE),
  sendMessageRules, validate, asyncHandler(controller.sendMessage),
);

module.exports = router;
