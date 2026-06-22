process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/doctor_system_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-characters-ok';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32-characters';
process.env.AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE || 'false';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../src/app');
const { ApiError } = require('../src/common/errors/ApiError');
const { SESSION_STATUS, TOKEN_TTL_SECONDS, USER_STATUS, USER_TYPE } = require('../src/modules/auth/auth.constants');
const { createOpaqueToken, hashPassword, hashToken, verifyPassword } = require('../src/modules/auth/auth.crypto');
const { createAuthService } = require('../src/modules/auth/auth.service');
const { signAccessToken, signRefreshToken, verifyToken } = require('../src/modules/auth/auth.tokens');

const accessSecret = 'a'.repeat(32);
const refreshSecret = 'b'.repeat(32);

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

const cookieHeader = (headers) => {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie().join('; ');
  return headers.get('set-cookie') || '';
};

const requestCookieHeader = (headers) => cookieHeader(headers)
  .split(/,\s*(?=[^;,]+=)|;\s*/)
  .map((entry) => entry.trim())
  .filter((entry) => /^[^=]+=/.test(entry))
  .filter((entry) => !/^(Path|Expires|Max-Age|HttpOnly|SameSite|Secure)=?/i.test(entry))
  .map((entry) => entry.split(';')[0])
  .join('; ');

