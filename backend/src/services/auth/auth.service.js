const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User.model');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('../../config/jwt.config');

const SALT_ROUNDS = 12;

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

const signup = async (payload) => {
  const { clinicId, fullName, email, phone, password, role, doctorProfile, permissions } = payload;

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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    tokens: { accessToken, refreshToken },
  };
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

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    tokens: { accessToken, refreshToken },
  };
};

module.exports = {
  signup,
  login,
};
