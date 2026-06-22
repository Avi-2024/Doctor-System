process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/doctor_system_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-characters-ok';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32-characters';
process.env.AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE || 'false';

const assert = require('node:assert/strict');
const express = require('express');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { body } = require('express-validator');
const { createApp } = require('../src/app');
const { buildEnv } = require('../src/config/env');
const { ApiError } = require('../src/common/errors/ApiError');
const { requestId } = require('../src/common/middleware/requestId');
const { requestContext } = require('../src/common/middleware/requestContext');
const { withIdentity } = require('../src/common/context/requestContext');
const { setTenantContext, requireTenantContext, assertSameClinic } = require('../src/common/middleware/tenantContext');
const {
  hasPermission,
  hasPermissionScope,
  hasRole,
  requirePermission,
  requirePermissionScope,
  requireRole,
} = require('../src/common/middleware/rbac');
const { validate } = require('../src/common/middleware/validate');
const { errorHandler } = require('../src/common/middleware/errorHandler');
const { runInTransaction } = require('../src/common/repositories/unitOfWork.repository');
const { createBaseRepository, requireClinicContext, requirePlatformContext } = require('../src/common/repositories/BaseRepository');
const { redactValue } = require('../src/common/utils/redact');
const logger = require('../src/common/utils/logger');
const { computeAuditHash, createAuditPayload, recordAudit } = require('../src/modules/audit/audit.service');

const request = async (app, path, options = {}) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
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

test('health returns standard success envelope', async () => {
  const app = createApp({ readinessPing: async () => true });
  const { response, body } = await request(app, '/health');
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, 'Service healthy');
  assert.equal(body.data.service, 'doctor-system-backend-new');
  assert.equal(typeof body.data.requestId, 'string');
  assert.deepEqual(body.meta, {});
});

test('readiness returns success when database ping passes', async () => {
  const app = createApp({ readinessPing: async () => true });
  const { response, body } = await request(app, '/health/ready');
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.database, 'mysql');
});

test('readiness returns normalized failure when database ping fails', async () => {
  const app = createApp({ readinessPing: async () => { throw new Error('offline'); } });
  const { response, body } = await request(app, '/health/ready');
  assert.equal(response.status, 503);
  assert.equal(body.success, false);
  assert.equal(body.message, 'Service dependencies unavailable');
  assert.equal(body.data.database, 'disconnected');
  assert.equal(typeof body.requestId, 'string');
});

test('health routes are exempt from rate limiting while API routes remain limited', async () => {
  const app = createApp({ readinessPing: async () => true, rateLimitOptions: { max: 1, windowMs: 60000 } });
  const firstHealth = await request(app, '/health');
  const secondHealth = await request(app, '/health');
  const firstMeta = await request(app, '/api/v1/meta');
  const secondMeta = await request(app, '/api/v1/meta');

  assert.equal(firstHealth.response.status, 200);
  assert.equal(secondHealth.response.status, 200);
  assert.equal(firstMeta.response.status, 200);
  assert.equal(secondMeta.response.status, 429);
});

