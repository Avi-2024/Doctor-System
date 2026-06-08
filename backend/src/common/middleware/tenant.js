/**
 * Tenant Middleware
 * Enforces clinic isolation.
 */

const { ROLES } = require('../constants/roles');
const { ApiError } = require('../errors/ApiError');
const { isUuid } = require('../utils/ids');

// Attach trusted tenant scope.
const attachTenant = (req, res, next) => {
  if (req.auth.role === ROLES.SUPER_ADMIN) {
    const clinicId = req.body?.clinicId || req.query?.clinicId || null;
    if (clinicId && !isUuid(clinicId)) return next(new ApiError(422, 'Valid clinicId required'));
    req.tenant = { clinicId, isPlatform: true };
    return next();
  }
  if (!req.auth.clinicId) return next(new ApiError(403, 'Clinic context required'));
  req.tenant = { clinicId: req.auth.clinicId, isPlatform: false };
  if (req.body) req.body.clinicId = req.auth.clinicId;
  req.query.clinicId = req.auth.clinicId;
  return next();
};

module.exports = { attachTenant };
