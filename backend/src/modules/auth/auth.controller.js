/**
 * Auth Controller
 * Maps authentication requests.
 */

const service = require('./auth.service');
const { env } = require('../../config/env');
const { successResponse } = require('../../common/utils/response');
const { recordAudit } = require('../audit/audit.service');

const cookieOptions = { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAME_SITE, path: '/' };

// Set authentication cookies.
const setCookies = (res, tokens) => {
  res.cookie('access_token', tokens.accessToken, cookieOptions);
  res.cookie('refresh_token', tokens.refreshToken, cookieOptions);
};

// Login user.
const login = async (req, res) => {
  const result = await service.login(req.body);
  setCookies(res, result.tokens);
  await recordAudit({ req, clinicId: result.user.clinicId, action: 'LOGIN', moduleName: 'Auth', entityType: 'User', entityId: result.user.id });
  return successResponse(res, 'Login successful', { user: result.user });
};

// Refresh session.
const refresh = async (req, res) => {
  const result = await service.refresh(req.cookies.refresh_token || req.body.refreshToken);
  setCookies(res, result.tokens);
  return successResponse(res, 'Token refreshed', { user: result.user });
};

// Logout session.
const logout = async (req, res) => {
  await service.logout(req.auth.userId);
  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
  return successResponse(res, 'Logout successful', { loggedOut: true });
};

// Fetch current user.
const me = async (req, res) => successResponse(res, 'Current user fetched', { user: await service.me(req.auth.userId) });

// Request password reset.
const requestPasswordReset = async (req, res) => successResponse(res, 'Password reset queued', await service.requestPasswordReset(req.body));

// Confirm password reset.
const confirmPasswordReset = async (req, res) => successResponse(res, 'Password updated', await service.confirmPasswordReset(req.body));

module.exports = { login, refresh, logout, me, requestPasswordReset, confirmPasswordReset };
