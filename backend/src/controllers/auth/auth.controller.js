const mongoose = require('mongoose');
const authService = require('../../services/auth/auth.service');
const { ROLES } = require('../../utils/constants/roles');
const {
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
} = require('../../config/jwt.config');

const allowedRoles = new Set(Object.values(ROLES));
const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
  maxAge,
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('access_token', accessToken, cookieOptions(ACCESS_COOKIE_MAX_AGE));
  res.cookie('refresh_token', refreshToken, cookieOptions(REFRESH_COOKIE_MAX_AGE));
};

const clearAuthCookies = (res) => {
  res.clearCookie('access_token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'strict' : 'lax', path: '/' });
  res.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'strict' : 'lax', path: '/' });
};

// ─── Validation ───────────────────────────────────────────────────────────────

const validateSignupPayload = (body) => {
  const { clinicId, fullName, email, phone, password, role } = body;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return 'Valid clinicId is required';
  }
  if (!fullName || fullName.trim().length < 2) {
    return 'fullName must be at least 2 characters';
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return 'Valid email is required';
  }
  if (!phone || phone.trim().length < 8) {
    return 'Valid phone number is required';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!role || !allowedRoles.has(role)) {
    return `role must be one of: ${Array.from(allowedRoles).join(', ')}`;
  }

  return null;
};

const validateLoginPayload = (body) => {
  const { clinicId, email, password } = body;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return 'Valid clinicId is required';
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return 'Valid email is required';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  return null;
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

const signup = async (req, res, next) => {
  try {
    const validationError = validateSignupPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { clinicId, fullName, email, phone, password, role, doctorProfile, permissions } = req.body;

    const data = await authService.signup({
      clinicId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role,
      doctorProfile,
      permissions,
    });

    setAuthCookies(res, data.tokens);

    return res.status(201).json({
      success: true,
      message: 'Signup successful',
      data: { user: data.user },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validationError = validateLoginPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { clinicId, email, password } = req.body;

    const data = await authService.login({
      clinicId,
      email: email.trim().toLowerCase(),
      password,
    });

    setAuthCookies(res, data.tokens);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: data.user },
    });
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies?.refresh_token;

    if (!incomingRefreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const data = await authService.refresh(incomingRefreshToken);

    setAuthCookies(res, data.tokens);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { user: data.user },
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.auth?.userId) {
      await authService.logout(req.auth.userId);
    }

    clearAuthCookies(res);

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
};

const me = (req, res) => {
  return res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  me,
};
