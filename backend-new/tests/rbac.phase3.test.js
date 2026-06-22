process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/doctor_system_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-characters-ok';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32-characters';
process.env.AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE || 'false';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../src/app');
const { ApiError } = require('../src/common/errors/ApiError');
const { PERMISSION_CATALOG, RBAC_SCOPE } = require('../src/modules/rbac/rbac.constants');
const { activeAssignmentKey } = require('../src/modules/rbac/rbac.repository');
const { createRbacService } = require('../src/modules/rbac/rbac.service');

const request = async (app, requestPath, options = {}) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}${requestPath}`, options);
    const bodyText = await response.text();
    let bodyJson;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch (error) {
      bodyJson = bodyText;
    }
    return { response, body: bodyJson };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

const withRolePermissions = (state, role) => ({
  ...role,
  role_permissions: state.rolePermissions
    .filter((entry) => entry.role_id === role.id && !entry.is_deleted)
    .map((entry) => ({
      ...entry,
      permission: state.permissions.find((permission) => permission.id === entry.permission_id),
    })),
});

const createFakeRbacRepository = ({ users = [] } = {}) => {
  const state = {
    permissions: [],
    roles: [],
    rolePermissions: [],
    userRoles: [],
    users: users.map((user) => ({ ...user })),
  };

  const repository = {
    upsertPermission: async (permission) => {
      const existing = state.permissions.find((entry) => entry.permission_key === permission.key);
      if (existing) {
        existing.module_name = permission.moduleName;
        existing.action = permission.action;
        existing.description = permission.description || null;
        existing.is_system = true;
        return existing;
      }
      const created = {
        id: permission.id,
        permission_key: permission.key,
        module_name: permission.moduleName,
        action: permission.action,
        description: permission.description || null,
        is_system: true,
      };
      state.permissions.push(created);
      return created;
    },
    listPermissions: async () => [...state.permissions].sort((a, b) => a.permission_key.localeCompare(b.permission_key)),
    findPermissionsByKeys: async (keys) => state.permissions.filter((permission) => keys.includes(permission.permission_key)),
    upsertSystemRole: async (role) => {
      const existing = state.roles.find((entry) => entry.scope_key === role.scope_key && entry.code === role.code);
      if (existing) {
        existing.name = role.name;
        existing.description = role.description || null;
        existing.is_system = true;
        existing.is_platform = role.is_platform;
        existing.is_deleted = false;
        return existing;
      }
      const created = {
        id: role.id,
        clinic_id: role.clinic_id || null,
        scope_key: role.scope_key,
        code: role.code,
        name: role.name,
        description: role.description || null,
        is_system: true,
        is_platform: role.is_platform,
        is_deleted: false,
      };
      state.roles.push(created);
      return created;
    },
    createRole: async (payload) => {
      const created = { ...payload, is_deleted: false };
      state.roles.push(created);
      return created;
    },
    listRoles: async ({ clinicId = null, includePlatform = false }) => state.roles
      .filter((role) => !role.is_deleted)
      .filter((role) => role.scope_key === 'SYSTEM' || role.clinic_id === clinicId || (includePlatform && role.scope_key === 'PLATFORM'))
      .map((role) => withRolePermissions(state, role)),
    findRoleById: async ({ roleId, clinicId = null, isPlatform = false }) => {
      const role = state.roles.find((entry) => {
        if (entry.id !== roleId || entry.is_deleted) return false;
        if (isPlatform && !clinicId) return entry.scope_key === 'PLATFORM' && entry.is_platform;
        return entry.clinic_id === clinicId || (entry.scope_key === 'SYSTEM' && !entry.is_platform);
      });
      return role ? withRolePermissions(state, role) : null;
    },
    createRolePermission: async (payload) => {
      const existing = state.rolePermissions.find((entry) => (
        entry.role_id === payload.role_id
        && entry.permission_id === payload.permission_id
        && entry.scope === payload.scope
      ));
      if (existing) {
        const error = new Error('duplicate');
        error.code = 'P2002';
        throw error;
      }
      state.rolePermissions.push({ ...payload, is_deleted: Boolean(payload.is_deleted) });
      return payload;
    },
    findUserById: async ({ userId, clinicId = null, isPlatform = false }) => state.users.find((user) => (
      user.id === userId
      && !user.is_deleted
      && (isPlatform ? !user.clinic_id : user.clinic_id === clinicId)
    )) || null,
    findActiveUserRole: async ({ userId, roleId, clinicId = null }) => state.userRoles.find((entry) => (
      entry.active_assignment_key === activeAssignmentKey({ clinicId, userId, roleId })
      && !entry.is_deleted
      && !entry.revoked_at
    )) || null,
    findUserRoleById: async ({ assignmentId, clinicId = null }) => {
      const assignment = state.userRoles.find((entry) => (
        entry.id === assignmentId
        && !entry.is_deleted
        && (entry.clinic_id || null) === (clinicId || null)
      ));
      if (!assignment) return null;
      const role = state.roles.find((entry) => entry.id === assignment.role_id);
      const user = state.users.find((entry) => entry.id === assignment.user_id);
      return {
        ...assignment,
        role: role ? withRolePermissions(state, role) : null,
        user,
      };
    },
    assignUserRole: async (payload) => {
      const key = activeAssignmentKey({
        clinicId: payload.clinic_id || null,
        userId: payload.user_id,
        roleId: payload.role_id,
      });
      const existing = state.userRoles.find((entry) => (
        entry.active_assignment_key === key
        && !entry.is_deleted
        && !entry.revoked_at
      ));
      if (existing) {
        const error = new Error('duplicate active assignment');
        error.code = 'P2002';
        throw error;
      }
      state.userRoles.push({
        ...payload,
        active_assignment_key: key,
        is_deleted: Boolean(payload.is_deleted),
        revoked_at: payload.revoked_at || null,
        revoked_by: payload.revoked_by || null,
      });
      return payload;
    },
    revokeUserRole: async ({ assignmentId, revokedBy, now = new Date() }) => {
      const assignment = state.userRoles.find((entry) => entry.id === assignmentId);
      assignment.revoked_at = now;
      assignment.revoked_by = revokedBy || null;
      assignment.updated_by = revokedBy || null;
      assignment.active_assignment_key = null;
      return assignment;
    },
    incrementUserTokenVersion: async (userId) => {
      const user = state.users.find((entry) => entry.id === userId);
      user.token_version += 1;
      return user;
    },
    listActiveUserRoles: async ({ userId, clinicId = null, isPlatform = false }) => state.userRoles
      .filter((entry) => entry.user_id === userId && !entry.is_deleted && !entry.revoked_at)
      .filter((entry) => (entry.clinic_id || null) === (clinicId || null) || (isPlatform && !entry.clinic_id))
      .map((entry) => ({
        ...entry,
        role: withRolePermissions(state, state.roles.find((role) => role.id === entry.role_id)),
      })),
  };

  return { repository, state };
};

const createUser = (overrides = {}) => ({
  id: overrides.id || '11111111-1111-4111-8111-111111111111',
  clinic_id: Object.prototype.hasOwnProperty.call(overrides, 'clinic_id') ? overrides.clinic_id : '22222222-2222-4222-8222-222222222222',
  full_name: overrides.full_name || 'RBAC User',
  email: overrides.email || 'rbac@example.com',
  user_type: overrides.user_type || 'CLINIC_USER',
  status: overrides.status || 'ACTIVE',
  token_version: overrides.token_version || 0,
  is_deleted: false,
});

const createServiceHarness = ({ users = [] } = {}) => {
  const { repository, state } = createFakeRbacRepository({ users });
  const audits = [];
  const service = createRbacService({
    repository,
    auditRecorder: async (input) => {
      audits.push(input);
      return input;
    },
    transaction: async (callback) => callback({}),
  });
  return { audits, repository, service, state };
};

const grantSystemRole = async ({
  clinicId = 'clinic-a',
  roleCode = 'clinic_admin',
  service,
  state,
  userId,
}) => {
  await service.syncSystemRoles();
  const role = state.roles.find((entry) => entry.code === roleCode);
    state.userRoles.push({
    id: `${userId}-${roleCode}`,
    clinic_id: clinicId,
    user_id: userId,
    role_id: role.id,
    active_assignment_key: activeAssignmentKey({ clinicId, userId, roleId: role.id }),
    assigned_by: 'seed',
    is_deleted: false,
    revoked_at: null,
  });
  return role;
};

const createManualRole = async ({
  clinicId,
  code,
  grants,
  state,
}) => {
  const role = {
    id: `${code}-role-id`,
    clinic_id: clinicId || null,
    scope_key: clinicId || 'SYSTEM',
    code,
    name: code,
    description: null,
    is_system: false,
    is_platform: false,
    is_deleted: false,
  };
  state.roles.push(role);
  grants.forEach((grant) => {
    const permission = state.permissions.find((entry) => entry.permission_key === grant.key);
    state.rolePermissions.push({
      id: `${code}-${grant.key}-${grant.scope}`,
      clinic_id: clinicId || null,
      role_id: role.id,
      permission_id: permission.id,
      scope: grant.scope,
      is_deleted: false,
    });
  });
  return withRolePermissions(state, role);
};

test('prisma schema includes Sprint 2 RBAC tables and login scope uniqueness', () => {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');
  assert.match(schema, /model permissions/);
  assert.match(schema, /model roles/);
  assert.match(schema, /model role_permissions/);
  assert.match(schema, /model user_roles/);
  assert.match(schema, /active_assignment_key\s+String\?\s+@unique/);
  assert.match(schema, /model user_branch_assignments/);
  assert.match(schema, /@@unique\(\[login_scope, email\]\)/);
});

test('rbac migration artifact includes Sprint 2 tables and tenant-first indexes', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'migrations', '0002_rbac.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE `permissions`/);
  assert.match(migration, /CREATE TABLE `roles`/);
  assert.match(migration, /CREATE TABLE `user_roles`/);
  assert.match(migration, /`active_assignment_key` VARCHAR\(140\) NULL/);
  assert.match(migration, /UNIQUE INDEX `user_roles_active_assignment_key_key`\(`active_assignment_key`\)/);
  assert.match(migration, /INDEX `roles_clinic_id_is_deleted_idx`\(`clinic_id`, `is_deleted`\)/);
  assert.match(migration, /ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey`/);
});

