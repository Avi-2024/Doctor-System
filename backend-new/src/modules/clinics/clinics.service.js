/**
 * Clinics Service
 * Owns tenant onboarding, lifecycle, audit, and outbox behavior.
 */

const crypto = require('node:crypto');
const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { ApiError } = require('../../common/errors/ApiError');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { activeKey, normalizeIdempotencyKey, payloadHash } = require('../../common/utils/idempotency');
const { isKnownPrismaError, mapPrismaError, withPrismaErrorMapping } = require('../../common/utils/prismaErrors');
const { recordAudit } = require('../audit/audit.service');
const { hashPassword } = require('../auth/auth.crypto');
const { loginScopeForClinic } = require('../auth/auth.repository');
const { createRbacService } = require('../rbac/rbac.service');
const {
  CLINIC_ACTION,
  CLINIC_OUTBOX_EVENT,
  CLINIC_STATUS,
  DEFAULT_TRIAL_PLAN,
} = require('./clinics.constants');
const {
  assertClinicReadable,
  assertClinicWritable,
  requiresRecoveryPermission,
} = require('./clinics.lifecycle');
const defaultRepository = require('./clinics.repository');

const DEFAULT_SETTINGS = Object.freeze({
  'clinic.locale': { locale: 'en-US' },
});

const STATUS_PERMISSION = Object.freeze({
  [CLINIC_STATUS.ACTIVE]: 'clinics.activate',
  [CLINIC_STATUS.SUSPENDED]: 'clinics.suspend',
  [CLINIC_STATUS.ARCHIVED]: 'clinics.archive',
});

// Checks whether the current context has a named permission.
const contextHasPermission = (context, permission) => Array.isArray(context?.permissions) && context.permissions.includes(permission);

// Normalizes clinic records for API responses.
const normalizeClinic = (clinic) => clinic ? ({
  id: clinic.id,
  code: clinic.code,
  name: clinic.name,
  status: clinic.status,
  timezone: clinic.timezone,
  contact: clinic.contact || null,
  address: clinic.address || null,
  branding: clinic.branding || null,
  ownerUserId: clinic.owner_user_id || null,
  createdAt: clinic.created_at || null,
  updatedAt: clinic.updated_at || null,
}) : null;

// Normalizes branch records for onboarding responses.
const normalizeBranch = (branch) => branch ? ({
  id: branch.id,
  clinicId: branch.clinic_id,
  branchCode: branch.branch_code,
  name: branch.name,
  timezone: branch.timezone,
  isPrimary: branch.is_primary,
  status: branch.status,
}) : null;

// Normalizes subscription records for onboarding responses.
const normalizeSubscription = (subscription) => subscription ? ({
  id: subscription.id,
  clinicId: subscription.clinic_id,
  planId: subscription.plan_id,
  status: subscription.status,
  startsAt: subscription.starts_at || null,
  trialEndsAt: subscription.trial_ends_at || null,
}) : null;

