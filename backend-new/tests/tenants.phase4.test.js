process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/doctor_system_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-characters-ok';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32-characters';
process.env.AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE || 'false';
process.env.SETTINGS_ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || Buffer.alloc(32, 7).toString('base64');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../src/app');
const { ApiError } = require('../src/common/errors/ApiError');
const { PERMISSION_CATALOG, SYSTEM_ROLES } = require('../src/modules/rbac/rbac.constants');
const { createAuthService } = require('../src/modules/auth/auth.service');
const { hashPassword } = require('../src/modules/auth/auth.crypto');
const { USER_STATUS } = require('../src/modules/auth/auth.constants');
const { createBranchesService } = require('../src/modules/branches/branches.service');
const { createClinicsService } = require('../src/modules/clinics/clinics.service');
const { createSettingsService } = require('../src/modules/settings/settings.service');
const { createUsersService } = require('../src/modules/users/users.service');
const { isEncryptedEnvelope } = require('../src/common/utils/settingsEncryption');
const { mapPrismaError } = require('../src/common/utils/prismaErrors');

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

const createClinicHarness = () => {
  const state = {
    clinics: [],
    users: [],
    branches: [],
    plans: [],
    subscriptions: [],
    roles: [],
    userRoles: [],
    settings: [],
    settingHistory: [],
    outbox: [],
    audits: [],
  };
  const repository = {
    activeSubscriptionKey: (clinicId) => `${clinicId}:active_subscription`,
    createBranch: async (payload) => { state.branches.push(payload); return payload; },
    createClinic: async (payload) => { state.clinics.push(payload); return payload; },
    createOutboxEvent: async (payload) => { state.outbox.push(payload); return payload; },
    createSetting: async (payload) => { state.settings.push(payload); return payload; },
    createSettingHistory: async (payload) => { state.settingHistory.push(payload); return payload; },
    createSubscription: async (payload) => { state.subscriptions.push(payload); return payload; },
    createUser: async (payload) => { state.users.push(payload); return payload; },
    createUserRole: async (payload) => { state.userRoles.push(payload); return payload; },
    findClinicById: async (clinicId) => state.clinics.find((clinic) => clinic.id === clinicId && !clinic.is_deleted) || null,
    findClinicByIdempotencyKey: async (key) => {
      const clinic = state.clinics.find((entry) => entry.onboarding_idempotency_key === key && !entry.is_deleted);
      if (!clinic) return null;
      return {
        ...clinic,
        branches: state.branches.filter((branch) => branch.clinic_id === clinic.id),
        owner_user: state.users.find((user) => user.id === clinic.owner_user_id),
        subscriptions: state.subscriptions.filter((subscription) => subscription.clinic_id === clinic.id),
      };
    },
    findSystemRoleByCode: async (code) => state.roles.find((role) => role.code === code) || null,
    findUserByEmailScope: async ({ email, loginScope }) => state.users.find((user) => user.email === email && user.login_scope === loginScope) || null,
    listClinics: async () => state.clinics,
    primaryBranchKey: (clinicId) => `${clinicId}:primary_branch`,
    updateClinic: async ({ clinicId, data }) => {
      const clinic = state.clinics.find((entry) => entry.id === clinicId);
      Object.assign(clinic, data);
      return clinic;
    },
    updateClinicOwner: async ({ clinicId, ownerUserId }) => {
      const clinic = state.clinics.find((entry) => entry.id === clinicId);
      clinic.owner_user_id = ownerUserId;
      return clinic;
    },
    upsertDefaultPlan: async (payload) => {
      const existing = state.plans.find((plan) => plan.code === payload.code);
      if (existing) return existing;
      state.plans.push(payload);
      return payload;
    },
  };
  const service = createClinicsService({
    repository,
    auditRecorder: async (input) => { state.audits.push(input); return input; },
    transaction: async (callback) => callback({}),
    rbacService: {
      syncSystemRoles: async () => {
        if (!state.roles.some((role) => role.code === 'clinic_owner')) {
          state.roles.push({ id: 'clinic-owner-role', code: 'clinic_owner', is_system: true, is_deleted: false });
        }
      },
    },
  });
  return { service, state };
};