test('rbac service syncs permission catalog through explicit bootstrap path', async () => {
  const { service, state } = createServiceHarness();

  await service.syncPermissionCatalog();
  const permissions = await service.listPermissions();

  assert.equal(permissions.length, PERMISSION_CATALOG.length);
  assert.equal(state.permissions.some((permission) => permission.permission_key === 'rbac.roles.create'), true);
  assert.equal(state.permissions.some((permission) => permission.permission_key === 'rbac.user_roles.revoke'), true);
});

test('rbac list endpoints are read-only service operations', async () => {
  const { repository, service } = createServiceHarness();
  let writes = 0;
  const readOnlyService = createRbacService({
    repository: {
      ...repository,
      upsertPermission: async (...args) => {
        writes += 1;
        return repository.upsertPermission(...args);
      },
      upsertSystemRole: async (...args) => {
        writes += 1;
        return repository.upsertSystemRole(...args);
      },
      createRolePermission: async (...args) => {
        writes += 1;
        return repository.createRolePermission(...args);
      },
    },
    auditRecorder: async (input) => input,
    transaction: async (callback) => callback({}),
  });

  await service.syncSystemRoles();
  await readOnlyService.listPermissions();
  await readOnlyService.listRoles({ context: { clinicId: 'clinic-a', isPlatform: false } });

  assert.equal(writes, 0);
});

