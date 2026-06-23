/**
 * Tenant Override Helpers
 * Reads and validates explicit platform tenant targeting headers.
 */

const { ApiError } = require('../errors/ApiError');

const TENANT_OVERRIDE_HEADER = 'x-clinic-id';
const SUPPORT_REASON_HEADER = 'x-support-reason';
const TENANT_OVERRIDE_ACTION = Object.freeze({
  ALLOWED: 'tenant.override.allowed',
  DENIED: 'tenant.override.denied',
});

// Reads the platform tenant override headers from a request.
const readTenantOverride = (req) => ({
  requestedClinicId: String(req.get(TENANT_OVERRIDE_HEADER) || '').trim() || null,
  supportReason: String(req.get(SUPPORT_REASON_HEADER) || '').trim() || null,
});

// Resolves the effective clinic target for tenant-scoped service operations.
const resolveTenantTarget = ({
  context = {},
  requestedClinicId = null,
  requireForPlatform = false,
} = {}) => {
  if (!context.isPlatform && requestedClinicId) throw new ApiError(403, 'Tenant override is not allowed');
  if (context.isPlatform) {
    if (requestedClinicId) return requestedClinicId;
    if (requireForPlatform) throw new ApiError(400, 'Clinic target is required');
    return null;
  }
  if (!context.clinicId) throw new ApiError(403, 'Clinic context required');
  return context.clinicId;
};

// Requires an operator reason before sensitive platform tenant operations.
const requireSupportReason = (supportReason) => {
  if (!String(supportReason || '').trim()) throw new ApiError(400, 'Support reason is required');
  return supportReason;
};

// Records a tenant override audit entry when an audit recorder is available.
const recordTenantOverrideAudit = async ({
  auditRecorder,
  connection,
  context = {},
  requestedClinicId = null,
  supportReason = null,
  outcome,
  reason = null,
  operation = 'tenant_override',
}) => {
  if (!auditRecorder) return;
  await auditRecorder({
    context: { ...context, clinicId: requestedClinicId || context.clinicId || null },
    action: outcome === 'allowed' ? TENANT_OVERRIDE_ACTION.ALLOWED : TENANT_OVERRIDE_ACTION.DENIED,
    moduleName: 'tenants',
    resourceType: 'clinic',
    resourceId: requestedClinicId || null,
    metadata: {
      operation,
      outcome,
      reason,
      supportReason: supportReason || null,
    },
  }, connection);
};

// Resolves a tenant override and writes allow or deny audit evidence.
const resolveTenantTargetWithAudit = async ({
  context = {},
  requestedClinicId = null,
  requireForPlatform = false,
  supportReason = null,
  requireReason = false,
  auditRecorder,
  connection,
  operation,
} = {}) => {
  if (!context.isPlatform && requestedClinicId) {
    await recordTenantOverrideAudit({
      auditRecorder,
      connection,
      context,
      requestedClinicId,
      supportReason,
      outcome: 'denied',
      reason: 'non_platform_override',
      operation,
    });
    throw new ApiError(403, 'Tenant override is not allowed');
  }
  if (context.isPlatform) {
    if (!requestedClinicId && requireForPlatform) {
      await recordTenantOverrideAudit({
        auditRecorder,
        connection,
        context,
        requestedClinicId,
        supportReason,
        outcome: 'denied',
        reason: 'clinic_target_required',
        operation,
      });
      throw new ApiError(400, 'Clinic target is required');
    }
    if (requestedClinicId && requireReason && !String(supportReason || '').trim()) {
      await recordTenantOverrideAudit({
        auditRecorder,
        connection,
        context,
        requestedClinicId,
        supportReason,
        outcome: 'denied',
        reason: 'support_reason_required',
        operation,
      });
      throw new ApiError(400, 'Support reason is required');
    }
    if (requestedClinicId) {
      await recordTenantOverrideAudit({
        auditRecorder,
        connection,
        context,
        requestedClinicId,
        supportReason,
        outcome: 'allowed',
        operation,
      });
      return requestedClinicId;
    }
    return null;
  }
  if (!context.clinicId) {
    await recordTenantOverrideAudit({
      auditRecorder,
      connection,
      context,
      requestedClinicId,
      supportReason,
      outcome: 'denied',
      reason: 'clinic_context_required',
      operation,
    });
    throw new ApiError(403, 'Clinic context required');
  }
  return context.clinicId;
};

module.exports = {
  SUPPORT_REASON_HEADER,
  TENANT_OVERRIDE_HEADER,
  readTenantOverride,
  recordTenantOverrideAudit,
  requireSupportReason,
  resolveTenantTarget,
  resolveTenantTargetWithAudit,
  TENANT_OVERRIDE_ACTION,
};
