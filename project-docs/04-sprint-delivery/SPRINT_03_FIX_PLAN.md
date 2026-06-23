# Sprint 3 Fix Plan

## Summary

This fix plan converts the Sprint 3 review findings into executable remediation items.

## Implementation Status

High issues H1-H11 have been implemented and locally verified with `npm test` passing at 101 passed and 2 MySQL-gated skipped tests. H4 has a gated integration harness, but live MySQL execution remains required before production acceptance. Medium and Low issues remain open unless a High fix directly added supporting coverage.

| Issue | Status |
| --- | --- |
| H1 Invitation acceptance lifecycle bypass | Completed |
| H2 Sensitive settings plaintext storage | Completed |
| H3 Onboarding idempotency races | Completed locally |
| H4 MySQL-backed transaction/FK/concurrency tests | Harness completed; live MySQL evidence pending |
| H5 Public invitation accept abuse controls | Completed |
| H6 Branch assignment route user mismatch | Completed |
| H7 Tenant override allow/deny audit | Completed |
| H8 Central clinic lifecycle policy | Completed |
| H9 Audit/outbox documentation drift | Completed |
| H10 Prisma conflict normalization | Completed |
| H11 User status tenant lockout protections | Completed |
| M1-M9 | Open |
| L1-L3 | Open |

Priority order:

1. Fix invitation session lifecycle bypass.
2. Fix sensitive settings encryption or block sensitive writes.
3. Add MySQL-backed transaction/FK/concurrency tests.
4. Harden onboarding idempotency and duplicate conflict handling.
5. Harden public invitation accept.
6. Fix branch assignment route/user mismatch.
7. Centralize tenant override audit and lifecycle guards.
8. Close audit/outbox documentation drift.
9. Normalize Prisma conflict errors.
10. Add user status transition/self-owner protections.
11. Complete Medium/Low coverage and documentation improvements.

## Issues

### 1. Invitation Acceptance Can Bypass Clinic Lifecycle Checks

**Severity:** High

**Affected files:**
- `backend-new/src/modules/users/users.service.js`
- `backend-new/src/modules/users/users.repository.js`
- `backend-new/src/modules/auth/auth.service.js`

**Root cause:** Invitation acceptance updates a user and passes that returned user into session issuance, but the user object does not include clinic lifecycle relation data. Auth lifecycle enforcement currently skips clinic checks when the `clinic` property is absent.

**Risk if not fixed:** Suspended or archived clinic users can receive fresh auth cookies through invitation acceptance.

**Exact fix approach:** After accepting an invitation, reload the user through the auth repository or a tenant-aware repository method that includes clinic status. Change `clinicAllowsAuth` so missing clinic relation for clinic users is not treated as allowed in session issuance paths. Reject suspended, archived, deleted, or missing clinics before cookies are issued.

**Dependencies:** Auth service lifecycle contract and user repository shape.

**Test cases required:**
- Accepting invitation for active clinic succeeds and sets cookies.
- Accepting invitation for suspended clinic returns account unavailable/authentication error.
- Accepting invitation for archived clinic returns account unavailable/authentication error.
- Session issuance fails when a clinic user lacks verified clinic lifecycle data.

**Acceptance criteria:**
- Invitation acceptance cannot create a session unless the tenant is active.
- Auth lifecycle checks are fail-closed for clinic users.

### 2. Sensitive Settings Are Marked Encrypted But Stored As Raw JSON

**Severity:** High

**Affected files:**
- `backend-new/src/modules/settings/settings.service.js`
- `backend-new/src/modules/settings/settings.repository.js`
- `backend-new/prisma/schema.prisma`

**Root cause:** Sensitive settings set `is_encrypted=true`, but the service stores raw JSON values.

**Risk if not fixed:** Provider credentials and other secrets can be stored plaintext with misleading encryption metadata.

**Exact fix approach:** Choose one Sprint 3-safe policy: either implement encryption-at-rest for sensitive setting values using a centralized crypto helper and key from env/KMS, or reject sensitive setting writes until the secure storage path is implemented. Do not allow `is_encrypted=true` unless encryption actually occurs.