test('rbac service creates tenant role with permission grants and audit', async () => {
  const admin = createUser({ id: 'admin-a', clinic_id: 'clinic-a' });
  const { audits, service, state } = createServiceHarness({ users: [admin] });
  await grantSystemRole({ service, state, userId: admin.id, clinicId: admin.clinic_id });

  const role = await service.createRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: {
      name: 'Billing Manager',
      code: 'billing_manager',
      permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.CLINIC }],
    },
  });

  assert.equal(role.code, 'billing_manager');
  assert.equal(state.roles.some((entry) => entry.code === 'billing_manager' && entry.clinic_id === 'clinic-a'), true);
  assert.equal(state.rolePermissions.filter((entry) => entry.role_id === role.id).length, 1);
  assert.equal(audits[0].action, 'rbac.role.created');
});

test('rbac role creation rejects unknown permission keys', async () => {
  const admin = createUser({ id: 'admin-a', clinic_id: 'clinic-a' });
  const { service, state } = createServiceHarness({ users: [admin] });
  await grantSystemRole({ service, state, userId: admin.id, clinicId: admin.clinic_id });

  await assert.rejects(service.createRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: {
      name: 'Unsafe Role',
      permissions: [{ key: 'billing.delete_all', scope: RBAC_SCOPE.ALL }],
    },
  }), (error) => error instanceof ApiError && error.statusCode === 400);
});