test('environment validation rejects unsafe runtime configuration', () => {
  const validEnv = {
    APP_NAME: 'doctor-system-backend-new',
    NODE_ENV: 'test',
    PORT: '8080',
    TRUST_PROXY: '0',
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    JSON_BODY_LIMIT: '1mb',
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX: '300',
    AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: '900000',
    AUTH_LOGIN_RATE_LIMIT_MAX: '10',
    AUTH_REFRESH_RATE_LIMIT_WINDOW_MS: '900000',
    AUTH_REFRESH_RATE_LIMIT_MAX: '60',
    AUTH_LOCKOUT_MAX_FAILURES: '5',
    AUTH_LOCKOUT_WINDOW_MS: '900000',
    AUTH_LOCKOUT_DURATION_MS: '900000',
    JWT_ACCESS_SECRET: 'test-access-secret-32-characters-ok',
    JWT_REFRESH_SECRET: 'test-refresh-secret-32-characters',
    ACCESS_TOKEN_TTL_SECONDS: '900',
    REFRESH_TOKEN_TTL_SECONDS: '2592000',
    AUTH_COOKIE_SECURE: 'false',
    ENABLE_POST_SPRINT_1_ROUTES: 'false',
    DATABASE_URL: 'mysql://user:password@localhost:3306/doctor_system_test',
    SENTRY_DSN: '',
  };

  assert.equal(buildEnv(validEnv).PORT, 8080);
  assert.equal(buildEnv({ ...validEnv, NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'true' }).AUTH_COOKIE_SECURE, true);
  assert.throws(() => buildEnv({ ...validEnv, PORT: '0' }), /PORT/);
  assert.throws(() => buildEnv({ ...validEnv, RATE_LIMIT_MAX: '-1' }), /RATE_LIMIT_MAX/);
  assert.throws(() => buildEnv({ ...validEnv, AUTH_LOGIN_RATE_LIMIT_MAX: '0' }), /AUTH_LOGIN_RATE_LIMIT_MAX/);
  assert.throws(() => buildEnv({ ...validEnv, AUTH_LOCKOUT_MAX_FAILURES: '0' }), /AUTH_LOCKOUT_MAX_FAILURES/);
  assert.throws(() => buildEnv({ ...validEnv, TRUST_PROXY: '-1' }), /TRUST_PROXY/);
  assert.throws(() => buildEnv({ ...validEnv, CORS_ALLOWED_ORIGINS: 'not-a-url' }), /CORS_ALLOWED_ORIGINS/);
  assert.throws(() => buildEnv({ ...validEnv, CORS_ALLOWED_ORIGINS: '*' }), /Wildcard CORS/);
  assert.throws(() => buildEnv({ ...validEnv, DATABASE_URL: '' }), /DATABASE_URL/);
  assert.throws(() => buildEnv({ ...validEnv, NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'false' }), /AUTH_COOKIE_SECURE/);
});

test('request id is generated and returned in headers', async () => {
  const app = createApp({ readinessPing: async () => true });
  const { response } = await request(app, '/health');
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
});

test('valid incoming request id is preserved', async () => {
  const app = createApp({ readinessPing: async () => true });
  const { response, body } = await request(app, '/health', { headers: { 'x-request-id': 'request-12345678' } });
  assert.equal(response.headers.get('x-request-id'), 'request-12345678');
  assert.equal(body.data.requestId, 'request-12345678');
});

test('request context is attached to meta route', async () => {
  const app = createApp({ readinessPing: async () => true });
  const { response, body } = await request(app, '/api/v1/meta', { headers: { 'x-request-id': 'request-abcdefgh' } });
  assert.equal(response.status, 200);
  assert.equal(body.data.requestId, 'request-abcdefgh');
});

test('post-Sprint 1 routes are not mounted by default', async () => {
  const app = createApp({ readinessPing: async () => true });
  const rbac = await request(app, '/api/v1/rbac/permissions');
  const users = await request(app, '/api/v1/users/me');

  assert.equal(rbac.response.status, 404);
  assert.equal(users.response.status, 404);
});

test('validation middleware returns normalized 400 response', async () => {
  const app = express();
  app.use(requestId);
  app.use(express.json());
  app.post('/test/validate', body('email').isEmail(), validate, (req, res) => res.json({ success: true }));
  app.use(errorHandler);
  const { response, body: payload } = await request(app, '/test/validate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'bad' }),
  });
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, 'Validation failed');
  assert.equal(Array.isArray(payload.errors), true);
});

