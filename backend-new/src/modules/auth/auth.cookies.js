/**
 * Auth Cookie Helpers
 * Owns HTTP-only cookie settings for access and refresh tokens.
 */

const { env } = require('../../config/env');
const { createCsrfToken } = require('../../common/middleware/csrf');
const { AUTH_COOKIE } = require('./auth.constants');

const secondsToMilliseconds = (seconds) => seconds * 1000;

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: 'strict',
  path: '/',
  maxAge: secondsToMilliseconds(env.ACCESS_TOKEN_TTL_SECONDS),
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: 'strict',
  path: '/api/v1/auth',
  maxAge: secondsToMilliseconds(env.REFRESH_TOKEN_TTL_SECONDS),
});

const csrfCookieOptions = () => ({
  httpOnly: false,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: 'strict',
  path: '/',
  maxAge: secondsToMilliseconds(env.REFRESH_TOKEN_TTL_SECONDS),
});

const clearAccessCookieOptions = () => ({
  httpOnly: true,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: 'strict',
  path: '/',
});

const clearRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: 'strict',
  path: '/api/v1/auth',
});

const clearCsrfCookieOptions = () => ({
  httpOnly: false,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: 'strict',
  path: '/',
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(AUTH_COOKIE.ACCESS_TOKEN, accessToken, accessCookieOptions());
  res.cookie(AUTH_COOKIE.REFRESH_TOKEN, refreshToken, refreshCookieOptions());
  res.cookie(AUTH_COOKIE.CSRF_TOKEN, createCsrfToken(), csrfCookieOptions());
};

const clearAuthCookies = (res) => {
  res.clearCookie(AUTH_COOKIE.ACCESS_TOKEN, clearAccessCookieOptions());
  res.clearCookie(AUTH_COOKIE.REFRESH_TOKEN, clearRefreshCookieOptions());
  res.clearCookie(AUTH_COOKIE.CSRF_TOKEN, clearCsrfCookieOptions());
};

module.exports = {
  accessCookieOptions,
  clearAccessCookieOptions,
  clearAuthCookies,
  clearCsrfCookieOptions,
  clearRefreshCookieOptions,
  csrfCookieOptions,
  refreshCookieOptions,
  setAuthCookies,
};