**Dependencies:** Environment secret management or KMS decision.

**Test cases required:**
- Sensitive setting writes are encrypted before persistence or rejected.
- Sensitive setting reads require `settings.read_sensitive`.
- Non-sensitive setting behavior remains unchanged.
- Logs and audit payloads redact sensitive values.

**Acceptance criteria:**
- No sensitive setting is persisted as raw JSON while marked encrypted.
- Documentation matches the actual storage behavior.

### 3. Clinic Onboarding Idempotency Is Not Concurrency-Safe Enough

**Severity:** High

**Affected files:**
- `backend-new/src/modules/clinics/clinics.service.js`
- `backend-new/src/modules/clinics/clinics.repository.js`
- `backend-new/prisma/schema.prisma`

**Root cause:** Onboarding uses a pre-read plus create flow and relies on unique constraints without normalizing duplicate-key races.

**Risk if not fixed:** Concurrent onboarding retries can return inconsistent 500 responses or leave confidence gaps around partial tenant state.

**Exact fix approach:** Keep the idempotency key unique, catch Prisma duplicate-key errors for onboarding key/code/owner email/primary branch/subscription, and deterministically map them to replay or 409 conflict. Add a transaction-level recovery path that reloads by idempotency key after duplicate idempotency-key conflicts.

**Dependencies:** Prisma error normalization helper.

**Test cases required:**
- Same idempotency key and same payload replays successfully.
- Same idempotency key and different payload returns 409.
- Concurrent same-payload onboarding creates one tenant.
- Concurrent different-payload onboarding returns deterministic conflict.
- Failed onboarding rolls back all tenant records.

**Acceptance criteria:**
- Onboarding is deterministic under retries and concurrency.
- No raw Prisma duplicate-key error reaches API clients.

### 4. No MySQL-Backed Sprint 3 Transaction, FK, Or Concurrency Tests

**Severity:** High

**Affected files:**
- `backend-new/tests/tenants.phase4.test.js`
- New integration test files as needed
- `backend-new/prisma/schema.prisma`
- `backend-new/prisma/migrations/0003_tenants.sql`

**Root cause:** Existing tests use fake repositories and schema regex checks for the highest-risk tenant data workflows.

**Risk if not fixed:** FK, unique index, rollback, and concurrency behavior can fail in production despite passing local tests.

**Exact fix approach:** Add a MySQL integration test harness gated by an environment variable such as `RUN_MYSQL_INTEGRATION_TESTS=true`. Run migrations against a disposable test database and test real onboarding, branch primary uniqueness, invitation uniqueness, subscription uniqueness, FK constraints, and rollback.

**Dependencies:** MySQL test database and CI service container or equivalent.

**Test cases required:**
- Migration applies cleanly to MySQL.
- Onboarding rollback leaves no partial records.
- Concurrent onboarding is deterministic.
- Active primary branch uniqueness is enforced.
- Active invitation uniqueness is enforced.
- Active subscription uniqueness is enforced.
- Branch assignment FK rejects missing branch/user/clinic references.

**Acceptance criteria:**
- Sprint 3 has real MySQL evidence before production acceptance.
- Fake repository tests remain as fast unit coverage.

### 5. Public Invitation Accept Lacks Dedicated Origin And Rate-Limit Abuse Controls

**Severity:** High

**Affected files:**
- `backend-new/src/app.js`
- `backend-new/src/modules/users/users.routes.js`
- `backend-new/src/modules/users/users.validator.js`
- `backend-new/src/modules/users/users.service.js`

**Root cause:** Invitation acceptance is a public session-issuing route, but it lacks route-specific origin checks and rate limiting.

**Risk if not fixed:** Attackers can brute force tokens or create avoidable password hashing load.

