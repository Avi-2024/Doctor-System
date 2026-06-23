/**
 * Settings Service
 * Owns scoped tenant settings validation, history, audit, and redaction.
 */

const crypto = require('node:crypto');
const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { ApiError } = require('../../common/errors/ApiError');
const { resolveTenantTargetWithAudit } = require('../../common/middleware/tenantOverride');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { withPrismaErrorMapping } = require('../../common/utils/prismaErrors');
const { redactValue } = require('../../common/utils/redact');
const {
  decryptSettingValue,
  encryptedValueSummary,
  encryptSettingValue,
  isEncryptedEnvelope,
} = require('../../common/utils/settingsEncryption');
const { recordAudit } = require('../audit/audit.service');
const { assertClinicWritable } = require('../clinics/clinics.lifecycle');
const {
  ALLOWED_SETTING_KEYS,
  SETTING_ACTION,
  SETTING_OUTBOX_EVENT,
  SETTING_SCOPE,
  SETTING_STATUS,
  isSensitiveSettingKey,
} = require('./settings.constants');
const defaultRepository = require('./settings.repository');

// Normalizes setting records for API responses.
const normalizeSetting = (setting, { revealSensitive = false } = {}) => {
  if (!setting) return null;
  const sensitive = isSensitiveSettingKey(setting.setting_key);
  const value = sensitive && revealSensitive ? decryptSettingValue(setting.value) : setting.value;
  return {
    id: setting.id,
    clinicId: setting.clinic_id || null,
    branchId: setting.branch_id || null,
    userId: setting.user_id || null,
    key: setting.setting_key,
    scope: setting.scope,
    value: sensitive && !revealSensitive ? redactValue(setting.value) : value,
    isEncrypted: setting.is_encrypted,
    status: setting.status,
    isSensitive: sensitive,
    updatedAt: setting.updated_at || null,
  };
};

