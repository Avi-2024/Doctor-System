/**
 * Tenant Context Framework
 * Provides tenant guard helpers without implementing authentication.
 */

const { ApiError } = require('../errors/ApiError');
const { TENANT_SCOPE } = require('../constants/tenant');
const { withIdentity } = require('../context/requestContext');

const attachTenantPlaceholder = (req, res, next) => {
  req.tenant = {
    clinicId: req.context?.clinicId || null,
    branchId: req.context?.branchId || null,
    scope: req.context?.isPlatform ? TENANT_SCOPE.PLATFORM : TENANT_SCOPE.CLINIC,
    isPlatform: Boolean(req.context?.isPlatform),
  };
  next();
};

const setTenantContext = (req, tenant = {}) => {
  req.context = withIdentity(req.context, {
    userId: req.context?.userId,
    clinicId: tenant.clinicId || null,
    branchId: tenant.branchId || null,
    roles: req.context?.roles || [],
    permissions: req.context?.permissions || [],
    isAuthenticated: req.context?.isAuthenticated || false,
    isPlatform: tenant.isPlatform || false,
  });
  req.tenant = {
    clinicId: req.context.clinicId,
    branchId: req.context.branchId,
    scope: req.context.isPlatform ? TENANT_SCOPE.PLATFORM : TENANT_SCOPE.CLINIC,
    isPlatform: req.context.isPlatform,
  };
  return req.tenant;
};

const requireTenantContext = (context) => {
  if (!context?.clinicId && !context?.isPlatform) throw new ApiError(403, 'Clinic context required');
  return context;
};

const assertSameClinic = (record, clinicId) => {
  if (!record || record.clinic_id !== clinicId) throw new ApiError(403, 'Tenant ownership mismatch');
  return record;
};

module.exports = {
  attachTenantPlaceholder,
  setTenantContext,
  requireTenantContext,
  assertSameClinic,
};