test('validation middleware omits rejected secret values', async () => {
  const app = express();
  app.use(requestId);
  app.use(express.json());
  app.post('/test/validate-secret', body('password').isLength({ min: 12 }), validate, (req, res) => res.json({ success: true }));
  app.use(errorHandler);
  const { response, body: payload } = await request(app, '/test/validate-secret', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'short' }),
  });
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.deepEqual(Object.keys(payload.errors[0]).sort(), ['field', 'location', 'message']);
  assert.equal(payload.errors[0].field, 'password');
  assert.equal(JSON.stringify(payload).includes('short'), false);
});

test('ApiError returns status and message', async () => {
  const app = express();
  app.use(requestId);
  app.get('/test/api-error', () => { throw new ApiError(409, 'Conflict'); });
  app.use(errorHandler);
  const { response, body } = await request(app, '/test/api-error');
  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(body.message, 'Conflict');
});

test('error handler clamps invalid statuses and sanitizes generic 4xx messages', async () => {
  const app = express();
  app.use(requestId);
  app.get('/test/generic-4xx', () => {
    const error = new Error('sensitive client detail');
    error.statusCode = 400;
    error.details = [{ secret: 'hidden' }];
    throw error;
  });
  app.get('/test/invalid-status', () => {
    const error = new Error('invalid status detail');
    error.statusCode = 700;
    error.details = [{ secret: 'hidden' }];
    throw error;
  });
  app.get('/test/exposed-api-error', () => {
    throw new ApiError(503, 'Planned maintenance', null, { expose: true });
  });
  app.get('/test/non-exposed-api-error', () => {
    throw new ApiError(400, 'Sensitive business detail', [{ secret: 'hidden' }], { expose: false });
  });
  app.use(errorHandler);

  const generic = await request(app, '/test/generic-4xx');
  assert.equal(generic.response.status, 400);
  assert.equal(generic.body.message, 'Request failed');
  assert.equal(JSON.stringify(generic.body).includes('sensitive client detail'), false);
  assert.equal(JSON.stringify(generic.body).includes('hidden'), false);

  const invalid = await request(app, '/test/invalid-status');
  assert.equal(invalid.response.status, 500);
  assert.equal(invalid.body.message, 'Internal server error');
  assert.equal(JSON.stringify(invalid.body).includes('hidden'), false);

  const exposed = await request(app, '/test/exposed-api-error');
  assert.equal(exposed.response.status, 503);
  assert.equal(exposed.body.message, 'Planned maintenance');

  const nonExposed = await request(app, '/test/non-exposed-api-error');
  assert.equal(nonExposed.response.status, 400);
  assert.equal(nonExposed.body.message, 'Request failed');
  assert.equal(JSON.stringify(nonExposed.body).includes('Sensitive business detail'), false);
  assert.equal(JSON.stringify(nonExposed.body).includes('hidden'), false);
});

test('unhandled errors are sanitized in production mode', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const app = express();
  app.use(requestId);
  app.get('/test/unhandled', () => { throw new Error('sensitive stack detail'); });
  app.use(errorHandler);
  const { response, body } = await request(app, '/test/unhandled');
  process.env.NODE_ENV = previous;
  assert.equal(response.status, 500);
  assert.equal(body.success, false);
  assert.equal(body.message, 'Internal server error');
  assert.equal(JSON.stringify(body).includes('sensitive stack detail'), false);
});

test('transaction helper delegates commit path', async (t) => {
  const prismaModule = require('../src/database/prisma');
  const original = prismaModule.transaction;
  prismaModule.transaction = async (callback) => callback({ committed: true });
  t.after(() => { prismaModule.transaction = original; });
  const result = await runInTransaction(async (tx) => tx.committed);
  assert.equal(result, true);
});

test('transaction helper propagates rollback path', async (t) => {
  const prismaModule = require('../src/database/prisma');
  const original = prismaModule.transaction;
  prismaModule.transaction = async (callback) => callback({});
  t.after(() => { prismaModule.transaction = original; });
  await assert.rejects(runInTransaction(async () => { throw new Error('rollback'); }), /rollback/);
});

