/**
 * Users Repository
 * Owns Prisma access for current-user, staff, and invitation operations.
 */

const { prisma, model } = require('../../database/prisma');
const { activeKey } = require('../../common/utils/idempotency');

const users = (connection) => model(connection || prisma, 'users');
const clinics = (connection) => model(connection || prisma, 'clinics');
const invitations = (connection) => model(connection || prisma, 'user_invitations');
const refreshTokens = (connection) => model(connection || prisma, 'refresh_tokens');
const outboxEvents = (connection) => model(connection || prisma, 'outbox_events');
const userRoles = (connection) => model(connection || prisma, 'user_roles');

// Builds a MySQL-safe active invitation uniqueness key.
const activeInvitationKey = ({ clinicId, email }) => activeKey(clinicId, String(email || '').trim().toLowerCase(), 'active_invitation');

// Finds a clinic by id.
const findClinicById = async (clinicId, connection) => clinics(connection).findFirst({
  where: { id: clinicId, is_deleted: false },
});

// Finds a user by tenant-aware identity.
const findUserById = async ({ userId, clinicId = null, isPlatform = false }, connection) => users(connection).findFirst({
  where: {
    id: userId,
    is_deleted: false,
    clinic_id: isPlatform ? null : clinicId,
  },
});

// Lists users inside one tenant.
const listUsers = async ({ clinicId, search = null, status = null, skip = 0, take = 50 }, connection) => users(connection).findMany({
  where: {
    clinic_id: clinicId,
    is_deleted: false,
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { full_name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ],
    } : {}),
  },
  orderBy: [{ created_at: 'desc' }],
  skip,
  take,
});

// Finds a user by tenant login scope and email.
const findUserByEmailScope = async ({ email, loginScope }, connection) => users(connection).findFirst({
  where: {
    email: String(email || '').trim().toLowerCase(),
    login_scope: loginScope,
    is_deleted: false,
  },
});

// Checks whether a user is the last active clinic admin or owner.
const isLastActiveTenantAdmin = async ({ clinicId, userId }, connection) => {
  const assignments = await userRoles(connection).findMany({
    where: {
      clinic_id: clinicId,
      is_deleted: false,
      revoked_at: null,
      role: {
        code: { in: ['clinic_owner', 'clinic_admin'] },
        is_deleted: false,
      },
      user: {
        status: 'ACTIVE',
        is_deleted: false,
      },
    },
    select: { user_id: true },
    distinct: ['user_id'],
  });
  return assignments.length === 1 && assignments[0]?.user_id === userId;
};

// Creates a staff user.
const createUser = async (payload, connection) => users(connection).create({ data: payload });

// Updates a staff user.
const updateUser = async ({ userId, data }, connection) => users(connection).update({
  where: { id: userId },
  data,
});

// Increments token version for session invalidation.
const incrementUserTokenVersion = async (userId, connection) => users(connection).update({
  where: { id: userId },
  data: { token_version: { increment: 1 } },
});

// Revokes active refresh tokens for a user.
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

// Creates a user invitation.
const createInvitation = async (payload, connection) => invitations(connection).create({
  data: {
    ...payload,
    active_invitation_key: activeInvitationKey({ clinicId: payload.clinic_id, email: payload.email }),
  },
});

// Lists invitations inside one tenant.
const listInvitations = async ({ clinicId, status = null, skip = 0, take = 50 }, connection) => invitations(connection).findMany({
  where: {
    clinic_id: clinicId,
    ...(status ? { status } : {}),
  },
  orderBy: [{ created_at: 'desc' }],
  skip,
  take,
});

// Finds an invitation by id inside one tenant.
const findInvitationById = async ({ clinicId, invitationId }, connection) => invitations(connection).findFirst({
  where: { id: invitationId, clinic_id: clinicId },
});

// Finds an invitation by token hash.
const findInvitationByTokenHash = async (tokenHash, connection) => invitations(connection).findUnique({
  where: { token_hash: tokenHash },
});

// Updates an invitation.
const updateInvitation = async ({ invitationId, data }, connection) => invitations(connection).update({
  where: { id: invitationId },
  data,
});

// Creates an outbox event for later worker delivery.
const createOutboxEvent = async (payload, connection) => outboxEvents(connection).create({ data: payload });

module.exports = {
  activeInvitationKey,
  createInvitation,
  createOutboxEvent,
  createUser,
  findClinicById,
  findInvitationById,
  findInvitationByTokenHash,
  findUserByEmailScope,
  findUserById,
  incrementUserTokenVersion,
  isLastActiveTenantAdmin,
  listInvitations,
  listUsers,
  revokeActiveRefreshTokensByUser,
  updateInvitation,
  updateUser,
};