const cookieValue = (headers, name) => {
  const match = cookieHeader(headers).match(new RegExp(`${name}=([^;,\\s]+)`));
  return match ? match[1] : null;
};

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const createFakeRepository = ({ initialUsers = [], claimDelayMs = 0 } = {}) => {
  const state = {
    users: initialUsers.map((user) => ({ ...user })),
    refreshTokens: [],
    loginAttempts: [],
    accountLockouts: [],
    revokeActiveCalls: [],
    lastFindUserByIdInput: null,
    lastFindActiveRefreshTokenBySessionInput: null,
  };

  const repository = {
    sanitizeEmail: (email) => String(email || '').trim().toLowerCase(),
    findUserForLogin: async ({ email, clinicId = null }) => state.users.find((user) => (
      user.email === repository.sanitizeEmail(email)
      && (user.login_scope || repository.loginScopeForClinic(user.clinic_id || null)) === repository.loginScopeForClinic(clinicId || null)
      && (user.clinic_id || null) === (clinicId || null)
      && !user.is_deleted
    )) || null,
    findUserById: async (input) => {
      state.lastFindUserByIdInput = input;
      const userId = typeof input === 'object' ? input.userId : input;
      const expectedClinicId = typeof input === 'object' ? (input.isPlatform ? null : input.clinicId) : undefined;
      return state.users.find((user) => (
        user.id === userId
        && !user.is_deleted
        && (expectedClinicId === undefined || (user.clinic_id || null) === (expectedClinicId || null))
      )) || null;
    },
    updateLastLogin: async (userId) => {
      const user = state.users.find((entry) => entry.id === userId);
      user.last_login_at = new Date();
      return user;
    },
    loginScopeForClinic: (clinicId = null) => clinicId || 'PLATFORM',
    createRefreshToken: async (payload) => {
      const record = { ...payload };
      state.refreshTokens.push(record);
      return record;
    },
    findRefreshTokenByHash: async (tokenHash) => {
      const token = state.refreshTokens.find((entry) => entry.token_hash === tokenHash);
      if (!token) return null;
      return { ...token, user: state.users.find((user) => user.id === token.user_id) };
    },
    findActiveRefreshTokenBySession: async (input) => {
      state.lastFindActiveRefreshTokenBySessionInput = input;
      const {
        sessionId,
        userId,
        clinicId = null,
        isPlatform = false,
      } = input;
      const token = state.refreshTokens.find((entry) => (
        entry.session_id === sessionId
        && entry.user_id === userId
        && (entry.clinic_id || null) === (isPlatform ? null : (clinicId || null))
        && entry.status === SESSION_STATUS.ACTIVE
        && !entry.revoked_at
        && entry.expires_at > new Date()
      ));
      if (!token) return null;
      return { ...token, user: state.users.find((user) => user.id === token.user_id) };
    },
    claimActiveRefreshTokenForRotation: async ({ id, tokenHash, now = new Date() }) => {
      const token = state.refreshTokens.find((entry) => (
        entry.id === id
        && entry.token_hash === tokenHash
        && entry.status === SESSION_STATUS.ACTIVE
        && !entry.revoked_at
        && entry.expires_at > now
      ));
      if (!token) return { count: 0 };
      token.status = SESSION_STATUS.REVOKED;
      token.revoked_at = now;
      if (claimDelayMs) await delay(claimDelayMs);
      return { count: 1 };
    },
    markRefreshTokenReplacement: async ({ id, replacedByTokenId }) => {
      const token = state.refreshTokens.find((entry) => entry.id === id);
      token.replaced_by_token_id = replacedByTokenId;
      return token;
    },
    revokeRefreshToken: async ({ id, replacedByTokenId = null }) => {
      const token = state.refreshTokens.find((entry) => entry.id === id);
      token.status = SESSION_STATUS.REVOKED;
      token.revoked_at = new Date();
      token.replaced_by_token_id = replacedByTokenId;
      return token;
    },
    revokeRefreshTokenByHash: async (tokenHash) => {
      let count = 0;
      state.refreshTokens.forEach((token) => {
        if (token.token_hash === tokenHash && token.status === SESSION_STATUS.ACTIVE && !token.revoked_at) {
          token.status = SESSION_STATUS.REVOKED;
          token.revoked_at = new Date();
          count += 1;
        }
      });
      return { count };
    },
    revokeActiveRefreshTokensByUser: async (userId) => {
      let count = 0;
      state.refreshTokens.forEach((token) => {
        if (token.user_id === userId && token.status === SESSION_STATUS.ACTIVE && !token.revoked_at) {
          token.status = SESSION_STATUS.REVOKED;
          token.revoked_at = new Date();
          count += 1;
        }
      });
      state.revokeActiveCalls.push({ userId, count });
      return { count };
    },
    recordLoginAttempt: async (payload) => {
      state.loginAttempts.push({ ...payload });
      return payload;
    },
    findActiveAccountLockout: async ({
      email,
      clinicId = null,
      ipAddress = 'unknown',
      now = new Date(),
    }) => state.accountLockouts.find((entry) => (
      entry.email === repository.sanitizeEmail(email)
      && (entry.clinic_id || null) === (clinicId || null)
      && entry.ip_address === ipAddress
      && !entry.unlocked_at
      && entry.locked_until > now
    )) || null,
    countRecentFailedLoginAttempts: async ({
      email,
      clinicId = null,
      ipAddress = 'unknown',
      since,
    }) => state.loginAttempts.filter((entry) => (
      entry.email === repository.sanitizeEmail(email)
      && (entry.clinic_id || null) === (clinicId || null)
      && entry.ip_address === ipAddress
      && entry.success === false
      && (!since || (entry.attempted_at || new Date()) >= since)
    )).length,
    createAccountLockout: async (payload) => {
      const record = { ...payload, created_at: new Date() };
      state.accountLockouts.push(record);
      return record;
    },
  };

  return { repository, state };
};

const createActiveUser = async (overrides = {}) => ({
  id: overrides.id || '11111111-1111-4111-8111-111111111111',
  clinic_id: Object.prototype.hasOwnProperty.call(overrides, 'clinic_id') ? overrides.clinic_id : '22222222-2222-4222-8222-222222222222',
  login_scope: overrides.login_scope || (Object.prototype.hasOwnProperty.call(overrides, 'clinic_id') && overrides.clinic_id === null ? 'PLATFORM' : (overrides.clinic_id || '22222222-2222-4222-8222-222222222222')),
  full_name: overrides.full_name || 'Dr Auth User',
  email: overrides.email || 'doctor@example.com',
  phone: overrides.phone || null,
  password_hash: overrides.password_hash || await hashPassword('ValidPassword#123'),
  user_type: overrides.user_type || USER_TYPE.CLINIC_USER,
  status: overrides.status || USER_STATUS.ACTIVE,
  token_version: Object.prototype.hasOwnProperty.call(overrides, 'token_version') ? overrides.token_version : 0,
  is_deleted: Boolean(overrides.is_deleted),
});

