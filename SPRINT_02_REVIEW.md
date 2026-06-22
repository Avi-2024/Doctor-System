# Sprint 02 Review

## Review Scope

Reviewed Sprint 2 RBAC Foundation implementation in `backend-new` as a Principal Engineer gate review.

Reviewed areas:

- Code quality.
- Architecture compliance.
- Security.
- RBAC.
- Tenant isolation.
- API standards.
- Validation coverage.
- Error handling.
- Logging.
- Audit logging.
- Database indexes.
- Transactions.
- Testing coverage.
- Documentation.
- Postman collection.

Implementation reviewed:

- `backend-new/src/modules/rbac/*`
- `backend-new/src/modules/users/*`
- `backend-new/tests/rbac.phase3.test.js`
- `backend-new/prisma/schema.prisma`
- `backend-new/docs/PHASE_03_RBAC.md`
- `backend-new/docs/RBAC_API.md`
- `backend-new/postman/Doctor-System-Phase-3-RBAC.postman_collection.json`

## Executive Verdict

Sprint 2 is directionally correct and materially stronger than the original plan. It now includes audited permission guards, custom-role privilege subset checks, role assignment revocation, token-version invalidation, and targeted tests.

Sprint 2 was **not production-ready** at review time. There were no Critical findings, but High issues were identified that had to be fixed before this RBAC foundation could be used by patient, clinical, billing, storage, reporting, or tenant administration modules.

## Post High-Fix Status

The High findings from this review have been implemented after the original review:

- H1 scope-aware RBAC enforcement: fixed.
- H2 GET RBAC endpoint write side effects: fixed.
- H3 active user-role assignment concurrency safety: fixed with a database-backed active assignment key.
- H4 tenant-scoped repository reads: fixed for RBAC/User Sprint 2 reads.

Medium and Low findings remain tracked in `SPRINT_02_FIX_PLAN.md`.

## Critical Findings

No Critical findings.

Rationale:

- No direct unauthenticated route exposure was found.
- RBAC/User routes remain gated behind post-Sprint-1 route enablement.
- Current Sprint 2 APIs do not expose PHI, clinical records, billing records, or tenant administration.
- Cross-tenant assignment and revocation are checked at the service layer.

## High Findings

### H1. RBAC Route Guard Does Not Enforce Permission Scope

**Severity:** High

**Affected files:**

- `backend-new/src/modules/rbac/rbac.middleware.js`
- `backend-new/src/common/middleware/rbac.js`
- `backend-new/src/modules/users/users.routes.js`
- Future protected business routes

**Evidence:**

- `requireAuditedPermission` checks only permission presence in `rbac.middleware.js:38`.
- `hasPermission` checks only permission keys, not `scopedPermissions`.
- Auth context carries `roles` and `permissions`, but not effective permission scopes.

**Risk:**

The system has a scope model, but route authorization cannot enforce it. A future user with `patients.read` at `OWN` scope could pass a route that intended `CLINIC` scope if the route only checks `patients.read`.

**Production impact:**

This is a foundational RBAC gap. It will become a security defect as soon as business modules with resource ownership or clinic-wide access are added.

### H2. GET RBAC Endpoints Perform Database Writes

**Severity:** High

**Affected files:**

- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/src/modules/rbac/rbac.repository.js`

**Evidence:**

- `listPermissions` calls `syncPermissionCatalog` in `rbac.service.js:221-223`.
- `listRoles` calls `syncSystemRoles` in `rbac.service.js:226-227`.
- `syncSystemRoles` writes permissions, roles, and role permissions.

**Risk:**

Read endpoints have side effects, can take locks, can trigger writes under user traffic, and violate HTTP/API standards. This can create unnecessary write load and deadlock risk as traffic grows.

**Production impact:**

RBAC reads should be predictable, cacheable, and read-only. Catalog/system-role sync belongs in bootstrap, migration, seed, or explicit administrative maintenance flow.

### H3. Active User-Role Assignment Is Not Concurrency-Safe

**Severity:** High

**Affected files:**

- `backend-new/prisma/schema.prisma`
- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/src/modules/rbac/rbac.repository.js`

**Evidence:**

- `user_roles` has indexes but no uniqueness/idempotency constraint for active assignments in `schema.prisma:154-179`.
- Service checks existing assignment before create in `rbac.service.js:388-405`.
- Repository create is unconditional in `rbac.repository.js:127`.

**Risk:**

