/**
 * Patient Records Repository
 * Owns Prisma access for append-only patient record operations.
 */

const { prisma, model } = require('../../database/prisma');

const clinics = (connection) => model(connection || prisma, 'clinics');
const patients = (connection) => model(connection || prisma, 'patients');
const patientRecords = (connection) => model(connection || prisma, 'patient_records');
const outboxEvents = (connection) => model(connection || prisma, 'outbox_events');

// Finds a clinic by id, excluding soft-deleted tenants.
const findClinicById = async (clinicId, connection) => clinics(connection).findFirst({
  where: { id: clinicId, is_deleted: false },
});

// Finds one patient inside a tenant.
const findPatientById = async ({ clinicId, patientId }, connection) => patients(connection).findFirst({
  where: { id: patientId, clinic_id: clinicId, is_deleted: false },
});

// Lists records for a patient inside one tenant.
const listRecords = async ({ clinicId, patientId = null, recordType = null, status = null, skip = 0, take = 50 }, connection) => patientRecords(connection).findMany({
  where: {
    clinic_id: clinicId,
    is_deleted: false,
    ...(patientId ? { patient_id: patientId } : {}),
    ...(recordType ? { record_type: recordType } : {}),
    ...(status ? { status } : {}),
  },
  orderBy: [{ recorded_at: 'desc' }, { created_at: 'desc' }],
  skip,
  take,
});

// Finds one patient record by tenant and id.
const findRecordById = async ({ clinicId, recordId }, connection) => patientRecords(connection).findFirst({
  where: { id: recordId, clinic_id: clinicId, is_deleted: false },
});

// Creates an append-only patient record.
const createRecord = async (payload, connection) => patientRecords(connection).create({ data: payload });

// Archives a patient record with a tenant-scoped mutation predicate.
const archiveRecord = async ({ clinicId, recordId, data }, connection) => {
  const result = await patientRecords(connection).updateMany({
    where: { id: recordId, clinic_id: clinicId, is_deleted: false },
    data,
  });
  if (result.count !== 1) return null;
  return findRecordById({ clinicId, recordId }, connection);
};

// Creates an outbox event for later worker delivery.
const createOutboxEvent = async (payload, connection) => outboxEvents(connection).create({ data: payload });

module.exports = {
  archiveRecord,
  createOutboxEvent,
  createRecord,
  findClinicById,
  findPatientById,
  findRecordById,
  listRecords,
};
