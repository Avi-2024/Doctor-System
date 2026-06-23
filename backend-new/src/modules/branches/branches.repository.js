/**
 * Branches Repository
 * Owns Prisma access for branch CRUD and branch assignment queries.
 */

const { prisma, model } = require('../../database/prisma');
const { activeKey } = require('../../common/utils/idempotency');

const clinics = (connection) => model(connection || prisma, 'clinics');
const branches = (connection) => model(connection || prisma, 'clinic_branches');
const users = (connection) => model(connection || prisma, 'users');
const branchAssignments = (connection) => model(connection || prisma, 'user_branch_assignments');
const outboxEvents = (connection) => model(connection || prisma, 'outbox_events');

// Builds a unique key for an active user-branch assignment.
const activeBranchAssignmentKey = ({ clinicId, userId, branchId }) => activeKey(clinicId, userId, branchId);

// Builds a unique key for a user's active primary branch assignment.
const activePrimaryBranchAssignmentKey = ({ clinicId, userId }) => activeKey(clinicId, userId, 'primary_branch_assignment');

// Builds a unique key for a clinic's active primary branch.
const primaryBranchKey = (clinicId) => activeKey(clinicId, 'primary_branch');

// Finds a clinic by id.
const findClinicById = async (clinicId, connection) => clinics(connection).findFirst({
  where: { id: clinicId, is_deleted: false },
});

// Lists branches in a clinic.
const listBranches = async ({ clinicId, search = null, status = null, skip = 0, take = 50 }, connection) => branches(connection).findMany({
  where: {
    clinic_id: clinicId,
    is_deleted: false,
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { branch_code: { contains: search } },
      ],
    } : {}),
  },
  orderBy: [{ is_primary: 'desc' }, { name: 'asc' }],
  skip,
  take,
});

// Finds one branch by tenant and id.
const findBranchById = async ({ clinicId, branchId }, connection) => branches(connection).findFirst({
  where: { id: branchId, clinic_id: clinicId, is_deleted: false },
});

// Creates a branch.
const createBranch = async (payload, connection) => branches(connection).create({ data: payload });

// Updates a branch.
const updateBranch = async ({ branchId, data }, connection) => branches(connection).update({
  where: { id: branchId },
  data,
});

// Clears the current primary branch for a clinic.
const clearPrimaryBranch = async ({ clinicId }, connection) => branches(connection).updateMany({
  where: {
    clinic_id: clinicId,
    is_primary: true,
    is_deleted: false,
  },
  data: {
    is_primary: false,
    primary_branch_key: null,
  },
});

// Finds a user in a clinic.
const findUserById = async ({ clinicId, userId }, connection) => users(connection).findFirst({
  where: { id: userId, clinic_id: clinicId, is_deleted: false },
});

// Lists a user's active branch assignments.
const listUserBranchAssignments = async ({ clinicId, userId }, connection) => branchAssignments(connection).findMany({
  where: { clinic_id: clinicId, user_id: userId, is_deleted: false, revoked_at: null },
  include: { branch: true },
  orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
});

// Finds a branch assignment by id.
const findBranchAssignmentById = async ({ clinicId, assignmentId }, connection) => branchAssignments(connection).findFirst({
  where: { id: assignmentId, clinic_id: clinicId, is_deleted: false },
  include: { branch: true, user: true },
});

// Finds an active assignment for idempotent assign behavior.
const findActiveBranchAssignment = async ({ clinicId, userId, branchId }, connection) => branchAssignments(connection).findFirst({
  where: {
    active_assignment_key: activeBranchAssignmentKey({ clinicId, userId, branchId }),
    is_deleted: false,
    revoked_at: null,
  },
});

// Creates a user-branch assignment.
const assignUserToBranch = async (payload, connection) => branchAssignments(connection).create({
  data: {
    ...payload,
    active_assignment_key: activeBranchAssignmentKey({
      clinicId: payload.clinic_id,
      userId: payload.user_id,
      branchId: payload.branch_id,
    }),
    active_primary_assignment_key: payload.is_primary
      ? activePrimaryBranchAssignmentKey({ clinicId: payload.clinic_id, userId: payload.user_id })
      : null,
  },
});

// Revokes a user-branch assignment.
const revokeBranchAssignment = async ({ assignmentId, revokedBy, now = new Date() }, connection) => branchAssignments(connection).update({
  where: { id: assignmentId },
  data: {
    revoked_at: now,
    revoked_by: revokedBy || null,
    active_assignment_key: null,
    active_primary_assignment_key: null,
    updated_by: revokedBy || null,
  },
});

// Clears a user's current primary branch assignment.
const clearPrimaryBranchAssignment = async ({ clinicId, userId }, connection) => branchAssignments(connection).updateMany({
  where: {
    clinic_id: clinicId,
    user_id: userId,
    is_primary: true,
    is_deleted: false,
    revoked_at: null,
  },
  data: {
    is_primary: false,
    active_primary_assignment_key: null,
  },
});

// Marks a branch assignment as the user's primary assignment.
const setPrimaryBranchAssignment = async ({ assignmentId, clinicId, userId, updatedBy }, connection) => branchAssignments(connection).update({
  where: { id: assignmentId },
  data: {
    is_primary: true,
    active_primary_assignment_key: activePrimaryBranchAssignmentKey({ clinicId, userId }),
    updated_by: updatedBy || null,
  },
});

// Creates an outbox event for later worker delivery.
const createOutboxEvent = async (payload, connection) => outboxEvents(connection).create({ data: payload });

module.exports = {
  activeBranchAssignmentKey,
  activePrimaryBranchAssignmentKey,
  assignUserToBranch,
  clearPrimaryBranch,
  clearPrimaryBranchAssignment,
  createBranch,
  createOutboxEvent,
  findActiveBranchAssignment,
  findBranchAssignmentById,
  findBranchById,
  findClinicById,
  findUserById,
  listBranches,
  listUserBranchAssignments,
  primaryBranchKey,
  revokeBranchAssignment,
  setPrimaryBranchAssignment,
  updateBranch,
};
