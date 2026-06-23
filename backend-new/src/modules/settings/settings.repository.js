/**
 * Settings Repository
 * Owns Prisma access for scoped settings and history.
 */

const { prisma, model } = require('../../database/prisma');
const { activeKey } = require('../../common/utils/idempotency');

const clinics = (connection) => model(connection || prisma, 'clinics');
const branches = (connection) => model(connection || prisma, 'clinic_branches');
const users = (connection) => model(connection || prisma, 'users');
const settings = (connection) => model(connection || prisma, 'settings');
const settingHistory = (connection) => model(connection || prisma, 'setting_history');
const outboxEvents = (connection) => model(connection || prisma, 'outbox_events');

// Builds the MySQL-safe active setting uniqueness key.
const activeSettingKey = ({ clinicId = null, branchId = null, userId = null, scope, settingKey }) => activeKey(
  clinicId || 'platform',
  branchId || 'no_branch',
  userId || 'no_user',
  scope,
  settingKey,
);

// Finds a clinic by id.
const findClinicById = async (clinicId, connection) => clinics(connection).findFirst({
  where: { id: clinicId, is_deleted: false },
});

// Finds a branch by id inside a clinic.
const findBranchById = async ({ clinicId, branchId }, connection) => branches(connection).findFirst({
  where: { id: branchId, clinic_id: clinicId, is_deleted: false },
});

// Finds a user by id inside a clinic.
const findUserById = async ({ clinicId, userId }, connection) => users(connection).findFirst({
  where: { id: userId, clinic_id: clinicId, is_deleted: false },
});

// Lists active settings for a scope.
const listSettings = async ({ clinicId = null, scope = null, skip = 0, take = 50 }, connection) => settings(connection).findMany({
  where: {
    is_deleted: false,
    ...(clinicId ? { clinic_id: clinicId } : {}),
    ...(scope ? { scope } : {}),
  },
  orderBy: [{ setting_key: 'asc' }],
  skip,
  take,
});

// Finds an active setting by its deterministic key.
const findSettingByActiveKey = async (key, connection) => settings(connection).findFirst({
  where: { active_setting_key: key, is_deleted: false },
});

// Creates a setting.
const createSetting = async (payload, connection) => settings(connection).create({ data: payload });

// Updates a setting.
const updateSetting = async ({ settingId, data }, connection) => settings(connection).update({
  where: { id: settingId },
  data,
});

// Creates setting history.
const createSettingHistory = async (payload, connection) => settingHistory(connection).create({ data: payload });

// Creates an outbox event for later worker delivery.
const createOutboxEvent = async (payload, connection) => outboxEvents(connection).create({ data: payload });

module.exports = {
  activeSettingKey,
  createOutboxEvent,
  createSetting,
  createSettingHistory,
  findBranchById,
  findClinicById,
  findSettingByActiveKey,
  findUserById,
  listSettings,
  updateSetting,
};
