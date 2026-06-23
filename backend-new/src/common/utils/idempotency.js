/**
 * Idempotency Utilities
 * Builds deterministic keys and hashes for retry-safe writes.
 */

const crypto = require('node:crypto');

// Converts client-provided idempotency keys into a stable bounded value.
const normalizeIdempotencyKey = (value) => {
  const normalized = String(value || '').trim();
  return normalized.length ? normalized.slice(0, 190) : null;
};

// Stringifies objects in stable key order for payload hashing.
const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

// Creates a SHA-256 hash of a request payload.
const payloadHash = (payload) => crypto.createHash('sha256').update(stableStringify(payload)).digest('hex');

// Builds a nullable active uniqueness key for MySQL partial-unique emulation.
const activeKey = (...parts) => parts.map((part) => String(part || 'none')).join(':').slice(0, 255);

module.exports = {
  activeKey,
  normalizeIdempotencyKey,
  payloadHash,
  stableStringify,
};
