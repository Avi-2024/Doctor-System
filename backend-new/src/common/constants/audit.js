/**
 * Audit Constants
 */

const AUDIT_SEVERITY = Object.freeze({
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
});

const AUDIT_ACTION = Object.freeze({
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  VIEWED: 'viewed',
  EXPORTED: 'exported',
  FAILED: 'failed',
});

module.exports = { AUDIT_SEVERITY, AUDIT_ACTION };
