/**
 * Patient Records Constants
 * Defines append-only record states, actions, and event names.
 */

const PATIENT_RECORD_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
});

const PATIENT_RECORD_TYPE = Object.freeze({
  NOTE: 'NOTE',
  HISTORY: 'HISTORY',
  ALLERGY: 'ALLERGY',
  DIAGNOSIS: 'DIAGNOSIS',
  OTHER: 'OTHER',
});

const PATIENT_RECORD_ACTION = Object.freeze({
  CREATED: 'patient_record.created',
  READ: 'patient_record.read',
  LIST_ACCESSED: 'patient_record.list_accessed',
  ARCHIVED: 'patient_record.archived',
});

const PATIENT_RECORD_OUTBOX_EVENT = Object.freeze({
  CREATED: 'patient_record.created.v1',
  ARCHIVED: 'patient_record.archived.v1',
});

module.exports = {
  PATIENT_RECORD_ACTION,
  PATIENT_RECORD_OUTBOX_EVENT,
  PATIENT_RECORD_STATUS,
  PATIENT_RECORD_TYPE,
};
