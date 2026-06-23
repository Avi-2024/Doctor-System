# Sprint 4 Execution Plan

## Source Review

Reviewed sources:

- `project-docs/00-executive-reviews/ROADMAP_12_MONTHS.md` as the available product roadmap source because `PRODUCT_ROADMAP.md` is not present in the current organized docs tree.
- `backend-new/docs/IMPLEMENTATION_PHASES.md`.
- `project-docs/01-product-launch/DELIVERY_MASTER_PLAN.md`.
- `project-docs/04-sprint-delivery/SPRINT_03_ACCEPTANCE_REPORT.md`.
- Supporting API/database/RBAC workflow docs in `backend-new/docs`.

Sprint 3 is accepted as the baseline for Sprint 4. Sprint 3 remains not production-ready until live MySQL evidence is recorded, but that is not a blocker for Sprint 4 local implementation planning.

## 1. Sprint Goal

Build the patient registry and patient record foundation required for daily outpatient clinic operations.

Sprint 4 must let authorized clinic staff safely create, search, view, update, archive, and restore patients, and create/view/update/archive patient records with tenant isolation, RBAC, validation, audit logging, and future storage hooks.

## 2. Business Value

- Enables front desk staff to register and find patients quickly.
- Gives doctors and clinical staff a trusted patient profile before appointments and consultations.
- Creates the data foundation for Sprint 5 appointments/queue and Sprint 6 clinical workflows.
- Establishes PHI handling rules before the product stores heavier clinical, lab, billing, and messaging data.
- Adds patient identifiers and search paths needed for real clinic workflow speed.

## 3. User Stories

| User Story | Priority | Acceptance Criteria |
| --- | --- | --- |
| As a Receptionist, I can register a patient with required demographics and contact data. | P0 | Patient is created with tenant-scoped `patient_code`, duplicate constraints, audit record, and outbox event. |
| As a Receptionist, I can search patients by code, name, phone, or email. | P0 | Search is tenant-scoped, paginated, capped, and uses indexed fields. |
| As a Clinic Owner/Admin, I can update and archive patient profiles. | P0 | Patient code remains immutable; archived patients cannot be used by future workflows until restored. |
| As a Doctor, I can view a patient profile and medical summary. | P0 | Sensitive read is audited and tenant/RBAC checks apply. |
| As Clinical Staff, I can add a patient record such as history, allergy, note, or document metadata. | P0 | Patient ownership is validated, record is tenant-scoped, payload is validated by record type, and audit/outbox records are written. |
| As a Doctor, I can view a patient record timeline. | P1 | List supports patient, type, date range, pagination, and safe sorting. |
| As a Clinic Admin, I can restore an archived patient when needed. | P1 | Restore is audited and revalidates duplicate/active state rules. |

## 4. Database Changes

Create migration artifact `backend-new/prisma/migrations/0004_patients.sql` and update Prisma schema.

### New Tables

| Table | Purpose | Required Constraints And Indexes |
| --- | --- | --- |
| `patient_code_counters` | Transaction-safe tenant patient-code sequencing. | Unique `(clinic_id, counter_key)`; tenant-first indexes; row locked/updated in patient registration transaction. |
| `patients` | Tenant patient registry. | `clinic_id`, `patient_code`, `full_name`, `phone`, `email`, `gender`, `date_of_birth`, `blood_group`, `demographics`, `medical_summary`, `status`, soft-delete fields, `created_by`, `updated_by`; unique `(clinic_id, patient_code)`; indexes `(clinic_id, is_deleted)`, `(clinic_id, patient_code)`, `(clinic_id, phone, is_deleted)`, `(clinic_id, full_name, is_deleted)`, `(clinic_id, created_at)`, `(clinic_id, status, is_deleted)`. |
| `patient_records` | Patient history and supporting medical/administrative data. | `clinic_id`, `patient_id`, `record_type`, `title`, `record_data`, `recorded_at`, `attachment_count`, `status`, soft-delete fields, `created_by`, `updated_by`; FK to `patients`; indexes `(clinic_id, patient_id, record_type, is_deleted)`, `(clinic_id, patient_id, recorded_at)`, `(clinic_id, record_type, created_at)`, `(clinic_id, created_at)`. |

### Explicitly Deferred

- Full S3 upload/download runtime is deferred to the Storage sprint.
- Sprint 4 may store `attachment_count` and future-safe attachment metadata references only if needed for patient records.
- No appointments, queue, vitals, consultations, prescriptions, billing, lab, or notifications implementation starts in Sprint 4.

## 5. APIs

All protected APIs follow:

`Auth -> Tenant Context -> RBAC -> CSRF for unsafe methods -> Validator -> Controller -> Service -> Repository -> Prisma`

### Patients

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/patients` | List/search patients. | `patients.read` |
| `GET` | `/api/v1/patients/search` | Fast patient lookup for front desk search boxes. | `patients.read` |
| `POST` | `/api/v1/patients` | Register patient. | `patients.create` |
| `GET` | `/api/v1/patients/:id` | Patient profile. | `patients.read` |
| `PATCH` | `/api/v1/patients/:id` | Update patient profile. | `patients.update` |
| `DELETE` | `/api/v1/patients/:id` | Archive patient. | `patients.delete` |
| `POST` | `/api/v1/patients/:id/restore` | Restore archived patient. | `patients.restore` |

### Patient Records

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/api/v1/patient-records` | List records by patient/type/date. | `patient_records.read` |
| `POST` | `/api/v1/patient-records` | Create patient record. | `patient_records.create` |
| `GET` | `/api/v1/patient-records/:id` | View one record. | `patient_records.read` |
| `PATCH` | `/api/v1/patient-records/:id` | Update non-final patient record. | `patient_records.update` |
| `DELETE` | `/api/v1/patient-records/:id` | Archive patient record. | `patient_records.delete` |

## 6. Services

| Service | Responsibilities |
| --- | --- |
| `patients.service.js` | Patient registration transaction, patient code generation, list/search/detail/update/archive/restore, duplicate handling, lifecycle checks, audit, outbox events. |
| `patientRecords.service.js` | Patient ownership validation, record payload validation by type, list/detail/create/update/archive, sensitive-read audit, outbox events. |
| Shared patient policy helper | Patient status/lifecycle rules, archived-patient restrictions for future workflows, safe PHI response normalization. |

## 7. Repositories

| Repository | Responsibilities |
| --- | --- |
| `patients.repository.js` | Prisma access for `patients`, `patient_code_counters`, tenant-scoped patient reads/writes, code counter updates, conflict-safe lookup helpers. |
| `patientRecords.repository.js` | Prisma access for `patient_records`, patient ownership checks, tenant-scoped record reads/writes, list filters and indexes. |

Repository rules:

- No patient query may omit `clinic_id`.
- No patient record query may omit `clinic_id`.
- Patient code generation must be transaction-safe.
- Prisma `P2002`, `P2003`, and not-found conflicts must map to stable API errors.

## 8. Validations

### Patient Validation

- `fullName`: required, 2-190 characters.
- `phone`: required, normalized string, 5-40 characters.
- `email`: optional valid email.
- `gender`: enum only.
- `dateOfBirth`: optional ISO date, cannot be in the future.
- `bloodGroup`: optional approved enum.
- `demographics`: optional object with size cap.
- `medicalSummary`: optional object with size cap.
- `patientCode`: server-generated only and immutable.
- List/search query: `page`, `limit`, `search`, `status`, `phone`, `patientCode`, `sortBy`, `sortDirection` with allowlisted values.
- Archive/restore body must include `reason`.

### Patient Record Validation

- `patientId`: required UUID.
- `recordType`: enum such as `MEDICAL_HISTORY`, `ALLERGY`, `NOTE`, `DOCUMENT`, `SURGICAL_HISTORY`, `FAMILY_HISTORY`.
- `title`: optional 1-190 characters.
- `recordData`: required object with size cap and type-specific required fields where applicable.
- `recordedAt`: optional ISO datetime, cannot be in the future beyond allowed clock skew.
- `attachmentCount`: integer, defaults to 0, cannot imply uploaded files unless storage metadata exists.
- List query: `patientId`, `recordType`, `dateFrom`, `dateTo`, `page`, `limit`, `sortBy`, `sortDirection`.
- Archive body must include `reason`.

## 9. Permissions

Extend RBAC catalog and system roles.

| Permission | Scope |
| --- | --- |
| `patients.read` | `BRANCH`, `CLINIC`, `ALL` |
| `patients.create` | `BRANCH`, `CLINIC`, `ALL` |
| `patients.update` | `BRANCH`, `CLINIC`, `ALL` |
| `patients.delete` | `CLINIC`, `ALL` |
| `patients.restore` | `CLINIC`, `ALL` |
| `patients.export` | Deferred; catalog entry allowed but no export API in Sprint 4 |
| `patient_records.read` | `ASSIGNED`, `BRANCH`, `CLINIC`, `ALL` |
| `patient_records.create` | `ASSIGNED`, `BRANCH`, `CLINIC`, `ALL` |
| `patient_records.update` | `ASSIGNED`, `BRANCH`, `CLINIC`, `ALL` |
| `patient_records.delete` | `CLINIC`, `ALL` |
| `patient_records.export` | Deferred; catalog entry allowed but no export API in Sprint 4 |

