/**
 * Users Repository
 * Handles tenant user persistence.
 */

const { prisma } = require('../../database/prisma');
const { createBaseRepository } = require('../../common/repositories/BaseRepository');
const { getPagination, buildMeta } = require('../../common/utils/pagination');
const { sanitizeSearch } = require('../../common/utils/sanitizeQuery');

const base = createBaseRepository({
  table: 'users',
  columns: ['id', 'clinic_id', 'full_name', 'email', 'phone', 'password_hash', 'role', 'permissions', 'profile', 'is_active', 'created_by', 'updated_by', 'is_deleted'],
  searchable: ['full_name', 'email', 'phone'],
  filterable: ['role', 'is_active'],
  jsonFields: ['permissions', 'profile'],
});

// Find user by tenant email.
const findByEmail = async (clinicId, email, connection) => {
  return (connection || prisma).users.findFirst({ where: { clinic_id: clinicId || null, email: email.toLowerCase(), is_deleted: false } });
};

// Revoke pending email invitations.
const revokePendingInvitations = async (clinicId, email, actorId, connection) => (connection || prisma).user_invitations.updateMany({
  where: { clinic_id: clinicId, email: email.toLowerCase(), accepted_at: null, revoked_at: null, is_deleted: false },
  data: { revoked_at: new Date(), updated_by: actorId },
});

// Create user invitation.
const createInvitation = async (invitation, connection) => {
  return (connection || prisma).user_invitations.create({
    data: {
      id: invitation.id,
      clinic_id: invitation.clinicId,
      email: invitation.email,
      full_name: invitation.fullName,
      phone: invitation.phone,
      role: invitation.role,
      permissions: JSON.parse(invitation.permissions),
      token_hash: invitation.tokenHash,
      expires_at: new Date(Date.now() + Number(invitation.ttlHours) * 60 * 60 * 1000),
      invited_by: invitation.actorId,
      created_by: invitation.actorId,
      updated_by: invitation.actorId,
    },
  });
};

// Find invitation for acceptance.
const findInvitationForUpdate = async (tokenHash, connection) => {
  return (connection || prisma).user_invitations.findFirst({
    where: { token_hash: tokenHash, accepted_at: null, revoked_at: null, expires_at: { gt: new Date() }, is_deleted: false },
  });
};

// Accept invitation.
const markInvitationAccepted = async (id, userId, connection) => (connection || prisma).user_invitations.updateMany({
  where: { id, accepted_at: null, revoked_at: null },
  data: { accepted_at: new Date(), updated_by: userId },
});

// Revoke invitation by tenant.
const revokeInvitation = async (id, clinicId, actorId, connection) => (connection || prisma).user_invitations.updateMany({
  where: { id, clinic_id: clinicId, accepted_at: null, revoked_at: null, is_deleted: false },
  data: { revoked_at: new Date(), updated_by: actorId },
});

// List tenant invitations.
const listInvitations = async (clinicId, requestQuery = {}, connection) => {
  const { page, limit, offset } = getPagination(requestQuery);
  const where = { clinic_id: clinicId, is_deleted: false };
  if (requestQuery.search) where.OR = [{ email: { contains: sanitizeSearch(requestQuery.search) } }, { full_name: { contains: sanitizeSearch(requestQuery.search) } }];
  const sortable = ['created_at', 'expires_at', 'email'];
  const sortBy = sortable.includes(requestQuery.sortBy) ? requestQuery.sortBy : 'created_at';
  const sortOrder = String(requestQuery.sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const client = connection || prisma;
  const [items, total] = await Promise.all([
    client.user_invitations.findMany({ where, orderBy: { [sortBy]: sortOrder.toLowerCase() }, take: limit, skip: offset }),
    client.user_invitations.count({ where }),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
};

module.exports = {
  ...base,
  findByEmail,
  revokePendingInvitations,
  createInvitation,
  findInvitationForUpdate,
  markInvitationAccepted,
  revokeInvitation,
  listInvitations,
};