test('base repository derives tenant scope from request context', async () => {
  let findArgs;
  let createArgs;
  const connection = {
    audit_logs: {
      findFirst: async (args) => {
        findArgs = args;
        return null;
      },
      create: async (args) => {
        createArgs = args;
        return args.data;
      },
    },
  };
  const repository = createBaseRepository({ modelName: 'audit_logs', tenantOwned: true });
  await assert.rejects(repository.findById('record-id', {}, connection), /Clinic context required/);
  assert.throws(() => requireClinicContext(null), /Clinic context required/);

  await repository.findById('record-id', { clinicId: 'clinic-a' }, connection);
  assert.deepEqual(findArgs.where, { id: 'record-id', clinic_id: 'clinic-a' });

  const created = await repository.create({ clinic_id: 'clinic-b', action: 'created' }, { clinicId: 'clinic-a' }, connection);
  assert.equal(created.clinic_id, 'clinic-a');
  assert.equal(createArgs.data.clinic_id, 'clinic-a');
});

test('base repository requires platform context for global operations', async () => {
  let findArgs;
  const connection = {
    schema_migrations: {
      findFirst: async (args) => {
        findArgs = args;
        return null;
      },
    },
  };
  const repository = createBaseRepository({ modelName: 'schema_migrations', tenantOwned: false });
  await assert.rejects(repository.findById('migration-a', { clinicId: 'clinic-a' }, connection), /Platform context required/);
  assert.throws(() => requirePlatformContext({ clinicId: 'clinic-a' }), /Platform context required/);

  await repository.findById('migration-a', { isPlatform: true }, connection);
  assert.deepEqual(findArgs.where, { id: 'migration-a' });
});

test('base repository soft delete behavior is explicit', async () => {
  let findArgs;
  let deleteArgs;
  const connection = {
    audit_logs: {
      findFirst: async (args) => {
        findArgs = args;
        return null;
      },
    },
    patients: {
      updateMany: async (args) => {
        deleteArgs = args;
        return { count: 1 };
      },
    },
  };
  const hardRepository = createBaseRepository({ modelName: 'audit_logs', tenantOwned: true });
  await hardRepository.findById('audit-a', { clinicId: 'clinic-a' }, connection);
  assert.deepEqual(findArgs.where, { id: 'audit-a', clinic_id: 'clinic-a' });
  await assert.rejects(hardRepository.softDelete('audit-a', { clinicId: 'clinic-a' }, 'user-a', connection), /Soft delete is not enabled/);

  const softRepository = createBaseRepository({ modelName: 'patients', tenantOwned: true, softDelete: true });
  await softRepository.softDelete('patient-a', { clinicId: 'clinic-a' }, 'user-a', connection);
  assert.equal(deleteArgs.where.id, 'patient-a');
  assert.equal(deleteArgs.where.clinic_id, 'clinic-a');
  assert.equal(deleteArgs.where.is_deleted, false);
  assert.equal(deleteArgs.data.is_deleted, true);
  assert.equal(deleteArgs.data.deleted_by, 'user-a');
});

test('tenant context helpers enforce clinic ownership', () => {
  const req = { context: { requestId: 'req', roles: [], permissions: [] } };
  assert.throws(() => requireTenantContext(req.context), /Clinic context required/);
  const tenant = setTenantContext(req, { clinicId: 'clinic-a', branchId: 'branch-a' });
  assert.equal(tenant.clinicId, 'clinic-a');
  assert.equal(req.context.branchId, 'branch-a');
  assert.deepEqual(assertSameClinic({ clinic_id: 'clinic-a' }, 'clinic-a'), { clinic_id: 'clinic-a' });
  assert.throws(() => assertSameClinic({ clinic_id: 'clinic-b' }, 'clinic-a'), /Tenant ownership mismatch/);
});