Default role grants:

- `clinic_owner`: `CLINIC` for all Sprint 4 patient permissions.
- `clinic_admin`: `CLINIC` for read/create/update; delete/restore only if approved by RBAC matrix.
- `doctor`: `ASSIGNED` or `CLINIC` read depending current RBAC policy; create/update patient records for assigned patients.
- `receptionist`: `BRANCH` patient read/create/update, limited patient record read/create for operational notes.
- `clinical_staff`: `BRANCH` or `ASSIGNED` patient record create/update.

## 10. Audit Requirements

Audit all PHI-sensitive operations:

- `patient.created`
- `patient.viewed`
- `patient.updated`
- `patient.archived`
- `patient.restored`
- `patient.search`
- `patient_record.created`
- `patient_record.viewed`
- `patient_record.updated`
- `patient_record.archived`
- `patient.cross_tenant_denied`
- `patient_record.cross_tenant_denied`

Audit payloads must include request ID, actor user ID, clinic ID, resource type, resource ID, action, severity, safe before/after data, and reason where required.

Do not store raw secret-like values in audit payloads. Medical details in audit metadata should be summarized, not duplicated wholesale.

## 11. WebSocket Events

No Socket.IO runtime implementation is required in Sprint 4.

Reserve event names for later realtime modules:

- `patient.created`
- `patient.updated`
- `patient.archived`
- `patient.restored`
- `patient_record.created`
- `patient_record.updated`
- `patient_record.archived`

If outbox events are created, payloads must be tenant-scoped and safe for future broadcasting to `clinic:{clinicId}` rooms.

## 12. Background Jobs

No worker runtime implementation is required in Sprint 4.

Create outbox events only:

- `patient.created.v1`
- `patient.updated.v1`
- `patient.archived.v1`
- `patient.restored.v1`
- `patient_record.created.v1`
- `patient_record.updated.v1`
- `patient_record.archived.v1`

Deferred jobs:

- Patient import.
- Patient export.
- Search index synchronization.
- Storage scanning.
- Notifications.

## 13. Tests

Required tests:

- Prisma schema includes Sprint 4 patient tables, FKs, tenant-first indexes, and uniqueness constraints.
- Migration artifact `0004_patients.sql` exists and includes patients, patient records, counters, indexes, FKs.
- RBAC catalog includes Sprint 4 permissions and system role grants.
- Patient registration creates tenant-scoped patient with unique patient code.
- Patient code generation is deterministic under transaction and conflict-safe under duplicate races.
- Duplicate patient code returns stable `409`.
- Patient list/search is tenant-scoped and paginated.
- Cross-tenant patient read/update/archive/restore is denied and audited.
- Patient code is immutable on update.
- Archive requires reason and blocks future workflow use.
- Restore requires permission and audit.
- Patient record create validates patient belongs to tenant.
- Patient record list/detail/update/archive is tenant-scoped.
- Patient record view writes sensitive-read audit.
- Validation errors do not echo PHI-heavy payloads unnecessarily.
- Postman collection parses as valid JSON.
- `npm run lint`, `npm run build`, and `npm test` pass.

Gated MySQL tests should be added or extended for:

- Migration apply.
- FK behavior for patient records.
- Patient code unique constraint.
- Counter concurrency.
- Rollback on patient registration failure.

## 14. Documentation

Create/update:

- `project-docs/04-sprint-delivery/SPRINT_04_EXECUTION_PLAN.md`.
- `backend-new/docs/PHASE_05_PATIENTS.md`.
- `backend-new/docs/PATIENTS_API.md`.
- `backend-new/docs/PHASE_01_MIGRATION_PLAN.md` or migration index to reference `0004_patients.sql`.
- `backend-new/docs/RBAC_MATRIX.md` if Sprint 4 permission grants change.

Docs must explicitly state:

- Patients and records are PHI.
- Every patient API is tenant-scoped and RBAC-protected.
- Full storage upload/download is deferred unless separately approved.
- MySQL integration evidence is required before production acceptance.

## 15. Postman Updates

Create:

- `backend-new/postman/Doctor-System-Phase-5-Patients.postman_collection.json`.

Collection must include:

- Auth prerequisite note using Sprint 1 cookie/CSRF flow.
- Patient create/list/search/detail/update/archive/restore.
- Patient record create/list/detail/update/archive.
- Negative examples for missing CSRF, missing permission, invalid UUID, cross-tenant `x-clinic-id`, archived patient usage.
- Tests for response envelope, status codes, stored IDs, and basic field assertions.