const createTestAuthService = ({ users = [] } = {}) => {
  const { repository, state } = createFakeRepository({ initialUsers: users });
  const audits = [];
  const service = createAuthService({
    repository,
    auditRecorder: async (input) => {
      audits.push(input);
      return input;
    },
    transaction: async (callback) => callback({}),
  });
  return { audits, service, state };
};

test('auth constants define Phase 02 identity and session values', () => {
  assert.equal(USER_TYPE.SUPER_ADMIN, 'SUPER_ADMIN');
  assert.equal(USER_TYPE.CLINIC_USER, 'CLINIC_USER');
  assert.equal(USER_STATUS.ACTIVE, 'ACTIVE');
  assert.equal(SESSION_STATUS.ACTIVE, 'ACTIVE');
  assert.equal(TOKEN_TTL_SECONDS.ACCESS, 900);
  assert.equal(TOKEN_TTL_SECONDS.REFRESH, 2592000);
});

test('password hashing stores bcrypt hash and verifies without plaintext storage', async () => {
  const passwordHash = await hashPassword('ValidPassword#123');
  assert.notEqual(passwordHash, 'ValidPassword#123');
  assert.match(passwordHash, /^\$2[aby]\$/);
  assert.equal(await verifyPassword('ValidPassword#123', passwordHash), true);
  assert.equal(await verifyPassword('WrongPassword#123', passwordHash), false);
});

test('opaque refresh token hash is deterministic and non-reversible', () => {
  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  assert.equal(typeof token, 'string');
  assert.equal(token.length > 40, true);
  assert.match(tokenHash, /^[0-9a-f]{64}$/);
  assert.equal(hashToken(token), tokenHash);
  assert.notEqual(tokenHash, token);
});

test('access token contains identity claims only', () => {
  const token = signAccessToken({
    userId: 'user-a',
    clinicId: 'clinic-a',
    sessionId: 'session-a',
    tokenVersion: 3,
  }, accessSecret);
  const payload = verifyToken(token, accessSecret, 'access token secret');
  assert.equal(payload.sub, 'user-a');
  assert.equal(payload.userId, 'user-a');
  assert.equal(payload.clinicId, 'clinic-a');
  assert.equal(payload.sessionId, 'session-a');
  assert.equal(payload.tokenVersion, 3);
  assert.equal(payload.permissions, undefined);
});

test('refresh token contains session and token id claims', () => {
  const token = signRefreshToken({
    userId: 'user-a',
    sessionId: 'session-a',
    tokenId: 'token-a',
  }, refreshSecret);
  const payload = verifyToken(token, refreshSecret, 'refresh token secret');
  assert.equal(payload.sub, 'user-a');
  assert.equal(payload.sessionId, 'session-a');
  assert.equal(payload.tokenId, 'token-a');
});

test('token helpers reject weak secrets', () => {
  assert.throws(() => signAccessToken({
    userId: 'user-a',
    sessionId: 'session-a',
    tokenVersion: 1,
  }, 'short'), /access token secret/);
});

test('prisma schema includes Phase 02 auth foundation tables', () => {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');
  assert.match(schema, /model users/);
  assert.match(schema, /model refresh_tokens/);
  assert.match(schema, /model password_reset_tokens/);
  assert.match(schema, /model login_attempts/);
  assert.match(schema, /model account_lockouts/);
  assert.match(schema, /token_version\s+Int\s+@default\(0\)/);
  assert.match(schema, /login_scope\s+String\s+@default\("PLATFORM"\)/);
  assert.match(schema, /@@unique\(\[clinic_id, email\]\)/);
  assert.match(schema, /@@unique\(\[login_scope, email\]\)/);
  assert.match(schema, /@@unique\(\[token_hash\]\)/);
  assert.doesNotMatch(schema, /@@unique\(\[session_id\]\)/);
  assert.match(schema, /@@index\(\[session_id\]\)/);
});

