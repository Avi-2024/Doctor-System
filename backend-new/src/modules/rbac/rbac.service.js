/**
 * RBAC Service
 * Resolves effective access and manages Sprint 2 role APIs.
 */

const crypto = require('node:crypto');
const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { ApiError } = require('../../common/errors/ApiError');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { recordAudit } = require('../audit/audit.service');
const {
  PERMISSION_CATALOG,
  RBAC_SCOPE,
  ROLE_SCOPE_KEY,
  SCOPE_RANK,
  SYSTEM_ROLES,
} = require('./rbac.constants');
const defaultRepository = require('./rbac.repository');

const RBAC_ACTION = Object.freeze({
  AUTHORIZATION_DENIED: 'rbac.authorization.denied',
  ROLE_CREATE_DENIED: 'rbac.role.create_denied',
  ROLE_CREATED: 'rbac.role.created',
  USER_ROLE_ASSIGN_DENIED: 'rbac.user_role.assign_denied',
  USER_ROLE_ASSIGNED: 'rbac.user_role.assigned',
  USER_ROLE_REVOKE_DENIED: 'rbac.user_role.revoke_denied',
  USER_ROLE_REVOKED: 'rbac.user_role.revoked',
});

const normalizeRoleCode = (code) => String(code || '').trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, '_');
const scopeKeyForContext = (context, clinicId = null) => {
  if (context?.isPlatform && !clinicId) return ROLE_SCOPE_KEY.PLATFORM;
  return clinicId || context?.clinicId;
};
const scopeRank = (scope) => SCOPE_RANK[scope] || 0;
const isReservedPermissionKey = (key) => /^platform\.|^system\./.test(String(key || ''));

const normalizePermission = (permission) => ({
  id: permission.id,
  key: permission.permission_key,
  moduleName: permission.module_name,
  action: permission.action,
  description: permission.description || null,
  isSystem: permission.is_system,
});

const normalizeRole = (role) => ({
  id: role.id,
  clinicId: role.clinic_id || null,
  code: role.code,
  name: role.name,
  description: role.description || null,
  isSystem: role.is_system,
  isPlatform: role.is_platform,
  permissions: (role.role_permissions || []).map((entry) => ({
    key: entry.permission.permission_key,
    scope: entry.scope,
  })),
});