**Exact fix approach:** Apply a dedicated invitation-accept limiter keyed by IP and token fingerprint. Enforce allowed Origin/Referer for browser requests, similar to login. Keep CSRF disabled because this is a public token-based endpoint, but apply strict validation and generic abuse responses.

**Dependencies:** Existing auth rate-limit and origin validation patterns.

**Test cases required:**
- Allowed origin accept succeeds.
- Disallowed origin accept fails.
- Excessive accept attempts are rate-limited.
- Invalid token response remains generic.
- Valid token still works under normal limits.

**Acceptance criteria:**
- Public invitation acceptance has abuse controls equivalent to other auth entrypoints.

### 6. Branch Assignment Revoke And Set-Primary Ignore Route User ID

**Severity:** High

**Affected files:**
- `backend-new/src/modules/users/users.controller.js`
- `backend-new/src/modules/branches/branches.service.js`
- `backend-new/src/modules/branches/branches.repository.js`
- `backend-new/tests/tenants.phase4.test.js`

**Root cause:** The route includes `:id`, but revoke and set-primary services only receive `assignmentId`.

**Risk if not fixed:** A caller can modify an assignment for a different user in the same tenant by supplying another assignment id.

**Exact fix approach:** Pass `userId` from the controller into revoke and set-primary services. Require the loaded assignment `user_id` to match the route user id before mutation.

**Dependencies:** Branch assignment service API update.

**Test cases required:**
- Revoke succeeds when route user id matches assignment user id.
- Revoke returns 404 or 403 when route user id does not match.
- Set-primary succeeds only for matching route user id.
- Cross-tenant assignment id remains inaccessible.

**Acceptance criteria:**
- Branch assignment routes enforce both tenant id and route user id.

### 7. Tenant Override Allow And Deny Are Not Centrally Audited

**Severity:** High

**Affected files:**
- `backend-new/src/common/middleware/tenantOverride.js`
- Tenant-aware services
- Audit docs/tests

**Root cause:** Override resolution is a pure helper that throws or returns a clinic id without guaranteeing audit records.

**Risk if not fixed:** Platform tenant targeting lacks support-access evidence.

**Exact fix approach:** Add an audited tenant override resolver or middleware that records allow and deny decisions with actor id, target clinic id, route, support reason, request id, and outcome. Use it consistently in platform tenant-targeted services.

**Dependencies:** Audit service availability in request/service layer.

**Test cases required:**
- Platform override allow writes audit event.
- Non-platform override deny writes audit event.
- Missing support reason on sensitive operation writes audit event.
- Audit payload redacts unsafe metadata.

**Acceptance criteria:**
- Every `x-clinic-id` override attempt has durable audit evidence.

### 8. Clinic Lifecycle Enforcement Is Duplicated Instead Of Centralized

**Severity:** High

**Affected files:**
- Auth, clinics, branches, users, settings, and subscriptions services
- New shared lifecycle helper or middleware

**Root cause:** Each module implements clinic status behavior independently.

**Risk if not fixed:** Suspended and archived clinic behavior can drift by route or module.

**Exact fix approach:** Create a shared lifecycle policy helper with explicit methods for auth allowed, read allowed, write allowed, recovery allowed, and platform override allowed. Replace ad hoc checks with this helper.

**Dependencies:** Clinic status enum and tenant override contract.

**Test cases required:**
- Active clinic auth/read/write succeeds.
- Suspended clinic auth/write fails.
- Suspended clinic approved reads behave as documented.
- Archived clinic write fails.
- Archived restore requires platform, `tenant.recovery`, and support reason.

**Acceptance criteria:**
- Lifecycle behavior is defined once and reused across Sprint 3 modules.

### 9. Audit And Outbox Coverage Does Not Match Sprint 3 Docs

**Severity:** High

**Affected files:**
- `backend-new/src/modules/clinics/clinics.service.js`
- `backend-new/src/modules/users/users.service.js`
- `backend-new/src/modules/settings/settings.service.js`
- `backend-new/docs/PHASE_04_TENANTS.md`
- `backend-new/docs/TENANTS_API.md`