test('prisma schema includes Sprint 3 tenant tables and active uniqueness keys', () => {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');
  assert.match(schema, /model clinics/);
  assert.match(schema, /model clinic_branches/);
  assert.match(schema, /model settings/);
  assert.match(schema, /model setting_history/);
  assert.match(schema, /model user_invitations/);
  assert.match(schema, /model subscription_plans/);
  assert.match(schema, /model clinic_subscriptions/);
  assert.match(schema, /onboarding_idempotency_key String\?\s+@unique/);
  assert.match(schema, /primary_branch_key String\?\s+@unique/);
  assert.match(schema, /active_setting_key String\?\s+@unique/);
  assert.match(schema, /active_invitation_key String\?\s+@unique/);
  assert.match(schema, /active_subscription_key String\?\s+@unique/);
  assert.match(schema, /active_primary_assignment_key String\?\s+@unique/);
});

test('tenant migration artifact includes Sprint 3 tables, indexes, and FKs', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'migrations', '0003_tenants.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE `clinics`/);
  assert.match(migration, /CREATE TABLE `clinic_branches`/);
  assert.match(migration, /CREATE TABLE `user_invitations`/);
  assert.match(migration, /UNIQUE INDEX `clinic_branches_primary_branch_key_key`/);
  assert.match(migration, /UNIQUE INDEX `user_invitations_active_invitation_key_key`/);
  assert.match(migration, /INDEX `settings_clinic_id_branch_id_scope_is_deleted_idx`/);
  assert.match(migration, /ALTER TABLE `user_branch_assignments` ADD CONSTRAINT `user_branch_assignments_branch_id_fkey`/);
});

test('Sprint 3 Postman collection is valid JSON and includes tenant requests', () => {
  const collection = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'postman', 'Doctor-System-Phase-4-Tenants.postman_collection.json'), 'utf8'));
  assert.equal(collection.info.name, 'Doctor System - Phase 4 Tenants');
  const folderNames = collection.item.map((item) => item.name);
  assert.equal(folderNames.includes('Clinics'), true);
  assert.equal(folderNames.includes('Users And Invitations'), true);
  assert.equal(folderNames.includes('Settings'), true);
});

test('rbac catalog includes Sprint 3 permissions and clinic owner role', () => {
  const permissionKeys = PERMISSION_CATALOG.map((permission) => permission.key);
  assert.equal(permissionKeys.includes('clinics.create'), true);
  assert.equal(permissionKeys.includes('branches.assign_users'), true);
  assert.equal(permissionKeys.includes('users.invite.revoke'), true);
  assert.equal(permissionKeys.includes('settings.update_sensitive'), true);
  assert.equal(permissionKeys.includes('subscriptions.read'), true);
  assert.equal(permissionKeys.includes('tenant.recovery'), true);
  const clinicOwner = SYSTEM_ROLES.find((role) => role.code === 'clinic_owner');
  assert.equal(Boolean(clinicOwner), true);
  assert.equal(clinicOwner.permissions.some((grant) => grant.key === 'users.manage'), true);
});

test('Sprint 3 routes stay gated by default and mount when enabled', async () => {
  const defaultApp = createApp({ readinessPing: async () => true });
  const hidden = await request(defaultApp, '/api/v1/clinics/current');
  assert.equal(hidden.response.status, 404);

  const authService = {
    resolveAccessToken: async () => ({
      contextIdentity: {
        userId: 'user-a',
        clinicId: 'clinic-a',
        sessionId: 'session-a',
        roles: ['clinic_owner'],
        permissions: ['clinics.read'],
        scopedPermissions: { 'clinics.read': 'CLINIC' },
        isAuthenticated: true,
        isPlatform: false,
      },
      user: { id: 'user-a', clinicId: 'clinic-a' },
      session: { sessionId: 'session-a' },
    }),
  };
  const clinicsService = {
    getCurrentClinic: async () => ({ clinic: { id: 'clinic-a', name: 'Clinic A' } }),
  };
  const app = createApp({
    readinessPing: async () => true,
    authService,
    clinicsService,
    enablePostSprint1Routes: true,
  });
  const visible = await request(app, '/api/v1/clinics/current', {
    headers: { cookie: 'access_token=access.jwt' },
  });
  assert.equal(visible.response.status, 200);
  assert.equal(visible.body.message, 'Current clinic');
  assert.equal(visible.body.data.clinic.id, 'clinic-a');
});

