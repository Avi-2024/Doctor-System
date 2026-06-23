/**
 * Clinics Repository
 * Owns Prisma access for clinic onboarding and lifecycle operations.
 */

const { prisma, model } = require('../../database/prisma');
const { activeKey } = require('../../common/utils/idempotency');

const clinics = (connection) => model(connection || prisma, 'clinics');
const users = (connection) => model(connection || prisma, 'users');
const branches = (connection) => model(connection || prisma, 'clinic_branches');
const settings = (connection) => model(connection || prisma, 'settings');
const settingHistory = (connection) => model(connection || prisma, 'setting_history');
const subscriptionPlans = (connection) => model(connection || prisma, 'subscription_plans');
const clinicSubscriptions = (connection) => model(connection || prisma, 'clinic_subscriptions');
const roles = (connection) => model(connection || prisma, 'roles');
const userRoles = (connection) => model(connection || prisma, 'user_roles');
const outboxEvents = (connection) => model(connection || prisma, 'outbox_events');

// Builds the MySQL-safe primary branch uniqueness key.
const primaryBranchKey = (clinicId) => activeKey(clinicId, 'primary_branch');

// Builds the MySQL-safe active subscription uniqueness key.
const activeSubscriptionKey = (clinicId) => activeKey(clinicId, 'active_subscription');

// Builds the MySQL-safe active role assignment uniqueness key.
const activeRoleAssignmentKey = ({ clinicId, userId, roleId }) => activeKey(clinicId || 'platform', userId, roleId);

// Finds a clinic by id, excluding soft-deleted records.
const findClinicById = async (clinicId, connection) => clinics(connection).findFirst({
  where: { id: clinicId, is_deleted: false },
});

// Finds a clinic by onboarding idempotency key.
const findClinicByIdempotencyKey = async (idempotencyKey, connection) => clinics(connection).findFirst({
  where: { onboarding_idempotency_key: idempotencyKey, is_deleted: false },
  include: {
    branches: true,
    subscriptions: { include: { plan: true } },
    owner_user: true,
  },
});

// Lists clinics for platform administration.
const listClinics = async ({ search = null, status = null, skip = 0, take = 50 }, connection) => clinics(connection).findMany({
  where: {
    is_deleted: false,
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { code: { contains: search } },
      ],
    } : {}),
  },
  orderBy: [{ created_at: 'desc' }],
  skip,
  take,
});

// Creates a clinic tenant root record.
const createClinic = async (payload, connection) => clinics(connection).create({ data: payload });

// Updates a clinic tenant root record.
const updateClinic = async ({ clinicId, data }, connection) => clinics(connection).update({
  where: { id: clinicId },
  data,
});

// Creates a tenant owner or staff user.
const createUser = async (payload, connection) => users(connection).create({ data: payload });

// Finds an existing user by login scope and email.
const findUserByEmailScope = async ({ email, loginScope }, connection) => users(connection).findFirst({
  where: {
    email: String(email || '').trim().toLowerCase(),
    login_scope: loginScope,
    is_deleted: false,
  },
});

// Updates the owner pointer on a clinic.
const updateClinicOwner = async ({ clinicId, ownerUserId, updatedBy }, connection) => clinics(connection).update({
  where: { id: clinicId },
  data: {
    owner_user_id: ownerUserId,
    updated_by: updatedBy || null,
  },
});

// Creates a branch record.
const createBranch = async (payload, connection) => branches(connection).create({ data: payload });

// Creates or updates a default trial subscription plan.
const upsertDefaultPlan = async (payload, connection) => subscriptionPlans(connection).upsert({
  where: { code: payload.code },
  create: payload,
  update: {
    name: payload.name,
    trial_days: payload.trial_days,
    status: payload.status,
    is_system: true,
  },
});

// Creates a clinic subscription record.
const createSubscription = async (payload, connection) => clinicSubscriptions(connection).create({ data: payload });

// Finds a system role by code.
const findSystemRoleByCode = async (code, connection) => roles(connection).findFirst({
  where: {
    code,
    is_system: true,
    is_deleted: false,
  },
});

// Creates a user-role assignment for onboarding.
const createUserRole = async (payload, connection) => userRoles(connection).create({
  data: {
    ...payload,
    active_assignment_key: activeRoleAssignmentKey({
      clinicId: payload.clinic_id || null,
      userId: payload.user_id,
      roleId: payload.role_id,
    }),
  },
});

// Creates a setting and its first history row.
const createSetting = async (payload, connection) => settings(connection).create({ data: payload });

// Creates a setting history record.
const createSettingHistory = async (payload, connection) => settingHistory(connection).create({ data: payload });

// Creates an outbox event for later worker delivery.
const createOutboxEvent = async (payload, connection) => outboxEvents(connection).create({ data: payload });

module.exports = {
  activeRoleAssignmentKey,
  activeSubscriptionKey,
  createBranch,
  createClinic,
  createOutboxEvent,
  createSetting,
  createSettingHistory,
  createSubscription,
  createUser,
  createUserRole,
  findClinicById,
  findClinicByIdempotencyKey,
  findSystemRoleByCode,
  findUserByEmailScope,
  listClinics,
  primaryBranchKey,
  updateClinic,
  updateClinicOwner,
  upsertDefaultPlan,
};
