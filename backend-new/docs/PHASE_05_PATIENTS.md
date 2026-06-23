# Phase 05 Patients And Records

## Status

Implemented for Sprint 4 local acceptance scope.

This phase adds the clinic-scoped patient registry and append-only patient records foundation. It deliberately keeps patient access at `CLINIC` scope because branch and assigned-provider patient access cannot be enforced safely until appointments, consultations, and branch ownership rules are available.

## Implemented Modules

- `src/modules/patients`
- `src/modules/patientRecords`

Both modules follow:

`Route -> Validator -> Controller -> Service -> Repository -> Prisma`

## APIs

Patients:

- `GET /api/v1/patients`
- `GET /api/v1/patients/search`
- `POST /api/v1/patients`
- `GET /api/v1/patients/:id`
- `PATCH /api/v1/patients/:id`
- `DELETE /api/v1/patients/:id`
- `POST /api/v1/patients/:id/restore`

Patient records:

- `GET /api/v1/patient-records`
- `POST /api/v1/patient-records`
- `GET /api/v1/patient-records/:id`
- `DELETE /api/v1/patient-records/:id`

Patient record updates are intentionally deferred. Clinical records are append-only/archive-only until a version-history policy is implemented.

## Database

Migration artifact:

- `prisma/migrations/0004_patients.sql`

Prisma models:

- `patient_code_counters`
- `patient_registration_requests`
- `patients`
- `patient_records`

Tenant-owned tables include `clinic_id` and tenant-first indexes. Patient registration uses `Idempotency-Key` and a clinic-local patient code counter.

## RBAC

Sprint 4 permissions:

- `patients.read`
- `patients.create`
- `patients.update`
- `patients.archive`
- `patients.restore`
- `patient_records.read`
- `patient_records.create`
- `patient_records.archive`

Default grants are limited to `clinic_owner` and `clinic_admin` at `CLINIC` scope. Doctor, receptionist, branch, and assigned scopes remain deferred until enforceable workflow ownership exists.

## Audit Rules

PHI audit payloads store summaries only:

- patient id
- clinic id
- patient code
- status
- boolean presence flags for phone, email, and date of birth
- patient record type, title, status, data keys, and attachment count

Raw patient demographics, medical summaries, and clinical record values are not copied into audit logs.

## Deferred

- Branch-scoped patient access.
- Assigned-provider patient record access.
- Patient merge.
- Patient attachments/documents.
- Patient export.
- Patient record update/version history.
- Full MySQL concurrency evidence unless gated integration tests are run.
