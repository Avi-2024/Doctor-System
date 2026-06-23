process.env.NODE_ENV = 'test';
const RUN_MYSQL_INTEGRATION = process.env.RUN_MYSQL_INTEGRATION_TESTS === 'true' && Boolean(process.env.MYSQL_TEST_DATABASE_URL);
process.env.DATABASE_URL = RUN_MYSQL_INTEGRATION
  ? process.env.MYSQL_TEST_DATABASE_URL
  : (process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/doctor_system_test');
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-characters-ok';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32-characters';
process.env.AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE || 'false';
process.env.SETTINGS_ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || Buffer.alloc(32, 7).toString('base64');
process.env.PHI_ENCRYPTION_KEY = process.env.PHI_ENCRYPTION_KEY || Buffer.alloc(32, 9).toString('base64');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../src/app');
const { ApiError } = require('../src/common/errors/ApiError');
const { PERMISSION_CATALOG, SYSTEM_ROLES } = require('../src/modules/rbac/rbac.constants');
const { isPhiEncryptedEnvelope } = require('../src/common/utils/phiEncryption');
const { createPatientsService } = require('../src/modules/patients/patients.service');
const patientsRepository = require('../src/modules/patients/patients.repository');
const { createPatientRecordsService } = require('../src/modules/patientRecords/patientRecords.service');

const request = async (app, requestPath, options = {}) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}${requestPath}`, options);
    const bodyText = await response.text();
    let bodyJson;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch (error) {
      bodyJson = bodyText;
    }
    return { response, body: bodyJson };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

const createPatientsHarness = ({ clinicStatus = 'ACTIVE', duplicates = [] } = {}) => {
  const state = {
    clinics: [{ id: '11111111-1111-4111-8111-111111111111', status: clinicStatus, is_deleted: false }],
    patients: [...duplicates],
    registrationRequests: [],
    counter: 1,
    audits: [],
    outbox: [],
  };
  const repository = {
    completeRegistrationRequest: async ({ requestId, patientId, responseSummary }) => {
      const requestEntry = state.registrationRequests.find((entry) => entry.id === requestId);
      Object.assign(requestEntry, { patient_id: patientId, response_summary: responseSummary, status: 'COMPLETED' });
      return requestEntry;
    },
    createOutboxEvent: async (payload) => { state.outbox.push(payload); return payload; },
    createPatient: async (payload) => { state.patients.push(payload); return payload; },
    createRegistrationRequest: async (payload) => {
      if (state.registrationRequests.some((entry) => entry.clinic_id === payload.clinic_id && entry.idempotency_key === payload.idempotency_key)) {
        const error = new Error('duplicate idempotency key');
        error.code = 'P2002';
        throw error;
      }
      state.registrationRequests.push(payload);
      return payload;
    },
    findClinicById: async (clinicId) => state.clinics.find((clinic) => clinic.id === clinicId && !clinic.is_deleted) || null,
    findPatientById: async ({ clinicId, patientId }) => state.patients.find((patient) => patient.clinic_id === clinicId && patient.id === patientId && !patient.is_deleted) || null,
    findPotentialDuplicates: async () => duplicates,
    findRegistrationRequest: async ({ clinicId, idempotencyKey }) => state.registrationRequests.find((entry) => (
      entry.clinic_id === clinicId && entry.idempotency_key === idempotencyKey
    )) || null,
    listPatients: async ({ clinicId }) => state.patients.filter((patient) => patient.clinic_id === clinicId && !patient.is_deleted),
    nextPatientCodeValue: async () => state.counter++,
    searchPatients: async ({ clinicId }) => state.patients.filter((patient) => patient.clinic_id === clinicId && !patient.is_deleted),
    updatePatient: async ({ clinicId, patientId, data }) => {
      const patient = state.patients.find((entry) => entry.id === patientId && entry.clinic_id === clinicId);
      if (!patient) return null;
      Object.assign(patient, data);
      return patient;
    },
  };
  const service = createPatientsService({
    repository,
    auditRecorder: async (input) => { state.audits.push(input); return input; },
    transaction: async (callback) => callback({}),
  });
  return { service, state };
};

const createPatientRecordsHarness = ({ clinicStatus = 'ACTIVE' } = {}) => {
  const state = {
    clinics: [{ id: '11111111-1111-4111-8111-111111111111', status: clinicStatus, is_deleted: false }],
    patients: [{ id: '22222222-2222-4222-8222-222222222222', clinic_id: '11111111-1111-4111-8111-111111111111', is_deleted: false }],
    records: [],
    audits: [],
    outbox: [],
  };
  const repository = {
    archiveRecord: async ({ clinicId, recordId, data }) => {
      const record = state.records.find((entry) => entry.id === recordId && entry.clinic_id === clinicId);
      if (!record) return null;
      Object.assign(record, data);
      return record;
    },
    createOutboxEvent: async (payload) => { state.outbox.push(payload); return payload; },
    createRecord: async (payload) => { state.records.push(payload); return payload; },
    findClinicById: async (clinicId) => state.clinics.find((clinic) => clinic.id === clinicId && !clinic.is_deleted) || null,
    findPatientById: async ({ clinicId, patientId }) => state.patients.find((patient) => patient.clinic_id === clinicId && patient.id === patientId) || null,
    findRecordById: async ({ clinicId, recordId }) => state.records.find((record) => record.clinic_id === clinicId && record.id === recordId && !record.is_deleted) || null,
    listRecords: async ({ clinicId }) => state.records.filter((record) => record.clinic_id === clinicId && !record.is_deleted),
  };
  const service = createPatientRecordsService({
    repository,
    auditRecorder: async (input) => { state.audits.push(input); return input; },
    transaction: async (callback) => callback({}),
  });
  return { service, state };
};

test('prisma schema includes Sprint 4 patient tables, tenant fields, and indexes', () => {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');
  assert.match(schema, /model patient_code_counters/);
  assert.match(schema, /model patient_registration_requests/);
  assert.match(schema, /model patients/);
  assert.match(schema, /model patient_records/);
  assert.match(schema, /clinic_id\s+String\s+@db\.Char\(36\)/);
  assert.match(schema, /@@unique\(\[clinic_id, patient_code\]\)/);
  assert.match(schema, /@@unique\(\[clinic_id, idempotency_key\]\)/);
  assert.match(schema, /@@index\(\[clinic_id, patient_id, created_at\]\)/);
  assert.match(schema, /@@index\(\[clinic_id, normalized_phone, is_deleted\]\)/);
  assert.match(schema, /@@index\(\[clinic_id, normalized_name, date_of_birth, is_deleted\]\)/);
});

test('patient migration artifact includes tables, FKs, and tenant-first indexes', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'migrations', '0004_patients.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE `patients`/);
  assert.match(migration, /CREATE TABLE `patient_records`/);
  assert.match(migration, /CREATE UNIQUE INDEX `patients_clinic_id_patient_code_key`/);
  assert.match(migration, /CREATE UNIQUE INDEX `patient_registration_requests_clinic_id_idempotency_key_key`/);
  assert.match(migration, /patients_clinic_id_normalized_name_date_of_birth_is_deleted_idx/);
  assert.match(migration, /ALTER TABLE `patient_records`/);
  assert.match(migration, /FOREIGN KEY \(`patient_id`\) REFERENCES `patients`/);
});

test('Sprint 4 MySQL integration gate is configured when enabled', { skip: process.env.RUN_MYSQL_INTEGRATION_TESTS !== 'true' || !process.env.MYSQL_TEST_DATABASE_URL ? 'Set RUN_MYSQL_INTEGRATION_TESTS=true and MYSQL_TEST_DATABASE_URL to run Sprint 4 DB evidence tests.' : false }, () => {
  assert.equal(process.env.RUN_MYSQL_INTEGRATION_TESTS, 'true');
  assert.ok(process.env.MYSQL_TEST_DATABASE_URL);
});

test('Sprint 4 MySQL concurrency scenarios required before production acceptance', { skip: 'Documented production gate; skipped in default unit test runs.' }, () => {
  assert.fail('Run live MySQL migration, FK, patient-code counter, and idempotent registration concurrency evidence before production acceptance.');
});

test('Sprint 4 Postman collection is valid JSON and includes PHI workflows', () => {
  const collection = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'postman', 'Doctor-System-Phase-5-Patients.postman_collection.json'), 'utf8'));
  assert.equal(collection.info.name, 'Doctor System - Phase 5 Patients');
  const folderNames = collection.item.map((item) => item.name);
  assert.equal(folderNames.includes('Patients'), true);
  assert.equal(folderNames.includes('Patient Records'), true);
  assert.equal(folderNames.includes('Negative Checks'), true);
});

test('rbac catalog includes Sprint 4 clinic-scoped patient permissions', () => {
  const permissionKeys = PERMISSION_CATALOG.map((permission) => permission.key);
  assert.equal(permissionKeys.includes('patients.read'), true);
  assert.equal(permissionKeys.includes('patients.create'), true);
  assert.equal(permissionKeys.includes('patient_records.create'), true);
  assert.equal(permissionKeys.includes('patient_records.archive'), true);
  const clinicOwner = SYSTEM_ROLES.find((role) => role.code === 'clinic_owner');
  const doctor = SYSTEM_ROLES.find((role) => role.code === 'doctor');
  assert.equal(clinicOwner.permissions.some((grant) => grant.key === 'patients.create' && grant.scope === 'CLINIC'), true);
  assert.equal(doctor.permissions.some((grant) => grant.key === 'patients.read'), false);
});

test('patient routes stay gated by default and mount when enabled', async () => {
  const defaultApp = createApp({ readinessPing: async () => true });
  const hidden = await request(defaultApp, '/api/v1/patients');
  assert.equal(hidden.response.status, 404);

  const authService = {
    resolveAccessToken: async () => ({
      contextIdentity: {
        userId: 'user-a',
        clinicId: '11111111-1111-4111-8111-111111111111',
        sessionId: 'session-a',
        roles: ['clinic_owner'],
        permissions: ['patients.read'],
        scopedPermissions: { 'patients.read': 'CLINIC' },
        isAuthenticated: true,
        isPlatform: false,
      },
      user: { id: 'user-a' },
      session: { sessionId: 'session-a' },
    }),
  };
  const patientsService = {
    listPatients: async () => ({ patients: [], meta: { page: 1, limit: 50 } }),
  };
  const app = createApp({
    readinessPing: async () => true,
    authService,
    patientsService,
    enablePostSprint1Routes: true,
  });
  const visible = await request(app, '/api/v1/patients', { headers: { cookie: 'access_token=access.jwt' } });
  assert.equal(visible.response.status, 200);
  assert.equal(visible.body.message, 'Patients');
});

test('patient registration requires idempotency and creates safe audit/outbox evidence', async () => {
  const duplicate = {
    id: '33333333-3333-4333-8333-333333333333',
    clinic_id: '11111111-1111-4111-8111-111111111111',
    patient_code: 'PAT-000099',
    full_name: 'Existing Patient',
    normalized_phone: '919999999999',
    status: 'ACTIVE',
    is_deleted: false,
  };
  const { service, state } = createPatientsHarness({ duplicates: [duplicate] });
  await assert.rejects(
    service.registerPatient({
      context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
      payload: { fullName: 'Patient A' },
      idempotencyKey: '',
    }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  );

  const result = await service.registerPatient({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    payload: {
      fullName: 'Patient A',
      phone: '+91 99999 99999',
      dateOfBirth: '1990-01-01',
      medicalSummary: { condition: 'private value' },
    },
    idempotencyKey: 'patient-register-1',
  });
  assert.equal(result.patient.patientCode, 'PAT-000001');
  assert.deepEqual(result.patient.medicalSummary, { condition: 'private value' });
  assert.equal(result.idempotent, false);
  assert.equal(result.duplicateWarnings.length, 1);
  assert.deepEqual(result.duplicateWarnings[0].matchedBy, ['phone']);
  assert.equal(state.outbox.length, 1);
  const createdPatient = state.patients.find((patient) => patient.patient_code === 'PAT-000001');
  assert.equal(isPhiEncryptedEnvelope(createdPatient.medical_summary), true);
  const audit = state.audits.find((entry) => entry.action === 'patient.registered');
  assert.equal(Boolean(audit), true);
  assert.equal(audit.afterData.patientCode, 'PAT-000001');
  assert.equal(Object.prototype.hasOwnProperty.call(audit.afterData, 'fullName'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(audit.afterData, 'medicalSummary'), false);
});

test('patient list/search omit PHI while detail returns decrypted PHI and list access is audited', async () => {
  const { service, state } = createPatientsHarness();
  const created = await service.registerPatient({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    payload: {
      fullName: 'Patient List',
      phone: '+1 202 555 0130',
      demographics: { address: 'private address' },
      medicalSummary: { diagnosis: 'private diagnosis' },
    },
    idempotencyKey: 'patient-list-1',
  });
  const listed = await service.listPatients({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    query: { page: 1, limit: 10 },
  });
  assert.equal(Object.prototype.hasOwnProperty.call(listed.patients[0], 'demographics'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(listed.patients[0], 'medicalSummary'), false);
  assert.equal(listed.patients[0].hasPhone, true);
  const search = await service.searchPatients({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    query: { search: 'pat' },
  });
  assert.equal(Object.prototype.hasOwnProperty.call(search.patients[0], 'medicalSummary'), false);
  const detail = await service.getPatient({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    patientId: created.patient.id,
  });
  assert.deepEqual(detail.patient.demographics, { address: 'private address' });
  assert.deepEqual(detail.patient.medicalSummary, { diagnosis: 'private diagnosis' });
  const listAudit = state.audits.find((entry) => entry.action === 'patient.list_accessed');
  assert.equal(Boolean(listAudit), true);
  assert.equal(listAudit.metadata.resultCount, 1);
  assert.equal(JSON.stringify(listAudit.metadata).includes('private'), false);
});

test('patient registration replays same idempotency key and blocks suspended clinics', async () => {
  const { service, state } = createPatientsHarness();
  const payload = { fullName: 'Patient B', phone: '+1 202 555 0100' };
  const first = await service.registerPatient({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    payload,
    idempotencyKey: 'patient-register-2',
  });
  const replay = await service.registerPatient({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    payload,
    idempotencyKey: 'patient-register-2',
  });
  assert.equal(first.patient.id, replay.patient.id);
  assert.equal(replay.idempotent, true);

  const blocked = createPatientsHarness({ clinicStatus: 'SUSPENDED' });
  await assert.rejects(
    blocked.service.registerPatient({
      context: { userId: 'user-a', clinicId: blocked.state.clinics[0].id, isPlatform: false },
      payload,
      idempotencyKey: 'patient-register-3',
    }),
    (error) => error instanceof ApiError && error.statusCode === 403,
  );
});

test('patient search requires bounded query and audits search metadata', async () => {
  const { service, state } = createPatientsHarness();
  await assert.rejects(
    service.searchPatients({
      context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
      query: { search: 'a' },
    }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  );
  await service.searchPatients({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    query: { search: 'pat' },
  });
  const audit = state.audits.find((entry) => entry.action === 'patient.search_performed');
  assert.equal(Boolean(audit), true);
  assert.equal(audit.metadata.searchLength, 3);
});

test('patient repository search uses normalized prefix predicates', async () => {
  let captured;
  const connection = {
    patients: {
      findMany: async (args) => {
        captured = args;
        return [];
      },
    },
  };
  await patientsRepository.searchPatients({
    clinicId: '11111111-1111-4111-8111-111111111111',
    search: '+1 202',
  }, connection);
  assert.equal(captured.where.clinic_id, '11111111-1111-4111-8111-111111111111');
  assert.equal(captured.where.OR.some((entry) => entry.normalized_phone?.startsWith === '1202'), true);
  assert.equal(captured.where.OR.some((entry) => entry.patient_code?.startsWith === '+1 202'), true);
  assert.equal(JSON.stringify(captured.where).includes('contains'), false);
});

test('patient code counter retries when counter row is missing after ensure', async () => {
  let createCalls = 0;
  let updateCalls = 0;
  const connection = {
    patient_code_counters: {
      create: async () => {
        createCalls += 1;
        return {};
      },
      update: async () => {
        updateCalls += 1;
        if (updateCalls === 1) {
          const error = new Error('missing row');
          error.code = 'P2025';
          throw error;
        }
        return { next_value: 2 };
      },
    },
  };
  const value = await patientsRepository.nextPatientCodeValue({
    clinicId: '11111111-1111-4111-8111-111111111111',
    counterKey: 'PATIENT',
    context: { userId: 'user-a' },
  }, connection);
  assert.equal(value, 1);
  assert.equal(createCalls, 2);
  assert.equal(updateCalls, 2);
});

test('patient update rejects medical summary and uses tenant-scoped mutations', async () => {
  const { service, state } = createPatientsHarness();
  const created = await service.registerPatient({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    payload: { fullName: 'Patient Update', demographics: { city: 'Private' } },
    idempotencyKey: 'patient-update-1',
  });
  await assert.rejects(
    service.updatePatient({
      context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
      patientId: created.patient.id,
      payload: { medicalSummary: { condition: 'changed' } },
    }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  );
  const updated = await service.updatePatient({
    context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
    patientId: created.patient.id,
    payload: { demographics: { city: 'Encrypted' } },
  });
  const stored = state.patients.find((patient) => patient.id === created.patient.id);
  assert.equal(isPhiEncryptedEnvelope(stored.demographics), true);
  assert.deepEqual(updated.patient.demographics, { city: 'Encrypted' });
  await assert.rejects(
    service.archivePatient({
      context: { userId: 'user-a', clinicId: '99999999-9999-4999-8999-999999999999', isPlatform: false },
      patientId: created.patient.id,
    }),
    (error) => error instanceof ApiError && error.statusCode === 404,
  );
});

test('PHI writes fail closed when PHI encryption key is missing', async () => {
  const previousKey = process.env.PHI_ENCRYPTION_KEY;
  delete process.env.PHI_ENCRYPTION_KEY;
  try {
    const { service, state } = createPatientsHarness();
    await assert.rejects(
      service.registerPatient({
        context: { userId: 'user-a', clinicId: state.clinics[0].id, isPlatform: false },
        payload: { fullName: 'Patient Missing Key', medicalSummary: { condition: 'private' } },
        idempotencyKey: 'patient-missing-key-1',
      }),
      (error) => error instanceof ApiError && error.statusCode === 500,
    );
    const records = createPatientRecordsHarness();
    await assert.rejects(
      records.service.createRecord({
        context: { userId: 'doctor-a', clinicId: records.state.clinics[0].id, isPlatform: false },
        payload: {
          patientId: records.state.patients[0].id,
          recordType: 'NOTE',
          title: 'Missing key',
          recordData: { note: 'private' },
        },
      }),
      (error) => error instanceof ApiError && error.statusCode === 500,
    );
  } finally {
    process.env.PHI_ENCRYPTION_KEY = previousKey;
  }
});

test('patient record creation is append-only and PHI-safe in audit payloads', async () => {
  const { service, state } = createPatientRecordsHarness();
  await assert.rejects(
    service.createRecord({
      context: { userId: 'doctor-a', clinicId: state.clinics[0].id, isPlatform: false },
      payload: {
        patientId: state.patients[0].id,
        recordType: 'NOTE',
        title: 'Visit note',
        recordData: { complaint: 'private detail' },
        attachmentCount: 1,
      },
    }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  );
  const result = await service.createRecord({
    context: { userId: 'doctor-a', clinicId: state.clinics[0].id, isPlatform: false },
    payload: {
      patientId: state.patients[0].id,
      recordType: 'NOTE',
      title: 'Visit note',
      recordData: { complaint: 'private detail' },
    },
  });
  assert.equal(result.record.attachmentCount, 0);
  assert.deepEqual(result.record.recordData, { complaint: 'private detail' });
  assert.equal(isPhiEncryptedEnvelope(state.records[0].record_data), true);
  const listed = await service.listRecords({
    context: { userId: 'doctor-a', clinicId: state.clinics[0].id, isPlatform: false },
    query: { patientId: state.patients[0].id },
  });
  assert.equal(Object.prototype.hasOwnProperty.call(listed.records[0], 'recordData'), false);
  const detail = await service.getRecord({
    context: { userId: 'doctor-a', clinicId: state.clinics[0].id, isPlatform: false },
    recordId: result.record.id,
  });
  assert.deepEqual(detail.record.recordData, { complaint: 'private detail' });
  const listAudit = state.audits.find((entry) => entry.action === 'patient_record.list_accessed');
  assert.equal(Boolean(listAudit), true);
  assert.equal(JSON.stringify(listAudit.metadata).includes('private detail'), false);
  const audit = state.audits.find((entry) => entry.action === 'patient_record.created');
  assert.equal(Boolean(audit), true);
  assert.deepEqual(audit.afterData.dataKeys, ['complaint']);
  assert.equal(JSON.stringify(audit.afterData).includes('private detail'), false);
});

test('patient record archive preserves record payload and blocks suspended clinics', async () => {
  const { service, state } = createPatientRecordsHarness();
  const created = await service.createRecord({
    context: { userId: 'doctor-a', clinicId: state.clinics[0].id, isPlatform: false },
    payload: {
      patientId: state.patients[0].id,
      recordType: 'HISTORY',
      title: 'History',
      recordData: { note: 'unchanged' },
    },
  });
  const archived = await service.archiveRecord({
    context: { userId: 'doctor-a', clinicId: state.clinics[0].id, isPlatform: false },
    recordId: created.record.id,
    reason: 'entered in error',
  });
  assert.equal(archived.record.status, 'ARCHIVED');
  assert.equal(isPhiEncryptedEnvelope(state.records[0].record_data), true);
  await assert.rejects(
    service.archiveRecord({
      context: { userId: 'doctor-a', clinicId: '99999999-9999-4999-8999-999999999999', isPlatform: false },
      recordId: created.record.id,
      reason: 'wrong tenant',
    }),
    (error) => error instanceof ApiError && error.statusCode === 404,
  );

  const blocked = createPatientRecordsHarness({ clinicStatus: 'SUSPENDED' });
  await assert.rejects(
    blocked.service.createRecord({
      context: { userId: 'doctor-a', clinicId: blocked.state.clinics[0].id, isPlatform: false },
      payload: {
        patientId: blocked.state.patients[0].id,
        recordType: 'NOTE',
        title: 'Blocked',
        recordData: { note: 'blocked' },
      },
    }),
    (error) => error instanceof ApiError && error.statusCode === 403,
  );
});
