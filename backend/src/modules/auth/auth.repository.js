/**
 * Auth Repository
 * Handles user and refresh-token persistence.
 */

const { prisma } = require('../../database/prisma');

// Find login user.
const findUserByEmail = async (clinicId, email, connection) => {
  const client = connection || prisma;
  const user = await client.users.findFirst({ where: { clinic_id: clinicId || null, email: email.toLowerCase(), is_deleted: false } });
  if (!user?.clinic_id) return user ? { ...user, clinic_status: null } : null;
  const clinic = await client.clinics.findFirst({ where: { id: user.clinic_id, is_deleted: false }, select: { status: true } });
  return { ...user, clinic_status: clinic?.status || null };
};

// Find user by id.
const findUserById = async (id, connection) => {
  const client = connection || prisma;
  const user = await client.users.findFirst({ where: { id, is_deleted: false } });
  if (!user?.clinic_id) return user ? { ...user, clinic_status: null } : null;
  const clinic = await client.clinics.findFirst({ where: { id: user.clinic_id, is_deleted: false }, select: { status: true } });
  return { ...user, clinic_status: clinic?.status || null };
};

// Store refresh token.
const createRefreshToken = async (token, connection) => {
  await (connection || prisma).refresh_tokens.create({
    data: {
      id: token.id,
      clinic_id: token.clinicId,
      user_id: token.userId,
      token_hash: token.tokenHash,
      expires_at: token.expiresAt,
      created_by: token.userId,
      updated_by: token.userId,
    },
  });
};

// Find active refresh token.
const findRefreshToken = async (tokenHash, connection) => {
  return (connection || prisma).refresh_tokens.findFirst({
    where: { token_hash: tokenHash, revoked_at: null, expires_at: { gt: new Date() }, is_deleted: false },
  });
};

// Revoke refresh token.
const revokeRefreshToken = async (id, replacedByTokenId, connection) => {
  await (connection || prisma).refresh_tokens.updateMany({
    where: { id, revoked_at: null },
    data: { revoked_at: new Date(), replaced_by_token_id: replacedByTokenId || null },
  });
};

// Revoke all user tokens.
const revokeUserTokens = async (userId, connection) => {
  await (connection || prisma).refresh_tokens.updateMany({ where: { user_id: userId, revoked_at: null }, data: { revoked_at: new Date() } });
};

// Update login timestamp.
const updateLastLogin = async (userId, connection) => (connection || prisma).users.updateMany({ where: { id: userId }, data: { last_login_at: new Date() } });

// Create password reset token.
const createPasswordResetToken = async (token, connection) => (connection || prisma).password_reset_tokens.create({
  data: {
    id: token.id,
    clinic_id: token.clinicId,
    user_id: token.userId,
    token_hash: token.tokenHash,
    expires_at: new Date(Date.now() + 30 * 60 * 1000),
  },
});

// Find password reset token.
const findPasswordResetForUpdate = async (tokenHash, connection) => {
  return (connection || prisma).password_reset_tokens.findFirst({
    where: { token_hash: tokenHash, consumed_at: null, expires_at: { gt: new Date() }, is_deleted: false },
  });
};

// Update user password.
const updatePassword = async (userId, passwordHash, connection) => (connection || prisma).users.updateMany({
  where: { id: userId, is_deleted: false },
  data: { password_hash: passwordHash, updated_by: userId },
});

// Consume password reset token.
const consumePasswordReset = async (id, connection) => (connection || prisma).password_reset_tokens.updateMany({ where: { id, consumed_at: null }, data: { consumed_at: new Date() } });

module.exports = {
  findUserByEmail,
  findUserById,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeUserTokens,
  updateLastLogin,
  createPasswordResetToken,
  findPasswordResetForUpdate,
  updatePassword,
  consumePasswordReset,
};
