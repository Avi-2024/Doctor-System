/**
 * Audit Service
 * Records immutable critical-write events.
 */

const { createId } = require('../../common/utils/ids');
const repository = require('./audit.repository');

const sensitiveFields = new Set([
  'password',
  'password_hash',
  'refresh_token_hash',
  'token',
  'token_hash',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
]);

// Redact credential material recursively.
const redact = (value) => {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, sensitiveFields.has(key) ? '[REDACTED]' : redact(nested)]));
};

// Record audit event.
const recordAudit = async ({ req, action, moduleName, entityType, entityId, clinicId, before, after, metadata }, connection) => {
  await repository.create({
    id: createId(),
    clinicId: clinicId || req.tenant?.clinicId || req.auth?.clinicId || null,
    actorUserId: req.auth?.userId || null,
    action,
    moduleName,
    entityType,
    entityId: entityId || null,
    requestId: req.requestId,
    beforeData: before ? redact(before) : null,
    afterData: after ? redact(after) : null,
    metadata: metadata ? redact(metadata) : null,
  }, connection);
};

module.exports = { recordAudit, redact };