**Root cause:** Documentation lists a broader audit/outbox contract than the current implementation emits.

**Risk if not fixed:** Compliance and operational docs overstate actual behavior.

**Exact fix approach:** Either emit the documented events/audits or update docs to match the implemented scope. Preferred fix: implement missing events for trial subscription creation, owner activation, settings update, branch status/create, and tenant override allow/deny where applicable.

**Dependencies:** Outbox event naming policy.

**Test cases required:**
- Onboarding emits expected clinic, owner, branch, settings, and subscription events or docs are reduced.
- Tenant override allow/deny audits exist.
- Invitation denied/expired/replay audits exist.
- Sensitive settings reads/writes are audited.

**Acceptance criteria:**
- Docs and implementation describe the same audit/outbox guarantees.

### 10. Prisma Unique And FK Conflicts Are Not Consistently Normalized

**Severity:** High

**Affected files:**
- Clinics, branches, users, settings, subscriptions services/repositories
- Common Prisma error helper if added

**Root cause:** Services rely on pre-checks but do not consistently handle race-time Prisma errors.

**Risk if not fixed:** API clients can receive generic 500 responses for expected business conflicts.

**Exact fix approach:** Add a common Prisma error mapper for `P2002`, `P2003`, and relevant not-found/update errors. Map duplicate business keys to stable 409 responses and FK violations to stable 400/409 responses.

**Dependencies:** Central error handling contract.

**Test cases required:**
- Duplicate clinic code returns 409.
- Duplicate branch code returns 409.
- Duplicate active invitation returns 409.
- Duplicate active setting returns 409.
- Missing FK returns safe 400/409.

**Acceptance criteria:**
- No expected Prisma uniqueness/FK conflict leaks as generic 500.

### 11. User Status Changes Can Lock Out Tenants

**Severity:** High

**Affected files:**
- `backend-new/src/modules/users/users.service.js`
- `backend-new/src/modules/users/users.validator.js`

**Root cause:** User status changes lack transition and safety rules for owner, self, and last-admin cases.

**Risk if not fixed:** A clinic can lose administrative access through a valid API call.

**Exact fix approach:** Add a status transition matrix. Block self-deactivation, owner deactivation without owner transfer, and last-admin deactivation. Require reason fields for sensitive status changes and audit them.

**Dependencies:** Role/admin detection and clinic owner model.

**Test cases required:**
- Self-deactivation is blocked.
- Clinic owner deactivation is blocked unless owner transfer exists.
- Last admin deactivation is blocked.
- Valid staff deactivation increments token version and revokes sessions.
- Reactivation follows allowed transition rules.

**Acceptance criteria:**
- User lifecycle cannot strand a tenant without admin access.

### 12. Route-Permission Coverage Is Not Automated

**Severity:** Medium

**Affected files:**
- Sprint 3 route files
- Test suite or route-permission artifact

**Root cause:** Permissions are embedded in route declarations and docs without an automated coverage assertion.

**Risk if not fixed:** A future route can be added without RBAC protection.

**Exact fix approach:** Add a route-to-permission registry or test that asserts every protected Sprint 3 route has auth and a named permission guard.

**Dependencies:** Route mounting pattern.

**Test cases required:**
- Every clinics, branches, users, settings, and subscriptions route maps to expected permission.

**Acceptance criteria:**
- Route-permission drift fails tests or review checklist.

### 13. List APIs Lack Full Sort And Filter Standards

**Severity:** Medium

**Affected files:**
- Sprint 3 validators, services, repositories

**Root cause:** Pagination and limited filters exist, but sort/filter behavior is not standardized.

**Risk if not fixed:** List APIs drift and may become inefficient or inconsistent.

**Exact fix approach:** Add bounded `sortBy`, `sortDirection`, and approved filters per endpoint. Reject unsupported fields.

**Dependencies:** API standards.

**Test cases required:**
- Valid sort/filter combinations work.
- Unsupported sort/filter fields return 400.
- Pagination caps remain enforced.