Concurrent assignment requests can create duplicate active user-role rows. Revoking one assignment can leave another active duplicate, so the UI/API can report a role revoked while effective access remains.

**Production impact:**

This is an operational security problem. Role revocation must be reliable.

### H4. Tenant-Owned Repository Reads Are Not Tenant-Scoped

**Severity:** High

**Affected files:**

- `backend-new/src/modules/rbac/rbac.repository.js`
- `backend-new/src/modules/users/users.repository.js`
- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/src/modules/users/users.service.js`

**Evidence:**

- `findRoleById` reads by `id` only in `rbac.repository.js:83-91`.
- `findUserById` reads by `id` only in `rbac.repository.js:95-97`.
- `findUserRoleById` reads by assignment `id` only in `rbac.repository.js:109-125`.
- Users repository reads by `id` only in `users.repository.js:10-14`.
- Services perform tenant checks after reading.

**Risk:**

This violates the approved tenant rule: every tenant-owned query must filter by trusted tenant context. Service-level post-read checks reduce exposure but still allow cross-tenant row access inside the application layer.

**Production impact:**

This must be fixed before expanding RBAC patterns into PHI or billing modules.

## Medium Findings

### M1. Platform Users Can Receive Tenant Role Assignments

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/rbac/rbac.service.js`

**Evidence:**

- Assignment target validation does not reject `targetUser.clinic_id === null` when assigning a tenant role in `rbac.service.js:339-366`.

**Risk:**

Tenant roles assigned to platform users currently do not affect access resolution because platform access resolves `clinic_id = null`, but these rows are confusing and could become dangerous if future platform tenant-switching is added.

### M2. Duplicate Role Codes And Duplicate Permission Grants Are Not Gracefully Handled

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/src/modules/rbac/rbac.validator.js`

**Evidence:**

- `createRole` does not catch duplicate `scope_key + code` conflicts.
- Duplicate permission grants in the same request can hit database uniqueness errors.
- Optional `code` is generated from `name`, but generated codes are not validated against the role code pattern.

**Risk:**

Expected client mistakes can become generic 500 responses instead of stable `400` or `409` API errors.

### M3. Denial Audit Writes Can Change Expected 403 Responses Into 500 Responses

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/rbac/rbac.middleware.js`
- `backend-new/src/modules/rbac/rbac.service.js`

**Evidence:**

- Route guard waits for denial audit before returning `403` in `rbac.middleware.js:39-49`.
- If audit persistence fails, request handling returns the audit error instead of the authorization denial.

**Risk:**

An audit database issue can turn normal forbidden requests into 500 errors. That is operationally noisy and can obscure true authorization behavior.

### M4. MySQL-Backed RBAC Integration And Concurrency Tests Are Missing

**Severity:** Medium

**Affected files:**

- `backend-new/tests/rbac.phase3.test.js`

**Evidence:**

- Tests use a fake in-memory repository for RBAC service behavior.
- No live MySQL test proves FK behavior, migration behavior, assignment concurrency, or duplicate active assignment behavior.

**Risk:**

The highest-risk RBAC behaviors are not tested against the actual database engine.

### M5. Missing Query Index For Active Assignment Lookup

**Severity:** Medium

**Affected files:**

- `backend-new/prisma/schema.prisma`
- `backend-new/prisma/migrations/0002_rbac.sql`

**Evidence:**

- Active assignment lookup filters by `user_id`, `role_id`, `clinic_id`, `is_deleted`, and `revoked_at`.
- Current indexes do not match that full access pattern.

**Risk:**

Assignment checks and effective access lookups can become slower as `user_roles` grows.

### M6. `/users/me` Does Not Return Scoped Permissions

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/users/users.service.js`
- `backend-new/src/modules/auth/auth.service.js`
- `backend-new/src/common/context/requestContext.js`

**Evidence:**

- Effective access resolver returns `scopedPermissions`.
- Auth service only carries `roles` and `permissions` into request context.
- `/users/me` returns `roles`, `permissions`, and `isPlatform`, but not permission scopes.

**Risk:**

Frontend and future route logic cannot make scope-aware decisions from current-user bootstrap data.

### M7. System Role Sync Does Not Repair Soft-Deleted Grants

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/src/modules/rbac/rbac.repository.js`

**Evidence:**

- `syncSystemRoles` ignores duplicate `role_permissions` errors.
- Because uniqueness does not include `is_deleted`, a soft-deleted system grant can block recreation while staying deleted.

