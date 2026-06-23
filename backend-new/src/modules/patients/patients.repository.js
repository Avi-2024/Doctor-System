/**
 * Patients Repository
 * Owns Prisma access for patient registration, lookup, search, and archive flows.
 */

const crypto = require('node:crypto');
const { prisma, model } = require('../../database/prisma');

const clinics = (connection) => model(connection || prisma, 'clinics');
const patients = (connection) => model(connection || prisma, 'patients');
const patientCodeCounters = (connection) => model(connection || prisma, 'patient_code_counters');
const registrationRequests = (connection) => model(connection || prisma, 'patient_registration_requests');
const outboxEvents = (connection) => model(connection || prisma, 'outbox_events');

// Normalizes searchable text for repository lookup predicates.
const normalizeSearchText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

// Normalizes phone values for indexed prefix lookup.
const normalizeSearchPhone = (value) => String(value || '').replace(/\D/g, '');

// Finds a clinic by id, excluding soft-deleted tenants.
const findClinicById = async (clinicId, connection) => clinics(connection).findFirst({
  where: { id: clinicId, is_deleted: false },
});

// Creates the patient code counter row if it does not already exist.
const ensurePatientCodeCounter = async ({ clinicId, counterKey, context = {} }, connection) => {
  try {
    return await patientCodeCounters(connection).create({
      data: {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        counter_key: counterKey,
        next_value: 1,
        created_by: context.userId || null,
        updated_by: context.userId || null,
        is_deleted: false,
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') return null;
    throw error;
  }
};

// Atomically increments and returns the next patient counter value.
const nextPatientCodeValue = async ({ clinicId, counterKey, context = {} }, connection) => {
  await ensurePatientCodeCounter({ clinicId, counterKey, context }, connection);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const updated = await patientCodeCounters(connection).update({
        where: {
          clinic_id_counter_key: {
            clinic_id: clinicId,
            counter_key: counterKey,
          },
        },
        data: {
          next_value: { increment: 1 },
          updated_by: context.userId || null,
        },
      });
      return updated.next_value - 1;
    } catch (error) {
      if (error?.code !== 'P2025' || attempt > 0) throw error;
      await ensurePatientCodeCounter({ clinicId, counterKey, context }, connection);
    }
  }
  throw new Error('Patient code counter could not be allocated');
};

// Finds a registration request by clinic-scoped idempotency key.
const findRegistrationRequest = async ({ clinicId, idempotencyKey }, connection) => registrationRequests(connection).findFirst({
  where: { clinic_id: clinicId, idempotency_key: idempotencyKey },
});

// Creates a registration idempotency request marker.
const createRegistrationRequest = async (payload, connection) => registrationRequests(connection).create({ data: payload });

// Completes a registration request with the created patient reference.
const completeRegistrationRequest = async ({ requestId, patientId, responseSummary }, connection) => registrationRequests(connection).update({
  where: { id: requestId },
  data: {
    patient_id: patientId,
    status: 'COMPLETED',
    response_summary: responseSummary,
  },
});

// Creates a patient record.
const createPatient = async (payload, connection) => patients(connection).create({ data: payload });

// Builds indexed search predicates for patient lookup.
const patientSearchPredicates = (search) => {
  const raw = String(search || '').trim();
  const normalized = normalizeSearchText(raw);
  const normalizedPhone = normalizeSearchPhone(raw);
  return [
    { patient_code: { startsWith: raw.toUpperCase() } },
    ...(normalizedPhone ? [{ normalized_phone: { startsWith: normalizedPhone } }] : []),
    { normalized_email: { startsWith: normalized } },
    { normalized_name: { startsWith: normalized } },
  ];
};

// Lists patients in a tenant.
const listPatients = async ({ clinicId, status = null, search = null, skip = 0, take = 50 }, connection) => patients(connection).findMany({
  where: {
    clinic_id: clinicId,
    is_deleted: false,
    ...(status ? { status } : {}),
    ...(search ? { OR: patientSearchPredicates(search) } : {}),
  },
  orderBy: [{ created_at: 'desc' }],
  skip,
  take,
});

// Searches patients using bounded indexed fields where possible.
const searchPatients = async ({ clinicId, search, skip = 0, take = 20 }, connection) => patients(connection).findMany({
  where: {
    clinic_id: clinicId,
    is_deleted: false,
    status: 'ACTIVE',
    OR: patientSearchPredicates(search),
  },
  orderBy: [{ updated_at: 'desc' }],
  skip,
  take,
});

// Finds duplicate candidates for registration warnings.
const findPotentialDuplicates = async ({ clinicId, normalizedPhone = null, normalizedEmail = null, normalizedName = null, dateOfBirth = null }, connection) => patients(connection).findMany({
  where: {
    clinic_id: clinicId,
    is_deleted: false,
    OR: [
      ...(normalizedPhone ? [{ normalized_phone: normalizedPhone }] : []),
      ...(normalizedEmail ? [{ normalized_email: normalizedEmail }] : []),
      ...(normalizedName && dateOfBirth ? [{ normalized_name: normalizedName, date_of_birth: dateOfBirth }] : []),
    ],
  },
  orderBy: [{ updated_at: 'desc' }],
  take: 5,
});

// Finds one patient by tenant and id.
const findPatientById = async ({ clinicId, patientId }, connection) => patients(connection).findFirst({
  where: { id: patientId, clinic_id: clinicId, is_deleted: false },
});

// Updates one patient using a tenant-scoped mutation predicate.
const updatePatient = async ({ clinicId, patientId, data }, connection) => {
  const result = await patients(connection).updateMany({
    where: { id: patientId, clinic_id: clinicId, is_deleted: false },
    data,
  });
  if (result.count !== 1) return null;
  return findPatientById({ clinicId, patientId }, connection);
};

// Creates an outbox event for later worker delivery.
const createOutboxEvent = async (payload, connection) => outboxEvents(connection).create({ data: payload });

module.exports = {
  completeRegistrationRequest,
  createOutboxEvent,
  createPatient,
  createRegistrationRequest,
  ensurePatientCodeCounter,
  findClinicById,
  findPatientById,
  findPotentialDuplicates,
  findRegistrationRequest,
  listPatients,
  normalizeSearchPhone,
  normalizeSearchText,
  nextPatientCodeValue,
  searchPatients,
  updatePatient,
};