test('request context middleware creates base context', () => {
  const req = { requestId: 'req-1', headers: { 'user-agent': 'agent' }, ip: '127.0.0.1' };
  requestContext(req, {}, () => {});
  assert.equal(req.context.requestId, 'req-1');
  assert.equal(req.context.userAgent, 'agent');
  assert.equal(req.context.isAuthenticated, false);
});

test('request context identity merge can clear stale identity values', () => {
  const originalContext = Object.freeze({
    requestId: 'req-1',
    userId: 'user-a',
    clinicId: 'clinic-a',
    branchId: 'branch-a',
    roles: ['doctor'],
    permissions: ['patients:read'],
    scopedPermissions: { 'patients:read': 'CLINIC' },
    isAuthenticated: true,
    isPlatform: true,
  });
  const context = withIdentity(originalContext, {
    userId: null,
    clinicId: null,
    branchId: null,
    roles: [],
    permissions: [],
    scopedPermissions: {},
    isAuthenticated: false,
    isPlatform: false,
  });

  assert.equal(context.userId, null);
  assert.equal(context.clinicId, null);
  assert.equal(context.branchId, null);
  assert.deepEqual(context.roles, []);
  assert.deepEqual(context.permissions, []);
  assert.deepEqual(context.scopedPermissions, {});
  assert.equal(context.isAuthenticated, false);
  assert.equal(context.isPlatform, false);
});

test('tenant context setter clears stale clinic and branch values', () => {
  const req = {
    context: withIdentity({
      requestId: 'req-1',
      roles: ['doctor'],
      permissions: ['patients:read'],
    }, {
      userId: 'user-a',
      clinicId: 'clinic-a',
      branchId: 'branch-a',
      isAuthenticated: true,
      isPlatform: false,
    }),
  };

  const tenant = setTenantContext(req, {});
  assert.equal(tenant.clinicId, null);
  assert.equal(tenant.branchId, null);
  assert.equal(req.context.clinicId, null);
  assert.equal(req.context.branchId, null);
  assert.equal(req.context.userId, 'user-a');
  assert.deepEqual(req.context.roles, ['doctor']);
});

test('rbac helpers evaluate roles permissions and platform bypass', () => {
  const context = {
    roles: ['doctor', 'clinic_admin'],
    permissions: ['patients:read', 'appointments:write'],
    scopedPermissions: {
      'patients:read': 'OWN',
      'appointments:write': 'CLINIC',
    },
    isPlatform: false,
  };
  assert.equal(hasRole(context, 'doctor'), true);
  assert.equal(hasRole(context, ['doctor', 'billing_admin'], { match: 'all' }), false);
  assert.equal(hasPermission(context, 'patients:read'), true);
  assert.equal(hasPermission(context, ['patients:read', 'appointments:write'], { match: 'all' }), true);
  assert.equal(hasPermissionScope(context, 'patients:read', 'OWN'), true);
  assert.equal(hasPermissionScope(context, 'patients:read', 'CLINIC'), false);
  assert.equal(hasPermissionScope(context, 'appointments:write', 'BRANCH'), true);
  assert.equal(hasPermission({ roles: [], permissions: [], isPlatform: true }, 'system:anything'), true);
  assert.equal(hasPermission({ roles: [], permissions: [], isPlatform: true }, 'system:anything', { allowPlatform: false }), false);
  assert.equal(hasPermissionScope({ roles: [], permissions: [], isPlatform: true }, 'system:anything', 'ALL'), true);
});

test('rbac middleware grants expected access and rejects missing permissions', async () => {
  const app = express();
  app.use(requestId);
  app.use((req, res, next) => {
    req.context = {
      roles: ['doctor'],
      permissions: ['patients:read'],
      scopedPermissions: { 'patients:read': 'OWN' },
      isPlatform: false,
    };
    next();
  });
  app.get('/test/role', requireRole('doctor'), (req, res) => res.json({ success: true }));
  app.get('/test/permission', requirePermission('patients:write'), (req, res) => res.json({ success: true }));
  app.get('/test/scope', requirePermissionScope('patients:read', 'CLINIC'), (req, res) => res.json({ success: true }));
  app.use(errorHandler);

  const role = await request(app, '/test/role');
  assert.equal(role.response.status, 200);
  assert.equal(role.body.success, true);

  const permission = await request(app, '/test/permission');
  assert.equal(permission.response.status, 403);
  assert.equal(permission.body.message, 'Required permission missing');

  const scope = await request(app, '/test/scope');
  assert.equal(scope.response.status, 403);
  assert.equal(scope.body.message, 'Required permission scope missing');
});

