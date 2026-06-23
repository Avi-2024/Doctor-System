# Sprint 3 Review

## Review Summary

Sprint 3 delivered a broad tenant foundation: clinics, branches, staff users, invitations, settings, minimal subscriptions, RBAC catalog expansion, migration artifact, tests, docs, and Postman collection.

Local verification passes, and the Sprint 3 High findings have been remediated in code with deterministic tests. Sprint 3 is still not production-ready until the gated MySQL integration suite is run against a disposable MySQL database and Medium/Low debt is formally accepted or resolved.

## Verification Evidence

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run build` | Passed, Prisma schema validated |
| `npm test` | Passed, 101 passed / 2 skipped MySQL-gated tests |
| Postman JSON parse | Covered by tests and passed |

## High Finding Status

| Finding | Status |
| --- | --- |
| H1 Invitation lifecycle bypass | Fixed: invitation acceptance checks clinic lifecycle before activation and session issuance reloads through Auth by user/clinic id. |
| H2 Sensitive settings plaintext storage | Fixed: sensitive settings are AES-256-GCM encrypted at rest using `SETTINGS_ENCRYPTION_KEY`; history/audit summaries are redacted. |
| H3 Onboarding idempotency races | Fixed locally: duplicate Prisma conflicts are mapped and idempotency-key races reload existing tenants when payload hash matches. |
| H4 MySQL-backed evidence | Harness added and gated; live MySQL execution remains a production acceptance gate. |
| H5 Invitation accept abuse controls | Fixed: route-specific origin guard and rate limiter added. |
| H6 Branch assignment route user mismatch | Fixed: revoke/set-primary require assignment `user_id` to match route `:id`. |
| H7 Tenant override audit | Fixed: shared audited resolver records allow/deny decisions. |
| H8 Lifecycle centralization | Fixed: shared clinic lifecycle policy is reused by Auth and Sprint 3 services. |
| H9 Audit/outbox drift | Fixed: onboarding emits clinic, owner activation, branch, settings, and trial subscription events; docs updated to match. |
| H10 Prisma conflict normalization | Fixed: common mapper covers P2002/P2003/P2025 and Sprint 3 services use it for expected conflict paths. |
| H11 User status tenant lockout | Fixed: reason, self, owner, and last-admin protections added. |

## Scope Reviewed

- Code quality
- Architecture compliance
- Security
- Tenant isolation
- RBAC
- API standards
- Validation coverage
- Error handling
- Logging
- Audit logging
- Database indexes
- Transactions
- Testing coverage
- Documentation
- Postman collection

## Critical Findings

No Critical findings.

Rationale: Sprint 3 routes remain gated, the current local test suite passes, and no confirmed direct cross-tenant data exposure was found during static review.

## High Findings

### H1. Invitation Acceptance Can Bypass Clinic Lifecycle Checks

Affected files:
- `backend-new/src/modules/users/users.service.js`
- `backend-new/src/modules/users/users.repository.js`
- `backend-new/src/modules/auth/auth.service.js`

The invitation acceptance flow updates the invited user and then issues an auth session using the updated user object. The user returned by the users repository does not include clinic lifecycle data. `auth.service.js` allows auth when a user object lacks the `clinic` property, so suspended or archived clinic state can be skipped during invitation-based session issuance.

Risk: A user from a suspended or archived clinic can accept an invitation and receive HTTP-only auth cookies.

### H2. Sensitive Settings Are Marked Encrypted But Stored As Raw JSON

Affected files:
- `backend-new/src/modules/settings/settings.service.js`
- `backend-new/prisma/schema.prisma`

Sensitive setting keys are detected and records are marked `is_encrypted`, but the value is still written directly to the JSON column. Redaction protects some responses, but storage is not actually encrypted.

Risk: WhatsApp credentials, provider secrets, or future API keys can be stored plaintext while the system claims encryption.

### H3. Clinic Onboarding Idempotency Is Not Concurrency-Safe Enough

Affected files:
- `backend-new/src/modules/clinics/clinics.service.js`
- `backend-new/src/modules/clinics/clinics.repository.js`
- `backend-new/prisma/schema.prisma`

Onboarding checks for an existing idempotency key before creating records. The unique key helps, but the service does not normalize duplicate-key races into deterministic replay or conflict behavior. There is no live MySQL concurrency test proving behavior under parallel retries.

Risk: concurrent onboarding requests can produce inconsistent errors or partial records if a database error occurs mid-transaction.

### H4. No MySQL-Backed Sprint 3 Transaction, FK, Or Concurrency Tests

Affected files:
- `backend-new/tests/tenants.phase4.test.js`
- `backend-new/prisma/schema.prisma`
- `backend-new/prisma/migrations/0003_tenants.sql`

The Sprint 3 tests use regex checks and fake repositories for the heaviest schema and transaction behaviors. They do not prove FK enforcement, rollback behavior, unique constraints, concurrent onboarding, active invitation uniqueness, active subscription uniqueness, or primary branch uniqueness in MySQL.

Risk: schema-heavy workflow defects can pass the suite and fail only in staging or production.

### H5. Public Invitation Accept Lacks Dedicated Origin And Rate-Limit Abuse Controls

Affected files:
- `backend-new/src/app.js`
- `backend-new/src/modules/users/users.routes.js`
- `backend-new/src/modules/users/users.service.js`

`POST /api/v1/users/invitations/accept` is intentionally public and does not require CSRF. It also issues auth cookies. The route currently lacks the same level of origin checking and route-specific rate limiting used for login.

Risk: token guessing, scripted abuse, and excessive password hashing load can target a public session-issuing endpoint.

### H6. Branch Assignment Revoke And Set-Primary Ignore The Route User ID

Affected files:
- `backend-new/src/modules/users/users.controller.js`
- `backend-new/src/modules/branches/branches.service.js`

Routes include `/users/:id/branches/:assignmentId`, but the controller passes only `assignmentId` into revoke and set-primary services. The service finds the assignment by tenant and assignment id, not by the route user id.

Risk: a request for one user can modify another user's branch assignment inside the same clinic if the caller knows the assignment id.

### H7. Tenant Override Allow And Deny Are Not Centrally Audited

Affected files:
- `backend-new/src/common/middleware/tenantOverride.js`
- Tenant-aware services

The tenant override helper resolves `x-clinic-id` and rejects non-platform overrides, but it does not audit allow or deny decisions. Some services audit platform-required denials, but there is no central audit guarantee for override use.

Risk: Super Admin tenant targeting lacks reliable evidence for compliance and support-access review.

### H8. Clinic Lifecycle Enforcement Is Duplicated Instead Of Centralized

Affected files:
- `backend-new/src/modules/auth/auth.service.js`
- `backend-new/src/modules/clinics/clinics.service.js`
- `backend-new/src/modules/branches/branches.service.js`
- `backend-new/src/modules/users/users.service.js`
- `backend-new/src/modules/settings/settings.service.js`
- `backend-new/src/modules/subscriptions/subscriptions.service.js`

Each module checks clinic lifecycle in its own way. Some reads only require the clinic to exist, some writes use `clinicCanWrite`, and auth skips lifecycle enforcement when relation data is missing.

Risk: suspended and archived clinic behavior can drift across modules.

### H9. Audit And Outbox Coverage Does Not Match Sprint 3 Docs

Affected files:
- `backend-new/src/modules/clinics/clinics.service.js`
- `backend-new/src/modules/users/users.service.js`
- `backend-new/docs/PHASE_04_TENANTS.md`

Docs list events and audits such as `subscription.trial_started.v1`, tenant override allow/deny, and broader onboarding-related outbox events. The implementation emits only part of that coverage.

Risk: operational and compliance documentation overstates implemented guarantees.

### H10. Prisma Unique And FK Conflicts Are Not Consistently Normalized

Affected files:
- Clinics, branches, users, settings, and subscriptions services/repositories

Several service paths perform pre-checks and then create records, but do not consistently catch Prisma unique/FK errors and map them to stable `409` or `400` responses.

Risk: duplicate clinic codes, invitation active keys, settings active keys, primary branches, subscriptions, or FK violations can leak generic 500 behavior.

### H11. User Status Changes Can Lock Out Tenants

Affected files:
- `backend-new/src/modules/users/users.service.js`

User deactivation/reactivation lacks a status transition matrix and does not appear to protect clinic owner, self, or last-admin deactivation.

Risk: a clinic can lose all administrative access through a valid API call.

## Medium Findings

### M1. Route-Permission Coverage Is Not Automated

There is no generated or tested route-to-permission matrix for Sprint 3 routes.

### M2. List APIs Lack Full Sort And Filter Standards

Several list endpoints support pagination and limited filters, but sorting and standardized filtering are incomplete.

### M3. Invitation Lifecycle Tests Are Thin

The suite does not fully cover accept, revoke, resend, expired, replay, raw-token handling, and active invitation uniqueness through HTTP and repository behavior.

### M4. Settings List Sensitive-Read Auditing Is Incomplete

Single sensitive setting reads are audited, but listing settings with sensitive read permission can reveal sensitive values without a dedicated sensitive-read audit trail.

### M5. Raw Invitation Tokens Are Returned In API Responses

This is understandable while notification delivery is deferred, but it increases exposure through browser tools, Postman environments, access logs, or support workflows.

### M6. Migration Artifact Lacks Live DB Dry-Run Evidence

The SQL artifact exists and schema validates, but there is no recorded MySQL migration dry-run result.

### M7. Docs Overstate Atomicity

Documentation claims transactional onboarding guarantees, but rollback behavior is not tested against a real MySQL database.

### M8. Postman Collection Does Not Fully Automate Auth And CSRF Bootstrap

The collection is valid JSON, but still requires manual login and CSRF token copy behavior for some flows.

### M9. Sprint 3 Observability Is Mostly Request-Level Logging

Domain metrics for onboarding, invitations, tenant lifecycle changes, settings changes, and subscription creation are not yet present.

## Low Findings

### L1. Postman Run Order Can Break Later Requests

Suspending a clinic early in the collection can make later tenant-scoped requests fail unless the runner order is adjusted.

### L2. Operational Notes Remain Deferred Instead Of Acceptance-Gated

Some important production notes are documented as deferred rather than tied to a release gate.

### L3. No Generated Route-To-Permission Checklist Artifact Exists

The route-permission mapping is implicit in routes and docs instead of a reviewable artifact.

## Category Review

| Area | Assessment |
| --- | --- |
| Code quality | Good modular structure, but service responsibilities are growing quickly. |
| Architecture compliance | Mostly follows Route -> Validator -> Controller -> Service -> Repository -> Prisma. Lifecycle and override policy should move into shared guards. |
| Security | High gaps in invitation acceptance, sensitive settings, and public endpoint hardening. |
| Tenant isolation | Tenant filters are common, but override audit and lifecycle enforcement are not strong enough. |
| RBAC | Catalog expansion exists. Route coverage automation and owner/self protections are missing. |
| API standards | Response shape is consistent. Conflict normalization and list standards need work. |
| Validation | Basic validators exist. Status transition, sort/filter, and invitation hardening validation need expansion. |
| Error handling | Central handler exists. Prisma conflicts need domain-specific mapping. |
| Logging | Request logging exists. Domain and security event logging is thin. |
| Audit logging | Important paths are audited, but override, denial, list-sensitive reads, and outbox/docs alignment need work. |
| Database indexes | Tenant-first indexes and active keys are present. Live DB behavior is not proven. |
| Transactions | Transactions are used. Rollback and concurrency evidence is insufficient. |
| Testing | Local suite passes. Coverage is too fake-heavy for Sprint 3 data integrity risks. |
| Documentation | Broad and useful, but overstates some guarantees. |
| Postman | Valid collection exists. Runner automation and ordering need improvement. |

## What Is Missing

- MySQL integration evidence.
- Real rollback and concurrency tests.
- Tenant override allow/deny audit events.
- Complete invitation accept hardening.
- Central clinic lifecycle guard.
- Full audit/outbox coverage.
- Automated route-permission coverage.
- Sensitive setting encryption or write blocking.

## What Is Risky

- Session issuance after invitation acceptance.
- Plaintext sensitive settings.
- Fake-only transaction tests for tenant onboarding.
- Branch assignment route/user mismatch.
- Unnormalized Prisma conflict errors.
- Owner/self deactivation.

## What Is Not Production Ready

- Tenant onboarding.
- Staff and invitation lifecycle.
- Sensitive settings.
- Branch assignment workflows.
- Tenant override support workflows.
- Sprint 3 migration acceptance without MySQL dry-run evidence.

## Technical Debt Introduced

- Duplicated lifecycle logic across services.
- Partial tenant override auditing.
- Minimal fake-based tests for schema-heavy workflows.
- Documentation that overstates implemented audit/outbox guarantees.
- Deferred encryption and observability decisions.
- Growing users and branches services that may need internal decomposition after Sprint 4.

## Final Verdict

Sprint 3 High findings are locally fixed and test-covered. It remains not production-ready until live MySQL migration/concurrency evidence is produced and remaining Medium/Low debt is accepted or resolved.
