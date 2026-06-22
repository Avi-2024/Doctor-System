/**
 * Request Context
 * Builds the shared request-scoped context used by services, audit, and tenant guards.
 */

const buildRequestContext = (req) => Object.freeze({
  requestId: req.requestId,
  requestTimestamp: new Date(),
  ipAddress: req.ip || req.socket?.remoteAddress || null,
  userAgent: req.headers?.['user-agent'] || null,
  userId: null,
  clinicId: null,
  branchId: null,
  sessionId: null,
  roles: [],
  permissions: [],
  scopedPermissions: {},
  isAuthenticated: false,
  isPlatform: false,
});

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const pickValue = (context, identity, key) => (hasOwn(identity, key) ? identity[key] : context[key]);

const pickArray = (context, identity, key) => {
  if (hasOwn(identity, key)) return Array.isArray(identity[key]) ? identity[key] : [];
  return Array.isArray(context[key]) ? context[key] : [];
};

const pickBoolean = (context, identity, key) => {
  if (hasOwn(identity, key)) return Boolean(identity[key]);
  return Boolean(context[key]);
};

const pickObject = (context, identity, key) => {
  if (hasOwn(identity, key)) {
    return identity[key] && typeof identity[key] === 'object' && !Array.isArray(identity[key])
      ? { ...identity[key] }
      : {};
  }
  return context[key] && typeof context[key] === 'object' && !Array.isArray(context[key])
    ? { ...context[key] }
    : {};
};

const withIdentity = (context = {}, identity = {}) => Object.freeze({
  ...context,
  userId: pickValue(context, identity, 'userId'),
  clinicId: pickValue(context, identity, 'clinicId'),
  branchId: pickValue(context, identity, 'branchId'),
  sessionId: pickValue(context, identity, 'sessionId'),
  roles: pickArray(context, identity, 'roles'),
  permissions: pickArray(context, identity, 'permissions'),
  scopedPermissions: pickObject(context, identity, 'scopedPermissions'),
  isAuthenticated: pickBoolean(context, identity, 'isAuthenticated'),
  isPlatform: pickBoolean(context, identity, 'isPlatform'),
});

module.exports = { buildRequestContext, withIdentity };