test('rbac role creation rejects grants outside actor privileges', async () => {
  const doctor = createUser({ id: 'doctor-a', clinic_id: 'clinic-a' });
  const { audits, service, state } = createServiceHarness({ users: [doctor] });
  await grantSystemRole({
    service,
    state,
    userId: doctor.id,
    clinicId: doctor.clinic_id,
    roleCode: 'doctor',
  });

  await assert.rejects(service.createRole({
    context: { userId: doctor.id, clinicId: doctor.clinic_id, isPlatform: false },
    payload: {
      name: 'Escalated Role',
      permissions: [{ key: 'rbac.roles.read', scope: RBAC_SCOPE.CLINIC }],
    },
  }), (error) => error instanceof ApiError && error.statusCode === 403);

  await assert.rejects(service.createRole({
    context: { userId: doctor.id, clinicId: doctor.clinic_id, isPlatform: false },
    payload: {
      name: 'Global Reader',
      permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.ALL }],
    },
  }), (error) => error instanceof ApiError && error.statusCode === 403);

  assert.equal(audits.filter((audit) => audit.action === 'rbac.role.create_denied').length, 2);
});

test('rbac role creation rejects custom platform roles and allows explicit tenant target for platform actors', async () => {
  const platformUser = createUser({ id: 'platform-a', clinic_id: null, user_type: 'SUPER_ADMIN' });
  const { audits, service, state } = createServiceHarness({ users: [platformUser] });
  await grantSystemRole({
    service,
    state,
    userId: platformUser.id,
    clinicId: null,
    roleCode: 'super_admin',
  });

  await assert.rejects(service.createRole({
    context: { userId: platformUser.id, clinicId: null, isPlatform: true },
    payload: {
      name: 'Platform Custom',
      permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.ALL }],
    },
  }), (error) => error instanceof ApiError && error.statusCode === 403);

  const tenantRole = await service.createRole({
    context: { userId: platformUser.id, clinicId: null, isPlatform: true },
    payload: {
      clinicId: 'clinic-a',
      name: 'Platform Seeded Tenant Role',
      permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.CLINIC }],
    },
  });

  assert.equal(tenantRole.clinicId, 'clinic-a');
  assert.equal(audits.some((audit) => audit.action === 'rbac.role.create_denied'), true);
});

test('rbac assignment blocks cross-tenant role assignment', async () => {
  const admin = createUser({ id: 'admin-a', clinic_id: 'clinic-a' });
  const user = createUser({ clinic_id: 'clinic-b' });
  const { audits, service, state } = createServiceHarness({ users: [admin, user] });
  await grantSystemRole({ service, state, userId: admin.id, clinicId: admin.clinic_id });
  const role = await service.createRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: { name: 'Clinic Role', permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.CLINIC }] },
  });

  await assert.rejects(service.assignUserRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: { userId: user.id, roleId: role.id },
  }), (error) => error instanceof ApiError && error.statusCode === 404);

  assert.equal(state.userRoles.filter((entry) => entry.user_id === user.id).length, 0);
  assert.equal(audits.some((audit) => audit.action === 'rbac.user_role.assign_denied'), true);
});

test('rbac assignment is idempotent when active assignment key already exists', async () => {
  const admin = createUser({ id: 'admin-a' });
  const user = createUser({ id: 'user-a' });
  const { service, state } = createServiceHarness({ users: [admin, user] });
  await grantSystemRole({ service, state, userId: admin.id, clinicId: admin.clinic_id });
  const role = await service.createRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: {
      name: 'Idempotent Reader',
      permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.CLINIC }],
    },
  });

  const first = await service.assignUserRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: { userId: user.id, roleId: role.id },
  });
  const second = await service.assignUserRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: { userId: user.id, roleId: role.id },
  });

  assert.equal(second.id, first.id);
  assert.equal(second.alreadyAssigned, true);
  assert.equal(state.userRoles.filter((entry) => entry.user_id === user.id && !entry.revoked_at).length, 1);
});

