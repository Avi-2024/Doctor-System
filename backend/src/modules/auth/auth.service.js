/**
 * Auth Service
 * Handles JWT authentication and refresh rotation.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { ApiError } = require('../../common/errors/ApiError');
const { createId } = require('../../common/utils/ids');
const { hashToken } = require('../../common/utils/token');
const repository = require('./auth.repository');

// Parse token expiry seconds.
const expirySeconds = (value) => {
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) return 604800;
  return Number(match[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 }[match[2]]);
};

// Serialize user.
const serializeUser = (user) => ({
  id: user.id,
  clinicId: user.clinic_id,
  fullName: user.full_name,
  email: user.email,
  role: user.role,
  permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
});

// Sign access token.
const signAccessToken = (user) => jwt.sign({ sub: user.id, clinicId: user.clinic_id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });

// Sign refresh token.
const signRefreshToken = (user, tokenId) => jwt.sign({ sub: user.id, jti: tokenId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

// Issue token pair.
const issueTokens = async (user, connection) => {
  const tokenId = createId();
  const refreshToken = signRefreshToken(user, tokenId);
  await repository.createRefreshToken({
    id: tokenId,
    clinicId: user.clinic_id,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + expirySeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000),
  }, connection);
  return { accessToken: signAccessToken(user), refreshToken };
};

// Authenticate user.
const login = async ({ clinicId, email, password }) => runInTransaction(async (connection) => {
  const user = await repository.findUserByEmail(clinicId, email, connection);
  if (!user || !user.is_active || (user.role !== 'SUPER_ADMIN' && user.clinic_status !== 'ACTIVE')) throw new ApiError(401, 'Invalid credentials');
  if (!await bcrypt.compare(password, user.password_hash)) throw new ApiError(401, 'Invalid credentials');
  const tokens = await issueTokens(user, connection);
  await repository.updateLastLogin(user.id, connection);
  return { user: serializeUser(user), tokens };
});

// Rotate refresh token.
const refresh = async (refreshToken) => {
  if (!refreshToken) throw new ApiError(401, 'Refresh token required');
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }
  const result = await runInTransaction(async (connection) => {
    const stored = await repository.findRefreshToken(hashToken(refreshToken), connection);
    if (!stored || stored.id !== decoded.jti || stored.user_id !== decoded.sub) return { reuseDetected: true };
    const user = await repository.findUserById(decoded.sub, connection);
    if (!user || !user.is_active || (user.role !== 'SUPER_ADMIN' && user.clinic_status !== 'ACTIVE')) throw new ApiError(401, 'Invalid refresh token');
    const tokens = await issueTokens(user, connection);
    const replacement = jwt.decode(tokens.refreshToken).jti;
    await repository.revokeRefreshToken(stored.id, replacement, connection);
    return { user: serializeUser(user), tokens };
  });
  if (result.reuseDetected) {
    await repository.revokeUserTokens(decoded.sub);
    throw new ApiError(401, 'Refresh token reuse detected');
  }
  return result;
};

// Logout user.
const logout = async (userId) => {
  await repository.revokeUserTokens(userId);
  return { loggedOut: true };
};

// Fetch current user.
const me = async (userId) => {
  const user = await repository.findUserById(userId);
  if (!user || !user.is_active) throw new ApiError(404, 'User not found');
  return serializeUser(user);
};

// Dispatch password reset link.
const dispatchReset = async (user, token) => {
  if (!env.PASSWORD_RESET_WEBHOOK_URL) return;
  const response = await fetch(env.PASSWORD_RESET_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.PASSWORD_RESET_WEBHOOK_SECRET}` },
    body: JSON.stringify({ email: user.email, fullName: user.full_name, resetUrl: `${env.PASSWORD_RESET_WEB_URL}?token=${encodeURIComponent(token)}` }),
  });
  if (!response.ok) throw new ApiError(502, 'Password reset delivery failed');
};

// Request password reset.
const requestPasswordReset = async ({ clinicId, email }) => {
  const user = await repository.findUserByEmail(clinicId, email);
  if (!user || !user.is_active) return { resetQueued: true };
  const token = crypto.randomBytes(32).toString('hex');
  await repository.createPasswordResetToken({ id: createId(), clinicId: user.clinic_id, userId: user.id, tokenHash: hashToken(token) });
  await dispatchReset(user, token);
  return { resetQueued: true };
};

// Confirm password reset.
const confirmPasswordReset = async ({ token, password }) => runInTransaction(async (connection) => {
  const reset = await repository.findPasswordResetForUpdate(hashToken(token), connection);
  if (!reset) throw new ApiError(401, 'Invalid or expired password reset token');
  await repository.updatePassword(reset.user_id, await bcrypt.hash(password, 12), connection);
  await repository.consumePasswordReset(reset.id, connection);
  await repository.revokeUserTokens(reset.user_id, connection);
  return { passwordUpdated: true };
});

module.exports = { login, refresh, logout, me, requestPasswordReset, confirmPasswordReset };