**Acceptance criteria:**
- Sprint 3 list APIs follow the same query contract.

### 14. Invitation Lifecycle Tests Are Thin

**Severity:** Medium

**Affected files:**
- `backend-new/tests/tenants.phase4.test.js`

**Root cause:** Invitation tests do not fully cover HTTP and service edge cases.

**Risk if not fixed:** Replay, expiry, resend, revoke, and token exposure bugs can regress.

**Exact fix approach:** Add service and API tests for the full invitation lifecycle.

**Dependencies:** Invitation accept hardening.

**Test cases required:**
- Create, list, resend, revoke, accept.
- Expired invite denied.
- Replay denied.
- Revoked invite denied.
- Raw token stored nowhere except one-time response or notification handoff.

**Acceptance criteria:**
- Invitation lifecycle behavior is covered end to end.

### 15. Settings List Sensitive-Read Auditing Is Incomplete

**Severity:** Medium

**Affected files:**
- `backend-new/src/modules/settings/settings.service.js`

**Root cause:** Single sensitive reads are audited, but list responses with sensitive reveal are not.

**Risk if not fixed:** Bulk sensitive setting access lacks audit evidence.

**Exact fix approach:** Audit list operations when sensitive values are revealed or require explicit endpoint for sensitive reveals.

**Dependencies:** Settings permission model.

**Test cases required:**
- List without sensitive permission redacts sensitive values.
- List with sensitive permission writes audit.
- Audit includes key names but not secret values.

**Acceptance criteria:**
- Bulk sensitive access is auditable and redacted.

### 16. Raw Invitation Tokens Are Returned In API Responses

**Severity:** Medium

**Affected files:**
- `backend-new/src/modules/users/users.service.js`
- `backend-new/docs/TENANTS_API.md`
- Postman collection

**Root cause:** Notification delivery is deferred, so the API returns the raw invitation token once.

**Risk if not fixed:** Tokens can leak through clients, Postman environments, screenshots, or support logs.

**Exact fix approach:** Keep one-time return only for local/dev or platform bootstrap, or move delivery to outbox handoff with a secure preview flag disabled in production.

**Dependencies:** Notification worker sprint.

**Test cases required:**
- Production mode does not return raw invitation token unless explicitly enabled.
- Token hash is stored, raw token is not.

**Acceptance criteria:**
- Raw invitation token exposure is controlled by environment and documented.

### 17. Migration Artifact Lacks Live DB Dry-Run Evidence

**Severity:** Medium

**Affected files:**
- `backend-new/prisma/migrations/0003_tenants.sql`
- Migration docs

**Root cause:** SQL file exists, but no recorded dry-run evidence exists.

**Risk if not fixed:** Migration can fail against real MySQL due to FK ordering, existing data, or dialect details.

**Exact fix approach:** Run migration dry-run against a disposable MySQL database and record results in migration docs.

**Dependencies:** MySQL test environment.

**Test cases required:**
- Fresh DB migration succeeds.
- Existing Sprint 1/2 DB migration succeeds or documented preconditions are enforced.

**Acceptance criteria:**
- Sprint 3 migration has repeatable dry-run evidence.

### 18. Documentation Overstates Atomicity

**Severity:** Medium

**Affected files:**
- `backend-new/docs/PHASE_04_TENANTS.md`
- `backend-new/docs/TENANTS_API.md`

**Root cause:** Docs claim transactional guarantees that are not proven by live DB rollback tests.

**Risk if not fixed:** Reviewers may trust guarantees that have not been validated.

**Exact fix approach:** Either add MySQL rollback tests or clarify documentation until tests exist.

**Dependencies:** MySQL integration harness.

**Test cases required:**
- Onboarding rollback leaves no clinic, owner, branch, settings, role, subscription, audit, or outbox records.

**Acceptance criteria:**
- Documentation matches evidence level.

### 19. Postman Collection Does Not Fully Automate Auth And CSRF Bootstrap

**Severity:** Medium

