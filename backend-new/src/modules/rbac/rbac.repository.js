/**
 * RBAC Repository
 * Owns Prisma access for permissions, roles, and assignments.
 */

const { prisma, model } = require('../../database/prisma');

const permissions = (connection) => model(connection || prisma, 'permissions');
const roles = (connection) => model(connection || prisma, 'roles');
const rolePermissions = (connection) => model(connection || prisma, 'role_permissions');
const userRoles = (connection) => model(connection || prisma, 'user_roles');
const users = (connection) => model(connection || prisma, 'users');

const activeAssignmentKey = ({ clinicId, userId, roleId }) => `${clinicId || 'platform'}:${userId}:${roleId}`;

const upsertPermission = async (permission, connection) => permissions(connection).upsert({
  where: { permission_key: permission.key },
  create: {
    id: permission.id,
    permission_key: permission.key,
    module_name: permission.moduleName,
    action: permission.action,
    description: permission.description || null,
    is_system: true,
  },
  update: {
    module_name: permission.moduleName,
    action: permission.action,
    description: permission.description || null,
    is_system: true,
  },
});

const listPermissions = async (connection) => permissions(connection).findMany({
  orderBy: [{ module_name: 'asc' }, { action: 'asc' }],
});

const findPermissionsByKeys = async (permissionKeys, connection) => permissions(connection).findMany({
  where: { permission_key: { in: permissionKeys } },
});

const upsertSystemRole = async (role, connection) => roles(connection).upsert({
  where: { scope_key_code: { scope_key: role.scope_key, code: role.code } },
  create: {
    id: role.id,
    clinic_id: role.clinic_id || null,
    scope_key: role.scope_key,
    code: role.code,
    name: role.name,
    description: role.description || null,
    is_system: true,
    is_platform: role.is_platform,
  },
  update: {
    name: role.name,
    description: role.description || null,
    is_system: true,
    is_platform: role.is_platform,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
  },
});

const createRole = async (payload, connection) => roles(connection).create({ data: payload });

const listRoles = async ({ clinicId = null, includePlatform = false }, connection) => roles(connection).findMany({
  where: {
    is_deleted: false,
    OR: [
      { scope_key: 'SYSTEM', is_platform: false },
      ...(clinicId ? [{ clinic_id: clinicId }] : []),
      ...(includePlatform ? [{ scope_key: 'PLATFORM' }] : []),
    ],
  },
  include: {
    role_permissions: {
      where: { is_deleted: false },
      include: { permission: true },
    },
  },
  orderBy: [{ is_system: 'desc' }, { name: 'asc' }],
});

const tenantRoleWhere = ({ clinicId = null, isPlatform = false }) => {
  if (isPlatform) {
    return clinicId
      ? { OR: [{ clinic_id: clinicId }, { scope_key: 'SYSTEM', is_platform: false }] }
      : { scope_key: 'PLATFORM', is_platform: true };
  }
  return {
    OR: [
      { clinic_id: clinicId },
      { scope_key: 'SYSTEM', is_platform: false },
    ],
  };
};

const findRoleById = async ({ roleId, clinicId = null, isPlatform = false }, connection) => roles(connection).findFirst({
  where: {
    id: roleId,
    is_deleted: false,
    ...tenantRoleWhere({ clinicId, isPlatform }),
  },
  include: {
    role_permissions: {
      where: { is_deleted: false },
      include: { permission: true },
    },
  },
});

const createRolePermission = async (payload, connection) => rolePermissions(connection).create({ data: payload });

const findUserById = async ({ userId, clinicId = null, isPlatform = false }, connection) => users(connection).findFirst({
  where: {
    id: userId,
    is_deleted: false,
    clinic_id: isPlatform ? null : clinicId,
  },
});

const findActiveUserRole = async ({ userId, roleId, clinicId = null }, connection) => userRoles(connection).findFirst({
  where: {
    active_assignment_key: activeAssignmentKey({ clinicId, userId, roleId }),
    is_deleted: false,
    revoked_at: null,
  },
});

const findUserRoleById = async ({ assignmentId, clinicId = null, isPlatform = false }, connection) => userRoles(connection).findFirst({
  where: {
    id: assignmentId,
    is_deleted: false,
    clinic_id: isPlatform ? clinicId : clinicId,
  },
  include: {
    user: true,
    role: {
      include: {
        role_permissions: {
          where: { is_deleted: false },
          include: { permission: true },
        },
      },
    },
  },
});

const assignUserRole = async (payload, connection) => userRoles(connection).create({
  data: {
    ...payload,
    active_assignment_key: activeAssignmentKey({
      clinicId: payload.clinic_id || null,
      userId: payload.user_id,
      roleId: payload.role_id,
    }),
  },
});

const revokeUserRole = async ({ assignmentId, revokedBy, now = new Date() }, connection) => userRoles(connection).update({
  where: { id: assignmentId },
  data: {
    revoked_at: now,
    revoked_by: revokedBy || null,
    updated_by: revokedBy || null,
    active_assignment_key: null,
  },
});

const incrementUserTokenVersion = async (userId, connection) => users(connection).update({
  where: { id: userId },
  data: { token_version: { increment: 1 } },
});

const listActiveUserRoles = async ({ userId, clinicId = null, isPlatform = false }, connection) => userRoles(connection).findMany({
  where: {
    user_id: userId,
    is_deleted: false,
    revoked_at: null,
    OR: [
      { clinic_id: clinicId },
      ...(isPlatform ? [{ clinic_id: null }] : []),
    ],
  },
  include: {
    role: {
      include: {
        role_permissions: {
          where: { is_deleted: false },
          include: { permission: true },
        },
      },
    },
  },
});

module.exports = {
  activeAssignmentKey,
  assignUserRole,
  createRole,
  createRolePermission,
  findActiveUserRole,
  findPermissionsByKeys,
  findRoleById,
  findUserById,
  findUserRoleById,
  incrementUserTokenVersion,
  listActiveUserRoles,
  listPermissions,
  listRoles,
  revokeUserRole,
  upsertPermission,
  upsertSystemRole,
};
