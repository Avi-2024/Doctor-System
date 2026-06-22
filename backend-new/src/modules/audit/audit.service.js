/**
 * Audit Service
 * Builds safe immutable audit records for critical actions.
 */

const crypto = require('node:crypto');
const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { redactValue } = require('../../common/utils/redact');
const repository = require('./audit.repository');

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const computeAuditHash = (payload, previousHash = null) => {
  const { hash, previous_hash: ignoredPreviousHash, ...auditedPayload } = payload;
  const canonicalPayload = {
    ...auditedPayload,
    previous_hash: previousHash || null,
  };
  return crypto.createHash('sha256').update(stableStringify(canonicalPayload)).digest('hex');
};

const createAuditPayload = ({
  context = {},
  action,
  moduleName,
  resourceType,
  resourceId = null,
  severity = AUDIT_SEVERITY.INFO,
  beforeData = null,
  afterData = null,
  metadata = null,
  previousHash = null,
}) => {
  const payload = {
    id: crypto.randomUUID(),
    clinic_id: context.clinicId || null,
    actor_user_id: context.userId || null,
    action,
    module_name: moduleName,
    resource_type: resourceType,
    resource_id: resourceId,
    severity,
    request_id: context.requestId || null,
    correlation_id: context.correlationId || null,
    ip_address: context.ipAddress || null,
    user_agent: context.userAgent || null,
    before_data: beforeData ? redactValue(beforeData) : null,
    after_data: afterData ? redactValue(afterData) : null,
    metadata: metadata ? redactValue(metadata) : null,
    previous_hash: previousHash || null,
  };
  return {
    ...payload,
    hash: computeAuditHash(payload, previousHash),
  };
};

const writeAudit = async (input, connection) => {
  const previousHash = await repository.lockAuditChainState(connection);
  const payload = createAuditPayload({ ...input, previousHash });
  const auditLog = await repository.createAuditLog(payload, connection);
  await repository.updateAuditChainState(payload.hash, connection);
  return auditLog;
};

const recordAudit = async (input, connection) => {
  if (connection) return writeAudit(input, connection);
  return runInTransaction((tx) => writeAudit(input, tx));
};

module.exports = { computeAuditHash, createAuditPayload, recordAudit, stableStringify };
