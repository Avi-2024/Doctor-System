/**
 * RBAC Module Middleware
 * Adds audited authorization checks for Sprint 2 protected routes.
 */

const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { ApiError } = require('../../common/errors/ApiError');
const { hasPermission, hasPermissionScope } = require('../../common/middleware/rbac');
const { recordAudit } = require('../audit/audit.service');

const auditRbacDenied = async ({
  auditRecorder = recordAudit,
  context,
  permission,
  route,
  method,
  reason = 'permission_denied',
  scope = null,
} = {}) => auditRecorder({
  context,
  action: 'rbac.authorization.denied',
  moduleName: 'rbac',
  resourceType: 'route',
  severity: AUDIT_SEVERITY.WARNING,
  metadata: {
    permission,
    route,
    method,
    reason,
    scope,
    outcome: 'denied',
  },
});

const requireAuditedPermission = (permission, {
  denialRecorder = auditRbacDenied,
  allowPlatform,
  match,
  scope,
} = {}) => async (req, res, next) => {
  const allowed = scope
    ? hasPermissionScope(req.context, permission, scope, { allowPlatform, match })
    : hasPermission(req.context, permission, { allowPlatform, match });
  if (allowed) return next();
  try {
    await denialRecorder({
      context: req.context,
      permission,
      route: req.originalUrl || req.path,
      method: req.method,
      reason: scope ? 'permission_scope_denied' : 'permission_denied',
      scope,
    });
  } catch (error) {
    return next(error);
  }
  return next(new ApiError(403, 'Required permission missing'));
};

module.exports = { auditRbacDenied, requireAuditedPermission };
