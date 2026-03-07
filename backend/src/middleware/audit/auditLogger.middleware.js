const mongoose = require('mongoose');
const AuditLog = require('../../models/AuditLog.model');

const pickClinicId = (req) => {
  const authClinicId = req.auth?.clinicId;
  if (authClinicId && mongoose.isValidObjectId(authClinicId)) return authClinicId;

  const candidates = [
    req.params?.clinicId,
    req.body?.clinicId,
    req.query?.clinicId,
    req.body?.data?.clinicId,
  ];

  return candidates.find((value) => mongoose.isValidObjectId(value)) || null;
};

const resolveResourceId = (req, configuredId) => {
  if (configuredId) return configuredId;

  return (
    req.params?.appointmentId ||
    req.params?.billingId ||
    req.params?.clinicId ||
    req.params?.subscriptionId ||
    req.params?.id ||
    null
  );
};

const auditLogger = (options = {}) => {
  const {
    action,
    resourceType = 'unknown',
    resolveMetadata,
    skipStatusCodes = [],
    logOnlySuccess = false,
  } = options;

  return (req, res, next) => {
    res.on('finish', async () => {
      try {
        if (skipStatusCodes.includes(res.statusCode)) return;
        if (logOnlySuccess && res.statusCode >= 400) return;

        const clinicId = pickClinicId(req);
        if (!clinicId) return;

        const actorUserId = req.auth?.userId || null;
        const actorRole = req.auth?.role || 'SYSTEM';
        const actorEmail = req.auth?.email || null;

        const metadata = typeof resolveMetadata === 'function' ? resolveMetadata(req, res) : {};

        await AuditLog.create({
          actorUserId,
          actorRole,
          actorEmail,
          action: action || `${req.method} ${req.baseUrl}${req.route?.path || req.path}`,
          clinicId,
          resourceType,
          resourceId: resolveResourceId(req, metadata?.resourceId),
          method: req.method,
          path: `${req.baseUrl}${req.path}`,
          statusCode: res.statusCode,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          metadata,
        });
      } catch (error) {
        // do not interrupt request lifecycle due to audit insert failures
      }
    });

    return next();
  };
};

module.exports = {
  auditLogger,
};
