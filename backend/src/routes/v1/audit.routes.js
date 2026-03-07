const express = require('express');
const auditLogController = require('../../controllers/audit/auditLog.controller');
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { requireSuperAdmin } = require('../../middleware/auth/superAdmin.middleware');

const router = express.Router();

router.use(jwtAuth, requireSuperAdmin);

router.get('/', auditLogController.listAuditLogs);
router.get('/:auditLogId', auditLogController.getAuditLogById);

module.exports = router;