test('clinic onboarding creates required tenant foundation records atomically', async () => {
  const { service, state } = createClinicHarness();
  const result = await service.onboardClinic({
    context: { userId: 'super-admin', isPlatform: true, permissions: ['clinics.create'] },
    idempotencyKey: 'onboard-clinic-a',
    payload: {
      code: 'clinic_a',
      name: 'Clinic A',
      timezone: 'Asia/Calcutta',
      owner: {
        fullName: 'Owner A',
        email: 'owner@example.com',
        password: 'StrongPassword123',
      },
      branch: {
        branchCode: 'main',
        name: 'Main Branch',
      },
    },
  });

  assert.equal(result.idempotent, false);
  assert.equal(state.clinics.length, 1);
  assert.equal(state.users.length, 1);
  assert.equal(state.branches.length, 1);
  assert.equal(state.branches[0].is_primary, true);
  assert.equal(state.subscriptions.length, 1);
  assert.equal(state.userRoles.length, 1);
  assert.equal(state.settings.some((setting) => setting.setting_key === 'clinic.timezone'), true);
  assert.equal(state.outbox.some((event) => event.event_name === 'clinic.created.v1'), true);
  assert.equal(state.outbox.some((event) => event.event_name === 'user.activated.v1'), true);
  assert.equal(state.outbox.some((event) => event.event_name === 'branch.created.v1'), true);
  assert.equal(state.outbox.some((event) => event.event_name === 'settings.updated.v1'), true);
  assert.equal(state.outbox.some((event) => event.event_name === 'subscription.trial_started.v1'), true);
  assert.equal(state.audits.some((audit) => audit.action === 'clinic.onboarded'), true);
});

test('clinic onboarding replays matching idempotency key and rejects mismatched payload', async () => {
  const { service } = createClinicHarness();
  const context = { userId: 'super-admin', isPlatform: true, permissions: ['clinics.create'] };
  const payload = {
    code: 'clinic_a',
    name: 'Clinic A',
    owner: { fullName: 'Owner A', email: 'owner@example.com', password: 'StrongPassword123' },
  };
  await service.onboardClinic({ context, idempotencyKey: 'same-key', payload });
  const replay = await service.onboardClinic({ context, idempotencyKey: 'same-key', payload });
  assert.equal(replay.idempotent, true);

  await assert.rejects(service.onboardClinic({
    context,
    idempotencyKey: 'same-key',
    payload: { ...payload, name: 'Different Clinic' },
  }), (error) => error instanceof ApiError && error.statusCode === 409);
});

test('auth login blocks suspended clinic users', async () => {
  const passwordHash = await hashPassword('StrongPassword123');
  const repository = {
    countRecentFailedLoginAttempts: async () => 0,
    createAccountLockout: async () => null,
    findActiveAccountLockout: async () => null,
    findUserForLogin: async () => ({
      id: 'user-a',
      clinic_id: 'clinic-a',
      full_name: 'Suspended User',
      email: 'user@example.com',
      phone: null,
      password_hash: passwordHash,
      user_type: 'CLINIC_USER',
      status: 'ACTIVE',
      token_version: 0,
      is_deleted: false,
      clinic: { id: 'clinic-a', status: 'SUSPENDED', is_deleted: false },
    }),
    recordLoginAttempt: async (payload) => payload,
    sanitizeEmail: (email) => String(email || '').trim().toLowerCase(),
  };
  const audits = [];
  const service = createAuthService({
    repository,
    auditRecorder: async (input) => { audits.push(input); return input; },
    transaction: async (callback) => callback({}),
  });

  await assert.rejects(service.login({
    clinicId: 'clinic-a',
    email: 'user@example.com',
    password: 'StrongPassword123',
    context: { ipAddress: '127.0.0.1' },
  }), (error) => error instanceof ApiError && error.statusCode === 403);
  assert.equal(audits.some((audit) => audit.action === 'auth.login.failure'), true);
});

