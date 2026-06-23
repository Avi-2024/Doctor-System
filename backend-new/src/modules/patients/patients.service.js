/**
 * Patients Service
 * Owns tenant-scoped patient registration, search, PHI-safe audit, and lifecycle behavior.
 */

const crypto = require('node:crypto');
const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { ApiError } = require('../../common/errors/ApiError');
const { resolveTenantTargetWithAudit } = require('../../common/middleware/tenantOverride');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { normalizeIdempotencyKey, payloadHash } = require('../../common/utils/idempotency');
const { decryptPhiValue, encryptPhiValue, phiValueSummary } = require('../../common/utils/phiEncryption');
const { withPrismaErrorMapping } = require('../../common/utils/prismaErrors');
const { recordAudit } = require('../audit/audit.service');
const { assertClinicReadable, assertClinicWritable } = require('../clinics/clinics.lifecycle');
const {
  PATIENT_ACTION,
  PATIENT_CODE_COUNTER_KEY,
  PATIENT_CODE_PREFIX,
  PATIENT_OUTBOX_EVENT,
  PATIENT_STATUS,
} = require('./patients.constants');
const defaultRepository = require('./patients.repository');

// Normalizes text for duplicate checks and search indexes.
const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ') || null;

// Normalizes phone values into a digit-only lookup key.
const normalizePhone = (value) => String(value || '').replace(/\D/g, '') || null;

// Normalizes email values into a case-insensitive lookup key.
const normalizeEmail = (value) => normalizeText(value);

// Formats a tenant-local patient code from the next counter value.
const formatPatientCode = (value) => `${PATIENT_CODE_PREFIX}-${String(value).padStart(6, '0')}`;

// Builds pagination values with safe defaults.
const pageInput = ({ page = 1, limit = 50 } = {}, maxLimit = 100) => {
  const take = Math.min(Number(limit) || 50, maxLimit);
  const currentPage = Math.max(Number(page) || 1, 1);
  return { skip: (currentPage - 1) * take, take, page: currentPage, limit: take };
};

// Normalizes patient records for full-detail API responses.
const normalizePatient = (patient) => patient ? ({
  id: patient.id,
  clinicId: patient.clinic_id,
  patientCode: patient.patient_code,
  fullName: patient.full_name,
  phone: patient.phone || null,
  email: patient.email || null,
  gender: patient.gender || null,
  dateOfBirth: patient.date_of_birth || null,
  bloodGroup: patient.blood_group || null,
  demographics: decryptPhiValue(patient.demographics) || null,
  medicalSummary: decryptPhiValue(patient.medical_summary) || null,
  status: patient.status,
  createdAt: patient.created_at || null,
  updatedAt: patient.updated_at || null,
}) : null;

// Normalizes patient records for PHI-minimized list/search responses.
const normalizePatientListItem = (patient) => patient ? ({
  id: patient.id,
  clinicId: patient.clinic_id,
  patientCode: patient.patient_code,
  fullName: patient.full_name,
  status: patient.status,
  hasPhone: Boolean(patient.phone),
  hasEmail: Boolean(patient.email),
  hasDateOfBirth: Boolean(patient.date_of_birth),
  createdAt: patient.created_at || null,
  updatedAt: patient.updated_at || null,
}) : null;

// Summarizes patient data for audit without copying full PHI payloads.
const auditPatientSummary = (patient) => patient ? ({
  id: patient.id,
  clinicId: patient.clinic_id,
  patientCode: patient.patient_code,
  status: patient.status,
  hasPhone: Boolean(patient.phone),
  hasEmail: Boolean(patient.email),
  hasDateOfBirth: Boolean(patient.date_of_birth),
}) : null;

// Builds duplicate warning payloads without exposing unnecessary PHI.
const duplicateWarnings = (patients, requested) => patients.map((patient) => {
  const matchedBy = [
    requested.normalizedPhone && patient.normalized_phone === requested.normalizedPhone ? 'phone' : null,
    requested.normalizedEmail && patient.normalized_email === requested.normalizedEmail ? 'email' : null,
    requested.normalizedName
      && requested.dateOfBirth
      && patient.normalized_name === requested.normalizedName
      && patient.date_of_birth
      && new Date(patient.date_of_birth).getTime() === requested.dateOfBirth.getTime()
      ? 'name_date_of_birth'
      : null,
  ].filter(Boolean);
  return {
    patientId: patient.id,
    patientCode: patient.patient_code,
    fullName: patient.full_name,
    status: patient.status,
    matchedBy,
  };
});

