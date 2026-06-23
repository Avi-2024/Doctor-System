/**
 * Branches Service
 * Owns tenant-scoped branch CRUD and user-branch assignment behavior.
 */

const crypto = require('node:crypto');
const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { ApiError } = require('../../common/errors/ApiError');
const { resolveTenantTargetWithAudit } = require('../../common/middleware/tenantOverride');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { withPrismaErrorMapping } = require('../../common/utils/prismaErrors');
const { recordAudit } = require('../audit/audit.service');
const { assertClinicWritable } = require('../clinics/clinics.lifecycle');
const { BRANCH_ACTION, BRANCH_OUTBOX_EVENT, BRANCH_STATUS } = require('./branches.constants');
const defaultRepository = require('./branches.repository');

// Normalizes branch records for API responses.
const normalizeBranch = (branch) => branch ? ({
  id: branch.id,
  clinicId: branch.clinic_id,
  branchCode: branch.branch_code,
  name: branch.name,
  timezone: branch.timezone,
  contact: branch.contact || null,
  address: branch.address || null,
  isPrimary: branch.is_primary,
  status: branch.status,
  createdAt: branch.created_at || null,
  updatedAt: branch.updated_at || null,
}) : null;

// Normalizes branch assignment records for API responses.
const normalizeAssignment = (assignment) => assignment ? ({
  id: assignment.id,
  clinicId: assignment.clinic_id,
  userId: assignment.user_id,
  branchId: assignment.branch_id,
  isPrimary: assignment.is_primary,
  branch: assignment.branch ? normalizeBranch(assignment.branch) : undefined,
}) : null;

