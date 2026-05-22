const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User.model');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('../../config/jwt.config');
const { ROLES } = require('../../utils/constants/roles');

const SALT_ROUNDS = 12;

// SUPER_ADMIN cannot self-register — must be seeded/created internally
const PUBLIC_SIGNUP_BLOCKED_ROLES = new Set([ROLES.SUPER_ADMIN]);

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const buildTokenPayload = (user) => ({
  sub: user._id.toString(),
  clinicId: user.clinicId.toString(),
  role: user.role,
  email: user.email,
});

const generateAccessToken = (user) =>
  jwt.sign(buildTokenPayload(user), JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });

const generateRefreshToken = (user) =>
  jwt.sign(buildTokenPayload(user), JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

const sanitizeUser = (user) => ({
  id: user._id,
  clinicId: user.clinicId,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
});

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash: hashToken(refreshToken),
    lastLoginAt: new Date(),
  });

  return { accessToken, refreshToken };
};

const signup = async (payload) => {
  const { clinicId, fullName, email, phone, password, role, doctorProfile, permissions } = payload;

  if (PUBLIC_SIGNUP_BLOCKED_ROLES.has(role)) {
    const error = new Error('Cannot register with this role');
    error.statusCode = 403;
    throw error;
  }

  const existingUser = await User.findOne({ clinicId, email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('Email already registered for this clinic');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    clinicId,
    fullName,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role,
    doctorProfile,
    permissions,
  });

  const tokens = await issueTokens(user);

  return { user: sanitizeUser(user), tokens };
};

const login = async ({ clinicId, email, password }) => {
  const user = await User.findOne({ clinicId, email: email.toLowerCase() });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('User account is inactive');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const tokens = await issueTokens(user);

  return { user: sanitizeUser(user), tokens };
};

const refresh = async (incomingRefreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, JWT_REFRESH_SECRET);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash');
  if (!user || !user.isActive) {
    const error = new Error('User not found or inactive');
    error.statusCode = 401;
    throw error;
  }

  const isTokenValid =
    user.refreshTokenHash && user.refreshTokenHash === hashToken(incomingRefreshToken);

  if (!isTokenValid) {
    // Token reuse detected — clear stored token (possible theft)
    await User.findByIdAndUpdate(user._id, { refreshTokenHash: null });
    const error = new Error('Refresh token reuse detected. Please log in again.');
    error.statusCode = 401;
    throw error;
  }

  const tokens = await issueTokens(user);

  return { user: sanitizeUser(user), tokens };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
};