test('settings service requires sensitive read permission', async () => {
  const setting = {
    id: 'setting-a',
    clinic_id: 'clinic-a',
    branch_id: null,
    user_id: null,
    setting_key: 'notifications.whatsapp',
    value: { token: 'secret-token' },
    scope: 'CLINIC',
    is_encrypted: true,
    status: 'ACTIVE',
  };
  const repository = {
    activeSettingKey: () => 'clinic-a:no_branch:no_user:CLINIC:notifications.whatsapp',
    findBranchById: async () => null,
    findClinicById: async () => ({ id: 'clinic-a', status: 'ACTIVE', is_deleted: false }),
    findSettingByActiveKey: async () => setting,
    findUserById: async () => null,
    listSettings: async () => [setting],
  };
  const service = createSettingsService({
    repository,
    auditRecorder: async (input) => input,
    transaction: async (callback) => callback({}),
  });

  await assert.rejects(service.getSetting({
    context: { userId: 'user-a', clinicId: 'clinic-a', permissions: ['settings.read'] },
    key: 'notifications.whatsapp',
    query: { scope: 'CLINIC' },
  }), (error) => error instanceof ApiError && error.statusCode === 403);

  const result = await service.getSetting({
    context: { userId: 'user-a', clinicId: 'clinic-a', permissions: ['settings.read', 'settings.read_sensitive'] },
    key: 'notifications.whatsapp',
    query: { scope: 'CLINIC' },
  });
  assert.equal(result.setting.value.token, 'secret-token');
});

test('sensitive settings are encrypted before persistence and redacted in history', async () => {
  const state = { settings: [], history: [], audits: [], outbox: [] };
  const repository = {
    activeSettingKey: () => 'clinic-a:no_branch:no_user:CLINIC:notifications.whatsapp',
    createOutboxEvent: async (payload) => { state.outbox.push(payload); return payload; },
    createSetting: async (payload) => { state.settings.push(payload); return payload; },
    createSettingHistory: async (payload) => { state.history.push(payload); return payload; },
    findBranchById: async () => null,
    findClinicById: async () => ({ id: 'clinic-a', status: 'ACTIVE', is_deleted: false }),
    findSettingByActiveKey: async () => null,
    findUserById: async () => null,
    updateSetting: async () => null,
  };
  const service = createSettingsService({
    repository,
    auditRecorder: async (input) => { state.audits.push(input); return input; },
    transaction: async (callback) => callback({}),
  });

  const result = await service.upsertSetting({
    context: {
      userId: 'user-a',
      clinicId: 'clinic-a',
      permissions: ['settings.update', 'settings.update_sensitive'],
    },
    key: 'notifications.whatsapp',
    payload: {
      scope: 'CLINIC',
      value: { apiKey: 'secret-api-key' },
      reason: 'configure provider',
    },
  });

  assert.equal(isEncryptedEnvelope(state.settings[0].value), true);
  assert.equal(state.history[0].after_value.encrypted, true);
  assert.equal(JSON.stringify(state.history).includes('secret-api-key'), false);
  assert.equal(JSON.stringify(state.audits).includes('secret-api-key'), false);
  assert.equal(result.setting.value.apiKey, 'secret-api-key');
});

test('sensitive settings fail closed when encryption key is missing', async () => {
  const previousKey = process.env.SETTINGS_ENCRYPTION_KEY;
  delete process.env.SETTINGS_ENCRYPTION_KEY;
  const repository = {
    activeSettingKey: () => 'clinic-a:no_branch:no_user:CLINIC:notifications.whatsapp',
    findBranchById: async () => null,
    findClinicById: async () => ({ id: 'clinic-a', status: 'ACTIVE', is_deleted: false }),
    findSettingByActiveKey: async () => null,
    findUserById: async () => null,
  };
  const service = createSettingsService({
    repository,
    auditRecorder: async (input) => input,
    transaction: async (callback) => callback({}),
  });

  await assert.rejects(service.upsertSetting({
    context: {
      userId: 'user-a',
      clinicId: 'clinic-a',
      permissions: ['settings.update', 'settings.update_sensitive'],
    },
    key: 'notifications.whatsapp',
    payload: { scope: 'CLINIC', value: { apiKey: 'secret-api-key' } },
  }), (error) => error instanceof ApiError && error.statusCode === 500);
  process.env.SETTINGS_ENCRYPTION_KEY = previousKey;
});

