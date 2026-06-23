# Sprint 4 Review

## Review Verdict

**Request changes before production acceptance.**

Sprint 4 is directionally aligned with the modular monolith architecture and the local baseline is green, but the implementation is not production-ready for PHI workflows. No Critical issue was confirmed because routes remain gated and service-level tenant checks exist, but several High issues must be fixed before this can be considered safe for real clinic data.

## Sources Reviewed

- `backend-new/src/app.js`
- `backend-new/prisma/schema.prisma`
- `backend-new/prisma/migrations/0004_patients.sql`
- `backend-new/src/modules/patients/*`
- `backend-new/src/modules/patientRecords/*`
- `backend-new/src/modules/rbac/rbac.constants.js`
- `backend-new/tests/patients.phase5.test.js`
- `backend-new/docs/PHASE_05_PATIENTS.md`
- `backend-new/docs/PATIENTS_API.md`
- `backend-new/postman/Doctor-System-Phase-5-Patients.postman_collection.json`

## Verification Observed

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run build` | Passed earlier in Sprint 4 implementation; Prisma schema validated |
| `npm test` | Passed: 111 passing, 4 skipped MySQL-gated tests |
| Postman JSON parse | Covered by tests and passed |

## Critical Findings

No Critical findings.

Rationale: the new patient routes remain behind the post-Sprint route gate, every exposed route uses auth/RBAC middleware, service methods resolve tenant scope before repository reads, and no confirmed direct cross-tenant exploit was found in static review.

## High Findings

### H1. List APIs Return Raw PHI And Clinical Payloads

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js:43`
- `backend-new/src/modules/patientRecords/patientRecords.service.js:28`
- `backend-new/src/modules/patients/patients.repository.js:79`
- `backend-new/src/modules/patientRecords/patientRecords.repository.js:23`

**Issue:** `normalizePatient` returns `demographics` and `medicalSummary`, and `normalizePatientRecord` returns full `recordData`. These normalizers are used by list endpoints, so broad list calls can return full PHI and clinical data.

**Risk:** Staff with list/read access can pull much more PHI than needed. Large clinical JSON payloads also make list APIs slow and expensive.

### H2. PHI List Access Is Not Audited

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js:121`
- `backend-new/src/modules/patientRecords/patientRecords.service.js:93`

**Issue:** Detail and search operations write audit entries, but `GET /patients` and `GET /patient-records` do not audit PHI access. Since the list responses currently include PHI, this creates an audit gap.

**Risk:** Bulk PHI access can happen without durable audit evidence.

### H3. Tenant-Owned Mutations Use ID-Only Repository Updates

**Affected files:**

- `backend-new/src/modules/patients/patients.repository.js:137`
- `backend-new/src/modules/patientRecords/patientRecords.repository.js:45`

**Issue:** `updatePatient` and `archiveRecord` update by primary key only. The service checks tenant ownership before calling them, but repository helpers do not enforce `clinic_id`.

**Risk:** This violates the tenant query rule and weakens defense-in-depth. A future service call or refactor could accidentally update cross-tenant PHI.

### H4. Patient Medical Summary Is Mutable Without Version History

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js:263`
- `backend-new/src/modules/patients/patients.validator.js:53`
- `backend-new/prisma/schema.prisma:145`

**Issue:** The implementation correctly makes `patient_records` append-only, but `patients.medical_summary` can still be overwritten through `PATCH /patients/:id` with only summary audit.

**Risk:** Clinically relevant information can be lost or changed without a reliable history trail.

### H5. PHI Is Stored Plaintext In JSON Columns

**Affected files:**

- `backend-new/prisma/schema.prisma:143`
- `backend-new/prisma/schema.prisma:145`
- `backend-new/prisma/schema.prisma:175`

**Issue:** `demographics`, `medical_summary`, and `record_data` are stored as raw JSON. Sprint 3 introduced encryption for sensitive settings, but Sprint 4 does not define a comparable PHI-at-rest policy.

**Risk:** Database snapshot, backup, or privileged database access exposes full PHI unless storage-layer controls are the only protection.

### H6. MySQL Transaction And Concurrency Evidence Is Still Skipped

**Affected files:**

