/**
 * Auth Constants
 * Phase 02 identity and session constants.
 */

const USER_TYPE = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLINIC_USER: 'CLINIC_USER',
});

const USER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
});

const SESSION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
});

const AUTH_COOKIE = Object.freeze({
  ACCESS_TOKEN: 'access_token',
  CSRF_TOKEN: 'csrf_token',
  REFRESH_TOKEN: 'refresh_token',
});

const TOKEN_TTL_SECONDS = Object.freeze({
  ACCESS: 15 * 60,
  REFRESH: 30 * 24 * 60 * 60,
});

module.exports = {
  AUTH_COOKIE,
  SESSION_STATUS,
  TOKEN_TTL_SECONDS,
  USER_STATUS,
  USER_TYPE,
};