// Builds pagination values with safe defaults.
const pageInput = ({ page = 1, limit = 50 } = {}) => {
  const take = Math.min(Number(limit) || 50, 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  return { skip: (currentPage - 1) * take, take, page: currentPage, limit: take };
};

// Throws when the current actor is not a platform user.
const requirePlatform = async ({ context, auditRecorder, action, metadata = {} }) => {
  if (context?.isPlatform) return;
  await auditRecorder({
    context,
    action,
    moduleName: 'clinics',
    resourceType: 'clinic',
    severity: AUDIT_SEVERITY.WARNING,
    metadata: { ...metadata, outcome: 'denied', reason: 'platform_required' },
  });
  throw new ApiError(403, 'Platform access required');
};

// Builds a safe outbox event payload.
const outboxPayload = ({ id, eventName, clinicId, aggregateType, aggregateId, context, payload }) => ({
  id,
  event_name: eventName,
  event_version: '1',
  aggregate_type: aggregateType,
  aggregate_id: aggregateId,
  tenant_id: clinicId || null,
  correlation_id: context?.correlationId || null,
  causation_id: context?.requestId || null,
  producer: 'backend-new',
  payload,
});

// Creates the clinics domain service.
const createClinicsService = ({
  repository = defaultRepository,
  auditRecorder = recordAudit,
  transaction = runInTransaction,
  rbacService = createRbacService(),
} = {}) => {
  // Records a clinic module audit entry.
  const audit = (input, connection) => auditRecorder(input, connection);

  // Normalizes an existing onboarding record into an idempotent response.
  const onboardingReplayResponse = (existing) => ({
    clinic: normalizeClinic(existing),
    owner: existing.owner_user ? { id: existing.owner_user.id, email: existing.owner_user.email } : null,
    branch: normalizeBranch(existing.branches?.[0]),
    subscription: normalizeSubscription(existing.subscriptions?.[0]),
    idempotent: true,
  });

  // Reloads an onboarding result after a duplicate-key race.
  const recoverOnboardingReplay = async ({ idempotencyKey, requestHash }) => {
    const existing = await repository.findClinicByIdempotencyKey(idempotencyKey);
    if (!existing) return null;
    if (existing.onboarding_payload_hash !== requestHash) throw new ApiError(409, 'Idempotency key payload mismatch');
    return onboardingReplayResponse(existing);
  };

  // Lists clinics for platform users or returns current clinic for tenant users.
  const listClinics = async ({ context, query = {} }) => {
    const { skip, take, page, limit } = pageInput(query);
    if (!context.isPlatform) {
      const clinic = await repository.findClinicById(context.clinicId);
      return {
        clinics: clinic ? [normalizeClinic(clinic)] : [],
        meta: { page: 1, limit: 1 },
      };
    }
    const clinics = await repository.listClinics({
      search: query.search || null,
      status: query.status || null,
      skip,
      take,
    });
    return { clinics: clinics.map(normalizeClinic), meta: { page, limit } };
  };

  // Gets the current authenticated tenant.
  const getCurrentClinic = async ({ context }) => {
    if (!context.clinicId) throw new ApiError(403, 'Clinic context required');
    const clinic = await repository.findClinicById(context.clinicId);
    return { clinic: normalizeClinic(assertClinicReadable(clinic)) };
  };

  // Gets a clinic by id with tenant-scope protection.
  const getClinic = async ({ context, clinicId }) => {
    if (!context.isPlatform && context.clinicId !== clinicId) throw new ApiError(403, 'Tenant ownership mismatch');
    const clinic = await repository.findClinicById(clinicId);
    return { clinic: normalizeClinic(assertClinicReadable(clinic)) };
  };

  // Creates a tenant, owner, primary branch, settings, role assignment, and trial subscription atomically.
  const onboardClinic = async ({ context, payload, idempotencyKey }) => {
    await requirePlatform({
      context,
      auditRecorder,
      action: CLINIC_ACTION.OVERRIDE_DENIED,
      metadata: { operation: 'clinic_onboarding' },
    });
    const normalizedKey = normalizeIdempotencyKey(idempotencyKey);
    if (!normalizedKey) throw new ApiError(400, 'Idempotency key is required');
    const requestHash = payloadHash(payload);

    try {
      return await transaction(async (tx) => {
      const existing = await repository.findClinicByIdempotencyKey(normalizedKey, tx);
      if (existing) {
        if (existing.onboarding_payload_hash !== requestHash) throw new ApiError(409, 'Idempotency key payload mismatch');
        return onboardingReplayResponse(existing);
      }

      await rbacService.syncSystemRoles(tx);
      const clinicId = crypto.randomUUID();
      const ownerId = crypto.randomUUID();
      const branchId = crypto.randomUUID();
      const now = new Date();
      const timezone = payload.timezone || 'UTC';
      const branch = payload.branch || {};
      const ownerEmail = String(payload.owner.email).trim().toLowerCase();
      const ownerLoginScope = loginScopeForClinic(clinicId);
      const duplicateOwner = await repository.findUserByEmailScope({ email: ownerEmail, loginScope: ownerLoginScope }, tx);
      if (duplicateOwner) throw new ApiError(409, 'Owner email already exists for clinic');

      const clinic = await withPrismaErrorMapping(() => repository.createClinic({
        id: clinicId,
        code: payload.code,
        name: payload.name,
        status: CLINIC_STATUS.ACTIVE,
        timezone,
        contact: payload.contact || null,
        address: payload.address || null,
        branding: payload.branding || null,
        onboarding_idempotency_key: normalizedKey,
        onboarding_payload_hash: requestHash,
        created_by: context.userId || null,
        updated_by: context.userId || null,
      }, tx), { unique: 'Clinic code or idempotency key already exists', foreignKey: 'Related clinic data is invalid' });

      const owner = await withPrismaErrorMapping(async () => repository.createUser({
        id: ownerId,
        clinic_id: clinicId,
        full_name: payload.owner.fullName,
        email: ownerEmail,
        login_scope: ownerLoginScope,
        phone: payload.owner.phone || null,
        password_hash: await hashPassword(payload.owner.password),
        user_type: 'CLINIC_USER',
        status: 'ACTIVE',
        created_by: context.userId || null,
        updated_by: context.userId || null,
        is_deleted: false,
      }, tx), { unique: 'Owner email already exists for clinic', foreignKey: 'Related owner data is invalid' });
      await repository.updateClinicOwner({ clinicId, ownerUserId: owner.id, updatedBy: context.userId }, tx);

      const primaryBranch = await withPrismaErrorMapping(() => repository.createBranch({
        id: branchId,
        clinic_id: clinicId,
        branch_code: branch.branchCode || 'main',
        name: branch.name || `${payload.name} Main Branch`,
        timezone: branch.timezone || timezone,
        contact: branch.contact || payload.contact || null,
        address: branch.address || payload.address || null,
        is_primary: true,
        primary_branch_key: repository.primaryBranchKey(clinicId),
        status: 'ACTIVE',
        created_by: context.userId || null,
        updated_by: context.userId || null,
        is_deleted: false,
      }, tx), { unique: 'Primary branch or branch code already exists', foreignKey: 'Related branch data is invalid' });

      const plan = await repository.upsertDefaultPlan({
        id: crypto.randomUUID(),
        code: DEFAULT_TRIAL_PLAN.code,
        name: DEFAULT_TRIAL_PLAN.name,
        status: 'ACTIVE',
        price_cents: 0,
        currency: 'USD',
        trial_days: DEFAULT_TRIAL_PLAN.trialDays,
        is_system: true,
      }, tx);
      const subscription = await withPrismaErrorMapping(() => repository.createSubscription({
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        plan_id: plan.id,
        status: 'TRIALING',
        starts_at: now,
        trial_ends_at: new Date(now.getTime() + (plan.trial_days * 24 * 60 * 60 * 1000)),
        active_subscription_key: repository.activeSubscriptionKey(clinicId),
        metadata: { source: 'clinic_onboarding' },
        created_by: context.userId || null,
        updated_by: context.userId || null,
        is_deleted: false,
      }, tx), { unique: 'Active subscription already exists for clinic', foreignKey: 'Related subscription data is invalid' });

      const role = await repository.findSystemRoleByCode('clinic_owner', tx);
      if (!role) throw new ApiError(500, 'Clinic owner system role is not initialized', null, { expose: false });
      await repository.createUserRole({
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        user_id: owner.id,
        role_id: role.id,
        assigned_by: context.userId || null,
        created_by: context.userId || null,
        updated_by: context.userId || null,
        is_deleted: false,
      }, tx);

      const settingEntries = {
        ...DEFAULT_SETTINGS,
        'clinic.timezone': { timezone },
        ...(payload.settings || {}),
      };
      for (const [settingKey, value] of Object.entries(settingEntries)) {
        const setting = await withPrismaErrorMapping(() => repository.createSetting({
          id: crypto.randomUUID(),
          clinic_id: clinicId,
          setting_key: settingKey,
          value,
          scope: 'CLINIC',
          is_encrypted: false,
          status: 'ACTIVE',
          active_setting_key: activeKey(clinicId, 'no_branch', 'no_user', 'CLINIC', settingKey),
          created_by: context.userId || null,
          updated_by: context.userId || null,
          is_deleted: false,
        }, tx), { unique: 'Active setting already exists for clinic', foreignKey: 'Related setting data is invalid' });
        await withPrismaErrorMapping(() => repository.createSettingHistory({
          id: crypto.randomUUID(),
          setting_id: setting.id,
          clinic_id: clinicId,
          setting_key: settingKey,
          scope: 'CLINIC',
          before_value: null,
          after_value: value,
          changed_by: context.userId || null,
          change_reason: 'clinic_onboarding',
        }, tx), { foreignKey: 'Related setting history data is invalid' });
        await repository.createOutboxEvent(outboxPayload({
          id: crypto.randomUUID(),
          eventName: CLINIC_OUTBOX_EVENT.SETTING_UPDATED,
          clinicId,
          aggregateType: 'setting',
          aggregateId: setting.id,
          context,
          payload: { clinicId, settingKey },
        }), tx);
      }

      await audit({
        context: { ...context, clinicId },
        action: CLINIC_ACTION.ONBOARDED,
        moduleName: 'clinics',
        resourceType: 'clinic',
        resourceId: clinicId,
        afterData: {
          clinic: normalizeClinic(clinic),
          ownerUserId: owner.id,
          primaryBranchId: primaryBranch.id,
          subscriptionId: subscription.id,
        },
      }, tx);

      await repository.createOutboxEvent(outboxPayload({
        id: crypto.randomUUID(),
        eventName: CLINIC_OUTBOX_EVENT.CREATED,
        clinicId,
        aggregateType: 'clinic',
        aggregateId: clinicId,
        context,
        payload: { clinicId, code: clinic.code, ownerUserId: owner.id },
      }), tx);
      await repository.createOutboxEvent(outboxPayload({
        id: crypto.randomUUID(),
        eventName: CLINIC_OUTBOX_EVENT.OWNER_ACTIVATED,
        clinicId,
        aggregateType: 'user',
        aggregateId: owner.id,
        context,
        payload: { clinicId, userId: owner.id },
      }), tx);
      await repository.createOutboxEvent(outboxPayload({
        id: crypto.randomUUID(),
        eventName: CLINIC_OUTBOX_EVENT.BRANCH_CREATED,
        clinicId,
        aggregateType: 'branch',
        aggregateId: primaryBranch.id,
        context,
        payload: { clinicId, branchId: primaryBranch.id, isPrimary: true },
      }), tx);
      await repository.createOutboxEvent(outboxPayload({
        id: crypto.randomUUID(),
        eventName: CLINIC_OUTBOX_EVENT.SUBSCRIPTION_TRIAL_STARTED,
        clinicId,
        aggregateType: 'subscription',
        aggregateId: subscription.id,
        context,
        payload: { clinicId, subscriptionId: subscription.id, planId: plan.id },
      }), tx);

      return {
        clinic: normalizeClinic({ ...clinic, owner_user_id: owner.id }),
        owner: { id: owner.id, email: owner.email, fullName: owner.full_name },
        branch: normalizeBranch(primaryBranch),
        subscription: normalizeSubscription(subscription),
        idempotent: false,
      };
      });
    } catch (error) {
      if (isKnownPrismaError(error) && error.code === 'P2002') {
        const replay = await recoverOnboardingReplay({ idempotencyKey: normalizedKey, requestHash });
        if (replay) return replay;
      }
      throw mapPrismaError(error, { unique: 'Clinic onboarding conflict', foreignKey: 'Related onboarding data is invalid' });
    }
  };

  // Updates tenant metadata after lifecycle write checks.
  const updateClinic = async ({ context, clinicId, payload }) => transaction(async (tx) => {
    if (!context.isPlatform && context.clinicId !== clinicId) throw new ApiError(403, 'Tenant ownership mismatch');
    const clinic = assertClinicReadable(await repository.findClinicById(clinicId, tx));
    assertClinicWritable(clinic);
    const updated = await withPrismaErrorMapping(() => repository.updateClinic({
      clinicId,
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.timezone ? { timezone: payload.timezone } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'contact') ? { contact: payload.contact || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'address') ? { address: payload.address || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'branding') ? { branding: payload.branding || null } : {}),
        updated_by: context.userId || null,
      },
    }, tx), { unique: 'Clinic code already exists', notFound: 'Clinic not found' });
    await audit({
      context,
      action: CLINIC_ACTION.UPDATED,
      moduleName: 'clinics',
      resourceType: 'clinic',
      resourceId: clinicId,
      beforeData: normalizeClinic(clinic),
      afterData: normalizeClinic(updated),
    }, tx);
    return { clinic: normalizeClinic(updated) };
  });

  // Changes clinic lifecycle status through platform-only recovery controls.
  const changeClinicStatus = async ({ context, clinicId, status, reason, supportReason }) => transaction(async (tx) => {
    await requirePlatform({
      context,
      auditRecorder,
      action: CLINIC_ACTION.OVERRIDE_DENIED,
      metadata: { operation: 'clinic_status_change', clinicId },
    });
    if (!supportReason) {
      await audit({
        context,
        action: CLINIC_ACTION.OVERRIDE_DENIED,
        moduleName: 'clinics',
        resourceType: 'clinic',
        resourceId: clinicId,
        severity: AUDIT_SEVERITY.WARNING,
        metadata: { operation: 'clinic_status_change', outcome: 'denied', reason: 'support_reason_required' },
      }, tx);
      throw new ApiError(400, 'Support reason is required');
    }
    const clinic = assertClinicReadable(await repository.findClinicById(clinicId, tx));
    const statusPermission = STATUS_PERMISSION[status];
    if (statusPermission && !contextHasPermission(context, statusPermission)) throw new ApiError(403, 'Required permission missing');
    if (requiresRecoveryPermission({ currentStatus: clinic.status, nextStatus: status }) && !contextHasPermission(context, 'tenant.recovery')) {
      throw new ApiError(403, 'Tenant recovery permission required');
    }
    const updated = await withPrismaErrorMapping(() => repository.updateClinic({
      clinicId,
      data: {
        status,
        archived_at: status === CLINIC_STATUS.ARCHIVED ? new Date() : null,
        updated_by: context.userId || null,
      },
    }, tx), { notFound: 'Clinic not found' });
    await audit({
      context: { ...context, clinicId },
      action: CLINIC_ACTION.STATUS_CHANGED,
      moduleName: 'clinics',
      resourceType: 'clinic',
      resourceId: clinicId,
      severity: AUDIT_SEVERITY.WARNING,
      beforeData: { status: clinic.status },
      afterData: { status },
      metadata: { reason, supportReason },
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      eventName: CLINIC_OUTBOX_EVENT.STATUS_CHANGED,
      clinicId,
      aggregateType: 'clinic',
      aggregateId: clinicId,
      context,
      payload: { clinicId, previousStatus: clinic.status, status, reason },
    }), tx);
    return { clinic: normalizeClinic(updated) };
  });

  return {
    changeClinicStatus,
    getClinic,
    getCurrentClinic,
    listClinics,
    onboardClinic,
    updateClinic,
  };
};

module.exports = {
  assertClinicWritable,
  createClinicsService,
  normalizeClinic,
};