test('rbac middleware allows platform context by default', async () => {
  const app = express();
  app.use(requestId);
  app.use((req, res, next) => {
    req.context = { roles: [], permissions: [], isPlatform: true };
    next();
  });
  app.get('/test/platform', requirePermission('system:admin'), (req, res) => res.json({ success: true }));
  app.use(errorHandler);

  const response = await request(app, '/test/platform');
  assert.equal(response.response.status, 200);
  assert.equal(response.body.success, true);
});

test('audit payload redacts secrets and keeps request metadata', () => {
  const payload = createAuditPayload({
    context: { requestId: 'req-1', clinicId: 'clinic-a', userId: 'user-a', ipAddress: '127.0.0.1', userAgent: 'agent' },
    action: 'created',
    moduleName: 'foundation',
    resourceType: 'test_resource',
    resourceId: 'resource-a',
    afterData: {
      name: 'Visible',
      Password: 'secret',
      Authorization: 'Bearer hidden',
      nested: { api_key: 'hidden', safe: 'kept' },
    },
  });
  assert.equal(payload.clinic_id, 'clinic-a');
  assert.equal(payload.request_id, 'req-1');
  assert.equal(payload.after_data.Password, '[REDACTED]');
  assert.equal(payload.after_data.Authorization, '[REDACTED]');
  assert.equal(payload.after_data.nested.api_key, '[REDACTED]');
  assert.equal(payload.after_data.nested.safe, 'kept');
  assert.match(payload.hash, /^[0-9a-f]{64}$/);
});

test('redaction handles credential key variants without redacting safe fields', () => {
  const payload = redactValue({
    name: 'Visible',
    refresh_token: 'hidden',
    clientSecret: 'hidden',
    headers: { Cookie: 'session=hidden' },
    nested: [{ tokenHash: 'hidden', label: 'safe' }],
  });
  assert.equal(payload.name, 'Visible');
  assert.equal(payload.refresh_token, '[REDACTED]');
  assert.equal(payload.clientSecret, '[REDACTED]');
  assert.equal(payload.headers.Cookie, '[REDACTED]');
  assert.equal(payload.nested[0].tokenHash, '[REDACTED]');
  assert.equal(payload.nested[0].label, 'safe');
});

test('logger redacts sensitive metadata fields', (t) => {
  const originalWrite = process.stdout.write;
  let output = '';
  process.stdout.write = (chunk) => {
    output += chunk;
    return true;
  };
  t.after(() => {
    process.stdout.write = originalWrite;
  });

  logger.info('redaction test', { Authorization: 'Bearer hidden', nested: { api_key: 'hidden' }, visible: 'kept' });
  const line = JSON.parse(output);
  assert.equal(line.Authorization, '[REDACTED]');
  assert.equal(line.nested.api_key, '[REDACTED]');
  assert.equal(line.visible, 'kept');
});

test('logger safely serializes circular metadata', (t) => {
  const originalWrite = process.stdout.write;
  let output = '';
  process.stdout.write = (chunk) => {
    output += chunk;
    return true;
  };
  t.after(() => {
    process.stdout.write = originalWrite;
  });

  const metadata = { visible: 'kept', count: 1n, Authorization: 'Bearer hidden' };
  metadata.self = metadata;
  logger.info('circular metadata test', metadata);
  const line = JSON.parse(output);
  assert.equal(line.visible, 'kept');
  assert.equal(line.count, '1');
  assert.equal(line.Authorization, '[REDACTED]');
  assert.equal(line.self, '[Circular]');
});