- `backend-new/tests/patients.phase5.test.js:156`
- `backend-new/tests/patients.phase5.test.js:161`

**Issue:** Sprint 4 adds patient-code counters, idempotent registration, FKs, and unique constraints, but the MySQL-backed tests are skipped by default and no live evidence is recorded.

**Risk:** Local fake tests do not prove MySQL locking, rollback, FK, or duplicate-registration behavior under concurrency.

### H7. Patient-Code Counter Recovery Path Is Not Fully Hardened

**Affected files:**

- `backend-new/src/modules/patients/patients.repository.js:20`
- `backend-new/src/modules/patients/patients.repository.js:40`

**Issue:** The counter pattern is reasonable, but it assumes Prisma's composite unique alias and live MySQL behavior are correct. It has no fallback when the counter row is missing due to manual corruption after deployment.

**Risk:** Patient registration can fail globally for a tenant if the counter row is deleted/corrupted, or if the generated Prisma delegate alias differs.

### H8. Duplicate Warning Matching Is Misleading

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js:72`
- `backend-new/src/modules/patients/patients.repository.js:117`

**Issue:** Duplicate warnings mark fields as matched based on the candidate having those fields, not based on which predicate actually matched.

**Risk:** Users can receive inaccurate duplicate warnings, which is dangerous in patient registration workflows.

### H9. Search Still Uses Broad `contains` Queries

**Affected files:**

- `backend-new/src/modules/patients/patients.repository.js:79`
- `backend-new/src/modules/patients/patients.repository.js:99`
- `backend-new/prisma/schema.prisma:166`

**Issue:** Search is bounded by length and limit, but it still uses `contains` against name, code, phone, and email fields without a full-text or prefix-specific strategy. The schema also lacks a composite duplicate lookup index for normalized name plus date of birth.

**Risk:** Patient search can become a high-traffic slow-query source as patient volume grows.

## Medium Findings

### M1. Patient Archive/Restore Do Not Emit Outbox Events

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js:314`
- `backend-new/src/modules/patients/patients.service.js:348`
- `backend-new/src/modules/patients/patients.constants.js`

Archive and restore event constants exist, but the service only emits outbox events for register/update. Downstream projections and future notifications will miss lifecycle changes.

### M2. Record Archive Does Not Require A Reason

**Affected files:**

- `backend-new/src/modules/patientRecords/patientRecords.validator.js:39`

Archiving clinical records should require a reason. The current validator makes it optional.

### M3. Missing `GET /api/v1/patients/:id/records`

**Affected files:**

- `backend-new/src/modules/patients/patients.routes.js`
- `backend-new/src/modules/patientRecords/patientRecords.routes.js`

The generic `GET /patient-records?patientId=` exists, but the patient-centric route requested in plan review is missing.

### M4. Route-Permission Coverage Is Not Automated

**Affected files:**

- `backend-new/tests/patients.phase5.test.js`

Tests verify some routing and RBAC catalog behavior, but there is no route-to-permission matrix assertion for every Sprint 4 route.

### M5. API Tests Are Mostly Service/Fake Tests

**Affected files:**

- `backend-new/tests/patients.phase5.test.js`

The test suite has useful service tests, but does not exercise real HTTP create/update/archive flows with CSRF, validation errors, and API response envelopes.

### M6. WebSocket Event Names Are Not Documented For Sprint 4

**Affected files:**

- `backend-new/docs/PHASE_05_PATIENTS.md`
- `backend-new/docs/PATIENTS_API.md`

No runtime WebSocket work is expected in Sprint 4, but reserved future event names are not documented.

### M7. Postman Collection Lacks Auth/CSRF Bootstrap

**Affected files:**

- `backend-new/postman/Doctor-System-Phase-5-Patients.postman_collection.json`

The collection assumes `csrfToken`, cookies, and `clinicId` already exist. It is useful manually but not runner-complete.

## Low Findings

### L1. Documentation Should State Production Blockers More Explicitly

**Affected files:**

- `backend-new/docs/PHASE_05_PATIENTS.md`
- `backend-new/docs/PATIENTS_API.md`

Docs mention deferred MySQL evidence and scopes, but should clearly label them as production gates.

