/**
 * Patient Records Service
 * Owns append-only patient record creation, PHI-safe reads, and archive behavior.
 */

const crypto = require('node:crypto');
const { AUDIT_SEVERITY } = require('../../common/constants/audit');
const { ApiError } = require('../../common/errors/ApiError');
const { resolveTenantTargetWithAudit } = require('../../common/middleware/tenantOverride');
const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { decryptPhiValue, encryptPhiValue } = require('../../common/utils/phiEncryption');
const { withPrismaErrorMapping } = require('../../common/utils/prismaErrors');
const { recordAudit } = require('../audit/audit.service');
const { assertClinicReadable, assertClinicWritable } = require('../clinics/clinics.lifecycle');
const {
  PATIENT_RECORD_ACTION,
  PATIENT_RECORD_OUTBOX_EVENT,
  PATIENT_RECORD_STATUS,
} = require('./patientRecords.constants');
const defaultRepository = require('./patientRecords.repository');

// Builds pagination values with safe defaults.
const pageInput = ({ page = 1, limit = 50 } = {}) => {
  const take = Math.min(Number(limit) || 50, 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  return { skip: (currentPage - 1) * take, take, page: currentPage, limit: take };
};

// Normalizes patient records for full-detail API responses.
const normalizePatientRecord = (record) => record ? ({
  id: record.id,
  clinicId: record.clinic_id,
  patientId: record.patient_id,
  recordType: record.record_type,
  title: record.title,
  recordData: decryptPhiValue(record.record_data),
  recordedAt: record.recorded_at || null,
  attachmentCount: record.attachment_count,
  status: record.status,
  createdAt: record.created_at || null,
  updatedAt: record.updated_at || null,
}) : null;

// Normalizes patient records for PHI-minimized list responses.
const normalizePatientRecordListItem = (record) => record ? ({
  id: record.id,
  clinicId: record.clinic_id,
  patientId: record.patient_id,
  recordType: record.record_type,
  title: record.title,
  recordedAt: record.recorded_at || null,
  attachmentCount: record.attachment_count,
  status: record.status,
  createdAt: record.created_at || null,
  updatedAt: record.updated_at || null,
}) : null;

// Summarizes record payloads for audit without copying raw clinical detail.
const auditRecordSummary = (record, sourceData = null) => record ? ({
  id: record.id,
  clinicId: record.clinic_id,
  patientId: record.patient_id,
  recordType: record.record_type,
  title: record.title,
  status: record.status,
  dataKeys: sourceData && typeof sourceData === 'object'
    ? Object.keys(sourceData).slice(0, 20)
    : [],
  attachmentCount: record.attachment_count,
}) : null;

// Builds safe list audit metadata without clinical values.
const listAuditMetadata = ({ query = {}, page, limit, resultCount }) => ({
  filters: {
    hasPatientId: Boolean(query.patientId),
    recordType: query.recordType || null,
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
  aggregate_type: 'patient_record',
  aggregate_id: aggregateId,
  tenant_id: clinicId,
  correlation_id: context?.correlationId || null,
  causation_id: context?.requestId || null,
  producer: 'backend-new',
  payload,
});

// Creates the patient records domain service.
const createPatientRecordsService = ({
  repository = defaultRepository,
  auditRecorder = recordAudit,
  transaction = runInTransaction,
} = {}) => {
  // Resolves and validates a clinic target for record operations.
  const resolveClinic = async ({ context, requestedClinicId = null, connection, requireWritable = false, operation = 'patient_records' }) => {
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

  // Lists append-only records in one tenant.
  const listRecords = async ({ context, query = {}, requestedClinicId = null }) => {
    const { clinicId } = await resolveClinic({ context, requestedClinicId, operation: 'patient_records.list' });
    if (query.patientId) {
      const patient = await repository.findPatientById({ clinicId, patientId: query.patientId });
      if (!patient) throw new ApiError(404, 'Patient not found');
    }
    const { skip, take, page, limit } = pageInput(query);
    const records = await repository.listRecords({
      clinicId,
      patientId: query.patientId || null,
      recordType: query.recordType || null,
      status: query.status || null,
      skip,
      take,
    });
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_RECORD_ACTION.LIST_ACCESSED,
      moduleName: 'patient_records',
      resourceType: 'patient_record',
      severity: AUDIT_SEVERITY.INFO,
      metadata: listAuditMetadata({ query, page, limit, resultCount: records.length }),
    });
    return { records: records.map(normalizePatientRecordListItem), meta: { page, limit } };
  };

  // Gets one record and writes PHI read audit evidence.
  const getRecord = async ({ context, recordId, requestedClinicId = null }) => {
    const { clinicId } = await resolveClinic({ context, requestedClinicId, operation: 'patient_records.read' });
    const record = await repository.findRecordById({ clinicId, recordId });
    if (!record) throw new ApiError(404, 'Patient record not found');
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_RECORD_ACTION.READ,
      moduleName: 'patient_records',
      resourceType: 'patient_record',
      resourceId: record.id,
      metadata: auditRecordSummary(record),
    });
    return { record: normalizePatientRecord(record) };
  };

  // Creates an append-only patient record.
  const createRecord = async ({ context, payload, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId } = await resolveClinic({
      context,
      requestedClinicId,
      connection: tx,
      requireWritable: true,
      operation: 'patient_records.create',
    });
    const patient = await repository.findPatientById({ clinicId, patientId: payload.patientId }, tx);
    if (!patient) throw new ApiError(404, 'Patient not found');
    if (payload.attachmentCount && Number(payload.attachmentCount) > 0) {
      throw new ApiError(400, 'Attachments are not available in Sprint 4');
    }
    const record = await withPrismaErrorMapping(() => repository.createRecord({
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      patient_id: payload.patientId,
      record_type: payload.recordType,
      title: payload.title,
      record_data: encryptPhiValue(payload.recordData),
      recorded_at: payload.recordedAt ? new Date(payload.recordedAt) : new Date(),
      attachment_count: 0,
      status: PATIENT_RECORD_STATUS.ACTIVE,
      created_by: context.userId || null,
      updated_by: context.userId || null,
      is_deleted: false,
    }, tx), { foreignKey: 'Related patient is invalid' });
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_RECORD_ACTION.CREATED,
      moduleName: 'patient_records',
      resourceType: 'patient_record',
      resourceId: record.id,
      afterData: auditRecordSummary(record, payload.recordData),
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      eventName: PATIENT_RECORD_OUTBOX_EVENT.CREATED,
      clinicId,
      aggregateId: record.id,
      context,
      payload: { clinicId, patientId: payload.patientId, recordId: record.id, recordType: record.record_type },
    }), tx);
    return { record: normalizePatientRecord(record) };
  });

  // Archives a patient record without editing its clinical data.
  const archiveRecord = async ({ context, recordId, reason = null, requestedClinicId = null }) => transaction(async (tx) => {
    const { clinicId } = await resolveClinic({
      context,
      requestedClinicId,
      connection: tx,
      requireWritable: true,
      operation: 'patient_records.archive',
    });
    const existing = await repository.findRecordById({ clinicId, recordId }, tx);
    if (!existing) throw new ApiError(404, 'Patient record not found');
    const archived = await withPrismaErrorMapping(() => repository.archiveRecord({
      clinicId,
      recordId,
      data: {
        status: PATIENT_RECORD_STATUS.ARCHIVED,
        archived_at: new Date(),
        archived_by: context.userId || null,
        updated_by: context.userId || null,
      },
    }, tx), { notFound: 'Patient record not found' });
    if (!archived) throw new ApiError(404, 'Patient record not found');
    await auditRecorder({
      context: { ...context, clinicId },
      action: PATIENT_RECORD_ACTION.ARCHIVED,
      moduleName: 'patient_records',
      resourceType: 'patient_record',
      resourceId: recordId,
      severity: AUDIT_SEVERITY.WARNING,
      beforeData: auditRecordSummary(existing),
      afterData: auditRecordSummary(archived),
      metadata: { reason },
    }, tx);
    await repository.createOutboxEvent(outboxPayload({
      id: crypto.randomUUID(),
      eventName: PATIENT_RECORD_OUTBOX_EVENT.ARCHIVED,
      clinicId,
      aggregateId: recordId,
      context,
      payload: { clinicId, patientId: existing.patient_id, recordId, reason },
    }), tx);
    return { record: normalizePatientRecord(archived) };
  });

  return {
    archiveRecord,
    createRecord,
    getRecord,
    listRecords,
  };
};

module.exports = {
  auditRecordSummary,
  createPatientRecordsService,
  normalizePatientRecord,
  normalizePatientRecordListItem,
};