test('auth migration artifact includes Sprint 1 tables and refresh rotation indexes', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'migrations', '0001_foundation_auth.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE `users`/);
  assert.match(migration, /CREATE TABLE `refresh_tokens`/);
  assert.match(migration, /CREATE TABLE `login_attempts`/);
  assert.match(migration, /CREATE TABLE `account_lockouts`/);
  assert.match(migration, /`login_scope` VARCHAR\(190\) NOT NULL DEFAULT 'PLATFORM'/);
  assert.match(migration, /UNIQUE INDEX `users_login_scope_email_key`\(`login_scope`, `email`\)/);
  assert.match(migration, /UNIQUE INDEX `refresh_tokens_token_hash_key`\(`token_hash`\)/);
  assert.match(migration, /INDEX `refresh_tokens_session_id_idx`\(`session_id`\)/);
  assert.doesNotMatch(migration, /UNIQUE INDEX `refresh_tokens_session_id/);
});

test('login success creates session tokens and records audit and attempt', async () => {
  const user = await createActiveUser();
  const { audits, service, state } = createTestAuthService({ users: [user] });
  const result = await service.login({
    clinicId: user.clinic_id,
    email: 'doctor@example.com',
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1', userAgent: 'agent' },
  });

  assert.equal(result.user.id, user.id);
  assert.equal(result.user.password_hash, undefined);
  assert.equal(typeof result.accessToken, 'string');
  assert.equal(typeof result.refreshToken, 'string');
  assert.equal(state.refreshTokens.length, 1);
  assert.equal(state.loginAttempts[0].success, true);
  assert.equal(audits.some((audit) => audit.action === 'auth.login.success'), true);
});

test('login failure is generic and records failed attempt', async () => {
  const user = await createActiveUser();
  const { service, state } = createTestAuthService({ users: [user] });
  await assert.rejects(service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'WrongPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  }), (error) => error instanceof ApiError && error.statusCode === 401 && error.message === 'Invalid credentials');

  assert.equal(state.loginAttempts.length, 1);
  assert.equal(state.loginAttempts[0].success, false);
  assert.equal(state.loginAttempts[0].failure_reason, 'INVALID_CREDENTIALS');
});

test('login failure writes are committed before auth error is thrown', async () => {
  const user = await createActiveUser();
  const { repository, state } = createFakeRepository({ initialUsers: [user] });
  const service = createAuthService({
    repository,
    auditRecorder: async (input) => input,
    transaction: async (callback) => {
      const beforeAttempts = [...state.loginAttempts];
      try {
        return await callback({});
      } catch (error) {
        state.loginAttempts = beforeAttempts;
        throw error;
      }
    },
  });

  await assert.rejects(service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'WrongPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  }), (error) => error instanceof ApiError && error.statusCode === 401);

  assert.equal(state.loginAttempts.length, 1);
  assert.equal(state.loginAttempts[0].failure_reason, 'INVALID_CREDENTIALS');
});

test('disabled user is blocked', async () => {
  const user = await createActiveUser({ status: USER_STATUS.SUSPENDED });
  const { service } = createTestAuthService({ users: [user] });
  await assert.rejects(service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  }), (error) => error instanceof ApiError && error.statusCode === 403 && error.message === 'Account unavailable');
});

test('clinic user login requires clinic id while platform user can omit it', async () => {
  const clinicUser = await createActiveUser();
  const platformUser = await createActiveUser({
    id: '33333333-3333-4333-8333-333333333333',
    clinic_id: null,
    email: 'admin@example.com',
    user_type: USER_TYPE.SUPER_ADMIN,
  });
  const { service } = createTestAuthService({ users: [clinicUser, platformUser] });

  await assert.rejects(service.login({
    email: clinicUser.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  }), (error) => error instanceof ApiError && error.statusCode === 401);

  const result = await service.login({
    email: platformUser.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-2', ipAddress: '127.0.0.1' },
  });
  assert.equal(result.user.id, platformUser.id);
  assert.equal(result.user.clinicId, null);
});

test('repeated failed login attempts create lockout and block correct password', async () => {
  const user = await createActiveUser();
  const { audits, service, state } = createTestAuthService({ users: [user] });
  const context = { requestId: 'req-lockout', ipAddress: '127.0.0.9' };

  for (let index = 0; index < 5; index += 1) {
    await assert.rejects(service.login({
      clinicId: user.clinic_id,
      email: user.email,
      password: 'WrongPassword#123',
      context,
    }), (error) => error instanceof ApiError && error.statusCode === 401 && error.message === 'Invalid credentials');
  }

  assert.equal(state.accountLockouts.length, 1);
  assert.equal(state.accountLockouts[0].reason, 'TOO_MANY_FAILED_LOGINS');
  assert.equal(audits.some((audit) => audit.action === 'auth.login.lockout_created'), true);

  await assert.rejects(service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context,
  }), (error) => error instanceof ApiError && error.statusCode === 401 && error.message === 'Invalid credentials');
  assert.equal(state.loginAttempts.at(-1).failure_reason, 'ACCOUNT_LOCKED');
});

test('expired lockout no longer blocks login', async () => {
  const user = await createActiveUser();
  const { service, state } = createTestAuthService({ users: [user] });
  state.accountLockouts.push({
    id: 'lockout-a',
    clinic_id: user.clinic_id,
    user_id: user.id,
    email: user.email,
    ip_address: '127.0.0.10',
    reason: 'TOO_MANY_FAILED_LOGINS',
    locked_until: new Date(Date.now() - 1000),
    unlocked_at: null,
  });

  const result = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-expired-lockout', ipAddress: '127.0.0.10' },
  });

  assert.equal(result.user.id, user.id);
});

test('refresh rotates token and revokes the previous token', async () => {
  const user = await createActiveUser();
  const { service, state } = createTestAuthService({ users: [user] });
  const login = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  });
  const refreshed = await service.refresh({
    refreshToken: login.refreshToken,
    context: { requestId: 'req-2', ipAddress: '127.0.0.1' },
  });

  assert.equal(refreshed.session.sessionId, login.session.sessionId);
  assert.notEqual(refreshed.session.refreshTokenId, login.session.refreshTokenId);
  assert.equal(state.refreshTokens.length, 2);
  assert.equal(state.refreshTokens.find((token) => token.id === login.session.refreshTokenId).status, SESSION_STATUS.REVOKED);
  assert.equal(state.refreshTokens.find((token) => token.id === login.session.refreshTokenId).replaced_by_token_id, refreshed.session.refreshTokenId);
  assert.equal(state.refreshTokens.find((token) => token.id === refreshed.session.refreshTokenId).status, SESSION_STATUS.ACTIVE);
});

test('refresh token reuse revokes active sessions', async () => {
  const user = await createActiveUser();
  const { service, state } = createTestAuthService({ users: [user] });
  const login = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  });
  await service.refresh({
    refreshToken: login.refreshToken,
    context: { requestId: 'req-2', ipAddress: '127.0.0.1' },
  });

  await assert.rejects(service.refresh({
    refreshToken: login.refreshToken,
    context: { requestId: 'req-3', ipAddress: '127.0.0.1' },
  }), (error) => error instanceof ApiError && error.statusCode === 401);

  assert.equal(state.refreshTokens.every((token) => token.status === SESSION_STATUS.REVOKED), true);
});

test('concurrent refresh with same token creates at most one replacement', async () => {
  const user = await createActiveUser();
  const { repository, state } = createFakeRepository({ initialUsers: [user], claimDelayMs: 25 });
  const audits = [];
  const service = createAuthService({
    repository,
    auditRecorder: async (input) => {
      audits.push(input);
      return input;
    },
    transaction: async (callback) => callback({}),
  });
  const login = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  });

  const results = await Promise.allSettled([
    service.refresh({ refreshToken: login.refreshToken, context: { requestId: 'req-2', ipAddress: '127.0.0.1' } }),
    service.refresh({ refreshToken: login.refreshToken, context: { requestId: 'req-3', ipAddress: '127.0.0.1' } }),
  ]);
  const fulfilled = results.filter((result) => result.status === 'fulfilled');
  const rejected = results.filter((result) => result.status === 'rejected');
  const replacements = state.refreshTokens.filter((token) => token.id !== login.session.refreshTokenId);
  const activeReplacements = replacements.filter((token) => token.status === SESSION_STATUS.ACTIVE);

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason instanceof ApiError, true);
  assert.equal(rejected[0].reason.statusCode, 401);
  assert.equal(replacements.length, 1);
  assert.equal(activeReplacements.length, 1);
  assert.equal(state.revokeActiveCalls.length, 1);
  assert.equal(audits.some((audit) => audit.action === 'auth.refresh.reuse_detected'), true);
});

test('refresh rollback preserves old token when replacement creation fails', async () => {
  const user = await createActiveUser();
  const { repository, state } = createFakeRepository({ initialUsers: [user] });
  const originalCreateRefreshToken = repository.createRefreshToken;
  let createCalls = 0;
  repository.createRefreshToken = async (payload) => {
    createCalls += 1;
    if (createCalls > 1) throw new Error('replacement create failed');
    return originalCreateRefreshToken(payload);
  };
  const service = createAuthService({
    repository,
    auditRecorder: async (input) => input,
    transaction: async (callback) => {
      const beforeTokens = state.refreshTokens.map((token) => ({ ...token }));
      try {
        return await callback({});
      } catch (error) {
        state.refreshTokens = beforeTokens;
        throw error;
      }
    },
  });
  const login = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  });

  await assert.rejects(service.refresh({
    refreshToken: login.refreshToken,
    context: { requestId: 'req-2', ipAddress: '127.0.0.1' },
  }), /replacement create failed/);

  assert.equal(state.refreshTokens.length, 1);
  assert.equal(state.refreshTokens[0].id, login.session.refreshTokenId);
  assert.equal(state.refreshTokens[0].status, SESSION_STATUS.ACTIVE);
  assert.equal(state.refreshTokens[0].revoked_at, undefined);
});

test('logout is idempotent and revokes presented refresh token', async () => {
  const user = await createActiveUser();
  const { service, state } = createTestAuthService({ users: [user] });
  assert.deepEqual(await service.logout({ context: { requestId: 'req-0' } }), { loggedOut: true });

  const login = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  });
  await service.logout({
    refreshToken: login.refreshToken,
    context: { requestId: 'req-2', ipAddress: '127.0.0.1' },
  });

  assert.equal(state.refreshTokens[0].status, SESSION_STATUS.REVOKED);
});

test('access token middleware resolution rejects token version mismatch', async () => {
  const user = await createActiveUser();
  const { service, state } = createTestAuthService({ users: [user] });
  const login = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-1', ipAddress: '127.0.0.1' },
  });
  const resolved = await service.resolveAccessToken(login.accessToken);
  assert.equal(resolved.user.id, user.id);
  assert.equal(resolved.contextIdentity.isAuthenticated, true);
  assert.equal(resolved.contextIdentity.clinicId, user.clinic_id);

  state.users[0].token_version = 1;
  await assert.rejects(service.resolveAccessToken(login.accessToken), (error) => error instanceof ApiError && error.statusCode === 401);
});

test('access token resolution passes trusted tenant scope to repository reads', async () => {
  const user = await createActiveUser();
  const { service, state } = createTestAuthService({ users: [user] });
  const login = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-tenant-scope', ipAddress: '127.0.0.1' },
  });

  await service.resolveAccessToken(login.accessToken);

  assert.deepEqual(state.lastFindUserByIdInput, {
    userId: user.id,
    clinicId: user.clinic_id,
    isPlatform: false,
  });
  assert.equal(state.lastFindActiveRefreshTokenBySessionInput.clinicId, user.clinic_id);
  assert.equal(state.lastFindActiveRefreshTokenBySessionInput.isPlatform, false);
});

test('access token resolution rejects cross-tenant repository data', async () => {
  const user = await createActiveUser();
  const { service, state } = createTestAuthService({ users: [user] });
  const login = await service.login({
    clinicId: user.clinic_id,
    email: user.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-cross-tenant', ipAddress: '127.0.0.1' },
  });
  state.users[0].clinic_id = '99999999-9999-4999-8999-999999999999';

  await assert.rejects(service.resolveAccessToken(login.accessToken), (error) => error instanceof ApiError && error.statusCode === 401);
});

test('platform access token resolution requires platform-scoped user and session', async () => {
  const platformUser = await createActiveUser({
    id: '33333333-3333-4333-8333-333333333333',
    clinic_id: null,
    email: 'admin@example.com',
    user_type: USER_TYPE.SUPER_ADMIN,
  });
  const { service, state } = createTestAuthService({ users: [platformUser] });
  const login = await service.login({
    email: platformUser.email,
    password: 'ValidPassword#123',
    context: { requestId: 'req-platform', ipAddress: '127.0.0.1' },
  });

  await service.resolveAccessToken(login.accessToken);

  assert.deepEqual(state.lastFindUserByIdInput, {
    userId: platformUser.id,
    clinicId: null,
    isPlatform: true,
  });
  assert.equal(state.lastFindActiveRefreshTokenBySessionInput.clinicId, null);
  assert.equal(state.lastFindActiveRefreshTokenBySessionInput.isPlatform, true);
});

test('auth API login sets secure cookie attributes and returns sanitized data', async () => {
  const authService = {
    login: async () => ({
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
      user: { id: 'user-a', clinicId: 'clinic-a', email: 'doctor@example.com' },
      session: { sessionId: 'session-a', refreshTokenId: 'refresh-a', expiresAt: new Date().toISOString() },
    }),
    refresh: async () => {},
    logout: async () => {},
    resolveAccessToken: async () => {},
  };
  const app = createApp({ readinessPing: async () => true, authService });
  const { response, body } = await request(app, '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({
      clinicId: '22222222-2222-4222-8222-222222222222',
      email: 'doctor@example.com',
      password: 'ValidPassword#123',
    }),
  });
  const cookies = cookieHeader(response.headers);

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, 'Login successful');
  assert.equal(body.data.user.id, 'user-a');
  assert.equal(cookies.includes('access_token=access.jwt'), true);
  assert.equal(cookies.includes('refresh_token=refresh.jwt'), true);
  assert.equal(cookies.includes('csrf_token='), true);
  assert.equal(cookies.includes('HttpOnly'), true);
  assert.equal(cookies.includes('SameSite=Strict'), true);
  assert.equal(cookies.includes('Path=/api/v1/auth'), true);
});

test('auth API login rejects disallowed browser origin', async () => {
  const authService = {
    login: async () => {
      throw new Error('login should not be called');
    },
    refresh: async () => {},
    logout: async () => {},
    resolveAccessToken: async () => {},
  };
  const app = createApp({ readinessPing: async () => true, authService });
  const { response, body } = await request(app, '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://evil.example' },
    body: JSON.stringify({
      clinicId: '22222222-2222-4222-8222-222222222222',
      email: 'doctor@example.com',
      password: 'ValidPassword#123',
    }),
  });

  assert.equal(response.status, 403);
  assert.equal(body.success, false);
});

test('auth API refresh requires matching CSRF cookie and header', async () => {
  let refreshCalls = 0;
  const authService = {
    login: async () => {},
    refresh: async () => {
      refreshCalls += 1;
      return {
        accessToken: 'new-access.jwt',
        refreshToken: 'new-refresh.jwt',
        user: { id: 'user-a', clinicId: 'clinic-a', email: 'doctor@example.com' },
        session: { sessionId: 'session-a', refreshTokenId: 'refresh-b', expiresAt: new Date().toISOString() },
      };
    },
    logout: async () => {},
    resolveAccessToken: async () => {},
  };
  const app = createApp({ readinessPing: async () => true, authService });
  const denied = await request(app, '/api/v1/auth/refresh', {
    method: 'POST',
    headers: { cookie: 'refresh_token=refresh.jwt; csrf_token=csrf-a' },
  });
  const allowed = await request(app, '/api/v1/auth/refresh', {
    method: 'POST',
    headers: { cookie: 'refresh_token=refresh.jwt; csrf_token=csrf-a', 'x-csrf-token': 'csrf-a' },
  });

  assert.equal(denied.response.status, 403);
  assert.equal(allowed.response.status, 200);
  assert.equal(refreshCalls, 1);
  assert.equal(cookieHeader(allowed.response.headers).includes('csrf_token='), true);
});

test('auth API me resolves authenticated request context', async () => {
  const authService = {
    login: async () => {},
    refresh: async () => {},
    logout: async () => {},
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
      user: { id: 'user-a', clinicId: 'clinic-a', email: 'doctor@example.com' },
      session: { sessionId: 'session-a', refreshTokenId: 'refresh-a' },
    }),
  };
  const app = createApp({ readinessPing: async () => true, authService });
  const { response, body } = await request(app, '/api/v1/auth/me', {
    headers: { cookie: 'access_token=access.jwt' },
  });

  assert.equal(response.status, 200);
  assert.equal(body.message, 'Current user');
  assert.equal(body.data.user.id, 'user-a');
  assert.deepEqual(body.data.roles, []);
  assert.deepEqual(body.data.permissions, []);
});

test('auth API logout clears auth cookies', async () => {
  const authService = {
    login: async () => {},
    refresh: async () => {},
    logout: async () => ({ loggedOut: true }),
    resolveAccessToken: async () => {},
  };
  const app = createApp({ readinessPing: async () => true, authService });
  const { response, body } = await request(app, '/api/v1/auth/logout', {
    method: 'POST',
    headers: { cookie: 'refresh_token=refresh.jwt; csrf_token=csrf-a', 'x-csrf-token': 'csrf-a' },
  });
  const cookies = cookieHeader(response.headers);

  assert.equal(response.status, 200);
  assert.equal(body.message, 'Logged out');
  assert.equal(cookies.includes('access_token='), true);
  assert.equal(cookies.includes('refresh_token='), true);
  assert.equal(cookies.includes('csrf_token='), true);
  assert.equal(cookies.toLowerCase().includes('expires=thu, 01 jan 1970'), true);
});

test('auth API logout rejects missing CSRF token', async () => {
  const authService = {
    login: async () => {},
    refresh: async () => {},
    logout: async () => {
      throw new Error('logout should not be called');
    },
    resolveAccessToken: async () => {},
  };
  const app = createApp({ readinessPing: async () => true, authService });
  const { response, body } = await request(app, '/api/v1/auth/logout', {
    method: 'POST',
    headers: { cookie: 'refresh_token=refresh.jwt; csrf_token=csrf-a' },
  });

  assert.equal(response.status, 403);
  assert.equal(body.success, false);
});

test('auth API login has an auth-specific rate limit', async () => {
  const authService = {
    login: async () => ({
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
      user: { id: 'user-a', clinicId: 'clinic-a', email: 'doctor@example.com' },
      session: { sessionId: 'session-a', refreshTokenId: 'refresh-a', expiresAt: new Date().toISOString() },
    }),
    refresh: async () => {},
    logout: async () => {},
    resolveAccessToken: async () => {},
  };
  const app = createApp({
    readinessPing: async () => true,
    authService,
    authLoginRateLimitOptions: { max: 1, windowMs: 60000 },
  });
  const requestOptions = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      clinicId: '22222222-2222-4222-8222-222222222222',
      email: 'doctor@example.com',
      password: 'ValidPassword#123',
    }),
  };

  const first = await request(app, '/api/v1/auth/login', requestOptions);
  const second = await request(app, '/api/v1/auth/login', requestOptions);

  assert.equal(first.response.status, 200);
  assert.equal(second.response.status, 429);
});

test('auth API validation does not echo password', async () => {
  const app = createApp({ readinessPing: async () => true });
  const { response, body } = await request(app, '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'bad', password: 'secret-password-value' }),
  });

  assert.equal(response.status, 400);
  assert.equal(JSON.stringify(body).includes('secret-password-value'), false);
});