### L2. Patient Record API Uses DELETE For Archive

**Affected files:**

- `backend-new/src/modules/patientRecords/patientRecords.routes.js:35`

The implementation is archive-only, but using `DELETE` can confuse clients. A `POST /:id/archive` or `PATCH /:id/status` route may be clearer for immutable clinical records.

### L3. Fixtures Use Minimal Synthetic PHI Only

**Affected files:**

- `backend-new/tests/patients.phase5.test.js`
- `backend-new/postman/Doctor-System-Phase-5-Patients.postman_collection.json`

This is acceptable, but coverage would benefit from more realistic edge cases such as Unicode names, same phone across family members, missing DOB, and old records.

## Dedicated Gap Summary

### Code Quality

The module layering is mostly clean and consistent with previous sprints. Main quality risk is reuse of full-detail normalizers for list views.

### Architecture Compliance

Routes/controllers are thin. Services own workflow logic. Repositories own Prisma access. The largest architecture violation is repository update helpers that do not include `clinic_id` in mutation predicates.

### Security

Authentication, CSRF, RBAC, and tenant override are wired. PHI minimization and PHI-at-rest policy are not strong enough yet.

### Tenant Isolation

Service-level tenant checks are present, but repository mutation predicates need tenant scope.

### RBAC

Sprint 4 intentionally avoids branch and assigned scopes. That is the correct conservative choice. Route-permission coverage should be automated before merge.

### API Standards

Envelope and validation patterns are followed. API surface is missing patient-centric record listing and has archive semantics hidden behind `DELETE`.

### Validation Coverage

Core validation exists. Clinical archive reason, recorded-at future dates, richer patient duplicate fields, and list query standards need tightening.

### Error Handling

Uses centralized `ApiError` and Prisma mapping. Duplicate registration and missing counter corruption paths need stronger operational handling.

### Logging

Request logging remains generic. No module metrics or PHI-specific access counters exist.

### Audit Logging

Detail and search audit exist. List access, archive/restore outbox parity, and mandatory clinical archive reasons are incomplete.

### Database Indexes

Tenant-first indexes exist, but search and duplicate checks need a stronger strategy. MySQL evidence is skipped.

### Transactions

Registration and record creation use transactions. Live MySQL concurrency evidence is still missing.

### Background Jobs

Outbox is partially used. No worker runtime is expected yet, but events are incomplete for archive/restore.

### WebSocket Events

No runtime WebSocket events. Future event names are not documented.

### Testing

Local tests pass, but there is no live MySQL proof and not enough HTTP/API coverage for Sprint 4.

### Documentation

Docs are useful but need stronger production-gate language and WebSocket/background-event notes.

### Postman

Collection parses and covers core requests, but is not runner-ready without manual Auth/CSRF setup.

## Answers

### 1. What Is Missing?

- Summary-only list responses for patients and records.
- Audit evidence for list/bulk PHI access.
- Tenant-scoped repository mutation predicates.
- PHI encryption or an explicit field-level PHI-at-rest policy.
- Live MySQL transaction/FK/concurrency evidence.
- Patient-centric record route.
- Automated route-permission coverage.
- Runner-ready Postman bootstrap.

### 2. What Is Risky?

- Returning full `medicalSummary`, `demographics`, and `recordData` in list endpoints.
- Overwriting `patients.medical_summary` without version history.
- Relying on fake tests for patient-code counter and idempotency semantics.
- ID-only repository updates for tenant-owned PHI.

### 3. What Is Not Production Ready?

Sprint 4 is not production-ready for real PHI until High findings are fixed and live MySQL evidence is recorded.

### 4. What Technical Debt Was Introduced?

- Full-detail normalizers reused for list endpoints.
- Skipped MySQL evidence gates.
- Partial outbox coverage.
- Search implementation based on `contains` rather than a scalable lookup/search model.
- Medical summary stored as mutable JSON on the patient root.

### 5. What Should Be Improved Before Merge?

Before merge, fix H1-H4 at minimum: list response minimization, list audit, tenant-scoped mutation predicates, and medical-summary immutability/history. If the merge target is only local sprint integration, H5-H9 can be tracked as explicit blockers for production acceptance, but they should not be ignored.