**Affected files:**
- `backend-new/postman/Doctor-System-Phase-4-Tenants.postman_collection.json`

**Root cause:** The collection requires manual login and CSRF token copying for some flows.

**Risk if not fixed:** Manual execution can produce false failures or skip security checks.

**Exact fix approach:** Add auth bootstrap requests or pre-request scripts that capture `csrf_token` into environment variables and consistently attach `x-csrf-token`.

**Dependencies:** Auth collection behavior.

**Test cases required:**
- Collection JSON parses.
- Runner can execute auth bootstrap and a protected unsafe request without manual token copy.

**Acceptance criteria:**
- Postman collection is runner-friendly for Sprint 3 smoke testing.

### 20. Sprint 3 Observability Is Mostly Request-Level Logging

**Severity:** Medium

**Affected files:**
- Sprint 3 services
- Monitoring docs

**Root cause:** New tenant workflows do not emit domain metrics or structured business events beyond audit/outbox.

**Risk if not fixed:** Production support cannot quickly see onboarding failures, invitation abuse, settings changes, or tenant lifecycle events.

**Exact fix approach:** Add metrics hooks or structured log events for onboarding success/failure, invitation accept/failure, tenant status changes, and sensitive settings access.

**Dependencies:** Monitoring framework decision.

**Test cases required:**
- Metrics/log hooks are called for success and failure paths.

**Acceptance criteria:**
- Critical Sprint 3 workflows are observable without reading database rows manually.

### 21. Postman Run Order Can Break Later Requests

**Severity:** Low

**Affected files:**
- `backend-new/postman/Doctor-System-Phase-4-Tenants.postman_collection.json`

**Root cause:** Suspension/status-change requests can affect later tenant-scoped requests.

**Risk if not fixed:** Collection runs can fail due to side effects rather than product defects.

**Exact fix approach:** Move destructive lifecycle requests into a negative-tests folder or run them after positive flows.

**Dependencies:** Postman collection organization.

**Test cases required:**
- Positive smoke flow runs before destructive negative cases.

**Acceptance criteria:**
- Collection order supports repeatable smoke testing.

### 22. Operational Notes Remain Deferred Instead Of Acceptance-Gated

**Severity:** Low

**Affected files:**
- Sprint 3 docs
- Delivery docs

**Root cause:** Some production requirements are documented as deferred without a concrete gate.

**Risk if not fixed:** Deferred items can be forgotten before beta.

**Exact fix approach:** Add explicit acceptance gates for MySQL integration, migration dry-run, notification delivery handoff, and sensitive setting storage.

**Dependencies:** Delivery board ownership.

**Test cases required:** None, documentation governance only.

**Acceptance criteria:**
- Deferred items have owners and release gates.

### 23. No Generated Route-To-Permission Checklist Artifact Exists

**Severity:** Low

**Affected files:**
- Sprint 3 docs

**Root cause:** Route permission coverage is implicit.

**Risk if not fixed:** Reviewers must inspect code manually to verify coverage.

**Exact fix approach:** Generate or maintain a route-permission checklist in docs and tie it to tests later.

**Dependencies:** Route-permission registry decision.

**Test cases required:** Optional documentation existence test.

**Acceptance criteria:**
- Sprint 3 has a human-reviewable route-to-permission matrix.

## Safe Groupings

- **Invitation/auth group:** Issues 1, 5, 14, and 16 can be fixed together.
- **Tenant lifecycle group:** Issues 7, 8, 11, and 12 can be fixed together.
- **Database integrity group:** Issues 3, 4, 10, 17, and 18 should be handled together with MySQL integration.
- **Settings security group:** Issues 2 and 15 can be fixed together.
- **Documentation/Postman group:** Issues 9, 19, 21, 22, and 23 can be fixed together after behavior is finalized.

## Acceptance Recommendation

Sprint 3 should not be accepted for production until all High items are fixed and verified with lint, build, tests, and MySQL-backed integration evidence. Medium and Low items may be accepted only as explicitly tracked technical debt with owners and dates.
