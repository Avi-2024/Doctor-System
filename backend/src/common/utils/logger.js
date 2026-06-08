/**
 * Structured Logger
 * Writes machine-readable runtime events.
 */

// Write structured log.
const write = (level, message, metadata = {}) => {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...metadata });
  (level === 'error' ? process.stderr : process.stdout).write(`${line}\n`);
};

module.exports = {
  info: (message, metadata) => write('info', message, metadata),
  error: (message, metadata) => write('error', message, metadata),
};