## Task Matrix

| Task | Priority | Dependencies | Risks | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| Confirm Sprint 4 boundary | P0 | Sprint 3 accepted | Scope creep into appointments, queue, clinical, storage runtime | Plan and implementation exclude non-patient workflow modules. |
| Add patient schema and migration | P0 | Sprint 3 tenants schema | Missing tenant indexes, invalid FKs, weak code uniqueness | Prisma validates and migration includes tenant-first indexes/FKs. |
| Add patient code counter strategy | P0 | Patient schema | Duplicate patient codes under concurrency | Counter is transaction-safe and covered by tests. |
| Extend RBAC catalog and roles | P0 | Sprint 2/3 RBAC | Overbroad PHI access | Permissions and default role grants are explicit and tested. |
| Implement patient module layers | P0 | Auth/RBAC/Tenant foundations | Business logic leaking into controllers | Route -> Validator -> Controller -> Service -> Repository -> Prisma is preserved. |
| Implement patient registration | P0 | Patient schema, counter strategy | Duplicate patients, PHI audit gaps | Creates patient with audit/outbox and unique tenant code. |
| Implement patient list/search/detail | P0 | Patient repository indexes | Slow search, PHI overexposure | Tenant-scoped pagination/search works and patient views are audited. |
| Implement patient update/archive/restore | P0 | Lifecycle policy | Immutable code mutation, unsafe restore | Patient code immutable; reason required for archive/restore; audit coverage passes. |
| Implement patient records module layers | P0 | Patients module | Cross-tenant record access | Records validate patient ownership and tenant scope. |
| Implement record create/list/detail/update/archive | P0 | Patient records schema | Unvalidated PHI payloads, missing read audit | Payload validation and sensitive-read audit tests pass. |
| Add outbox events | P1 | Outbox foundation | Docs overstate async behavior | Events are emitted or docs match actual behavior. |
| Add tests | P0 | Implementation complete | PHI/security regressions | Unit/API/RBAC/tenant/validation tests pass. |
| Add docs and Postman | P1 | API behavior finalized | Contract drift | Docs and Postman match implemented APIs and parse as valid JSON. |
| Run verification | P0 | Code/docs/tests complete | Broken baseline | `npm run lint`, `npm run build`, and `npm test` pass. |

## Why Sprint 4 Is Important

Sprint 4 is the first patient-data sprint. It turns the tenant/admin platform into a clinic workflow system by introducing the patient registry and patient record foundation that every later module depends on.

Without Sprint 4, appointments, queue, consultations, prescriptions, labs, billing, notifications, and reports have no trusted patient source of truth.

## What Customer Value Sprint 4 Delivers

- Clinics can start registering real patients.
- Reception can search and update patient profiles.
- Doctors and clinical staff can view patient history before care.
- Clinics get a safer PHI foundation with audit logging and tenant isolation.
- Later workflow sprints can build on stable patient IDs and indexed patient lookup.

## What Can Fail During Sprint 4

- Cross-tenant PHI access if any query misses `clinic_id`.
- Patient-code duplication under concurrent registrations.
- Overbroad RBAC grants exposing patient records to the wrong staff roles.
- PHI leakage through validation errors, logs, audit payloads, or Postman examples.
- Slow patient search if indexes do not match real query patterns.
- Archived patients accidentally used by later workflows.
- Patient record payloads becoming unbounded JSON blobs without type rules.

## What Must Be Tested Carefully

- Tenant isolation for every patient and record API.
- RBAC allow/deny behavior by role and scope.
- Patient code uniqueness and transaction behavior.
- Patient search pagination, filters, and sort caps.
- Archive/restore status transitions.
- Sensitive read audit for patient profile and patient record views.
- Validation failures for bad demographics, future birth dates, invalid record types, oversized JSON, and invalid UUIDs.
- Prisma migration validity, FK behavior, and MySQL uniqueness enforcement.

## Sprint 4 Acceptance Criteria

Sprint 4 is accepted only when:

- Patients and patient records modules exist in `backend-new`.
- All Sprint 4 APIs are protected by Auth, tenant context, RBAC, validation, and CSRF where unsafe.
- Every patient-owned query filters by trusted `clinic_id`.
- Patient registration is transaction-safe and produces unique tenant-scoped patient codes.
- Patient and record views are audited as PHI access.
- Docs and Postman match the implementation.
- `npm run lint`, `npm run build`, and `npm test` pass.
- MySQL-backed DB evidence is either completed or explicitly recorded as a production gate.
