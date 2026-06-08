/**
 * RBAC Middleware
 * Enforces role-based access.
 */

const { ApiError } = require('../errors/ApiError');
const { ROLES } = require('../constants/roles');

// Allow selected roles.
const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.auth?.role)) return next(new ApiError(403, 'Insufficient role permission'));
  return next();
};

// Allow selected permissions.
const allowPermissions = (...permissions) => (req, res, next) => {
  const granted = new Set(req.auth?.permissions || []);
  if (req.auth?.role === ROLES.SUPER_ADMIN || granted.has('*') || permissions.some((permission) => granted.has(permission))) return next();
  return next(new ApiError(403, 'Insufficient permission'));
};

module.exports = { allowRoles, allowPermissions };