const createRbacService = ({
  repository = defaultRepository,
  auditRecorder = recordAudit,
  transaction = runInTransaction,
} = {}) => {
  const permissionIdByKey = (records) => new Map(records.map((permission) => [permission.permission_key, permission.id]));

  const auditDenied = async ({
    action,
    context,
    metadata = {},
    resourceId = null,
    resourceType = 'rbac_policy',
  }) => auditRecorder({
    context,
    action,
    moduleName: 'rbac',
    resourceType,
    resourceId,
    severity: AUDIT_SEVERITY.WARNING,
    metadata: {
      ...metadata,
      outcome: 'denied',
    },
  });

  const recordAuthorizationDenied = async ({
    context,
    method,
    permission,
    reason = 'permission_denied',
    route,
    scope = null,
  }) => auditDenied({
    action: RBAC_ACTION.AUTHORIZATION_DENIED,
    context,
    resourceType: 'route',
    metadata: {
      method,
      permission,
      reason,
      route,
      scope,
    },
  });

  const buildEffectiveAccess = async ({ userId, clinicId = null, isPlatform = false }, connection) => {
    const assignments = await repository.listActiveUserRoles({ userId, clinicId, isPlatform }, connection);
    const roles = [];
    const permissionScopes = new Map();

    assignments.forEach((assignment) => {
      if (!assignment.role || assignment.role.is_deleted) return;
      roles.push(assignment.role.code);
      (assignment.role.role_permissions || []).forEach((entry) => {
        const key = entry.permission.permission_key;
        const existing = permissionScopes.get(key);
        if (!existing || scopeRank(entry.scope) > scopeRank(existing)) permissionScopes.set(key, entry.scope);
      });
    });

    return {
      roles: [...new Set(roles)],
      permissions: [...permissionScopes.keys()],
      scopedPermissions: Object.fromEntries(permissionScopes.entries()),
    };
  };

  const actorAccess = async (context, connection) => buildEffectiveAccess({
    userId: context.userId,
    clinicId: context.clinicId || null,
    isPlatform: Boolean(context.isPlatform),
  }, connection);

  const assertGrantSubset = async ({
    context,
    grants,
    deniedAction,
    resourceId = null,
    resourceType = 'role',
    connection,
  }) => {
    if (!grants.length) return;
    const access = await actorAccess(context, connection);
    for (const grant of grants) {
      const requestedScope = grant.scope || RBAC_SCOPE.CLINIC;
      const actorScope = access.scopedPermissions?.[grant.key];
      const denialMetadata = {
        permission: grant.key,
        requestedScope,
        actorScope: actorScope || null,
      };

      if (requestedScope === RBAC_SCOPE.ALL && !context.isPlatform) {
        await auditDenied({ action: deniedAction, context, resourceType, resourceId, metadata: { ...denialMetadata, reason: 'tenant_all_scope_denied' } });
        throw new ApiError(403, 'Cannot grant permission outside actor scope');
      }

      if (isReservedPermissionKey(grant.key) && !context.isPlatform) {
        await auditDenied({ action: deniedAction, context, resourceType, resourceId, metadata: { ...denialMetadata, reason: 'reserved_permission_denied' } });
        throw new ApiError(403, 'Cannot grant reserved permission');
      }

      if (!actorScope) {
        await auditDenied({ action: deniedAction, context, resourceType, resourceId, metadata: { ...denialMetadata, reason: 'permission_not_held' } });
        throw new ApiError(403, 'Cannot grant permission outside actor scope');
      }

      if (scopeRank(requestedScope) > scopeRank(actorScope)) {
        await auditDenied({ action: deniedAction, context, resourceType, resourceId, metadata: { ...denialMetadata, reason: 'scope_escalation_denied' } });
        throw new ApiError(403, 'Cannot grant permission outside actor scope');
      }
    }
  };

  const syncPermissionCatalog = async (connection) => {
    await Promise.all(PERMISSION_CATALOG.map((permission) => repository.upsertPermission({
      ...permission,
      id: crypto.randomUUID(),
    }, connection)));
    return repository.listPermissions(connection);
  };

  const syncSystemRoles = async (connection) => {
    const permissionRecords = await syncPermissionCatalog(connection);
    const permissionsByKey = permissionIdByKey(permissionRecords);
    const syncedRoles = [];

    for (const role of SYSTEM_ROLES) {
      const scopeKey = role.isPlatform ? ROLE_SCOPE_KEY.PLATFORM : ROLE_SCOPE_KEY.SYSTEM;
      const roleRecord = await repository.upsertSystemRole({
        id: crypto.randomUUID(),
        clinic_id: null,
        scope_key: scopeKey,
        code: role.code,
        name: role.name,
        description: role.description,
        is_platform: role.isPlatform,
      }, connection);

      for (const grant of role.permissions) {
        const permissionId = permissionsByKey.get(grant.key);
        if (!permissionId) throw new ApiError(500, 'Permission catalog is inconsistent', null, { expose: false });
        try {
          await repository.createRolePermission({
            id: crypto.randomUUID(),
            clinic_id: null,
            role_id: roleRecord.id,
            permission_id: permissionId,
            scope: grant.scope,
            is_deleted: false,
          }, connection);
        } catch (error) {
          if (error?.code !== 'P2002') throw error;
        }
      }
      syncedRoles.push(roleRecord);
    }

    return syncedRoles;
  };

  const listPermissions = async () => transaction(async (tx) => {
    const permissions = await repository.listPermissions(tx);
    return permissions.map(normalizePermission);
  });

  const listRoles = async ({ context }) => transaction(async (tx) => {
    const roles = await repository.listRoles({
      clinicId: context?.clinicId || null,
      includePlatform: Boolean(context?.isPlatform),
    }, tx);
    return roles.map(normalizeRole);
  });

  const assertPermissionKeys = async (grants, connection) => {
    const keys = [...new Set(grants.map((grant) => grant.key))];
    const permissions = await repository.findPermissionsByKeys(keys, connection);
    const found = permissionIdByKey(permissions);
    const missing = keys.filter((key) => !found.has(key));
    if (missing.length) throw new ApiError(400, 'Unknown permission requested', { missing });
    return found;
  };

  const createRole = async ({ context, payload }) => transaction(async (tx) => {
    await syncPermissionCatalog(tx);
    const grants = Array.isArray(payload.permissions) ? payload.permissions : [];
    const permissionsByKey = await assertPermissionKeys(grants, tx);
    const roleClinicId = context.isPlatform ? (payload.clinicId || null) : context.clinicId;
    if (!context.isPlatform && payload.clinicId && payload.clinicId !== context.clinicId) {
      await auditDenied({
        action: RBAC_ACTION.ROLE_CREATE_DENIED,
        context,
        resourceType: 'role',
        metadata: {
          requestedClinicId: payload.clinicId,
          actorClinicId: context.clinicId || null,
          reason: 'actor_tenant_mismatch',
        },
      });
      throw new ApiError(403, 'Cannot create role outside clinic');
    }
    if (context.isPlatform && !roleClinicId) {
      await auditDenied({
        action: RBAC_ACTION.ROLE_CREATE_DENIED,
        context,
        resourceType: 'role',
        metadata: { reason: 'platform_custom_role_denied', roleName: payload.name },
      });
      throw new ApiError(403, 'Custom platform roles are not supported in Sprint 2');
    }
    const scopeKey = scopeKeyForContext(context, roleClinicId);
    if (!scopeKey) throw new ApiError(403, 'Clinic context required');
    await assertGrantSubset({
      context,
      grants,
      deniedAction: RBAC_ACTION.ROLE_CREATE_DENIED,
      resourceType: 'role',
      connection: tx,
    });

    const role = await repository.createRole({
      id: crypto.randomUUID(),
      clinic_id: roleClinicId,
      scope_key: scopeKey,
      code: normalizeRoleCode(payload.code || payload.name),
      name: payload.name,
      description: payload.description || null,
      is_system: false,
      is_platform: Boolean(context.isPlatform && !roleClinicId),
      created_by: context.userId || null,
      updated_by: context.userId || null,
      is_deleted: false,
    }, tx);

    for (const grant of grants) {
      const scope = grant.scope || RBAC_SCOPE.CLINIC;
      await repository.createRolePermission({
        id: crypto.randomUUID(),
        clinic_id: roleClinicId,
        role_id: role.id,
        permission_id: permissionsByKey.get(grant.key),
        scope,
        created_by: context.userId || null,
        updated_by: context.userId || null,
        is_deleted: false,
      }, tx);
    }

    await auditRecorder({
      context,
      action: RBAC_ACTION.ROLE_CREATED,
      moduleName: 'rbac',
      resourceType: 'role',
      resourceId: role.id,
      afterData: normalizeRole({ ...role, role_permissions: [] }),
    }, tx);

    return normalizeRole({ ...role, role_permissions: [] });
  });

  const assignUserRole = async ({ context, payload }) => transaction(async (tx) => {
    await syncSystemRoles(tx);
    const assignmentClinicId = context.isPlatform ? (payload.clinicId || null) : context.clinicId;
    if (context.isPlatform && !assignmentClinicId) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_ASSIGN_DENIED,
        context,
        resourceType: 'user_role',
        metadata: { userId: payload.userId, roleId: payload.roleId, reason: 'tenant_target_required' },
      });
      throw new ApiError(403, 'Clinic target required for role assignment');
    }

    const targetUser = await repository.findUserById({
      userId: payload.userId,
      clinicId: assignmentClinicId,
      isPlatform: false,
    }, tx);
    if (!targetUser) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_ASSIGN_DENIED,
        context,
        resourceType: 'user_role',
        metadata: { userId: payload.userId, roleId: payload.roleId, assignmentClinicId, reason: 'user_not_found_or_not_owned' },
      });
      throw new ApiError(404, 'User not found');
    }

    const role = await repository.findRoleById({
      roleId: payload.roleId,
      clinicId: assignmentClinicId,
      isPlatform: Boolean(context.isPlatform),
    }, tx);
    if (!role) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_ASSIGN_DENIED,
        context,
        resourceType: 'role',
        resourceId: payload.roleId,
        metadata: { userId: payload.userId, roleId: payload.roleId, assignmentClinicId, reason: 'role_not_found_or_not_owned' },
      });
      throw new ApiError(404, 'Role not found');
    }
    if (role.is_platform || role.scope_key === ROLE_SCOPE_KEY.PLATFORM) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_ASSIGN_DENIED,
        context,
        resourceType: 'role',
        resourceId: role.id,
        metadata: { userId: payload.userId, roleId: payload.roleId, reason: 'platform_role_assignment_denied' },
      });
      throw new ApiError(403, 'Platform roles cannot be assigned through Sprint 2 API');
    }

    if (!context.isPlatform && assignmentClinicId !== context.clinicId) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_ASSIGN_DENIED,
        context,
        resourceType: 'user_role',
        metadata: { userId: payload.userId, roleId: payload.roleId, assignmentClinicId, reason: 'actor_tenant_mismatch' },
      });
      throw new ApiError(403, 'Cannot assign role outside clinic');
    }
    if (targetUser.clinic_id && targetUser.clinic_id !== assignmentClinicId) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_ASSIGN_DENIED,
        context,
        resourceType: 'user_role',
        metadata: { userId: payload.userId, roleId: payload.roleId, assignmentClinicId, targetClinicId: targetUser.clinic_id, reason: 'target_tenant_mismatch' },
      });
      throw new ApiError(403, 'Cannot assign role across clinics');
    }
    if (role.clinic_id && role.clinic_id !== assignmentClinicId) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_ASSIGN_DENIED,
        context,
        resourceType: 'user_role',
        metadata: { userId: payload.userId, roleId: payload.roleId, assignmentClinicId, roleClinicId: role.clinic_id, reason: 'role_tenant_mismatch' },
      });
      throw new ApiError(403, 'Cannot assign role across clinics');
    }
    await assertGrantSubset({
      context,
      grants: (role.role_permissions || []).map((entry) => ({
        key: entry.permission.permission_key,
        scope: entry.scope,
      })),
      deniedAction: RBAC_ACTION.USER_ROLE_ASSIGN_DENIED,
      resourceId: role.id,
      resourceType: 'role',
      connection: tx,
    });

    const existing = await repository.findActiveUserRole({
      userId: payload.userId,
      roleId: payload.roleId,
      clinicId: assignmentClinicId,
    }, tx);
    if (existing) return { id: existing.id, alreadyAssigned: true };

    let assignment;
    try {
      assignment = await repository.assignUserRole({
        id: crypto.randomUUID(),
        clinic_id: assignmentClinicId,
        user_id: payload.userId,
        role_id: payload.roleId,
        assigned_by: context.userId || null,
        created_by: context.userId || null,
        updated_by: context.userId || null,
        is_deleted: false,
      }, tx);
    } catch (error) {
      if (error?.code !== 'P2002') throw error;
      const active = await repository.findActiveUserRole({
        userId: payload.userId,
        roleId: payload.roleId,
        clinicId: assignmentClinicId,
      }, tx);
      if (active) return { id: active.id, alreadyAssigned: true };
      throw error;
    }
    await repository.incrementUserTokenVersion(payload.userId, tx);

    await auditRecorder({
      context,
      action: RBAC_ACTION.USER_ROLE_ASSIGNED,
      moduleName: 'rbac',
      resourceType: 'user_role',
      resourceId: assignment.id,
      afterData: {
        userId: payload.userId,
        roleId: payload.roleId,
        clinicId: assignmentClinicId,
      },
    }, tx);

    return { id: assignment.id, alreadyAssigned: false };
  });

  const revokeUserRole = async ({ context, assignmentId, clinicId = null }) => transaction(async (tx) => {
    const assignmentClinicId = context.isPlatform ? clinicId : context.clinicId;
    if (context.isPlatform && !assignmentClinicId) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_REVOKE_DENIED,
        context,
        resourceId: assignmentId,
        resourceType: 'user_role',
        metadata: { reason: 'tenant_target_required' },
      });
      throw new ApiError(403, 'Clinic target required for role revocation');
    }

    const assignment = await repository.findUserRoleById({
      assignmentId,
      clinicId: assignmentClinicId,
      isPlatform: Boolean(context.isPlatform),
    }, tx);
    if (!assignment || assignment.revoked_at) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_REVOKE_DENIED,
        context,
        resourceId: assignmentId,
        resourceType: 'user_role',
        metadata: { reason: 'assignment_not_found_or_not_owned' },
      });
      throw new ApiError(404, 'Role assignment not found');
    }

    if (context.isPlatform && !assignment.clinic_id) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_REVOKE_DENIED,
        context,
        resourceId: assignmentId,
        resourceType: 'user_role',
        metadata: { reason: 'platform_assignment_revoke_denied' },
      });
      throw new ApiError(403, 'Cannot revoke platform role assignments through Sprint 2 API');
    }

    if (!context.isPlatform && assignment.clinic_id !== context.clinicId) {
      await auditDenied({
        action: RBAC_ACTION.USER_ROLE_REVOKE_DENIED,
        context,
        resourceId: assignmentId,
        resourceType: 'user_role',
        metadata: { assignmentClinicId: assignment.clinic_id || null, reason: 'actor_tenant_mismatch' },
      });
      throw new ApiError(403, 'Cannot revoke role outside clinic');
    }

    await assertGrantSubset({
      context,
      grants: (assignment.role?.role_permissions || []).map((entry) => ({
        key: entry.permission.permission_key,
        scope: entry.scope,
      })),
      deniedAction: RBAC_ACTION.USER_ROLE_REVOKE_DENIED,
      resourceId: assignmentId,
      resourceType: 'user_role',
      connection: tx,
    });

    const revoked = await repository.revokeUserRole({
      assignmentId,
      revokedBy: context.userId || null,
    }, tx);
    await repository.incrementUserTokenVersion(assignment.user_id, tx);

    await auditRecorder({
      context,
      action: RBAC_ACTION.USER_ROLE_REVOKED,
      moduleName: 'rbac',
      resourceType: 'user_role',
      resourceId: assignmentId,
      beforeData: {
        userId: assignment.user_id,
        roleId: assignment.role_id,
        clinicId: assignment.clinic_id || null,
      },
      afterData: {
        revokedAt: revoked.revoked_at,
        revokedBy: revoked.revoked_by || null,
      },
    }, tx);

    return { id: assignmentId, revoked: true };
  });

  const resolveEffectiveAccess = async ({ userId, clinicId = null, isPlatform = false }) => buildEffectiveAccess({ userId, clinicId, isPlatform });

  return {
    assignUserRole,
    createRole,
    listPermissions,
    listRoles,
    recordAuthorizationDenied,
    resolveEffectiveAccess,
    revokeUserRole,
    syncPermissionCatalog,
    syncSystemRoles,
  };
};

module.exports = { RBAC_ACTION, createRbacService, normalizeRole };