test('audit payload chains hash to previous audit hash', () => {
  const payload = createAuditPayload({
    context: { requestId: 'req-1', clinicId: 'clinic-a' },
    action: 'updated',
    moduleName: 'foundation',
    resourceType: 'test_resource',
    resourceId: 'resource-a',
    afterData: { name: 'Visible' },
    previousHash: 'previous-hash',
  });
  assert.equal(payload.previous_hash, 'previous-hash');
  assert.equal(payload.hash, computeAuditHash(payload, 'previous-hash'));
  assert.notEqual(payload.hash, computeAuditHash({ ...payload, after_data: { name: 'Changed' } }, 'previous-hash'));
});

test('recordAudit persists chained audit hash with provided transaction connection', async () => {
  let created;
  let chainHash = 'previous-hash';
  const connection = {
    audit_chain_state: {
      upsert: async () => ({ chain_scope: 'global', latest_hash: chainHash }),
      findUnique: async () => ({ latest_hash: chainHash }),
      update: async ({ data }) => {
        chainHash = data.latest_hash;
        return { chain_scope: 'global', latest_hash: chainHash };
      },
    },
    audit_logs: {
      create: async ({ data }) => {
        created = data;
        return data;
      },
    },
  };
  const result = await recordAudit({
    context: { requestId: 'req-1', clinicId: 'clinic-a' },
    action: 'created',
    moduleName: 'foundation',
    resourceType: 'test_resource',
    resourceId: 'resource-a',
    afterData: { name: 'Visible' },
  }, connection);

  assert.equal(result.previous_hash, 'previous-hash');
  assert.equal(created.hash, computeAuditHash(created, 'previous-hash'));
  assert.equal(chainHash, result.hash);
});

test('recordAudit does not advance audit chain when audit write fails', async () => {
  let chainHash = 'previous-hash';
  const connection = {
    audit_chain_state: {
      upsert: async () => ({ chain_scope: 'global', latest_hash: chainHash }),
      findUnique: async () => ({ latest_hash: chainHash }),
      update: async ({ data }) => {
        chainHash = data.latest_hash;
        return { chain_scope: 'global', latest_hash: chainHash };
      },
    },
    audit_logs: {
      create: async () => {
        throw new Error('write failed');
      },
    },
  };

  await assert.rejects(recordAudit({
    context: { requestId: 'req-1', clinicId: 'clinic-a' },
    action: 'created',
    moduleName: 'foundation',
    resourceType: 'test_resource',
    resourceId: 'resource-a',
    afterData: { name: 'Visible' },
  }, connection), /write failed/);

  assert.equal(chainHash, 'previous-hash');
});

test('prisma schema includes medium-priority indexes and job relations', () => {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');
  assert.match(schema, /model audit_chain_state/);
  assert.match(schema, /chain_scope String\s+@id/);
  assert.match(schema, /@@index\(\[clinic_id, created_at\]\)/);
  assert.match(schema, /@@index\(\[clinic_id, status, run_at\]\)/);
  assert.match(schema, /attempts_log\s+job_attempts\[\]/);
  assert.match(schema, /dead_letters\s+dead_letter_jobs\[\]/);
  assert.match(schema, /job\s+jobs\s+@relation\(fields: \[job_id\], references: \[id\], onDelete: Cascade/);
  assert.match(schema, /job\s+jobs\s+@relation\(fields: \[job_id\], references: \[id\], onDelete: Restrict/);
});

test('background jobs docs state outbox no-foreign-key policy', () => {
  const docs = fs.readFileSync(path.join(__dirname, '..', 'docs', 'BACKGROUND_JOBS_ARCHITECTURE.md'), 'utf8');
  assert.match(docs, /intentionally do not enforce foreign keys to `outbox_events`/);
});
