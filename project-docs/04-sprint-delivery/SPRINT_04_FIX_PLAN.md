# Sprint 4 Fix Plan

## Summary

This plan covers issues found in the Sprint 4 Principal Engineer review. Do not start Sprint 5 until Critical and High Sprint 4 issues are closed or explicitly accepted by the CTO with documented risk.

## Critical Issues

No Critical issues were found.

## High Issues

### H1. List APIs Return Raw PHI And Clinical Payloads

**Severity:** High

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js`
- `backend-new/src/modules/patientRecords/patientRecords.service.js`
- `backend-new/src/modules/patients/patients.repository.js`
- `backend-new/src/modules/patientRecords/patientRecords.repository.js`

**Root cause:** The same full-detail normalizers are used for list and detail endpoints.

**Risk if not fixed:** Bulk PHI exposure, slow responses, large payloads, and weak least-privilege behavior.

**Exact fix approach:** Split list and detail DTOs. List DTOs should return only ids, patient code, name, status, high-level timestamps, and non-sensitive flags. Patient record list DTOs should omit `recordData` and return only record id, patient id, record type, title, status, recorded date, and attachment count.

**Dependencies:** API docs/Postman update.

**Required tests:**

- `GET /patients` does not include `demographics` or `medicalSummary`.
- `GET /patient-records` does not include `recordData`.
- Detail endpoints still return permitted full data.

**Acceptance criteria:** List endpoints are PHI-minimized and response docs match implementation.

### H2. PHI List Access Is Not Audited

**Severity:** High

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js`
- `backend-new/src/modules/patientRecords/patientRecords.service.js`

**Root cause:** Audit was added for detail/search but not list operations.

**Risk if not fixed:** Bulk PHI reads can happen without audit evidence.

**Exact fix approach:** Add summary audit events for patient list and patient-record list access. Store actor, clinic, route operation, filters used, page/limit, and result count only. Do not copy PHI into audit metadata.

**Dependencies:** Audit action constants.

**Required tests:**

- Patient list writes PHI-safe audit.
- Patient record list writes PHI-safe audit.
- Audit metadata does not contain names, medical summaries, or record values.

**Acceptance criteria:** All list/detail/search PHI read paths write safe audit evidence.

### H3. Tenant-Owned Mutations Use ID-Only Repository Updates

**Severity:** High

**Affected files:**

- `backend-new/src/modules/patients/patients.repository.js`
- `backend-new/src/modules/patientRecords/patientRecords.repository.js`
- `backend-new/src/modules/patients/patients.service.js`
- `backend-new/src/modules/patientRecords/patientRecords.service.js`

**Root cause:** Repository update helpers mutate by primary key only after service-level tenant checks.

**Risk if not fixed:** A future caller can accidentally bypass tenant scope and update cross-tenant PHI.

**Exact fix approach:** Change mutation repository APIs to require `clinicId` and use tenant-scoped `updateMany` plus reload, or use composite unique constraints where possible. Fail if affected count is not exactly one.

**Dependencies:** None.

**Required tests:**

- Patient update passes clinic id to repository mutation.
- Patient archive/restore cannot update a record from another clinic.
- Patient record archive cannot update a record from another clinic.

**Acceptance criteria:** Every tenant-owned mutation predicate includes `clinic_id`.

### H4. Patient Medical Summary Is Mutable Without Version History