test('rbac assignment rejects roles stronger than actor access', async () => {
  const doctor = createUser({ id: 'doctor-a', clinic_id: 'clinic-a' });
  const target = createUser({ id: 'target-a', clinic_id: 'clinic-a' });
  const { audits, service, state } = createServiceHarness({ users: [doctor, target] });
  await grantSystemRole({
    service,
    state,
    userId: doctor.id,
    clinicId: doctor.clinic_id,
    roleCode: 'doctor',
  });
  const role = await createManualRole({
    clinicId: doctor.clinic_id,
    code: 'rbac_manager',
    grants: [{ key: 'rbac.roles.create', scope: RBAC_SCOPE.CLINIC }],
    state,
  });

  await assert.rejects(service.assignUserRole({
    context: { userId: doctor.id, clinicId: doctor.clinic_id, isPlatform: false },
    payload: { userId: target.id, roleId: role.id },
  }), (error) => error instanceof ApiError && error.statusCode === 403);

  assert.equal(state.userRoles.some((entry) => entry.user_id === target.id), false);
  assert.equal(audits.some((audit) => audit.action === 'rbac.user_role.assign_denied'), true);
});

test('rbac effective access merges roles and keeps strongest permission scope', async () => {
  const admin = createUser({ id: 'admin-a' });
  const user = createUser();
  const { service, state } = createServiceHarness({ users: [admin, user] });
  await grantSystemRole({ service, state, userId: admin.id, clinicId: admin.clinic_id });
  const role = await service.createRole({
    context: { userId: admin.id, clinicId: user.clinic_id, isPlatform: false },
    payload: {
      name: 'Scope Role',
      permissions: [
        { key: 'users.me.read', scope: RBAC_SCOPE.OWN },
        { key: 'users.me.read', scope: RBAC_SCOPE.CLINIC },
      ],
    },
  });
  await service.assignUserRole({
    context: { userId: admin.id, clinicId: user.clinic_id, isPlatform: false },
    payload: { userId: user.id, roleId: role.id },
  });

  const access = await service.resolveEffectiveAccess({ userId: user.id, clinicId: user.clinic_id });

  assert.deepEqual(access.roles, ['scope_role']);
  assert.deepEqual(access.permissions, ['users.me.read']);
  assert.equal(access.scopedPermissions['users.me.read'], RBAC_SCOPE.CLINIC);
  assert.equal(state.users.find((entry) => entry.id === user.id).token_version, 1);
});

test('rbac revocation removes effective access and increments token version', async () => {
  const admin = createUser({ id: 'admin-a' });
  const user = createUser({ id: 'user-a' });
  const { audits, service, state } = createServiceHarness({ users: [admin, user] });
  await grantSystemRole({ service, state, userId: admin.id, clinicId: admin.clinic_id });
  const role = await service.createRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: {
      name: 'Current User Reader',
      permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.CLINIC }],
    },
  });
  const assignment = await service.assignUserRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    payload: { userId: user.id, roleId: role.id },
  });

  const revoked = await service.revokeUserRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    assignmentId: assignment.id,
  });
  const access = await service.resolveEffectiveAccess({ userId: user.id, clinicId: user.clinic_id });

  assert.deepEqual(revoked, { id: assignment.id, revoked: true });
  assert.deepEqual(access.permissions, []);
  assert.equal(state.users.find((entry) => entry.id === user.id).token_version, 2);
  assert.equal(audits.some((audit) => audit.action === 'rbac.user_role.revoked'), true);
});

test('rbac revocation blocks cross-tenant attempts and audits denial', async () => {
  const admin = createUser({ id: 'admin-a', clinic_id: 'clinic-a' });
  const otherAdmin = createUser({ id: 'admin-b', clinic_id: 'clinic-b' });
  const user = createUser({ id: 'user-b', clinic_id: 'clinic-b' });
  const { audits, service, state } = createServiceHarness({ users: [admin, otherAdmin, user] });
  await grantSystemRole({ service, state, userId: admin.id, clinicId: admin.clinic_id });
  await grantSystemRole({ service, state, userId: otherAdmin.id, clinicId: otherAdmin.clinic_id });
  const role = await service.createRole({
    context: { userId: otherAdmin.id, clinicId: otherAdmin.clinic_id, isPlatform: false },
    payload: {
      name: 'Other Clinic Reader',
      permissions: [{ key: 'users.me.read', scope: RBAC_SCOPE.CLINIC }],
    },
  });
  const assignment = await service.assignUserRole({
    context: { userId: otherAdmin.id, clinicId: otherAdmin.clinic_id, isPlatform: false },
    payload: { userId: user.id, roleId: role.id },
  });

  await assert.rejects(service.revokeUserRole({
    context: { userId: admin.id, clinicId: admin.clinic_id, isPlatform: false },
    assignmentId: assignment.id,
  }), (error) => error instanceof ApiError && error.statusCode === 404);

  assert.equal(state.userRoles.find((entry) => entry.id === assignment.id).revoked_at, null);
  assert.equal(audits.some((audit) => audit.action === 'rbac.user_role.revoke_denied'), true);
});

