/**
 * Patients Constants
 * Defines Sprint 4 patient statuses, audit actions, and outbox names.
 */

const PATIENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
});

const PATIENT_GENDER = Object.freeze({
  FEMALE: 'FEMALE',
  MALE: 'MALE',
  OTHER: 'OTHER',
  UNKNOWN: 'UNKNOWN',
});

const PATIENT_ACTION = Object.freeze({
  REGISTERED: 'patient.registered',
  UPDATED: 'patient.updated',
  ARCHIVED: 'patient.archived',
  RESTORED: 'patient.restored',
  READ: 'patient.read',
  LIST_ACCESSED: 'patient.list_accessed',
  SEARCHED: 'patient.search_performed',
});

const PATIENT_OUTBOX_EVENT = Object.freeze({
  REGISTERED: 'patient.registered.v1',
  UPDATED: 'patient.updated.v1',
  ARCHIVED: 'patient.archived.v1',
  RESTORED: 'patient.restored.v1',
});

const PATIENT_CODE_COUNTER_KEY = 'PATIENT';
const PATIENT_CODE_PREFIX = 'PAT';

module.exports = {
  PATIENT_ACTION,
  PATIENT_CODE_COUNTER_KEY,
  PATIENT_CODE_PREFIX,
  PATIENT_GENDER,
  PATIENT_OUTBOX_EVENT,
  PATIENT_STATUS,
};
