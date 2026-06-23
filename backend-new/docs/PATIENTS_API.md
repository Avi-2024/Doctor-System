# Patients API

## Overview

The Patients API is a protected, clinic-scoped Sprint 4 API. All routes require:

- HTTP-only cookie authentication.
- Trusted tenant context or platform `x-clinic-id` override.
- RBAC permission.
- CSRF token on unsafe methods.
- Validation for params, query, body, and `Idempotency-Key` where required.

## Tenant Scope

Clinic users cannot provide client tenant IDs. Platform users must send `x-clinic-id` for tenant-scoped patient operations.

Suspended or archived clinics cannot create, update, archive, restore, or create patient records.

## Patients

### `GET /api/v1/patients`

Required permission: `patients.read`

Query:

- `page`
- `limit`
- `search`
- `status`

### `GET /api/v1/patients/search`

Required permission: `patients.read`

Query:

- `search` required, minimum 2 characters.
- `page`
- `limit` maximum 25.

Search is limited to patient code, name, normalized phone, and normalized email. Search audits record only search length and result count.

### `POST /api/v1/patients`

Required permission: `patients.create`

Headers:

- `Idempotency-Key` required.
- `x-csrf-token` required.

Body:

```json
{
  "fullName": "Jane Patient",
  "phone": "+1 202 555 0100",
  "email": "jane@example.com",
  "gender": "FEMALE",
  "dateOfBirth": "1990-01-01",
  "bloodGroup": "O+",
  "demographics": {},
  "medicalSummary": {}
}
```

Registration returns duplicate warnings when similar active patients are found. Warnings do not block registration in Sprint 4.

### `GET /api/v1/patients/:id`

Required permission: `patients.read`

Writes PHI read audit evidence using summary-only metadata.

### `PATCH /api/v1/patients/:id`

Required permission: `patients.update`

Updates patient registry fields only. It does not edit patient records.

### `DELETE /api/v1/patients/:id`

Required permission: `patients.archive`

Archives the patient. Historical records remain intact.

### `POST /api/v1/patients/:id/restore`

Required permission: `patients.restore`

Restores an archived patient.

## Patient Records

### `GET /api/v1/patient-records`

Required permission: `patient_records.read`

Query:

- `patientId`
- `recordType`
- `status`
- `page`
- `limit`

### `POST /api/v1/patient-records`

Required permission: `patient_records.create`

Body:

```json
{
  "patientId": "00000000-0000-4000-8000-000000000000",
  "recordType": "NOTE",
  "title": "Visit note",
  "recordData": {
    "summary": "Clinical note text"
  }
}
```

Attachments are not available in Sprint 4. `attachmentCount` must be omitted or `0`.

### `GET /api/v1/patient-records/:id`

Required permission: `patient_records.read`

Writes PHI read audit evidence using data keys, not raw record values.

### `DELETE /api/v1/patient-records/:id`

Required permission: `patient_records.archive`

Archives the record without mutating its clinical payload.

## Deferred Contract

The following are explicitly deferred:

- `PATCH /api/v1/patient-records/:id`
- patient merge
- patient attachments
- branch-scoped patient access
- assigned-provider patient access
- patient exports
