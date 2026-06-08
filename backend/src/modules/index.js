/**
 * Module Router
 * Mounts versioned feature modules.
 */

const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth/auth.routes'));
router.use('/clinics', require('./clinics/clinics.routes'));
router.use('/users', require('./users/users.routes'));
router.use('/patients', require('./patients/patients.routes'));
router.use('/patient-records', require('./patients/patientRecords.routes'));
router.use('/branches', require('./branches/branches.routes'));
router.use('/doctor-schedules', require('./schedules/schedules.routes'));
router.use('/doctor-leaves', require('./schedules/leaves.routes'));
router.use('/appointments', require('./appointments/appointments.routes'));
router.use('/queue', require('./queue/queue.routes'));
router.use('/clinical', require('./clinical/clinical.routes'));
router.use('/vitals', require('./clinical/vitals.routes'));
router.use('/prescriptions', require('./prescriptions/prescriptions.routes'));
router.use('/prescription-templates', require('./prescriptions/templates.routes'));
router.use('/lab-tests', require('./lab/tests.routes'));
router.use('/lab-orders', require('./lab/lab.routes'));
router.use('/lab-order-items', require('./lab/items.routes'));
router.use('/lab-reports', require('./lab/reports.routes'));
router.use('/billing', require('./billing/billing.routes'));
router.use('/storage', require('./storage/storage.routes'));
router.use('/whatsapp', require('./whatsapp/whatsapp.routes'));
router.use('/whatsapp-accounts', require('./whatsapp/accounts.routes'));
router.use('/whatsapp-messages', require('./whatsapp/messages.routes'));
router.use('/whatsapp-templates', require('./whatsapp/templates.routes'));
router.use('/notifications', require('./notifications/notifications.routes'));
router.use('/subscription-plans', require('./subscriptions/subscriptions.routes'));
router.use('/subscriptions', require('./subscriptions/clinicSubscriptions.routes'));
router.use('/settings', require('./settings/settings.routes'));
router.use('/audit-logs', require('./audit/audit.routes'));
router.use('/reports', require('./reports/reports.routes'));

module.exports = router;
