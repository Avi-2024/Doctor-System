/**
 * RBAC Guard Helpers
 * Uses request context roles and permissions without implementing authentication.
 */

const { ApiError } = require('../errors/ApiError');

const SCOPE_RANK = Object.freeze({
  OWN: 1,
  ASSIGNED: 2,
  BRANCH: 3,
  CLINIC: 4,
  ALL: 5,
});

const toArray = (value) => (Array.isArray(value) ? value : [value]).filter(Boolean);

const hasValues = (actualValues = [], requiredValues = [], match = 'any') => {
  const actual = new Set(toArray(actualValues));
  const required = toArray(requiredValues);
  if (!required.length) return false;
  if (match === 'all') return required.every((value) => actual.has(value));
  return required.some((value) => actual.has(value));
};

const allowsPlatform = (context, options = {}) => context?.isPlatform && options.allowPlatform !== false;

const hasRole = (context, roles, options = {}) => {
  if (allowsPlatform(context, options)) return true;
  return hasValues(context?.roles, roles, options.match);
};

const hasPermission = (context, permissions, options = {}) => {
  if (allowsPlatform(context, options)) return true;
  return hasValues(context?.permissions, permissions, options.match);
};

const hasPermissionScope = (context, permissions, minimumScope, options = {}) => {
  if (allowsPlatform(context, options)) return true;
  const requiredPermissions = toArray(permissions);
  if (!requiredPermissions.length || !minimumScope) return false;
  const requiredRank = SCOPE_RANK[minimumScope] || 0;
  const hasRequiredScope = (permission) => {
    const actualScope = context?.scopedPermissions?.[permission];
    return Boolean(actualScope) && (SCOPE_RANK[actualScope] || 0) >= requiredRank;
  };
  if (options.match === 'all') return requiredPermissions.every(hasRequiredScope);
  return requiredPermissions.some(hasRequiredScope);
};

const requireRole = (roles, options = {}) => (req, res, next) => {
  if (hasRole(req.context, roles, options)) return next();
  return next(new ApiError(403, 'Required role missing'));
};

const requirePermission = (permissions, options = {}) => (req, res, next) => {
  if (hasPermission(req.context, permissions, options)) return next();
  return next(new ApiError(403, 'Required permission missing'));
};

const requirePermissionScope = (permissions, minimumScope, options = {}) => (req, res, next) => {
  if (hasPermissionScope(req.context, permissions, minimumScope, options)) return next();
  return next(new ApiError(403, 'Required permission scope missing'));
};

module.exports = {
  hasPermission,
  hasPermissionScope,
  hasRole,
  requirePermission,
  requirePermissionScope,
  requireRole,
};
