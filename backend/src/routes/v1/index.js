const express = require('express');
const authRoutes = require('./auth.routes');
const clinicRoutes = require('./clinic.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/clinics', clinicRoutes);

module.exports = router;
