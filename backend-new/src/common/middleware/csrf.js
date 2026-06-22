/**
 * CSRF Middleware
 * Enforces origin and double-submit token checks for cookie-authenticated browser requests.
 */

const crypto = require('node:crypto');
const { env } = require('../../config/env');
const { ApiError } = require('../errors/ApiError');

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const parseAllowedOrigins = (value = env.CORS_ALLOWED_ORIGINS) => String(value)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const originFromUrl = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch (error) {
    return null;
  }
};

const requestOrigin = (req) => originFromUrl(req.get('origin')) || originFromUrl(req.get('referer'));

const originIsAllowed = (origin, allowedOrigins = parseAllowedOrigins()) => !origin || allowedOrigins.includes(origin);

const requireAllowedOrigin = ({ allowedOrigins = parseAllowedOrigins(), allowMissingOrigin = true } = {}) => (req, res, next) => {
  const origin = requestOrigin(req);
  if (!origin && allowMissingOrigin) return next();
  if (originIsAllowed(origin, allowedOrigins)) return next();
  return next(new ApiError(403, 'Request origin not allowed'));
};

const createCsrfToken = () => crypto.randomBytes(32).toString('base64url');

const constantTimeEquals = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  if (leftBuffer.length !== rightBuffer.length || leftBuffer.length === 0) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const createCsrfProtection = ({
  cookieName = CSRF_COOKIE_NAME,
  headerName = CSRF_HEADER_NAME,
} = {}) => (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookieToken = req.cookies?.[cookieName];
  const headerToken = req.get(headerName);
  if (!constantTimeEquals(cookieToken, headerToken)) return next(new ApiError(403, 'CSRF validation failed'));
  return next();
};

module.exports = {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  createCsrfProtection,
  createCsrfToken,
  originIsAllowed,
  parseAllowedOrigins,
  requestOrigin,
  requireAllowedOrigin,
};
