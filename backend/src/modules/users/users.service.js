/**
 * Users Service
 * Manages secure tenant user accounts.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const repository = require('./users.repository');
const { ApiError } = require('../../common/errors/ApiError');
const { ROLES } = require('../../common/constants/roles');
const { DEFAULT_ROLE_PERMISSIONS } = require('../../common/constants/permissions');
const { env } = require('../../config/env');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { createId } = require('../../common/utils/ids');
const { hashToken } = require('../../common/utils/token');
const { assertUsageAvailable } = require('../subscriptions/subscriptions.service');

const ownerRoles = new Set([ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.PATIENT]);

// Validate assignable role.
const validateRole = (role, actorRole) => {
  if (actorRole === ROLES.SUPER_ADMIN) return;
  if (!ownerRoles.has(role)) throw new ApiError(403, 'Role assignment is not allowed');
};

// Create user.
const createUser = async (payload, context) => runInTransaction(async (connection) => {
  validateRole(payload.role, context.role);
  const clinicId = payload.role === ROLES.SUPER_ADMIN ? null : context.clinicId;
  if (payload.role !== ROLES.SUPER_ADMIN && !clinicId) throw new ApiError(400, 'clinicId is required');
  if (clinicId) await assertUsageAvailable({ clinicId, metric: 'users', connection });
  if (await repository.findByEmail(clinicId, payload.email, connection)) throw new ApiError(409, 'Email already registered');
  const user = await repository.create({
    clinic_id: clinicId,
    full_name: payload.fullName,
    email: payload.email.toLowerCase(),
    phone: payload.phone || null,
    password_hash: await bcrypt.hash(payload.password, 12),
    role: payload.role,
    permissions: payload.permissions || DEFAULT_ROLE_PERMISSIONS[payload.role] || [],
    profile: payload.profile || {},
    is_active: true,
    created_by: context.userId,
    updated_by: context.userId,
  }, connection);
  delete user.password_hash;
  delete user.refresh_token_hash;
  return user;
});

// Update tenant user.
const updateUser = async (id, payload, context) => {
  const current = await repository.findById(id, context.clinicId);
  if (!current) throw new ApiError(404, 'User not found');
  if (id === context.userId && (payload.role || payload.isActive === false)) throw new ApiError(400, 'Cannot change own role or active state');
  if (payload.role) validateRole(payload.role, context.role);
  const update = {
    ...(payload.fullName !== undefined ? { full_name: payload.fullName } : {}),
    ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
    ...(payload.role !== undefined ? { role: payload.role } : {}),
    ...(payload.permissions !== undefined ? { permissions: payload.permissions } : {}),
    ...(payload.profile !== undefined ? { profile: payload.profile } : {}),
    ...(payload.isActive !== undefined ? { is_active: payload.isActive } : {}),
    updated_by: context.userId,
  };
  const user = await repository.updateById(id, context.clinicId, update);
  delete user.password_hash;
  delete user.refresh_token_hash;
  return { before: current, user };
};

// Soft delete tenant user.
const deleteUser = async (id, context) => {
  if (id === context.userId) throw new ApiError(400, 'Cannot delete own account');
  const current = await repository.findById(id, context.clinicId);
  if (!current) throw new ApiError(404, 'User not found');
  await repository.softDelete(id, context.clinicId, context.userId);
  return current;
};

// List tenant users.
const listUsers = async (requestQuery, context) => {
  const result = await repository.list(context.clinicId, requestQuery);
  result.items.forEach((user) => {
    delete user.password_hash;
    delete user.refresh_token_hash;
  });
  return result;
};

// Dispatch invitation link.
const dispatchInvitation = async (invitation, token) => {
  if (!env.USER_INVITATION_WEBHOOK_URL) return;
  const response = await fetch(env.USER_INVITATION_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.USER_INVITATION_WEBHOOK_SECRET}` },
    body: JSON.stringify({
      email: invitation.email,
      fullName: invitation.full_name,
      role: invitation.role,
      invitationUrl: `${env.USER_INVITATION_WEB_URL}?token=${encodeURIComponent(token)}`,
    }),
  });
  if (!response.ok) throw new ApiError(502, 'User invitation delivery failed');
};

// Invite tenant user.
const inviteUser = async (payload, context) => {
  validateRole(payload.role, context.role);
  if (!context.clinicId) throw new ApiError(400, 'clinicId is required');
  if (await repository.findByEmail(context.clinicId, payload.email)) throw new ApiError(409, 'Email already registered');
  const token = crypto.randomBytes(32).toString('hex');
  const invitation = await runInTransaction(async (connection) => {
    await repository.revokePendingInvitations(context.clinicId, payload.email, context.userId, connection);
    return repository.createInvitation({
      id: createId(),
      clinicId: context.clinicId,
      email: payload.email.toLowerCase(),
      fullName: payload.fullName,
      phone: payload.phone || null,
      role: payload.role,
      permissions: JSON.stringify(payload.permissions || DEFAULT_ROLE_PERMISSIONS[payload.role] || []),
      tokenHash: hashToken(token),
      ttlHours: env.USER_INVITATION_TTL_HOURS,
      actorId: context.userId,
    }, connection);
  });
  await dispatchInvitation(invitation, token);
  return { invitation, ...(env.NODE_ENV === 'production' ? {} : { invitationToken: token }) };
};

// Accept user invitation.
const acceptInvitation = async ({ token, password }) => runInTransaction(async (connection) => {
  const invitation = await repository.findInvitationForUpdate(hashToken(token), connection);
  if (!invitation) throw new ApiError(401, 'Invalid or expired invitation');
  await assertUsageAvailable({ clinicId: invitation.clinic_id, metric: 'users', connection });
  if (await repository.findByEmail(invitation.clinic_id, invitation.email, connection)) throw new ApiError(409, 'Email already registered');
  const user = await repository.create({
    clinic_id: invitation.clinic_id,
    full_name: invitation.full_name,
    email: invitation.email,
    phone: invitation.phone,
    password_hash: await bcrypt.hash(password, 12),
    role: invitation.role,
    permissions: typeof invitation.permissions === 'string' ? JSON.parse(invitation.permissions) : invitation.permissions,
    profile: {},
    is_active: true,
    created_by: invitation.invited_by,
    updated_by: invitation.invited_by,
  }, connection);
  await repository.markInvitationAccepted(invitation.id, user.id, connection);
  delete user.password_hash;
  return { invitation, user };
});

// Revoke tenant invitation.
const revokeInvitation = async (id, context) => {
  const result = await repository.revokeInvitation(id, context.clinicId, context.userId);
  if (!result.count) throw new ApiError(404, 'Pending invitation not found');
  return { id, revoked: true };
};

// List tenant invitations.
const listInvitations = async (requestQuery, context) => repository.listInvitations(context.clinicId, requestQuery);

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  inviteUser,
  acceptInvitation,
  revokeInvitation,
  listInvitations,
};
