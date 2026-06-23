/**
 * Users Service
 * Provides current-user, staff administration, and invitation behavior.
 */

const crypto = require('node:crypto');
const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { ApiError } = require('../../common/errors/ApiError');
const { resolveTenantTargetWithAudit } = require('../../common/middleware/tenantOverride');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { withPrismaErrorMapping } = require('../../common/utils/prismaErrors');
const { recordAudit } = require('../audit/audit.service');
const { createOpaqueToken, hashPassword, hashToken } = require('../auth/auth.crypto');
const { USER_STATUS } = require('../auth/auth.constants');
const { loginScopeForClinic } = require('../auth/auth.repository');
const { assertClinicWritable } = require('../clinics/clinics.lifecycle');
const { createBranchesService } = require('../branches/branches.service');
const defaultRepository = require('./users.repository');

const sanitizeUser = (user) => user ? ({
  id: user.id,
  clinicId: user.clinic_id || null,
  fullName: user.full_name,
  email: user.email,
  phone: user.phone || null,
  userType: user.user_type,
  status: user.status,
  lastLoginAt: user.last_login_at || null,
}) : null;

// Normalizes invitation records without exposing token hashes.
const sanitizeInvitation = (invitation) => invitation ? ({
  id: invitation.id,
  clinicId: invitation.clinic_id,
  userId: invitation.user_id || null,
  email: invitation.email,
  fullName: invitation.full_name,
  status: invitation.status,
  expiresAt: invitation.expires_at,
  acceptedAt: invitation.accepted_at || null,
  revokedAt: invitation.revoked_at || null,
  resendCount: invitation.resend_count || 0,
}) : null;