**Risk:**

System roles can silently lose permissions if a grant is soft-deleted or corrupted.

## Low Findings

### L1. Documentation Still Lists Role Revocation As Remaining

**Severity:** Low

**Affected file:**

- `backend-new/docs/PHASE_03_RBAC.md`

**Evidence:**

- `PHASE_03_RBAC.md:97` still lists "Role revocation endpoint" under remaining work even though the endpoint exists.

### L2. Postman Collection Requires Manual CSRF Setup

**Severity:** Low

**Affected file:**

- `backend-new/postman/Doctor-System-Phase-3-RBAC.postman_collection.json`

**Risk:**

Collection users must manually copy `csrf_token` into `csrfToken`, which is error-prone.

### L3. List Endpoints Have No Pagination Or Explicit Small-Catalog Contract

**Severity:** Low

**Affected files:**

- `backend-new/src/modules/rbac/rbac.validator.js`
- `backend-new/docs/RBAC_API.md`

**Risk:**

This is acceptable for a small system catalog, but the API standard should explicitly say these endpoints are intentionally unpaginated.

### L4. Route-Permission Coverage Is Not Automated

**Severity:** Low

**Affected files:**

- `backend-new/tests/rbac.phase3.test.js`
- Future route registration

**Risk:**

As modules grow, routes can be added without corresponding permission coverage unless this becomes automated.

### L5. RBAC Service Is Accumulating Too Many Responsibilities

**Severity:** Low

**Affected file:**

- `backend-new/src/modules/rbac/rbac.service.js`

**Risk:**

The service currently owns catalog sync, policy checks, audit metadata, role CRUD, assignment, revocation, and effective access. This is still manageable in Sprint 2, but will become harder to maintain as RBAC grows.

## Category Assessment

| Category | Assessment |
| --- | --- |
| Code quality | Acceptable foundation, but RBAC service should be split before more policy paths are added. |
| Architecture compliance | Mostly follows Route -> Validator -> Controller -> Service -> Repository -> Prisma. Concern: Users routes import RBAC module middleware instead of a common authorization middleware. |
| Security | Improved, but scope-aware authorization and reliable revocation remain blockers. |
| RBAC | Good start: catalog, roles, assignments, revocation, effective access. Missing scope-aware guards. |
| Tenant isolation | Service checks exist, but repositories still read tenant-owned rows without tenant filters. |
| API standards | Response envelope is consistent. GET endpoints with writes violate API semantics. |
| Validation coverage | Basic validators exist. Duplicate business constraints and generated role code need safer handling. |
| Error handling | Generic handler works, but expected duplicates can become 500s. |
| Logging | No new logging issues found. |
| Audit logging | Success and denial audit coverage exists, but audit failure behavior needs operational hardening. |
| Database indexes | Tenant-first indexes exist. Active assignment lookup and uniqueness are incomplete. |
| Transactions | Multi-step writes use transactions. Concurrency safety still needs DB enforcement. |
| Testing coverage | Strong unit/API tests. Missing MySQL-backed integration and concurrency tests. |
| Documentation | Mostly updated, with one stale contradiction. |
| Postman collection | Updated for core flow, but CSRF capture and negative tests need improvement. |

## Direct Answers

### 1. What Is Missing?

- Scope-aware permission guard.
- Tenant-scoped repository read contracts.
- Database-backed active assignment uniqueness/idempotency.
- MySQL-backed RBAC integration/concurrency tests.
- Scoped permissions in `/users/me`.
- Automated route-permission coverage.
- Clean bootstrap path for permission/system-role sync.

### 2. What Is Risky?

- Duplicate active role assignments can make revocation unreliable.
- GET endpoints write to RBAC tables under user traffic.
- Repository methods read cross-tenant candidate rows before service checks.
- Scope model exists but authorization middleware cannot enforce it.

### 3. What Is Not Production Ready?

- RBAC scope enforcement.
- Role assignment/revocation concurrency model.
- Tenant-scoped repository enforcement.
- RBAC database integration tests.
- Permission/system-role bootstrap lifecycle.

### 4. What Technical Debt Was Introduced?

- RBAC service now mixes catalog sync, policy enforcement, audit, and assignment workflows.
- Users routes depend on RBAC module middleware instead of a common authorization abstraction.
- Postman CSRF setup is manual.
- Documentation still has a stale remaining-work item.
- Test harness relies heavily on fake repositories for database-sensitive behavior.