**Severity:** High

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js`
- `backend-new/src/modules/patients/patients.validator.js`
- `backend-new/prisma/schema.prisma`

**Root cause:** Sprint 4 deferred patient record updates but still allows direct overwrite of `patients.medical_summary`.

**Risk if not fixed:** Clinical summary data can be silently overwritten and cannot be reconstructed.

**Exact fix approach:** Either remove `medicalSummary` from `PATCH /patients/:id` until a version-history model exists, or add `patient_summary_history` with append-only changes. Preferred Sprint 4 fix: block `medicalSummary` updates and keep medical facts in append-only patient records.

**Dependencies:** API docs/Postman update.

**Required tests:**

- `PATCH /patients/:id` rejects `medicalSummary`.
- Existing registration can set initial summary only if accepted by product/security.
- Docs state medical summary updates are deferred.

**Acceptance criteria:** No mutable clinical summary overwrite exists without history.

### H5. PHI Is Stored Plaintext In JSON Columns

**Severity:** High

**Affected files:**

- `backend-new/prisma/schema.prisma`
- `backend-new/src/modules/patients/patients.service.js`
- `backend-new/src/modules/patientRecords/patientRecords.service.js`

**Root cause:** PHI JSON storage does not use field-level encryption or a documented exception.

**Risk if not fixed:** Database-level exposure leaks PHI from demographics, medical summary, and clinical record data.

**Exact fix approach:** Define PHI-at-rest policy. Either encrypt PHI JSON fields with a dedicated PHI encryption helper and key, or document the accepted architecture if relying only on RDS/KMS/storage encryption. Preferred fix: encrypt `demographics`, `medical_summary`, and `record_data` with AES-256-GCM envelopes similar to settings encryption, with detail-only decryption.

**Dependencies:** Key management and performance review.

**Required tests:**

- PHI JSON is encrypted before persistence.
- Missing/invalid PHI encryption key fails closed.
- Audit/history/outbox never include raw decrypted values.

**Acceptance criteria:** PHI-at-rest behavior is explicit, tested, and documented.

### H6. MySQL Transaction And Concurrency Evidence Is Still Skipped

**Severity:** High

**Affected files:**

- `backend-new/tests/patients.phase5.test.js`
- `backend-new/prisma/migrations/0004_patients.sql`

**Root cause:** Default local tests use fakes; MySQL tests are placeholders/skipped.

**Risk if not fixed:** The riskiest DB behaviors are unproven: counter increments, idempotency, FK enforcement, rollback, duplicate patient-code protection.

**Exact fix approach:** Add and run live MySQL integration tests behind the existing env gate. Record evidence in Sprint 4 acceptance docs.

**Dependencies:** MySQL test database and migration runner.

**Required tests:**

- Migration applies cleanly.
- Concurrent patient registration produces unique patient codes.
- Same idempotency key replays or conflicts deterministically.
- FK prevents orphan patient records.
- Transaction rollback leaves no partial patient registration state.

**Acceptance criteria:** MySQL suite passes and evidence is stored with Sprint 4 acceptance.

### H7. Patient-Code Counter Recovery Path Is Not Fully Hardened

**Severity:** High

**Affected files:**

- `backend-new/src/modules/patients/patients.repository.js`

**Root cause:** Counter behavior assumes expected Prisma alias and healthy counter state.

**Risk if not fixed:** Tenant registration can break if the counter row is manually deleted/corrupted or if Prisma delegate naming differs in generated client behavior.

**Exact fix approach:** Add robust counter repair/retry behavior: create missing row, retry increment on not found, map Prisma errors safely, and cover with integration tests.

**Dependencies:** MySQL test suite.

**Required tests:**

- Missing counter row is recreated.
- Duplicate counter create race still produces unique codes.
- Corrupt counter state returns stable API error or repairs safely.

**Acceptance criteria:** Patient code allocation is deterministic under retry and concurrency.

### H8. Duplicate Warning Matching Is Misleading

**Severity:** High

**Affected files:**

- `backend-new/src/modules/patients/patients.service.js`
- `backend-new/src/modules/patients/patients.repository.js`

**Root cause:** The service marks matched fields based on candidate field presence instead of actual matching predicates.

**Risk if not fixed:** Staff can make wrong patient identity decisions based on inaccurate duplicate warnings.

**Exact fix approach:** Return match reasons from duplicate detection. Compare requested normalized phone/email/name+DOB against candidate values and populate `matchedBy` only for actual matches.

**Dependencies:** None.

**Required tests:**

- Phone-only duplicate returns `phone`.
- Email-only duplicate returns `email`.
- Name+DOB duplicate returns `name_date_of_birth`.
- Candidate fields that did not match are not listed.

**Acceptance criteria:** Duplicate warnings are accurate and deterministic.

### H9. Search Still Uses Broad `contains` Queries

**Severity:** High

**Affected files:**

- `backend-new/src/modules/patients/patients.repository.js`
- `backend-new/prisma/schema.prisma`
- `backend-new/prisma/migrations/0004_patients.sql`

**Root cause:** Sprint 4 search uses flexible `contains` matching without a production search/index strategy.

**Risk if not fixed:** Patient search becomes a slow-query hotspot as patient volume grows.

**Exact fix approach:** Split search into exact/prefix indexed lookups for patient code, phone, and email; add a normalized searchable name field with prefix behavior or defer broad name search to a proper search service later. Add composite index for duplicate matching: `(clinic_id, normalized_name, date_of_birth, is_deleted)`.

**Dependencies:** DB migration update and query-plan review.

**Required tests:**

- Search enforces minimum length and max limit.
- Phone/code/email use normalized indexed lookup.
- Duplicate name+DOB query uses indexed fields.
- Migration artifact includes new indexes.

**Acceptance criteria:** Sprint 4 search has documented and indexed query patterns.

## Medium Issues

### M1. Patient Archive/Restore Do Not Emit Outbox Events

**Severity:** Medium

**Affected files:** `backend-new/src/modules/patients/patients.service.js`

**Root cause:** Constants exist but service does not emit lifecycle outbox events.

**Risk if not fixed:** Future projections/notifications miss patient lifecycle changes.

**Exact fix approach:** Emit `patient.archived.v1` and `patient.restored.v1` events after successful archive/restore.

**Dependencies:** None.

**Required tests:** Archive/restore emit correct tenant-scoped outbox events.

**Acceptance criteria:** Docs, constants, and behavior match.

### M2. Record Archive Does Not Require A Reason

**Severity:** Medium

**Affected files:** `backend-new/src/modules/patientRecords/patientRecords.validator.js`

**Root cause:** Reason is optional for clinical record archive.

**Risk if not fixed:** Clinical correction trail lacks operational context.

**Exact fix approach:** Require `reason` with length 3-500 for record archive.

**Dependencies:** Postman/docs update.

**Required tests:** Archive without reason fails validation.

**Acceptance criteria:** Every record archive has an audit reason.

### M3. Missing Patient-Centric Records Route

**Severity:** Medium

**Affected files:** `backend-new/src/modules/patients/patients.routes.js`, `backend-new/src/modules/patientRecords/patientRecords.routes.js`

**Root cause:** Only generic query-based record listing was implemented.

**Risk if not fixed:** API ergonomics drift from planned patient workflow.

**Exact fix approach:** Add `GET /api/v1/patients/:id/records` or explicitly keep it deferred in docs and route coverage.

**Dependencies:** None.

**Required tests:** Route returns only records for the requested patient and tenant.

**Acceptance criteria:** API contract is explicit and tested.

### M4. Route-Permission Coverage Is Not Automated

**Severity:** Medium

**Affected files:** `backend-new/tests/patients.phase5.test.js`

**Root cause:** No route matrix test maps each route to its permission.

**Risk if not fixed:** Future route additions can ship without correct RBAC.

**Exact fix approach:** Add route-permission matrix test or static route checklist.

**Dependencies:** None.

**Required tests:** Every Sprint 4 route has expected permission guard.

**Acceptance criteria:** Route-permission coverage fails when a guard is missing or wrong.

### M5. API Tests Are Mostly Service/Fake Tests

**Severity:** Medium

**Affected files:** `backend-new/tests/patients.phase5.test.js`

**Root cause:** HTTP tests currently cover route mounting but not end-to-end validation and CSRF behavior for patient writes.

**Risk if not fixed:** API envelope, CSRF, and validation regressions can slip through.

**Exact fix approach:** Add HTTP tests with fake services for validation, CSRF, and response envelope behavior.

**Dependencies:** None.

**Required tests:** Invalid registration, missing idempotency key, missing CSRF, valid list/detail envelope.

**Acceptance criteria:** Sprint 4 API behavior is covered at HTTP boundary.

### M6. WebSocket Event Names Are Not Documented

**Severity:** Medium

**Affected files:** `backend-new/docs/PHASE_05_PATIENTS.md`, `backend-new/docs/PATIENTS_API.md`

**Root cause:** Runtime WebSockets are deferred, but future event names were not reserved.

**Risk if not fixed:** Later realtime implementation invents incompatible names.

**Exact fix approach:** Document reserved future events: `patient.created`, `patient.updated`, `patient.archived`, `patient_record.created`, `patient_record.archived`.

**Dependencies:** None.

**Required tests:** Documentation presence test if the repo uses doc checks.

**Acceptance criteria:** WebSocket deferral and event naming are explicit.

### M7. Postman Collection Lacks Auth/CSRF Bootstrap

**Severity:** Medium

**Affected files:** `backend-new/postman/Doctor-System-Phase-5-Patients.postman_collection.json`

**Root cause:** Collection assumes cookies and CSRF token already exist.

**Risk if not fixed:** Runner use fails or users manually test incorrectly.

**Exact fix approach:** Add an Auth setup folder or clear prerequisite instructions and tests that capture `csrf_token`.

**Dependencies:** Auth Postman collection.

**Required tests:** JSON parse and manual run order verification.

**Acceptance criteria:** Collection can be run reliably against a seeded test tenant.

## Low Issues

### L1. Documentation Should Label Production Blockers

**Severity:** Low

**Affected files:** `backend-new/docs/PHASE_05_PATIENTS.md`, `backend-new/docs/PATIENTS_API.md`

**Root cause:** Deferrals are listed but not always stated as production gates.

**Risk if not fixed:** Stakeholders may misread local acceptance as production readiness.

**Exact fix approach:** Add a production gates section.

**Dependencies:** None.

**Required tests:** Manual documentation review.

**Acceptance criteria:** Docs clearly distinguish merge-ready from production-ready.

### L2. Archive Uses DELETE Route Semantics

**Severity:** Low

**Affected files:** `backend-new/src/modules/patientRecords/patientRecords.routes.js`, `backend-new/src/modules/patients/patients.routes.js`

**Root cause:** Archive operation is exposed as `DELETE`.

**Risk if not fixed:** Clients may assume destructive deletion.

**Exact fix approach:** Consider adding explicit archive routes and deprecating DELETE before public API freeze.

**Dependencies:** API standards decision.

**Required tests:** Route behavior remains archive-only.

**Acceptance criteria:** API semantics are clear to clients.

### L3. Fixtures Need More Realistic Edge Cases

**Severity:** Low

**Affected files:** `backend-new/tests/patients.phase5.test.js`, `backend-new/postman/Doctor-System-Phase-5-Patients.postman_collection.json`

**Root cause:** Fixtures are intentionally minimal synthetic data.

**Risk if not fixed:** Edge-case regressions in names, phones, DOB, and duplicate warnings may be missed.

**Exact fix approach:** Add synthetic edge cases for Unicode names, family phone reuse, missing DOB, and old record dates.

**Dependencies:** None.

**Required tests:** New edge-case fixtures pass validation and duplicate logic.

**Acceptance criteria:** Patient validation and duplicate warning behavior handles realistic clinic inputs.

## Prioritized Fix Order

1. H1: Minimize PHI list responses.
2. H2: Audit list/bulk PHI access.
3. H3: Add tenant-scoped mutation predicates.
4. H4: Block or version medical-summary updates.
5. H6: Add and run live MySQL evidence tests.
6. H7: Harden patient-code counter recovery.
7. H8: Fix duplicate warning match reasons.
8. H9: Tighten search/index strategy.
9. H5: Define and implement PHI-at-rest policy.
10. M1-M7: Close medium gaps.
11. L1-L3: Documentation/API polish.

## Safe Groupings

- **PHI minimization group:** H1, H2, H4, H5.
- **Tenant/data integrity group:** H3, H6, H7.
- **Patient matching/search group:** H8, H9.
- **API/test/docs group:** M3, M4, M5, M6, M7, L1, L2, L3.

## Merge Recommendation

Do not merge Sprint 4 into a production-bound branch until H1-H4 are fixed. If this is only a local sprint integration branch, merge may be considered after H1-H4 are fixed and H5-H9 are explicitly tracked as production blockers.