// Builds pagination values with safe defaults.
const pageInput = ({ page = 1, limit = 50 } = {}) => {
  const take = Math.min(Number(limit) || 50, 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  return { skip: (currentPage - 1) * take, take, page: currentPage, limit: take };
};

// Checks whether the current context has a named permission.
const contextHasPermission = (context, permission) => Array.isArray(context?.permissions) && context.permissions.includes(permission);

// Builds a safe outbox event payload.
const outboxPayload = ({ id, eventName, clinicId, aggregateId, context, payload }) => ({
  id,
  event_name: eventName,
  event_version: '1',
  aggregate_type: 'branch',
  aggregate_id: aggregateId,
  tenant_id: clinicId,
  correlation_id: context?.correlationId || null,
  causation_id: context?.requestId || null,
  producer: 'backend-new',
  payload,
});

// Creates the branches domain service.
const createBranchesService = ({
  repository = defaultRepository,
  auditRecorder = recordAudit,
  transaction = runInTransaction,
} = {}) => {
  // Resolves and validates the target clinic for a branch operation.
  const resolveClinic = async ({ context, requestedClinicId, connection }) => {
    const clinicId = await resolveTenantTargetWithAudit({
      context,
      requestedClinicId,
      requireForPlatform: true,
      auditRecorder,
      connection,
      operation: 'branches',
    });
    const clinic = await repository.findClinicById(clinicId, connection);
    if (!clinic) throw new ApiError(404, 'Clinic not found');
    return { clinicId, clinic };
  };

  // Throws if a clinic cannot accept writes.
  const requireWritableClinic = (clinic) => {
    assertClinicWritable(clinic);
  };

  // Lists branches inside one tenant.
  const listBranches = async ({ context, query = {}, requestedClinicId = null }) => {
    const { skip, take, page, limit } = pageInput(query);
    const { clinicId } = await resolveClinic({ context, requestedClinicId });
    const branches = await repository.listBranches({
      clinicId,
      search: query.search || null,
      status: query.status || null,
      skip,
      take,
    });
    return { branches: branches.map(normalizeBranch), meta: { page, limit } };
  };

  // Gets one branch inside one tenant.
  const getBranch = async ({ context, branchId, requestedClinicId = null }) => {
    const { clinicId } = await resolveClinic({ context, requestedClinicId });
    const branch = await repository.findBranchById({ clinicId, branchId });
    if (!branch) throw new ApiError(404, 'Branch not found');
    return { branch: normalizeBranch(branch) };
  };

  // Creates a branch inside one tenant.
  const createBranch = async ({ context, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    if (payload.isPrimary && !contextHasPermission(context, 'branches.set_primary')) throw new ApiError(403, 'Required permission missing');
    if (payload.isPrimary) await repository.clearPrimaryBranch({ clinicId }, tx);
    const branch = await withPrismaErrorMapping(() => repository.createBranch({
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      branch_code: payload.branchCode,
      name: payload.name,
      timezone: payload.timezone || clinic.timezone || 'UTC',
      contact: payload.contact || null,
      address: payload.address || null,
      is_primary: Boolean(payload.isPrimary),
      primary_branch_key: payload.isPrimary ? repository.primaryBranchKey(clinicId) : null,
      status: BRANCH_STATUS.ACTIVE,
      created_by: context.userId || null,
      updated_by: context.userId || null,
      is_deleted: false,
    }, tx), { unique: 'Branch code or primary branch already exists', foreignKey: 'Related clinic is invalid' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: BRANCH_ACTION.CREATED,
      moduleName: 'branches',
      resourceType: 'branch',
      resourceId: branch.id,
      afterData: normalizeBranch(branch),
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      eventName: BRANCH_OUTBOX_EVENT.CREATED,
      clinicId,
      aggregateId: branch.id,
      context,
      payload: { clinicId, branchId: branch.id },
    }), tx);
    return { branch: normalizeBranch(branch) };
  });

  // Updates a branch inside one tenant.
  const updateBranch = async ({ context, branchId, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const existing = await repository.findBranchById({ clinicId, branchId }, tx);
    if (!existing) throw new ApiError(404, 'Branch not found');
    if (payload.isPrimary && !contextHasPermission(context, 'branches.set_primary')) throw new ApiError(403, 'Required permission missing');
    if (payload.isPrimary) await repository.clearPrimaryBranch({ clinicId }, tx);
    const updated = await withPrismaErrorMapping(() => repository.updateBranch({
      branchId,
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.timezone ? { timezone: payload.timezone } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'contact') ? { contact: payload.contact || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'address') ? { address: payload.address || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'isPrimary') ? {
          is_primary: Boolean(payload.isPrimary),
          primary_branch_key: payload.isPrimary ? repository.primaryBranchKey(clinicId) : null,
        } : {}),
        updated_by: context.userId || null,
      },
    }, tx), { unique: 'Branch code or primary branch already exists', notFound: 'Branch not found' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: payload.isPrimary ? BRANCH_ACTION.PRIMARY_CHANGED : BRANCH_ACTION.UPDATED,
      moduleName: 'branches',
      resourceType: 'branch',
      resourceId: branchId,
      beforeData: normalizeBranch(existing),
      afterData: normalizeBranch(updated),
    }, tx);
    return { branch: normalizeBranch(updated) };
  });

  // Changes branch lifecycle status.
  const changeBranchStatus = async ({ context, branchId, status, reason = null, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const existing = await repository.findBranchById({ clinicId, branchId }, tx);
    if (!existing) throw new ApiError(404, 'Branch not found');
    const permission = status === BRANCH_STATUS.ACTIVE ? 'branches.activate' : 'branches.deactivate';
    if (!contextHasPermission(context, permission)) throw new ApiError(403, 'Required permission missing');
    const updated = await withPrismaErrorMapping(() => repository.updateBranch({
      branchId,
      data: {
        status,
        updated_by: context.userId || null,
        ...(status !== BRANCH_STATUS.ACTIVE ? { primary_branch_key: null, is_primary: false } : {}),
      },
    }, tx), { notFound: 'Branch not found' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: BRANCH_ACTION.STATUS_CHANGED,
      moduleName: 'branches',
      resourceType: 'branch',
      resourceId: branchId,
      severity: AUDIT_SEVERITY.WARNING,
      beforeData: { status: existing.status },
      afterData: { status },
      metadata: { reason },
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      eventName: BRANCH_OUTBOX_EVENT.STATUS_CHANGED,
      clinicId,
      aggregateId: branchId,
      context,
      payload: { clinicId, branchId, previousStatus: existing.status, status, reason },
    }), tx);
    return { branch: normalizeBranch(updated) };
  });

  // Lists active branch assignments for a user.
  const listUserBranchAssignments = async ({ context, userId, requestedClinicId = null }) => {
    const { clinicId } = await resolveClinic({ context, requestedClinicId });
    const user = await repository.findUserById({ clinicId, userId });
    if (!user) throw new ApiError(404, 'User not found');
    const assignments = await repository.listUserBranchAssignments({ clinicId, userId });
    return { assignments: assignments.map(normalizeAssignment) };
  };

  // Assigns a user to a branch in the same tenant.
  const assignUserToBranch = async ({ context, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const user = await repository.findUserById({ clinicId, userId: payload.userId }, tx);
    const branch = await repository.findBranchById({ clinicId, branchId: payload.branchId }, tx);
    if (!user) throw new ApiError(404, 'User not found');
    if (!branch) throw new ApiError(404, 'Branch not found');
    const existing = await repository.findActiveBranchAssignment({
      clinicId,
      userId: payload.userId,
      branchId: payload.branchId,
    }, tx);
    if (existing) return { assignment: normalizeAssignment(existing), alreadyAssigned: true };
    if (payload.isPrimary) await repository.clearPrimaryBranchAssignment({ clinicId, userId: payload.userId }, tx);
    const assignment = await withPrismaErrorMapping(() => repository.assignUserToBranch({
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      user_id: payload.userId,
      branch_id: payload.branchId,
      is_primary: Boolean(payload.isPrimary),
      assigned_by: context.userId || null,
      created_by: context.userId || null,
      updated_by: context.userId || null,
      is_deleted: false,
    }, tx), { unique: 'Branch assignment already exists', foreignKey: 'Related user or branch is invalid' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: 'branch.user_assigned',
      moduleName: 'branches',
      resourceType: 'user_branch_assignment',
      resourceId: assignment.id,
      afterData: normalizeAssignment(assignment),
    }, tx);
    return { assignment: normalizeAssignment(assignment), alreadyAssigned: false };
  });

  // Revokes a user branch assignment.
  const revokeUserBranchAssignment = async ({ context, userId, assignmentId, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const assignment = await repository.findBranchAssignmentById({ clinicId, assignmentId }, tx);
    if (!assignment || assignment.revoked_at) throw new ApiError(404, 'Branch assignment not found');
    if (assignment.user_id !== userId) throw new ApiError(404, 'Branch assignment not found');
    const revoked = await withPrismaErrorMapping(() => repository.revokeBranchAssignment({
      assignmentId,
      revokedBy: context.userId || null,
    }, tx), { notFound: 'Branch assignment not found' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: 'branch.user_assignment_revoked',
      moduleName: 'branches',
      resourceType: 'user_branch_assignment',
      resourceId: assignmentId,
      beforeData: normalizeAssignment(assignment),
      afterData: { revokedAt: revoked.revoked_at },
    }, tx);
    return { assignment: normalizeAssignment(revoked), revoked: true };
  });

  // Sets an existing user branch assignment as primary.
  const setPrimaryUserBranchAssignment = async ({ context, userId, assignmentId, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId, clinic } = await resolveClinic({ context, requestedClinicId, connection: tx });
    requireWritableClinic(clinic);
    const assignment = await repository.findBranchAssignmentById({ clinicId, assignmentId }, tx);
    if (!assignment || assignment.revoked_at) throw new ApiError(404, 'Branch assignment not found');
    if (assignment.user_id !== userId) throw new ApiError(404, 'Branch assignment not found');
    await repository.clearPrimaryBranchAssignment({ clinicId, userId: assignment.user_id }, tx);
    const updated = await withPrismaErrorMapping(() => repository.setPrimaryBranchAssignment({
      assignmentId,
      clinicId,
      userId: assignment.user_id,
      updatedBy: context.userId || null,
    }, tx), { unique: 'Primary branch assignment already exists', notFound: 'Branch assignment not found' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: 'branch.user_assignment_primary_changed',
      moduleName: 'branches',
      resourceType: 'user_branch_assignment',
      resourceId: assignmentId,
      beforeData: normalizeAssignment(assignment),
      afterData: normalizeAssignment(updated),
    }, tx);
    return { assignment: normalizeAssignment(updated) };
  });

  return {
    assignUserToBranch,
    changeBranchStatus,
    createBranch,
    getBranch,
    listBranches,
    listUserBranchAssignments,
    revokeUserBranchAssignment,
    setPrimaryUserBranchAssignment,
    updateBranch,
  };
};

module.exports = { createBranchesService, normalizeAssignment, normalizeBranch };
