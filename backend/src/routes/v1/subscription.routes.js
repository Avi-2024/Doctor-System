const express = require('express');
const subscriptionController = require('../../controllers/subscription/subscription.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { requireSuperAdmin } = require('../../middleware/auth/superAdmin.middleware');
const { auditLogger } = require('../../middleware/audit/auditLogger.middleware');

const router = express.Router();

// SUPER_ADMIN endpoints for plan lifecycle
router.post('/admin/assign', jwtAuth, requireSuperAdmin, auditLogger({ action: 'SUBSCRIPTION_ASSIGN', resourceType: 'subscription', logOnlySuccess: true }), subscriptionController.createOrUpdateClinicSubscription);
router.post('/admin/razorpay/create', jwtAuth, requireSuperAdmin, auditLogger({ action: 'RAZORPAY_SUBSCRIPTION_CREATE', resourceType: 'subscription', logOnlySuccess: true }), subscriptionController.createRazorpaySubscription);

// clinic/subscriber endpoint
router.get('/clinic/:clinicId', jwtAuth, subscriptionController.getClinicSubscription);

// Razorpay webhook endpoint
router.post('/razorpay/webhook', auditLogger({ action: 'RAZORPAY_WEBHOOK_RECEIVED', resourceType: 'subscription' }), subscriptionController.razorpayWebhook);

module.exports = router;
