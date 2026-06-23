# Sprint 4 Plan Review

## Review Verdict

**Request changes before implementation.**

The Sprint 4 plan is directionally correct for Patients and Patient Records, but it is not implementation-ready. The High findings below must be resolved before coding starts because this sprint introduces PHI, patient identity, searchable medical data, and database concurrency concerns.

## Sources Reviewed

- `project-docs/04-sprint-delivery/SPRINT_04_EXECUTION_PLAN.md`
- `project-docs/04-sprint-delivery/SPRINT_03_ACCEPTANCE_REPORT.md`
- `project-docs/01-product-launch/DELIVERY_MASTER_PLAN.md`
- `project-docs/00-executive-reviews/ROADMAP_12_MONTHS.md`
- `backend-new/docs/IMPLEMENTATION_PHASES.md`
- `backend-new/docs/API_ROADMAP.md`
- `backend-new/docs/DATABASE_DESIGN.md`
- `backend-new/docs/RBAC_MATRIX.md`
- `backend-new/docs/BUSINESS_WORKFLOWS.md`

Note: `PRODUCT_ROADMAP.md` is not present in the organized docs tree. `ROADMAP_12_MONTHS.md` was used as the available roadmap source.

## Critical Findings

No Critical findings.

Rationale: this is a plan review, not live code. No production vulnerability exists until implementation starts.

## High Findings

### H1. Branch-Scoped Patient Access Is Not Enforceable

Area: RBAC coverage, tenant isolation, architecture alignment.

The plan grants `BRANCH` patient access, but `patients` has no `branch_id`, home branch, or patient-branch assignment model. Without a concrete branch ownership model, branch-scoped roles cannot be enforced deterministically.

Risk: Receptionists or branch-scoped users can accidentally receive clinic-wide patient access, or implementation may invent inconsistent branch filtering.

Required fix: add a clear branch ownership/access model, or restrict Sprint 4 patient permissions to `CLINIC` until branch scoping is modeled.

### H2. Assigned-Scope Patient Record RBAC Is Not Enforceable Yet

Area: RBAC coverage, API security.

The plan grants `ASSIGNED` patient record access, but appointments, consultations, provider assignments, and clinical task ownership are Sprint 5+. Sprint 4 has no source of truth for assigned patients.

Risk: assigned access can silently become clinic-wide access or inconsistent service logic.

Required fix: defer `ASSIGNED` enforcement or define a Sprint 4 assignment source of truth.

### H3. Patient Registration Lacks Idempotency

Area: API completeness, database consistency.

`POST /api/v1/patients` generates a patient code but does not require an `Idempotency-Key`.

Risk: client retries can create duplicate patients with different generated codes.

Required fix: require `Idempotency-Key` for patient registration, store/replay request hash, and test duplicate/retry behavior.

### H4. Patient-Code Counter Strategy Is Under-Specified

Area: database impact, scalability, testing coverage.

`patient_code_counters` is named, but no MySQL/Prisma-safe atomic increment pattern is defined.

Risk: concurrent patient registration can produce duplicate codes or lock contention surprises.

Required fix: define atomic counter transaction behavior and add gated MySQL concurrency tests.

### H5. Medical Record Update/Versioning Policy Is Unsafe

Area: auditability, compliance readiness, data integrity.

`PATCH /api/v1/patient-records/:id` allows mutable PHI records without a version/history policy.

Risk: medical history can be overwritten without a defensible chain of changes.

Required fix: make patient records append-only/archive-only for Sprint 4, or add version history before allowing updates.

### H6. Duplicate Patient Detection And Merge Policy Is Missing

Area: product correctness, operational quality.

The plan has unique patient codes, but no duplicate warning rules for phone/name/date-of-birth.

Risk: real clinics will create duplicate patient profiles, corrupting future appointments, billing, clinical history, and reporting.

Required fix: add duplicate warning/search rules; defer merge if needed but document no-merge behavior.

### H7. PHI Audit Policy Is Not Concrete Enough

Area: security alignment, audit requirements.

The plan says medical details should be summarized but does not define safe audit fields or list/search audit granularity.

Risk: PHI can leak into audit payloads, or audit volume can explode from search/list operations.

Required fix: define audit payload shape and what is never copied into audit logs.

### H8. Search API Promises Fast/Indexed Search Without A Concrete Strategy

Area: scalability impact, database impact.

`GET /api/v1/patients/search` promises fast lookup, but no minimum search length, normalized phone/code lookup, allowed fields, or query plan policy is defined.

Risk: large tenants can trigger slow MySQL `LIKE` scans on PHI-heavy tables.

Required fix: define minimum search length, allowed fields, normalized phone/code lookup, pagination caps, and MySQL indexes.

### H9. Sprint 3 MySQL Evidence Remains Unresolved

Area: testing coverage, database readiness.

Sprint 3 acceptance still has MySQL migration/FK/transaction/concurrency evidence pending. Sprint 4 adds more schema and concurrency risk.

Risk: schema-heavy Sprint 4 work stacks on unverified Sprint 3 database behavior.

Required fix: make MySQL migration/concurrency suite a Sprint 4 acceptance gate, not only a production gate.

### H10. Attachment/Document Metadata Is Ambiguous

Area: architecture alignment, API completeness.

The plan mentions `attachment_count` and future-safe metadata without defining storage-file reference rules.

