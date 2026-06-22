/**
 * Structured Logger
 * Writes machine-readable runtime events.
 */

const { redactValue } = require('./redact');

const safeStringify = (payload) => JSON.stringify(payload, (key, value) => {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Error) return { name: value.name, message: value.message };
  return value;
});

const write = (level, message, metadata = {}) => {
  const line = safeStringify({ timestamp: new Date().toISOString(), level, message, ...redactValue(metadata) });
  (level === 'error' ? process.stderr : process.stdout).write(`${line}\n`);
};

module.exports = {
  info: (message, metadata) => write('info', message, metadata),
  error: (message, metadata) => write('error', message, metadata),
  safeStringify,
};
