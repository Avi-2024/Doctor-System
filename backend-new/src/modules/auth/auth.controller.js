/**
 * Auth Controller
 * Handles HTTP response concerns for Sprint 1 Auth APIs.
 */

const { successResponse } = require('../../common/utils/response');
const { AUTH_COOKIE } = require('./auth.constants');
const { clearAuthCookies, setAuthCookies } = require('./auth.cookies');

const createAuthController = ({ service }) => ({
  login: async (req, res) => {
    const result = await service.login({
      clinicId: req.body.clinicId || null,
      email: req.body.email,
      password: req.body.password,
      context: req.context,
    });
    setAuthCookies(res, result);
    return successResponse(res, 'Login successful', {
      user: result.user,
      session: result.session,
    });
  },

  refresh: async (req, res) => {
    const result = await service.refresh({
      refreshToken: req.cookies?.[AUTH_COOKIE.REFRESH_TOKEN],
      context: req.context,
    });
    setAuthCookies(res, result);
    return successResponse(res, 'Session refreshed', {
      user: result.user,
      session: result.session,
    });
  },

  logout: async (req, res) => {
    await service.logout({
      refreshToken: req.cookies?.[AUTH_COOKIE.REFRESH_TOKEN],
      context: req.context,
    });
    clearAuthCookies(res);
    return successResponse(res, 'Logged out', { loggedOut: true });
  },

  me: async (req, res) => successResponse(res, 'Current user', {
    user: req.auth.user,
    session: req.auth.session,
    roles: [],
    permissions: [],
  }),
});

module.exports = { createAuthController };
