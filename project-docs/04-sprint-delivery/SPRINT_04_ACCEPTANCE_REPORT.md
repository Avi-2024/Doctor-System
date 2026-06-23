# Sprint 4 Acceptance Report

## Acceptance Scope

Sprint 4 covers Patients and append-only Patient Records only.

Included scope:

- Clinic-scoped patient registration, list, search, detail, update, archive, and restore.
- Append-only patient record create, list, detail, and archive.
- PHI-minimized list/search DTOs.
- PHI-safe audit summaries.
- PHI encryption-at-rest implementation for patient demographics, patient medical summaries, and patient record data.
- Tenant-scoped mutation predicates.
- Patient-code counter hardening.
- Duplicate warning and bounded search hardening.

Excluded scope:

- Appointments.
- Clinical workflow.
- Storage/attachments.
- Patient exports.
- WebSocket runtime.
- Production MySQL evidence acceptance.
- Medium/Low Sprint 4 debt unless directly required by High fixes.

## Final Verdict

Sprint 4 is **not accepted yet**.

The local baseline is green, but final acceptance is blocked because High issue H6 remains evidence-open and supporting artifacts are not fully aligned with the High fixes.

## Verification Evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Critical issues | No Critical findings reported | `SPRINT_04_REVIEW.md` reported no Critical issues. |
| High issues | Not fully accepted | H1-H5 and H7-H9 appear locally code-covered, but H6 remains evidence-open and artifact updates are incomplete. |
| Lint | Passed | `npm run lint` passed. |
| Build | Passed | `npm run build` passed and Prisma schema validated. |
| Tests | Passed locally with skips | `npm test` passed with 120 total tests, 116 passed, 4 skipped. |
| MySQL evidence | Not complete | Sprint 3 and Sprint 4 MySQL evidence tests remain skipped by default. |
| Documentation | Partially updated | `PHASE_05_PATIENTS.md` and `PATIENTS_API.md` still need clearer PHI encryption, list DTO, and `medicalSummary` update language. |
| Postman | Partially updated | Collection parses, but patient update still includes `medicalSummary` and list/detail PHI assertions are incomplete. |
| Acceptance report | Created | This file records the current acceptance state. |

## Critical Status

No Critical Sprint 4 issues were reported.

Critical status: **resolved / not applicable**.

## High Status

| Issue | Status | Notes |
| --- | --- | --- |
| H1. List APIs Return Raw PHI And Clinical Payloads | Locally code-covered, not final accepted | Tests indicate patient and patient-record list DTOs omit PHI, but docs/Postman need final alignment. |
| H2. PHI List Access Is Not Audited | Locally code-covered, not final accepted | Tests indicate list audit events exist and use safe metadata. |
| H3. Tenant-Owned Mutations Use ID-Only Repository Updates | Locally code-covered, not final accepted | Tests indicate tenant-scoped mutation paths exist. |
| H4. Patient Medical Summary Is Mutable Without Version History | Locally code-covered, not final accepted | Tests indicate update rejects `medicalSummary`; docs/Postman still need cleanup. |
| H5. PHI Is Stored Plaintext In JSON Columns | Locally code-covered, not final accepted | Tests indicate PHI is encrypted and fails closed without a key. |
| H6. MySQL Transaction And Concurrency Evidence Is Still Skipped | Open | Live MySQL migration/FK/transaction/concurrency evidence has not been run. |
| H7. Patient-Code Counter Recovery Path Is Not Fully Hardened | Locally code-covered, not final accepted | Unit coverage exists, but live MySQL concurrency evidence remains pending. |
| H8. Duplicate Warning Matching Is Misleading | Locally code-covered, not final accepted | Tests indicate duplicate reasons are based on actual matches. |
| H9. Search Still Uses Broad `contains` Queries | Locally code-covered, not final accepted | Tests indicate normalized prefix predicates and index artifact exist. |

## Acceptance Answers

### 1. Is Sprint 4 complete?

No.

Local implementation tests pass, but Sprint 4 cannot be marked complete until H6 MySQL evidence is closed and documentation/Postman/status artifacts are aligned with the High fixes.

### 2. Is Sprint 4 merge ready?

No for a production-bound branch.

It may be locally integrated only if the CTO explicitly accepts H6 and artifact drift as tracked blockers. For production-bound merge, Sprint 4 should wait until live MySQL evidence is recorded and supporting artifacts are updated.

### 3. Is Sprint 4 production ready?

No.

Production readiness is blocked by missing live MySQL transaction/FK/concurrency evidence for PHI workflows and by incomplete acceptance artifacts.

### 4. What technical debt remains?

- Live MySQL migration/FK/transaction/concurrency suite has not been run.
- Sprint 4 MySQL tests remain skipped in default local runs.
- Postman does not fully assert PHI-minimized list/detail behavior.
- Postman patient update still includes `medicalSummary`, which the API should reject.
- Documentation does not fully describe PHI encryption, `PHI_ENCRYPTION_KEY`, list DTO minimization, and blocked `medicalSummary` updates.
- Sprint 4 review/fix-plan docs still present High issues as open rather than final status.
- Route-permission coverage is not automated.
- Patient archive/restore outbox events remain Medium debt.
- Patient record archive reason remains Medium debt.
- Explicit `GET /api/v1/patients/:id/records` remains deferred.
- Stronger HTTP API tests for envelopes, CSRF, validation, and Postman parity remain Medium debt.
- API naming polish around archive/delete semantics remains Low debt.

## Required Completion Tasks

Before Sprint 4 can be accepted:

1. Replace placeholder Sprint 4 MySQL tests with real gated live scenarios or explicitly keep H6 open.
2. Run the MySQL-gated suite with:

```powershell
$env:RUN_MYSQL_INTEGRATION_TESTS='true'
$env:MYSQL_TEST_DATABASE_URL='<mysql-test-url>'
npm test
```

3. Record MySQL evidence in the Sprint 4 acceptance artifacts.
4. Update `backend-new/docs/PHASE_05_PATIENTS.md`.
5. Update `backend-new/docs/PATIENTS_API.md`.
6. Update `backend-new/postman/Doctor-System-Phase-5-Patients.postman_collection.json`.
7. Update `project-docs/04-sprint-delivery/SPRINT_04_REVIEW.md`.
8. Update `project-docs/04-sprint-delivery/SPRINT_04_FIX_PLAN.md`.
9. Re-run:

```powershell
npm run lint
npm run build
npm test
```

## Acceptance Decision

Sprint 4 status: **Not accepted yet**.

Sprint 4 should remain blocked for final acceptance until H6 MySQL evidence and artifact alignment are complete.