test('invitation acceptance blocks unavailable clinic before account activation', async () => {
  const state = { userUpdated: false, audits: [] };
  const repository = {
    createOutboxEvent: async (payload) => payload,
    findClinicById: async () => ({ id: 'clinic-a', status: 'SUSPENDED', is_deleted: false }),
    findInvitationByTokenHash: async () => ({
      id: 'invitation-a',
      clinic_id: 'clinic-a',
      user_id: 'user-a',
      email: 'invite@example.com',
      full_name: 'Invite User',
      status: 'PENDING',
      accepted_at: null,
      revoked_at: null,
      expires_at: new Date(Date.now() + 60_000),
    }),
    updateInvitation: async (payload) => payload,
    updateUser: async () => {
      state.userUpdated = true;
      return null;
    },
  };
  const service = createUsersService({
    repository,
    auditRecorder: async (input) => { state.audits.push(input); return input; },
    authService: { issueSessionForUser: async () => { throw new Error('session should not be issued'); } },
    branchesService: {},
    transaction: async (callback) => callback({}),
  });

  await assert.rejects(service.acceptInvitation({
    token: 'x'.repeat(48),
    password: 'StrongPassword123',
    context: { ipAddress: '127.0.0.1' },
  }), (error) => error instanceof ApiError && error.statusCode === 403);
  assert.equal(state.userUpdated, false);
  assert.equal(state.audits.some((audit) => audit.action === 'user.invitation.denied'), true);
});

test('invitation acceptance reloads auth user by id and clinic before issuing session', async () => {
  const authCalls = [];
  const repository = {
    createOutboxEvent: async (payload) => payload,
    findClinicById: async () => ({ id: 'clinic-a', status: 'ACTIVE', is_deleted: false }),
    findInvitationByTokenHash: async () => ({
      id: 'invitation-a',
      clinic_id: 'clinic-a',
      user_id: 'user-a',
      email: 'invite@example.com',
      full_name: 'Invite User',
      status: 'PENDING',
      accepted_at: null,
      revoked_at: null,
      expires_at: new Date(Date.now() + 60_000),
    }),
    updateInvitation: async ({ invitationId, data }) => ({ id: invitationId, ...data }),
    updateUser: async ({ userId, data }) => ({
      id: userId,
      clinic_id: 'clinic-a',
      full_name: 'Invite User',
      email: 'invite@example.com',
      user_type: 'CLINIC_USER',
      status: data.status,
    }),
  };
  const service = createUsersService({
    repository,
    auditRecorder: async (input) => input,
    authService: {
      issueSessionForUser: async (input) => {
        authCalls.push(input);
        return {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          session: { sessionId: 'session-a' },
        };
      },
    },
    branchesService: {},
    transaction: async (callback) => callback({}),
  });

  const result = await service.acceptInvitation({
    token: 'x'.repeat(48),
    password: 'StrongPassword123',
    context: { requestId: 'request-a' },
  });
  assert.equal(result.accessToken, 'access-token');
  assert.deepEqual(authCalls[0].userId, 'user-a');
  assert.deepEqual(authCalls[0].clinicId, 'clinic-a');
  assert.equal(Object.prototype.hasOwnProperty.call(authCalls[0], 'user'), false);
});

test('public invitation accept enforces origin and route-specific rate limits', async () => {
  const usersService = {
    acceptInvitation: async () => ({
      user: { id: 'user-a' },
      invitation: { id: 'invitation-a' },
    }),
  };
  const app = createApp({
    readinessPing: async () => true,
    usersService,
    enablePostSprint1Routes: true,
    authInvitationAcceptRateLimitOptions: { windowMs: 60_000, max: 2 },
  });

  const denied = await request(app, '/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: JSON.stringify({ token: 't'.repeat(48), password: 'StrongPassword123' }),
  });
  assert.equal(denied.response.status, 403);

  const first = await request(app, '/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 't'.repeat(48), password: 'StrongPassword123' }),
  });
  assert.equal(first.response.status, 200);

  const limited = await request(app, '/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 't'.repeat(48), password: 'StrongPassword123' }),
  });
  assert.equal(limited.response.status, 429);
});

test('branch assignment mutations reject route user mismatch', async () => {
  const repository = {
    clearPrimaryBranchAssignment: async () => null,
    findBranchAssignmentById: async () => ({
      id: 'assignment-a',
      clinic_id: 'clinic-a',
      user_id: 'other-user',
      branch_id: 'branch-a',
      revoked_at: null,
    }),
    findClinicById: async () => ({ id: 'clinic-a', status: 'ACTIVE', is_deleted: false }),
    revokeBranchAssignment: async () => { throw new Error('should not revoke'); },
    setPrimaryBranchAssignment: async () => { throw new Error('should not set primary'); },
  };
  const service = createBranchesService({
    repository,
    auditRecorder: async (input) => input,
    transaction: async (callback) => callback({}),
  });

  await assert.rejects(service.revokeUserBranchAssignment({
    context: { userId: 'admin-a', clinicId: 'clinic-a' },
    userId: 'route-user',
    assignmentId: 'assignment-a',
  }), (error) => error instanceof ApiError && error.statusCode === 404);

  await assert.rejects(service.setPrimaryUserBranchAssignment({
    context: { userId: 'admin-a', clinicId: 'clinic-a' },
    userId: 'route-user',
    assignmentId: 'assignment-a',
  }), (error) => error instanceof ApiError && error.statusCode === 404);
});

