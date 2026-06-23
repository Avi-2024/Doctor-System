/**
 * Auth Repository
 * Owns Prisma access for Sprint 1 authentication and sessions.
 */

const { prisma, model } = require('../../database/prisma');

const users = (connection) => model(connection || prisma, 'users');
const refreshTokens = (connection) => model(connection || prisma, 'refresh_tokens');
const loginAttempts = (connection) => model(connection || prisma, 'login_attempts');
const accountLockouts = (connection) => model(connection || prisma, 'account_lockouts');

const PLATFORM_LOGIN_SCOPE = 'PLATFORM';

const sanitizeEmail = (email) => String(email || '').trim().toLowerCase();
const loginScopeForClinic = (clinicId = null) => clinicId || PLATFORM_LOGIN_SCOPE;

const findUserForLogin = async ({ email, clinicId = null }, connection) => users(connection).findFirst({
  where: {
    email: sanitizeEmail(email),
    login_scope: loginScopeForClinic(clinicId),
    clinic_id: clinicId,
    is_deleted: false,
  },
  include: { clinic: true },
});

const findUserById = async (userId, connection) => users(connection).findFirst({
  where: {
    id: typeof userId === 'object' ? userId.userId : userId,
    ...(typeof userId === 'object' ? { clinic_id: userId.isPlatform ? null : userId.clinicId } : {}),
    is_deleted: false,
  },
  include: { clinic: true },
});

const updateLastLogin = async (userId, connection) => users(connection).update({
  where: { id: userId },
  data: { last_login_at: new Date() },
});

const createRefreshToken = async (payload, connection) => refreshTokens(connection).create({ data: payload });

const findRefreshTokenByHash = async (tokenHash, connection) => refreshTokens(connection).findUnique({
  where: { token_hash: tokenHash },
  include: { user: { include: { clinic: true } } },
});

const findActiveRefreshTokenBySession = async ({
  sessionId,
  userId,
  clinicId = null,
  isPlatform = false,
}, connection) => refreshTokens(connection).findFirst({
  where: {
    session_id: sessionId,
    user_id: userId,
    clinic_id: isPlatform ? null : clinicId,
    status: 'ACTIVE',
    revoked_at: null,
    expires_at: { gt: new Date() },
  },
  include: { user: { include: { clinic: true } } },
});

const claimActiveRefreshTokenForRotation = async ({
  id,
  tokenHash,
  now = new Date(),
}, connection) => refreshTokens(connection).updateMany({
  where: {
    id,
    token_hash: tokenHash,
    status: 'ACTIVE',
    revoked_at: null,
    expires_at: { gt: now },
  },
  data: {
    status: 'REVOKED',
    revoked_at: now,
  },
});

const markRefreshTokenReplacement = async ({ id, replacedByTokenId }, connection) => refreshTokens(connection).update({
  where: { id },
  data: {
    replaced_by_token_id: replacedByTokenId,
  },
});

const revokeRefreshToken = async ({ id, replacedByTokenId = null }, connection) => refreshTokens(connection).update({
  where: { id },
  data: {
    status: 'REVOKED',
    revoked_at: new Date(),
    replaced_by_token_id: replacedByTokenId,
  },
});

const revokeRefreshTokenByHash = async (tokenHash, connection) => refreshTokens(connection).updateMany({
  where: {
    token_hash: tokenHash,
    status: 'ACTIVE',
    revoked_at: null,
  },
  data: {
    status: 'REVOKED',
    revoked_at: new Date(),
  },
});

const revokeActiveRefreshTokensByUser = async (userId, connection) => refreshTokens(connection).updateMany({
  where: {
    user_id: userId,
    status: 'ACTIVE',
    revoked_at: null,
  },
  data: {
    status: 'REVOKED',
    revoked_at: new Date(),
  },
});

const recordLoginAttempt = async (payload, connection) => loginAttempts(connection).create({ data: payload });

const findActiveAccountLockout = async ({
  email,
  clinicId = null,
  ipAddress = 'unknown',
  now = new Date(),
}, connection) => accountLockouts(connection).findFirst({
  where: {
    email: sanitizeEmail(email),
    clinic_id: clinicId,
    ip_address: ipAddress,
    unlocked_at: null,
    locked_until: { gt: now },
  },
});

const countRecentFailedLoginAttempts = async ({
  email,
  clinicId = null,
  ipAddress = 'unknown',
  since,
}, connection) => loginAttempts(connection).count({
  where: {
    email: sanitizeEmail(email),
    clinic_id: clinicId,
    ip_address: ipAddress,
    success: false,
    attempted_at: { gte: since },
  },
});

const createAccountLockout = async (payload, connection) => accountLockouts(connection).create({ data: payload });

module.exports = {
  claimActiveRefreshTokenForRotation,
  countRecentFailedLoginAttempts,
  createAccountLockout,
  createRefreshToken,
  findActiveAccountLockout,
  findActiveRefreshTokenBySession,
  findRefreshTokenByHash,
  findUserById,
  findUserForLogin,
  loginScopeForClinic,
  markRefreshTokenReplacement,
  recordLoginAttempt,
  revokeActiveRefreshTokensByUser,
  revokeRefreshToken,
  revokeRefreshTokenByHash,
  sanitizeEmail,
  updateLastLogin,
};