// Builds safe list audit metadata without PHI values.
const listAuditMetadata = ({ query = {}, page, limit, resultCount }) => ({
  filters: {
    hasSearch: Boolean(query.search),
    status: query.status || null,
  },
  page,
  limit,
  resultCount,
});

// Builds a safe outbox event payload.
const outboxPayload = ({ id, eventName, clinicId, aggregateId, context, payload }) => ({
  id,
  event_name: eventName,
  event_version: '1',
  aggregate_type: 'patient',
  aggregate_id: aggregateId,
  tenant_id: clinicId,
  correlation_id: context?.correlationId || null,
  causation_id: context?.requestId || null,
  producer: 'backend-new',
  payload,
});

// Creates the patients domain service.
const createPatientsService = ({
  repository = defaultRepository,
  auditRecorder = recordAudit,
  transaction = runInTransaction,
} = {}) => {
  // Resolves and validates a clinic target for patient operations.
  const resolveClinic = async ({ context, requestedClinicId = null, connection, requireWritable = false, operation = 'patients' }) => {
    const clinicId = await resolveTenantTargetWithAudit({
      context,
      requestedClinicId,
      requireForPlatform: true,
      auditRecorder,
      connection,
      operation,
    });
    const clinic = await repository.findClinicById(clinicId, connection);
    assertClinicReadable(clinic);
    if (requireWritable) assertClinicWritable(clinic);
    return { clinicId, clinic };
  };

  // Lists tenant patients with bounded pagination.
  const listPatients = async ({ context, query = {}, requestedClinicId = null }) => {
    const { clinicId } = await resolveClinic({ context, requestedClinicId, operation: 'patients.list' });
    const { skip, take, page, limit } = pageInput(query);
    const patients = await repository.listPatients({
      clinicId,
      status: query.status || null,
      search: query.search || null,
      skip,
      take,
    });
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_ACTION.LIST_ACCESSED,
      moduleName: 'patients',
      resourceType: 'patient',
      severity: AUDIT_SEVERITY.INFO,
      metadata: listAuditMetadata({ query, page, limit, resultCount: patients.length }),
    });
    return { patients: patients.map(normalizePatientListItem), meta: { page, limit } };
  };

  // Searches tenant patients using constrained query rules.
  const searchPatients = async ({ context, query = {}, requestedClinicId = null }) => {
    const search = String(query.search || '').trim();
    if (search.length < 2) throw new ApiError(400, 'Search must be at least 2 characters');
    const { clinicId } = await resolveClinic({ context, requestedClinicId, operation: 'patients.search' });
    const { skip, take, page, limit } = pageInput(query, 25);
    const patients = await repository.searchPatients({ clinicId, search, skip, take });
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_ACTION.SEARCHED,
      moduleName: 'patients',
      resourceType: 'patient',
      severity: AUDIT_SEVERITY.INFO,
      metadata: { searchLength: search.length, resultCount: patients.length },
    });
    return { patients: patients.map(normalizePatientListItem), meta: { page, limit } };
  };

  // Gets one patient and records PHI access evidence.
  const getPatient = async ({ context, patientId, requestedClinicId = null }) => {
    const { clinicId } = await resolveClinic({ context, requestedClinicId, operation: 'patients.read' });
    const patient = await repository.findPatientById({ clinicId, patientId });
    if (!patient) throw new ApiError(404, 'Patient not found');
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_ACTION.READ,
      moduleName: 'patients',
      resourceType: 'patient',
      resourceId: patient.id,
      metadata: auditPatientSummary(patient),
    });
    return { patient: normalizePatient(patient) };
  };

  // Registers a patient with idempotency and clinic-local code allocation.
  const registerPatient = async ({ context, payload, idempotencyKey, requestedClinicId = null }) => transaction(async (tx) => {
    const normalizedKey = normalizeIdempotencyKey(idempotencyKey);
    if (!normalizedKey) throw new ApiError(400, 'Idempotency-Key header is required');
    const { clinicId } = await resolveClinic({
      context,
      requestedClinicId,
      connection: tx,
      requireWritable: true,
      operation: 'patients.register',
    });
    const requestHash = payloadHash(payload);
    const existingRequest = await repository.findRegistrationRequest({ clinicId, idempotencyKey: normalizedKey }, tx);
    if (existingRequest) {
      if (existingRequest.request_hash !== requestHash) throw new ApiError(409, 'Idempotency key was used with a different payload');
      if (!existingRequest.patient_id) throw new ApiError(409, 'Patient registration is already in progress');
      const patient = await repository.findPatientById({ clinicId, patientId: existingRequest.patient_id }, tx);
      return { patient: normalizePatient(patient), idempotent: true, duplicateWarnings: [] };
    }
    const normalized = {
      normalizedName: normalizeText(payload.fullName),
      normalizedPhone: normalizePhone(payload.phone),
      normalizedEmail: normalizeEmail(payload.email),
    };
    const dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
    const duplicates = await repository.findPotentialDuplicates({
      clinicId,
      normalizedPhone: normalized.normalizedPhone,
      normalizedEmail: normalized.normalizedEmail,
      normalizedName: normalized.normalizedName,
      dateOfBirth,
    }, tx);
    let registrationRequest;
    try {
      registrationRequest = await repository.createRegistrationRequest({
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        idempotency_key: normalizedKey,
        request_hash: requestHash,
        status: 'IN_PROGRESS',
        created_by: context.userId || null,
      }, tx);
    } catch (error) {
      if (error?.code !== 'P2002') throw error;
      const replay = await repository.findRegistrationRequest({ clinicId, idempotencyKey: normalizedKey }, tx);
      if (!replay || replay.request_hash !== requestHash || !replay.patient_id) throw new ApiError(409, 'Patient registration conflict');
      const patient = await repository.findPatientById({ clinicId, patientId: replay.patient_id }, tx);
      return { patient: normalizePatient(patient), idempotent: true, duplicateWarnings: [] };
    }
    const nextValue = await repository.nextPatientCodeValue({ clinicId, counterKey: PATIENT_CODE_COUNTER_KEY, context }, tx);
    const patient = await withPrismaErrorMapping(() => repository.createPatient({
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      patient_code: formatPatientCode(nextValue),
      full_name: payload.fullName,
      normalized_name: normalized.normalizedName,
      phone: payload.phone || null,
      normalized_phone: normalized.normalizedPhone,
      email: payload.email ? String(payload.email).trim().toLowerCase() : null,
      normalized_email: normalized.normalizedEmail,
      gender: payload.gender || null,
      date_of_birth: dateOfBirth,
      blood_group: payload.bloodGroup || null,
      demographics: encryptPhiValue(payload.demographics || null),
      medical_summary: encryptPhiValue(payload.medicalSummary || null),
      status: PATIENT_STATUS.ACTIVE,
      created_by: context.userId || null,
      updated_by: context.userId || null,
      is_deleted: false,
    }, tx), { unique: 'Patient code already exists', foreignKey: 'Related clinic is invalid' });
    await repository.completeRegistrationRequest({
      requestId: registrationRequest.id,
      patientId: patient.id,
      responseSummary: auditPatientSummary(patient),
    }, tx);
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_ACTION.REGISTERED,
      moduleName: 'patients',
      resourceType: 'patient',
      resourceId: patient.id,
      afterData: auditPatientSummary(patient),
      metadata: { duplicateWarningCount: duplicates.length },
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      eventName: PATIENT_OUTBOX_EVENT.REGISTERED,
      clinicId,
      aggregateId: patient.id,
      context,
      payload: { clinicId, patientId: patient.id, patientCode: patient.patient_code },
    }), tx);
    return {
      patient: normalizePatient(patient),
      idempotent: false,
      duplicateWarnings: duplicateWarnings(duplicates, { ...normalized, dateOfBirth }),
    };
  });

  // Updates non-record patient demographics and summary fields.
  const updatePatient = async ({ context, patientId, payload, requestedClinicId = null }) => transaction(async (tx) => {
    if (Object.prototype.hasOwnProperty.call(payload, 'medicalSummary')) {
      throw new ApiError(400, 'Medical summary updates require patient record history');
    }
    const { clinicId } = await resolveClinic({
      context,
      requestedClinicId,
      connection: tx,
      requireWritable: true,
      operation: 'patients.update',
    });
    const existing = await repository.findPatientById({ clinicId, patientId }, tx);
    if (!existing) throw new ApiError(404, 'Patient not found');
    const normalized = {
      normalized_name: Object.prototype.hasOwnProperty.call(payload, 'fullName') ? normalizeText(payload.fullName) : existing.normalized_name,
      normalized_phone: Object.prototype.hasOwnProperty.call(payload, 'phone') ? normalizePhone(payload.phone) : existing.normalized_phone,
      normalized_email: Object.prototype.hasOwnProperty.call(payload, 'email') ? normalizeEmail(payload.email) : existing.normalized_email,
    };
    const updated = await withPrismaErrorMapping(() => repository.updatePatient({
      clinicId,
      patientId,
      data: {
        ...(payload.fullName ? { full_name: payload.fullName } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'phone') ? { phone: payload.phone || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'email') ? { email: payload.email ? String(payload.email).trim().toLowerCase() : null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'gender') ? { gender: payload.gender || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'dateOfBirth') ? { date_of_birth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'bloodGroup') ? { blood_group: payload.bloodGroup || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(payload, 'demographics') ? { demographics: encryptPhiValue(payload.demographics || null) } : {}),
        ...normalized,
        updated_by: context.userId || null,
      },
    }, tx), { notFound: 'Patient not found' });
    if (!updated) throw new ApiError(404, 'Patient not found');
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_ACTION.UPDATED,
      moduleName: 'patients',
      resourceType: 'patient',
      resourceId: patientId,
      beforeData: auditPatientSummary(existing),
      afterData: auditPatientSummary(updated),
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      eventName: PATIENT_OUTBOX_EVENT.UPDATED,
      clinicId,
      aggregateId: patientId,
      context,
      payload: { clinicId, patientId },
    }), tx);
    return { patient: normalizePatient(updated) };
  });

  // Archives a patient without deleting historical PHI records.
  const archivePatient = async ({ context, patientId, reason = null, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId } = await resolveClinic({
      context,
      requestedClinicId,
      connection: tx,
      requireWritable: true,
      operation: 'patients.archive',
    });
    const existing = await repository.findPatientById({ clinicId, patientId }, tx);
    if (!existing) throw new ApiError(404, 'Patient not found');
    const archived = await withPrismaErrorMapping(() => repository.updatePatient({
      clinicId,
      patientId,
      data: {
        status: PATIENT_STATUS.ARCHIVED,
        archived_at: new Date(),
        archived_by: context.userId || null,
        updated_by: context.userId || null,
      },
    }, tx), { notFound: 'Patient not found' });
    if (!archived) throw new ApiError(404, 'Patient not found');
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_ACTION.ARCHIVED,
      moduleName: 'patients',
      resourceType: 'patient',
      resourceId: patientId,
      severity: AUDIT_SEVERITY.WARNING,
      beforeData: auditPatientSummary(existing),
      afterData: auditPatientSummary(archived),
      metadata: { reason },
    }, tx);
    return { patient: normalizePatient(archived) };
  });

  // Restores an archived patient to active status.
  const restorePatient = async ({ context, patientId, reason = null, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId } = await resolveClinic({
      context,
      requestedClinicId,
      connection: tx,
      requireWritable: true,
      operation: 'patients.restore',
    });
    const existing = await repository.findPatientById({ clinicId, patientId }, tx);
    if (!existing) throw new ApiError(404, 'Patient not found');
    const restored = await withPrismaErrorMapping(() => repository.updatePatient({
      clinicId,
      patientId,
      data: {
        status: PATIENT_STATUS.ACTIVE,
        archived_at: null,
        archived_by: null,
        updated_by: context.userId || null,
      },
    }, tx), { notFound: 'Patient not found' });
    if (!restored) throw new ApiError(404, 'Patient not found');
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_ACTION.RESTORED,
      moduleName: 'patients',
      resourceType: 'patient',
      resourceId: patientId,
      severity: AUDIT_SEVERITY.INFO,
      beforeData: auditPatientSummary(existing),
      afterData: auditPatientSummary(restored),
      metadata: { reason },
    }, tx);
    return { patient: normalizePatient(restored) };
  });

  return {
    archivePatient,
    getPatient,
    listPatients,
    registerPatient,
    restorePatient,
    searchPatients,
    updatePatient,
  };
};

module.exports = {
  auditPatientSummary,
  createPatientsService,
  normalizePatient,
  normalizePatientListItem,
  normalizeEmail,
  normalizePhone,
  normalizeText,
};