test('tenant override allow and deny decisions are audited centrally', async () => {
  const audits = [];
  const repository = {
    listSettings: async () => [],
  };
  const service = createSettingsService({
    repository,
    auditRecorder: async (input) => { audits.push(input); return input; },
    transaction: async (callback) => callback({}),
  });

  await service.listSettings({
    context: { userId: 'platform-a', isPlatform: true },
    requestedClinicId: 'clinic-a',
    query: { scope: 'CLINIC' },
  });
  assert.equal(audits.some((audit) => audit.action === 'tenant.override.allowed'), true);

  await assert.rejects(service.listSettings({
    context: { userId: 'user-a', clinicId: 'clinic-b', isPlatform: false },
    requestedClinicId: 'clinic-a',
    query: { scope: 'CLINIC' },
  }), (error) => error instanceof ApiError && error.statusCode === 403);
  assert.equal(audits.some((audit) => audit.action === 'tenant.override.denied'), true);
});

test('user status changes protect self, owner, and last-admin access', async () => {
  const baseRepository = (overrides = {}) => ({
    findClinicById: async () => ({
      id: 'clinic-a',
      status: 'ACTIVE',
      is_deleted: false,
      owner_user_id: overrides.ownerUserId || 'owner-a',
    }),
    findUserById: async () => ({
      id: overrides.targetUserId || 'target-a',
      clinic_id: 'clinic-a',
      full_name: 'Target User',
      email: 'target@example.com',
      user_type: 'CLINIC_USER',
      status: USER_STATUS.ACTIVE,
    }),
    isLastActiveTenantAdmin: async () => Boolean(overrides.lastAdmin),
    revokeActiveRefreshTokensByUser: async () => null,
    updateUser: async () => {
      throw new Error('should not update blocked user');
    },
  });
  const makeService = (repository) => createUsersService({
    repository,
    auditRecorder: async (input) => input,
    branchesService: {},
    transaction: async (callback) => callback({}),
  });

  await assert.rejects(makeService(baseRepository({ targetUserId: 'actor-a' })).changeUserStatus({
    context: { userId: 'actor-a', clinicId: 'clinic-a' },
    userId: 'actor-a',
    status: USER_STATUS.DEACTIVATED,
    reason: 'staff change',
  }), (error) => error instanceof ApiError && error.statusCode === 403);

  await assert.rejects(makeService(baseRepository({ ownerUserId: 'owner-a', targetUserId: 'owner-a' })).changeUserStatus({
    context: { userId: 'admin-a', clinicId: 'clinic-a' },
    userId: 'owner-a',
    status: USER_STATUS.DEACTIVATED,
    reason: 'staff change',
  }), (error) => error instanceof ApiError && error.statusCode === 409);

  await assert.rejects(makeService(baseRepository({ lastAdmin: true })).changeUserStatus({
    context: { userId: 'admin-a', clinicId: 'clinic-a' },
    userId: 'target-a',
    status: USER_STATUS.DEACTIVATED,
    reason: 'staff change',
  }), (error) => error instanceof ApiError && error.statusCode === 409);
});

test('Prisma conflict helper maps expected uniqueness and FK errors safely', () => {
  const unique = mapPrismaError({ code: 'P2002' }, { unique: 'Duplicate tenant record' });
  const foreignKey = mapPrismaError({ code: 'P2003' }, { foreignKey: 'Related tenant record is invalid' });
  const notFound = mapPrismaError({ code: 'P2025' }, { notFound: 'Tenant record not found' });

  assert.equal(unique.statusCode, 409);
  assert.equal(unique.message, 'Duplicate tenant record');
  assert.equal(foreignKey.statusCode, 409);
  assert.equal(foreignKey.message, 'Related tenant record is invalid');
  assert.equal(notFound.statusCode, 404);
});