// Builds pagination values with safe defaults.
const pageInput = ({ page = 1, limit = 50 } = {}) => {
  const take = Math.min(Number(limit) || 50, 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  return { skip: (currentPage - 1) * take, take, page: currentPage, limit: take };
};

// Builds a safe outbox event payload.
const outboxPayload = ({ id, eventName, clinicId, aggregateId, context, payload }) => ({
  id,
  event_name: eventName,
  event_version: '1',
  aggregate_type: 'user',
  aggregate_id: aggregateId,
  tenant_id: clinicId,
  correlation_id: context?.correlationId || null,
  causation_id: context?.requestId || null,
  producer: 'backend-new',
  payload,
});

const USER_ACTION = Object.freeze({
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  DEACTIVATED: 'user.deactivated',
  REACTIVATED: 'user.reactivated',
  INVITED: 'user.invited',
  INVITATION_ACCEPTED: 'user.invitation.accepted',
  INVITATION_REVOKED: 'user.invitation.revoked',
  INVITATION_RESENT: 'user.invitation.resent',
  INVITATION_DENIED: 'user.invitation.denied',
});

const USER_OUTBOX_EVENT = Object.freeze({
  INVITED: 'user.invited.v1',
  ACTIVATED: 'user.activated.v1',
});

// Creates the users domain service.
const createUsersService = ({
  repository = defaultRepository,
  auditRecorder = recordAudit,
  transaction = runInTransaction,
  authService = null,
  branchesService = createBranchesService(),
} = {}) => {
  // Resolves and validates tenant context for staff operations.
  const resolveClinic = async ({ context, requestedClinicId = null, connection }) => {
    const clinicId = await resolveTenantTargetWithAudit({
      context,
      requestedClinicId,
      requireForPlatform: true,
      auditRecorder,
      connection,
      operation: 'users',
    });
    const clinic = await repository.findClinicById(clinicId, connection);
    if (!clinic) throw new ApiError(404, 'Clinic not found');
    return { clinicId, clinic };
  };

  // Requires the clinic to be active for writes.
  const requireWritableClinic = (clinic) => {
    assertClinicWritable(clinic);
  };

  // Requires an invitation tenant to still allow account activation.
  const requireInvitationClinicActive = async ({ clinicId, context, connection }) => {
    const clinic = await repository.findClinicById(clinicId, connection);
    try {
      requireWritableClinic(clinic);
      return clinic;
    } catch (error) {
      await auditRecorder({
        context: { ...context, clinicId },
        action: USER_ACTION.INVITATION_DENIED,
        moduleName: 'users',
        resourceType: 'user_invitation',
        severity: AUDIT_SEVERITY.WARNING,
        metadata: { reason: 'clinic_unavailable' },
      }, connection);
      throw new ApiError(403, 'Account unavailable');
    }
  };

  // Rejects user status changes that would remove tenant administration.
  const assertSafeUserStatusChange = async ({ context, clinic, clinicId, user, status, reason, connection }) => {
    if (!reason) throw new ApiError(400, 'Status change reason is required');
    if (status === USER_STATUS.ACTIVE) return;
    if (context.userId === user.id) throw new ApiError(403, 'Self deactivation is not allowed');
    if (clinic.owner_user_id === user.id) throw new ApiError(409, 'Clinic owner must be transferred before deactivation');
    if (await repository.isLastActiveTenantAdmin({ clinicId, userId: user.id }, connection)) {
      throw new ApiError(409, 'At least one active clinic administrator is required');
    }
  };

  // Reads the current authenticated user profile.
  const getCurrentUser = async ({ context }) => {
    const user = await repository.findUserById({
      userId: context.userId,
      clinicId: context.clinicId || null,
      isPlatform: Boolean(context.isPlatform),
    });
    if (!user) throw new ApiError(404, 'User not found');
    if (!context.isPlatform && user.clinic_id !== context.clinicId) throw new ApiError(403, 'Tenant ownership mismatch');
    return {
      user: sanitizeUser(user),
      access: {
        roles: context.roles || [],
        permissions: context.permissions || [],
        scopedPermissions: context.scopedPermissions || {},
        isPlatform: Boolean(context.isPlatform),
      },
    };
  };

  // Lists staff users inside one tenant.
  const listUsers = async ({ context, query = {}, requestedClinicId = null }) => {
    const { skip, take, page, limit } = pageInput(query);
    const { clinicId } = await resolveClinic({ context, requestedClinicId });
    const users = await repository.listUsers({
      clinicId,
      search: query.search || null,
      status: query.status || null,
      skip,
      take,
    });
    return { users: users.map(sanitizeUser), meta: { page, limit } };
  };

  // Gets one staff user inside one tenant.
  const getUser = async ({ context, userId, requestedClinicId = null }) => {
    const { clinicId } = await resolveClinic({ context, requestedClinicId });
    const user = await repository.findUserById({ userId, clinicId });
    if (!user) throw new ApiError(404, 'User not found');
    return { user: sanitizeUser(user) };
  };

  // Creates an active staff user.
  const createUser = async ({ context, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const email = String(payload.email).trim().toLowerCase();
    const loginScope = loginScopeForClinic(clinicId);
    const duplicate = await repository.findUserByEmailScope({ email, loginScope }, tx);
    if (duplicate) throw new ApiError(409, 'User email already exists for clinic');
    const user = await withPrismaErrorMapping(async () => repository.createUser({
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      full_name: payload.fullName,
      email,
      login_scope: loginScope,
      phone: payload.phone || null,
      password_hash: await hashPassword(payload.password),
      user_type: 'CLINIC_USER',
      status: payload.status || USER_STATUS.ACTIVE,
      profile: payload.profile || null,
      created_by: context.userId || null,
      updated_by: context.userId || null,
      is_deleted: false,
    }, tx), { unique: 'User email already exists for clinic', foreignKey: 'Related clinic is invalid' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: USER_ACTION.CREATED,
      moduleName: 'users',
      resourceType: 'user',
      resourceId: user.id,
      afterData: sanitizeUser(user),
    }, tx);
    return { user: sanitizeUser(user) };
  });

  // Updates a staff user.
  const updateUser = async ({ context, userId, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const existing = await repository.findUserById({ userId, clinicId }, tx);
    if (!existing) throw new ApiError(404, 'User not found');
    const updated = await withPrismaErrorMapping(() => repository.updateUser({
      userId,
      data: {
        ...(payload.fullName ? { full_name: payload.fullName } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'phone') ? { phone: payload.phone || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'profile') ? { profile: payload.profile || null } : {}),
        updated_by: context.userId || null,
      },
    }, tx), { unique: 'User email already exists for clinic', notFound: 'User not found' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: USER_ACTION.UPDATED,
      moduleName: 'users',
      resourceType: 'user',
      resourceId: userId,
      beforeData: sanitizeUser(existing),
      afterData: sanitizeUser(updated),
    }, tx);
    return { user: sanitizeUser(updated) };
  });

  // Changes staff user status and invalidates sessions.
  const changeUserStatus = async ({ context, userId, status, reason = null, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const existing = await repository.findUserById({ userId, clinicId }, tx);
    if (!existing) throw new ApiError(404, 'User not found');
    await assertSafeUserStatusChange({ context, clinic, clinicId, user: existing, status, reason, connection: tx });
    const updated = await withPrismaErrorMapping(() => repository.updateUser({
      userId,
      data: {
        status,
        token_version: { increment: 1 },
        updated_by: context.userId || null,
      },
    }, tx), { notFound: 'User not found' });
    await repository.revokeActiveRefreshTokensByUser(userId, tx);
    await auditRecorder({
      context: { ...context, clinicId },
      action: status === USER_STATUS.ACTIVE ? USER_ACTION.REACTIVATED : USER_ACTION.DEACTIVATED,
      moduleName: 'users',
      resourceType: 'user',
      resourceId: userId,
      severity: AUDIT_SEVERITY.WARNING,
      beforeData: { status: existing.status },
      afterData: { status },
      metadata: { reason },
    }, tx);
    return { user: sanitizeUser(updated) };
  });

  // Creates a single-use invitation and pending user.
  const inviteUser = async ({ context, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const email = String(payload.email).trim().toLowerCase();
    const loginScope = loginScopeForClinic(clinicId);
    const duplicate = await repository.findUserByEmailScope({ email, loginScope }, tx);
    if (duplicate && duplicate.status !== USER_STATUS.PENDING) throw new ApiError(409, 'User email already exists for clinic');
    const user = duplicate || await withPrismaErrorMapping(async () => repository.createUser({
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      full_name: payload.fullName,
      email,
      login_scope: loginScope,
      phone: payload.phone || null,
      password_hash: await hashPassword(createOpaqueToken()),
      user_type: 'CLINIC_USER',
      status: USER_STATUS.PENDING,
      created_by: context.userId || null,
      updated_by: context.userId || null,
      is_deleted: false,
    }, tx), { unique: 'User email already exists for clinic', foreignKey: 'Related clinic is invalid' });
    const token = createOpaqueToken();
    const invitation = await withPrismaErrorMapping(() => repository.createInvitation({
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      user_id: user.id,
      email,
      full_name: payload.fullName,
      token_hash: hashToken(token),
      status: 'PENDING',
      invited_by: context.userId || null,
      expires_at: new Date(Date.now() + ((payload.expiresInDays || 7) * 24 * 60 * 60 * 1000)),
      last_sent_at: new Date(),
    }, tx), { unique: 'Active invitation already exists for user email', foreignKey: 'Related invitation user is invalid' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: USER_ACTION.INVITED,
      moduleName: 'users',
      resourceType: 'user_invitation',
      resourceId: invitation.id,
      afterData: sanitizeInvitation(invitation),
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      eventName: USER_OUTBOX_EVENT.INVITED,
      clinicId,
      aggregateId: user.id,
      context,
      payload: { userId: user.id, invitationId: invitation.id, email },
    }), tx);
    return { invitation: sanitizeInvitation(invitation), invitationToken: token };
  });

  // Lists invitations inside one tenant.
  const listInvitations = async ({ context, query = {}, requestedClinicId = null }) => {
    const { skip, take, page, limit } = pageInput(query);
    const { clinicId } = await resolveClinic({ context, requestedClinicId });
    const invitations = await repository.listInvitations({ clinicId, status: query.status || null, skip, take });
    return { invitations: invitations.map(sanitizeInvitation), meta: { page, limit } };
  };

  // Revokes a pending invitation.
  const revokeInvitation = async ({ context, invitationId, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const invitation = await repository.findInvitationById({ clinicId, invitationId }, tx);
    if (!invitation || invitation.status !== 'PENDING') throw new ApiError(404, 'Invitation not found');
    const updated = await withPrismaErrorMapping(() => repository.updateInvitation({
      invitationId,
      data: {
        status: 'REVOKED',
        revoked_at: new Date(),
        revoked_by: context.userId || null,
        active_invitation_key: null,
      },
    }, tx), { notFound: 'Invitation not found' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: USER_ACTION.INVITATION_REVOKED,
      moduleName: 'users',
      resourceType: 'user_invitation',
      resourceId: invitationId,
      beforeData: sanitizeInvitation(invitation),
      afterData: sanitizeInvitation(updated),
      severity: AUDIT_SEVERITY.WARNING,
    }, tx);
    return { invitation: sanitizeInvitation(updated) };
  });

  // Resends an invitation by rotating its token.
  const resendInvitation = async ({ context, invitationId, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const invitation = await repository.findInvitationById({ clinicId, invitationId }, tx);
    if (!invitation || invitation.status !== 'PENDING') throw new ApiError(404, 'Invitation not found');
    const token = createOpaqueToken();
    const updated = await withPrismaErrorMapping(() => repository.updateInvitation({
      invitationId,
      data: {
        token_hash: hashToken(token),
        resend_count: { increment: 1 },
        last_sent_at: new Date(),
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
      },
    }, tx), { unique: 'Active invitation already exists for user email', notFound: 'Invitation not found' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: USER_ACTION.INVITATION_RESENT,
      moduleName: 'users',
      resourceType: 'user_invitation',
      resourceId: invitationId,
      afterData: sanitizeInvitation(updated),
    }, tx);
    return { invitation: sanitizeInvitation(updated), invitationToken: token };
  });

  // Accepts a public invitation token and starts a browser session.
  const acceptInvitation = async ({ token, password, context = {} }) => {
    let acceptedUserId = null;
    let acceptedClinicId = null;
    const result = await transaction(async (tx) => {
      const invitation = await repository.findInvitationByTokenHash(hashToken(token), tx);
      const now = new Date();
      if (!invitation || invitation.status !== 'PENDING' || invitation.accepted_at || invitation.revoked_at) {
        await auditRecorder({
          context,
          action: USER_ACTION.INVITATION_DENIED,
          moduleName: 'users',
          resourceType: 'user_invitation',
          severity: AUDIT_SEVERITY.WARNING,
          metadata: { reason: 'missing_or_replayed' },
        }, tx);
        throw new ApiError(401, 'Invitation is invalid');
      }
      if (invitation.expires_at <= now) {
        await withPrismaErrorMapping(() => repository.updateInvitation({ invitationId: invitation.id, data: { status: 'EXPIRED', active_invitation_key: null } }, tx), { notFound: 'Invitation not found' });
        await auditRecorder({
          context: { ...context, clinicId: invitation.clinic_id },
          action: USER_ACTION.INVITATION_DENIED,
          moduleName: 'users',
          resourceType: 'user_invitation',
          resourceId: invitation.id,
          severity: AUDIT_SEVERITY.WARNING,
          metadata: { reason: 'expired' },
        }, tx);
        throw new ApiError(410, 'Invitation expired');
      }
      await requireInvitationClinicActive({ clinicId: invitation.clinic_id, context, connection: tx });
      const user = await withPrismaErrorMapping(async () => repository.updateUser({
        userId: invitation.user_id,
        data: {
          password_hash: await hashPassword(password),
          status: USER_STATUS.ACTIVE,
          token_version: { increment: 1 },
          updated_by: invitation.user_id,
        },
      }, tx), { notFound: 'Invitation user not found' });
      const updatedInvitation = await withPrismaErrorMapping(() => repository.updateInvitation({
        invitationId: invitation.id,
        data: {
          status: 'ACCEPTED',
          accepted_at: now,
          active_invitation_key: null,
        },
      }, tx), { notFound: 'Invitation not found' });
      await auditRecorder({
        context: { ...context, userId: user.id, clinicId: invitation.clinic_id },
        action: USER_ACTION.INVITATION_ACCEPTED,
        moduleName: 'users',
        resourceType: 'user_invitation',
        resourceId: invitation.id,
        afterData: sanitizeInvitation(updatedInvitation),
      }, tx);
      await repository.createOutboxEvent(outboxPayload({
        id: crypto.randomUUID(),
        eventName: USER_OUTBOX_EVENT.ACTIVATED,
        clinicId: invitation.clinic_id,
        aggregateId: user.id,
        context,
        payload: { userId: user.id, invitationId: invitation.id },
      }), tx);
      acceptedUserId = user.id;
      acceptedClinicId = invitation.clinic_id;
      return { user: sanitizeUser(user), invitation: sanitizeInvitation(updatedInvitation) };
    });
    if (authService?.issueSessionForUser && acceptedUserId) {
      const session = await authService.issueSessionForUser({ userId: acceptedUserId, clinicId: acceptedClinicId, context });
      return { ...result, ...session };
    }
    return result;
  };

  // Delegates user branch assignment listing to the Branches service.
  const listUserBranchAssignments = (input) => branchesService.listUserBranchAssignments(input);

  // Delegates user branch assignment creation to the Branches service.
  const assignUserToBranch = (input) => branchesService.assignUserToBranch(input);

  // Delegates user branch assignment revocation to the Branches service.
  const revokeUserBranchAssignment = (input) => branchesService.revokeUserBranchAssignment(input);

  // Delegates primary branch assignment changes to the Branches service.
  const setPrimaryUserBranchAssignment = (input) => branchesService.setPrimaryUserBranchAssignment(input);

  return {
    acceptInvitation,
    assignUserToBranch,
    changeUserStatus,
    createUser,
    getCurrentUser,
    getUser,
    inviteUser,
    listInvitations,
    listUserBranchAssignments,
    listUsers,
    resendInvitation,
    revokeInvitation,
    revokeUserBranchAssignment,
    setPrimaryUserBranchAssignment,
    updateUser,
  };
};

module.exports = { createUsersService, sanitizeInvitation, sanitizeUser };
