/**
 * Redaction Utilities
 * Removes secrets before logging or auditing.
 */

const sensitiveKeys = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'tokenhash',
  'secret',
  'clientsecret',
  'apikey',
  'authorization',
  'cookie',
  'setcookie',
  'session',
  'sessionid',
  'credential',
  'privatekey',
]);

const normalizeKey = (key) => String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const isSensitiveKey = (key) => {
  const normalized = normalizeKey(key);
  if (sensitiveKeys.has(normalized)) return true;
  return ['password', 'token', 'secret', 'apikey', 'authorization', 'cookie', 'credential', 'privatekey']
    .some((pattern) => normalized.includes(pattern));
};

const redactValue = (value, seen = new WeakSet()) => {
  if (typeof value === 'bigint') return value.toString();
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((entry) => redactValue(entry, seen));
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    if (isSensitiveKey(key)) return [key, '[REDACTED]'];
    return [key, redactValue(entry, seen)];
  }));
};

module.exports = { redactValue, sensitiveKeys, isSensitiveKey, normalizeKey };
