/**
 * Environment Configuration
 * Normalizes and validates Phase 01 runtime configuration.
 */

require('dotenv').config();

const ALLOWED_NODE_ENVS = new Set(['development', 'test', 'production']);

const rawValue = (source, key, fallback = '') => {
  const value = source[key];
  if (value === undefined || value === null || value === '') return fallback;
  return value;
};

const integerValue = (source, key, fallback, { min, max }) => {
  const raw = rawValue(source, key, String(fallback));
  if (!/^-?\d+$/.test(String(raw))) throw new Error(`${key} must be an integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${key} must be between ${min} and ${max}`);
  return value;
};

const booleanValue = (source, key, fallback) => {
  const raw = String(rawValue(source, key, String(fallback))).toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${key} must be true or false`);
};

const secretValue = (source, key) => {
  const value = rawValue(source, key, '');
  if (String(value).length < 32) throw new Error(`${key} must be at least 32 characters`);
  return value;
};

const validateUrl = (key, value, protocols) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch (error) {
    throw new Error(`${key} must be a valid URL`);
  }
  if (protocols && !protocols.includes(parsed.protocol)) throw new Error(`${key} must use one of: ${protocols.join(', ')}`);
  return value;
};

const validateCorsOrigins = (value) => {
  const origins = String(value).split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length) throw new Error('CORS_ALLOWED_ORIGINS must include at least one origin');
  origins.forEach((origin) => {
    if (origin === '*') throw new Error('Wildcard CORS is not allowed');
    validateUrl('CORS_ALLOWED_ORIGINS', origin, ['http:', 'https:']);
  });
  return origins.join(',');
};

const buildEnv = (source = process.env) => {
  const NODE_ENV = rawValue(source, 'NODE_ENV', 'development');
  const APP_NAME = rawValue(source, 'APP_NAME', 'doctor-system-backend-new');
  const DATABASE_URL = rawValue(source, 'DATABASE_URL', '');
  const SENTRY_DSN = rawValue(source, 'SENTRY_DSN', '');

  if (!ALLOWED_NODE_ENVS.has(NODE_ENV)) throw new Error('NODE_ENV must be one of: development, test, production');
  if (!String(APP_NAME).trim()) throw new Error('APP_NAME is required');
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  validateUrl('DATABASE_URL', DATABASE_URL, ['mysql:']);
  if (SENTRY_DSN) validateUrl('SENTRY_DSN', SENTRY_DSN, ['http:', 'https:']);
  const AUTH_COOKIE_SECURE = booleanValue(source, 'AUTH_COOKIE_SECURE', NODE_ENV === 'production');
  if (NODE_ENV === 'production' && !AUTH_COOKIE_SECURE) throw new Error('AUTH_COOKIE_SECURE must be true in production');

  return Object.freeze({
    NODE_ENV,
    APP_NAME,
    PORT: integerValue(source, 'PORT', 8080, { min: 1, max: 65535 }),
    TRUST_PROXY: integerValue(source, 'TRUST_PROXY', 0, { min: 0, max: 10 }),
    CORS_ALLOWED_ORIGINS: validateCorsOrigins(rawValue(source, 'CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),
    JSON_BODY_LIMIT: rawValue(source, 'JSON_BODY_LIMIT', '1mb'),
    RATE_LIMIT_WINDOW_MS: integerValue(source, 'RATE_LIMIT_WINDOW_MS', 900000, { min: 1000, max: 86400000 }),
    RATE_LIMIT_MAX: integerValue(source, 'RATE_LIMIT_MAX', 300, { min: 1, max: 100000 }),
    AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: integerValue(source, 'AUTH_LOGIN_RATE_LIMIT_WINDOW_MS', 900000, { min: 1000, max: 86400000 }),
    AUTH_LOGIN_RATE_LIMIT_MAX: integerValue(source, 'AUTH_LOGIN_RATE_LIMIT_MAX', 10, { min: 1, max: 100000 }),
    AUTH_REFRESH_RATE_LIMIT_WINDOW_MS: integerValue(source, 'AUTH_REFRESH_RATE_LIMIT_WINDOW_MS', 900000, { min: 1000, max: 86400000 }),
    AUTH_REFRESH_RATE_LIMIT_MAX: integerValue(source, 'AUTH_REFRESH_RATE_LIMIT_MAX', 60, { min: 1, max: 100000 }),
    AUTH_INVITATION_ACCEPT_RATE_LIMIT_WINDOW_MS: integerValue(source, 'AUTH_INVITATION_ACCEPT_RATE_LIMIT_WINDOW_MS', 900000, { min: 1000, max: 86400000 }),
    AUTH_INVITATION_ACCEPT_RATE_LIMIT_MAX: integerValue(source, 'AUTH_INVITATION_ACCEPT_RATE_LIMIT_MAX', 20, { min: 1, max: 100000 }),
    AUTH_LOCKOUT_MAX_FAILURES: integerValue(source, 'AUTH_LOCKOUT_MAX_FAILURES', 5, { min: 1, max: 100 }),
    AUTH_LOCKOUT_WINDOW_MS: integerValue(source, 'AUTH_LOCKOUT_WINDOW_MS', 900000, { min: 1000, max: 86400000 }),
    AUTH_LOCKOUT_DURATION_MS: integerValue(source, 'AUTH_LOCKOUT_DURATION_MS', 900000, { min: 1000, max: 86400000 }),
    JWT_ACCESS_SECRET: secretValue(source, 'JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: secretValue(source, 'JWT_REFRESH_SECRET'),
    ACCESS_TOKEN_TTL_SECONDS: integerValue(source, 'ACCESS_TOKEN_TTL_SECONDS', 900, { min: 60, max: 1800 }),
    REFRESH_TOKEN_TTL_SECONDS: integerValue(source, 'REFRESH_TOKEN_TTL_SECONDS', 2592000, { min: 86400, max: 7776000 }),
    AUTH_COOKIE_SECURE,
    ENABLE_POST_SPRINT_1_ROUTES: booleanValue(source, 'ENABLE_POST_SPRINT_1_ROUTES', false),
    SETTINGS_ENCRYPTION_KEY: rawValue(source, 'SETTINGS_ENCRYPTION_KEY', ''),
    PHI_ENCRYPTION_KEY: rawValue(source, 'PHI_ENCRYPTION_KEY', ''),
    DATABASE_URL,
    SENTRY_DSN,
  });
};

const validateEnv = (value = env) => value;

const env = buildEnv();

module.exports = { booleanValue, buildEnv, env, validateEnv };
