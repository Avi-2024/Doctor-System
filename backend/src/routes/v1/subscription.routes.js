const express = require('express');
const subscriptionController = require('../../controllers/subscription/subscription.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { requireSuperAdmin } = require('../../middleware/auth/superAdmin.middleware');

const router = express.Router();

// SUPER_ADMIN endpoints for plan lifecycle
router.post('/admin/assign', jwtAuth, requireSuperAdmin, subscriptionController.createOrUpdateClinicSubscription);
router.post('/admin/razorpay/create', jwtAuth, requireSuperAdmin, subscriptionController.createRazorpaySubscription);

// clinic/subscriber endpoint
router.get('/clinic/:clinicId', jwtAuth, subscriptionController.getClinicSubscription);

// Razorpay webhook endpoint
router.post('/razorpay/webhook', subscriptionController.razorpayWebhook);

module.exports = router;