// Builds pagination values with safe defaults.
const pageInput = ({ page = 1, limit = 50 } = {}) => {
  const take = Math.min(Number(limit) || 50, 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  return { skip: (currentPage - 1) * take, take, page: currentPage, limit: take };
};

// Checks if the actor holds a permission.
const hasPermission = (context, permission) => Array.isArray(context?.permissions) && context.permissions.includes(permission);

// Summarizes setting values without leaking sensitive plaintext.
const safeValueSummary = (value, { sensitive = false } = {}) => {
  if (!sensitive) return encryptedValueSummary(value);
  if (isEncryptedEnvelope(value)) return encryptedValueSummary(value);
  return redactValue(value);
};

// Builds a safe outbox event payload.
const outboxPayload = ({ id, clinicId, settingKey, context, payload }) => ({
  id,
  event_name: SETTING_OUTBOX_EVENT.UPDATED,
  event_version: '1',
  aggregate_type: 'setting',
  aggregate_id: id,
  tenant_id: clinicId || null,
  correlation_id: context?.correlationId || null,
  causation_id: context?.requestId || null,
  producer: 'backend-new',
  payload: { settingKey, ...payload },
});

// Creates the settings domain service.
const createSettingsService = ({
  repository = defaultRepository,
  auditRecorder = recordAudit,
  transaction = runInTransaction,
} = {}) => {
  // Resolves setting scope ownership.
  const resolveScope = async ({ context, requestedClinicId = null, scope, branchId = null, userId = null, connection }) => {
    if (!ALLOWED_SETTING_KEYS.length) throw new ApiError(500, 'Settings catalog is not initialized', null, { expose: false });
    if (scope === SETTING_SCOPE.PLATFORM) {
      if (!context.isPlatform) throw new ApiError(403, 'Platform settings require platform access');
      return { clinicId: null, branchId: null, userId: null, clinic: null };
    }
    const clinicId = await resolveTenantTargetWithAudit({
      context,
      requestedClinicId,
      requireForPlatform: true,
      auditRecorder,
      connection,
      operation: 'settings',
    });
    const clinic = await repository.findClinicById(clinicId, connection);
    if (!clinic) throw new ApiError(404, 'Clinic not found');
    if (scope === SETTING_SCOPE.BRANCH) {
      if (!branchId) throw new ApiError(400, 'Branch scope requires branchId');
      const branch = await repository.findBranchById({ clinicId, branchId }, connection);
      if (!branch) throw new ApiError(404, 'Branch not found');
    }
    if (scope === SETTING_SCOPE.USER) {
      if (!userId) throw new ApiError(400, 'User scope requires userId');
      const user = await repository.findUserById({ clinicId, userId }, connection);
      if (!user) throw new ApiError(404, 'User not found');
    }
    return {
      clinicId,
      branchId: scope === SETTING_SCOPE.BRANCH ? branchId : null,
      userId: scope === SETTING_SCOPE.USER ? userId : null,
      clinic,
    };
  };

  // Lists settings visible to the current actor.
  const listSettings = async ({ context, query = {}, requestedClinicId = null }) => {
    const { skip, take, page, limit } = pageInput(query);
    const scope = query.scope || null;
    const clinicId = scope === SETTING_SCOPE.PLATFORM
      ? null
      : await resolveTenantTargetWithAudit({
        context,
        requestedClinicId,
        requireForPlatform: Boolean(context.isPlatform),
        auditRecorder,
        operation: 'settings.list',
      });
    const settings = await repository.listSettings({ clinicId, scope, skip, take });
    const revealSensitive = hasPermission(context, 'settings.read_sensitive');
    return {
      settings: settings.map((setting) => normalizeSetting(setting, { revealSensitive })),
      meta: { page, limit },
    };
  };

  // Gets one setting by key and scope.
  const getSetting = async ({ context, key, query = {}, requestedClinicId = null }) => {
    const scope = query.scope || SETTING_SCOPE.CLINIC;
    const resolved = await resolveScope({
      context,
      requestedClinicId,
      scope,
      branchId: query.branchId || null,
      userId: query.userId || null,
    });
    const activeKey = repository.activeSettingKey({ ...resolved, scope, settingKey: key });
    const setting = await repository.findSettingByActiveKey(activeKey);
    if (!setting) throw new ApiError(404, 'Setting not found');
    const sensitive = isSensitiveSettingKey(key);
    if (sensitive && !hasPermission(context, 'settings.read_sensitive')) throw new ApiError(403, 'Sensitive setting permission required');
    if (sensitive) {
      await auditRecorder({
        context: { ...context, clinicId: resolved.clinicId || context.clinicId || null },
        action: SETTING_ACTION.SENSITIVE_READ,
        moduleName: 'settings',
        resourceType: 'setting',
        resourceId: setting.id,
        severity: AUDIT_SEVERITY.WARNING,
        metadata: { key, scope },
      });
    }
    return { setting: normalizeSetting(setting, { revealSensitive: sensitive }) };
  };

  // Upserts a scoped setting with history and audit.
  const upsertSetting = async ({ context, key, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const scope = payload.scope;
    const resolved = await resolveScope({
      context,
      requestedClinicId,
      scope,
      branchId: payload.branchId || null,
      userId: payload.userId || null,
      connection: tx,
    });
    if (resolved.clinic) assertClinicWritable(resolved.clinic);
    const sensitive = isSensitiveSettingKey(key);
    if (sensitive && !hasPermission(context, 'settings.update_sensitive')) throw new ApiError(403, 'Sensitive setting permission required');
    const storedValue = sensitive ? encryptSettingValue(payload.value) : payload.value;
    const activeSettingKey = repository.activeSettingKey({ ...resolved, scope, settingKey: key });
    const existing = await repository.findSettingByActiveKey(activeSettingKey, tx);
    const data = {
      clinic_id: resolved.clinicId,
      branch_id: resolved.branchId,
      user_id: resolved.userId,
      setting_key: key,
      value: storedValue,
      scope,
      is_encrypted: Boolean(payload.isEncrypted || sensitive),
      status: SETTING_STATUS.ACTIVE,
      active_setting_key: activeSettingKey,
      updated_by: context.userId || null,
      is_deleted: false,
    };
    const setting = existing
      ? await withPrismaErrorMapping(() => repository.updateSetting({ settingId: existing.id, data }, tx), { unique: 'Active setting already exists', notFound: 'Setting not found' })
      : await withPrismaErrorMapping(() => repository.createSetting({
        id: crypto.randomUUID(),
        ...data,
        created_by: context.userId || null,
      }, tx), { unique: 'Active setting already exists', foreignKey: 'Related setting target is invalid' });

    await withPrismaErrorMapping(() => repository.createSettingHistory({
      id: crypto.randomUUID(),
      setting_id: setting.id,
      clinic_id: resolved.clinicId,
      setting_key: key,
      scope,
      before_value: existing ? safeValueSummary(existing.value, { sensitive }) : null,
      after_value: safeValueSummary(storedValue, { sensitive }),
      changed_by: context.userId || null,
      change_reason: payload.reason || null,
    }, tx), { foreignKey: 'Related setting history data is invalid' });
    await auditRecorder({
      context: { ...context, clinicId: resolved.clinicId || context.clinicId || null },
      action: SETTING_ACTION.UPDATED,
      moduleName: 'settings',
      resourceType: 'setting',
      resourceId: setting.id,
      beforeData: existing ? normalizeSetting(existing) : null,
      afterData: normalizeSetting(setting),
      severity: sensitive ? AUDIT_SEVERITY.WARNING : AUDIT_SEVERITY.INFO,
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      clinicId: resolved.clinicId,
      settingKey: key,
      context,
      payload: { scope, branchId: resolved.branchId, userId: resolved.userId },
    }), tx);
    return { setting: normalizeSetting(setting, { revealSensitive: sensitive }) };
  });

  // Archives a scoped setting.
  const archiveSetting = async ({ context, key, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const scope = payload.scope;
    const resolved = await resolveScope({
      context,
      requestedClinicId,
      scope,
      branchId: payload.branchId || null,
      userId: payload.userId || null,
      connection: tx,
    });
    if (resolved.clinic) assertClinicWritable(resolved.clinic);
    const activeSettingKey = repository.activeSettingKey({ ...resolved, scope, settingKey: key });
    const existing = await repository.findSettingByActiveKey(activeSettingKey, tx);
    if (!existing) throw new ApiError(404, 'Setting not found');
    const updated = await withPrismaErrorMapping(() => repository.updateSetting({
      settingId: existing.id,
      data: {
        status: SETTING_STATUS.ARCHIVED,
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: context.userId || null,
        active_setting_key: null,
      },
    }, tx), { notFound: 'Setting not found' });
    await withPrismaErrorMapping(() => repository.createSettingHistory({
      id: crypto.randomUUID(),
      setting_id: existing.id,
      clinic_id: resolved.clinicId,
      setting_key: key,
      scope,
      before_value: safeValueSummary(existing.value, { sensitive: isSensitiveSettingKey(key) }),
      after_value: null,
      changed_by: context.userId || null,
      change_reason: payload.reason,
    }, tx), { foreignKey: 'Related setting history data is invalid' });
    await auditRecorder({
      context: { ...context, clinicId: resolved.clinicId || context.clinicId || null },
      action: SETTING_ACTION.ARCHIVED,
      moduleName: 'settings',
      resourceType: 'setting',
      resourceId: existing.id,
      beforeData: normalizeSetting(existing),
      afterData: normalizeSetting(updated),
      severity: AUDIT_SEVERITY.WARNING,
    }, tx);
    return { setting: normalizeSetting(updated) };
  });

  return {
    archiveSetting,
    getSetting,
    listSettings,
    upsertSetting,
  };
};

module.exports = { createSettingsService, normalizeSetting };
