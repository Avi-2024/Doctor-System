const express = require('express');
const authRoutes = require('./auth.routes');
const clinicRoutes = require('./clinic.routes');
const appointmentRoutes = require('./appointment.routes');
const whatsappRoutes = require('./whatsapp.routes');
const billingRoutes = require('./billing.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/clinics', clinicRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/billing', billingRoutes);

module.exports = router;