test('rbac APIs require permissions and allow authorized access', async () => {
  const authorizedAuthService = {
    resolveAccessToken: async () => ({
      contextIdentity: {
        userId: 'user-a',
        clinicId: 'clinic-a',
        sessionId: 'session-a',
        roles: ['clinic_admin'],
        permissions: ['rbac.permissions.read'],
        isAuthenticated: true,
        isPlatform: false,
      },
      user: { id: 'user-a', clinicId: 'clinic-a', email: 'admin@example.com' },
      session: { sessionId: 'session-a' },
    }),
  };
  const rbacService = {
    listPermissions: async () => [{ key: 'rbac.permissions.read' }],
  };
  const app = createApp({
    readinessPing: async () => true,
    authService: authorizedAuthService,
    rbacService,
    enablePostSprint1Routes: true,
  });
  const allowed = await request(app, '/api/v1/rbac/permissions', {
    headers: { cookie: 'access_token=access.jwt' },
  });

  assert.equal(allowed.response.status, 200);
  assert.equal(allowed.body.message, 'Permissions');

  const deniedAuthService = {
    resolveAccessToken: async () => ({
      contextIdentity: {
        userId: 'user-a',
        clinicId: 'clinic-a',
        sessionId: 'session-a',
        roles: [],
        permissions: [],
        isAuthenticated: true,
        isPlatform: false,
      },
      user: { id: 'user-a', clinicId: 'clinic-a', email: 'admin@example.com' },
      session: { sessionId: 'session-a' },
    }),
  };
  const denials = [];
  const deniedApp = createApp({
    readinessPing: async () => true,
    authService: deniedAuthService,
    rbacService: {
      ...rbacService,
      recordAuthorizationDenied: async (input) => {
        denials.push(input);
        return input;
      },
    },
    enablePostSprint1Routes: true,
  });
  const denied = await request(deniedApp, '/api/v1/rbac/permissions', {
    headers: { cookie: 'access_token=access.jwt' },
  });

  assert.equal(denied.response.status, 403);
  assert.equal(denials.length, 1);
  assert.equal(denials[0].permission, 'rbac.permissions.read');
});

test('users me API returns current user and effective access', async () => {
  const authService = {
    resolveAccessToken: async () => ({
      contextIdentity: {
        userId: '11111111-1111-4111-8111-111111111111',
        clinicId: '22222222-2222-4222-8222-222222222222',
        sessionId: 'session-a',
        roles: ['doctor'],
        permissions: ['users.me.read'],
        scopedPermissions: { 'users.me.read': 'CLINIC' },
        isAuthenticated: true,
        isPlatform: false,
      },
      user: { id: '11111111-1111-4111-8111-111111111111' },
      session: { sessionId: 'session-a' },
    }),
  };
  const usersService = {
    getCurrentUser: async ({ context }) => ({
      user: { id: context.userId, clinicId: context.clinicId, email: 'doctor@example.com' },
      access: {
        roles: context.roles,
        permissions: context.permissions,
        scopedPermissions: context.scopedPermissions,
        isPlatform: context.isPlatform,
      },
    }),
  };
  const app = createApp({
    readinessPing: async () => true,
    authService,
    usersService,
    enablePostSprint1Routes: true,
  });
  const result = await request(app, '/api/v1/users/me', {
    headers: { cookie: 'access_token=access.jwt' },
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.body.message, 'Current user');
  assert.equal(result.body.data.user.id, '11111111-1111-4111-8111-111111111111');
  assert.deepEqual(result.body.data.access.permissions, ['users.me.read']);
  assert.equal(result.body.data.access.scopedPermissions['users.me.read'], 'CLINIC');
});