Risk: patient records can claim attachments that do not exist, bypass future Storage ownership checks, or require later migration cleanup.

Required fix: keep attachments completely out of Sprint 4 or add explicit storage-file reference rules.

## Medium Findings

### M1. Patient Records Nested API Is Missing Or Not Explicitly Deferred

API completeness should add or explicitly defer `GET /api/v1/patients/:id/records`.

### M2. Status Enums And Transitions Need Exact Definitions

Patient and patient-record status values and allowed transitions need to be listed before implementation.

### M3. Phone/Email Normalization Needs Stronger Validation

The plan should define normalized phone storage, duplicate comparison, and email casing behavior.

### M4. Patient Search Audit Can Flood Audit Logs

`patient.search` audit for every search can generate excessive audit volume. The plan should audit detail views and high-risk search/export behavior, or define throttled search audit policy.

### M5. Outbox And Reserved WebSocket Payload Shapes Are Not Defined

Event names exist, but payload fields are not specified. At minimum include `eventId`, `clinicId`, `aggregateType`, `aggregateId`, `eventVersion`, `correlationId`, and safe payload.

### M6. Export Permissions Are Listed While Export APIs Are Deferred

The plan includes `patients.export` and `patient_records.export` catalog entries. Docs must prevent accidental export implementation in Sprint 4.

### M7. Archive/Delete Behavior Needs Future Reference Rules

Patient and record archive behavior must define how future appointments, clinical, lab, and billing modules treat archived patients and records.

### M8. Postman Fixtures Must Use Synthetic PHI

Postman examples should use clearly fake patients and include negative tenant/RBAC examples.

## Low Findings

### L1. Product Roadmap Filename Mismatch

`PRODUCT_ROADMAP.md` is missing. The review should state `ROADMAP_12_MONTHS.md` was used instead.

### L2. Route-To-Permission Checklist Artifact Is Missing

A human-reviewable route-permission matrix should be added for Sprint 4 acceptance.

### L3. Phase Numbering Needs Clarification

Sprint 4 maps to patient work, while implementation docs call patient/storage work Phase 6. The Sprint 4 docs should explicitly map Sprint 4 to Phase 6 patient subset.

### L4. Manual Verification Steps Need More Detail

Sprint 4 acceptance should include Postman JSON parse and MySQL-gated test instructions.

## Gap Summary

| Area | Assessment |
| --- | --- |
| Architecture alignment | Good modular-monolith direction, but attachment metadata and record mutability need redesign. |
| Security alignment | PHI handling is acknowledged, but audit payload and validation redaction rules need more precision. |
| RBAC coverage | Permissions are listed, but `BRANCH` and `ASSIGNED` scopes are not enforceable with current Sprint 4 data model. |
| Tenant isolation | Tenant-first query rules are present; cross-tenant tests must be mandatory for every API. |
| API completeness | Core APIs are present; nested record listing and idempotency headers are missing or ambiguous. |
| Database impact | Patient tables and indexes are directionally right; counter concurrency and MySQL proof are under-specified. |
| Validation coverage | Basic fields are covered; duplicate detection, phone normalization, status transitions, and record-type schemas need detail. |
| Audit requirements | Audit events are listed, but safe payload shape and search/list audit policy are incomplete. |
| WebSocket events | Correctly deferred, but event payload shape should be defined for outbox compatibility. |
| Background jobs | Correctly deferred, but outbox payload contract should be explicit. |
| Testing coverage | Strong intent, but MySQL integration must become an acceptance gate. |
| Scalability impact | Search and code generation can become bottlenecks unless the strategy is tightened before implementation. |

## What Is Missing

- Enforceable branch and assigned-scope model.
- Patient registration idempotency.
- Atomic patient-code counter details.
- Patient record versioning or append-only policy.
- Duplicate patient warning rules.
- Concrete PHI audit payload contract.
- Search strategy that avoids unbounded scans.
- Live MySQL acceptance gate.
- Clear attachment/storage boundary.

## What Is Risky

- Granting `BRANCH`/`ASSIGNED` permissions before data relationships exist.
- Allowing mutable medical records without version history.
- Generating patient codes under concurrency without proven locking.
- Logging or auditing too much PHI.
- Adding `/patients/search` without strict query constraints.
- Starting Sprint 4 while Sprint 3 MySQL evidence is still pending.

## What Should Be Redesigned Before Implementation

1. RBAC scope model for patients and records.
2. Patient registration idempotency and patient-code generation.
3. Patient record mutability/versioning policy.
4. Duplicate patient detection and no-merge/merge policy.
5. PHI audit payload contract.
6. Patient search contract and index strategy.
7. Attachment boundary with the future Storage module.

## What Can Cause Production Issues Later

- Duplicate patient profiles leading to split clinical and billing history.
- Cross-branch PHI exposure due to unenforceable branch scope.
- Untraceable medical record edits.
- Slow patient searches as tenant data grows.
- Audit log bloat from search events.
- Broken future storage migration if attachment placeholders are inconsistent.
- Failing migrations or FK behavior due to insufficient MySQL validation.

## Recommendation

Do not implement Sprint 4 as-is.

Fix all High findings before Sprint 4 implementation starts. Medium findings may be accepted only if explicitly tracked in the Sprint 4 plan and do not weaken PHI security, tenant isolation, or database consistency.
