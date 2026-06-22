# Sprint 02 Fix Plan

## Summary

This plan addresses issues found in `SPRINT_02_REVIEW.md`. Do not start Sprint 3 until High issues are resolved or explicitly accepted by the CTO as launch-blocking debt.

## Critical Fixes

No Critical fixes.

## High Fixes

### H1. Add Scope-Aware RBAC Enforcement

**Severity:** High

**Status:** Completed.

**Affected files:**

- `backend-new/src/common/context/requestContext.js`
- `backend-new/src/common/middleware/rbac.js`
- `backend-new/src/modules/rbac/rbac.middleware.js`
- `backend-new/src/modules/auth/auth.service.js`
- `backend-new/src/modules/users/users.service.js`
- `backend-new/tests/rbac.phase3.test.js`

**Root cause:** Request context and RBAC guards carry permission keys but not effective scopes.

**Risk if not fixed:** Future business routes can accidentally authorize `OWN` or `ASSIGNED` users for `CLINIC`-level operations.

**Exact fix approach:**

- Add `scopedPermissions` to request context.
- Preserve `scopedPermissions` from auth effective access resolution.
- Add `hasPermissionScope` and `requirePermissionScope` helpers.
- Update audited RBAC guard to optionally enforce minimum scope.
- Update `/users/me` response to include scoped permissions.
- Add tests proving weaker scopes are rejected and stronger scopes pass.

**Dependencies:** None.

**Test cases required:**

- User with `users.me.read: OWN` fails a `CLINIC` guard.
- User with `users.me.read: CLINIC` passes a `CLINIC` guard.
- Platform context behavior is explicit and tested.
- `/users/me` returns `scopedPermissions`.

**Acceptance criteria:**

- Route middleware can enforce both permission key and minimum scope.
- Future modules can declare scope requirements without custom code.

### H2. Move Permission/System Role Sync Out Of GET Endpoints

**Severity:** High

**Status:** Completed.

**Affected files:**

- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/src/app.js` or startup/bootstrap script
- `backend-new/docs/PHASE_03_RBAC.md`
- `backend-new/tests/rbac.phase3.test.js`

**Root cause:** `listPermissions` and `listRoles` call sync methods that write to the database.

**Risk if not fixed:** Read traffic can perform writes, trigger locks, and violate API semantics.

**Exact fix approach:**

- Add explicit RBAC bootstrap function for catalog/system role sync.
- Call bootstrap from controlled startup, migration/seed command, or admin maintenance flow.
- Make `GET /rbac/permissions` and `GET /rbac/roles` read-only.
- Tests should assert list methods do not call write/upsert repository methods.

**Dependencies:** Startup/bootstrap decision.

**Test cases required:**

- List permissions does not call `upsertPermission`.
- List roles does not call `upsertSystemRole` or `createRolePermission`.
- Bootstrap remains idempotent.

**Acceptance criteria:**

- GET RBAC endpoints perform no writes.
- Catalog/system-role sync remains available through a controlled path.

### H3. Make Active User-Role Assignment Concurrency-Safe

**Severity:** High

**Status:** Completed.

**Affected files:**

- `backend-new/prisma/schema.prisma`
- `backend-new/prisma/migrations/0002_rbac.sql` or follow-up migration
- `backend-new/src/modules/rbac/rbac.repository.js`
- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/tests/rbac.phase3.test.js`

**Root cause:** Active assignment uniqueness is service-enforced by check-then-create.

**Risk if not fixed:** Duplicate active assignments can be created under concurrency, and revoking one assignment may not remove effective access.

**Exact fix approach:**

- Add DB-backed active assignment idempotency strategy.
- Preferred MySQL approach: generated active key column or deterministic assignment key that is unique for active `(clinic_id, user_id, role_id)`.
- Update assignment repository to use atomic create/upsert/claim semantics.
- Update revocation to revoke all duplicates if legacy duplicates are possible, or reject duplicates during migration cleanup.

**Dependencies:** Migration review.

**Test cases required:**

- Concurrent duplicate assignment creates one active assignment.
- Repeated assignment returns idempotent success.
- Revocation removes effective access even if duplicate historical data exists.
- Migration validates against MySQL.

**Acceptance criteria:**

- Database prevents duplicate active user-role assignments.
- Revocation reliably removes the assigned role.

### H4. Enforce Tenant Scope In Repository Reads

**Severity:** High

**Status:** Completed.

**Affected files:**

- `backend-new/src/modules/rbac/rbac.repository.js`
- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/src/modules/users/users.repository.js`
- `backend-new/src/modules/users/users.service.js`
- `backend-new/tests/rbac.phase3.test.js`

**Root cause:** Repositories read users, roles, and user-role assignments by ID before tenant filtering.

**Risk if not fixed:** Tenant isolation is convention-based at the service layer instead of guaranteed by repository contracts.

**Exact fix approach:**

- Change repository methods to accept trusted context or explicit `{ clinicId, isPlatform }`.
- Tenant actors must query with `clinic_id = context.clinicId`.
- Platform reads must be explicit and must not silently bypass tenant filters.
- Preserve post-read service checks as defense in depth.

**Dependencies:** None.

**Test cases required:**

- Tenant actor cannot fetch cross-tenant user/role/assignment from repository methods.
- Platform actor can fetch tenant records only through explicit platform path.
- `/users/me` repository read is tenant-scoped.

**Acceptance criteria:**

- No tenant-owned RBAC/User repository read is scoped only by ID.
- Tenant filtering happens in the query, not only after query results return.

## Medium Fixes

### M1. Reject Tenant Role Assignment To Platform Users

**Severity:** Medium

**Affected files:** `backend-new/src/modules/rbac/rbac.service.js`

**Root cause:** Target user validation does not reject `clinic_id = null` users for tenant role assignment.

**Risk if not fixed:** Creates confusing assignment rows that may become dangerous if platform tenant switching is added.

**Exact fix approach:** Reject assignments where target user has no `clinic_id` unless a future platform-role assignment workflow explicitly supports it.

**Test cases required:** Platform user cannot receive tenant role through Sprint 2 API.

**Acceptance criteria:** Sprint 2 APIs create no tenant-role assignments for platform users.

### M2. Normalize Duplicate Role And Grant Errors

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/rbac/rbac.service.js`
- `backend-new/src/modules/rbac/rbac.validator.js`

**Root cause:** Expected duplicate role code/grant cases can bubble Prisma errors.

**Risk if not fixed:** Clients receive generic 500 responses for normal conflict cases.

**Exact fix approach:**

- Validate or require role code after normalization.
- De-duplicate permission grants before persistence.
- Convert duplicate role code to `409 Conflict`.

**Test cases required:**

- Duplicate role code returns `409`.
- Duplicate permission grants do not cause 500.
- Invalid generated role code returns `400`.

**Acceptance criteria:** Expected client conflicts return stable API errors.

### M3. Harden Denial Audit Failure Behavior

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/rbac/rbac.middleware.js`
- `backend-new/src/modules/rbac/rbac.service.js`

**Root cause:** Authorization denial waits on audit persistence and propagates audit write failures.

**Risk if not fixed:** Audit database issues can turn expected `403` responses into `500` responses.

**Exact fix approach:**

- Decide fail-closed vs fail-with-denial behavior.
- Recommended: preserve `403`, log audit-write failure safely, and emit operational metric/alert when available.
- For service-level privilege denials, preserve durable audit where feasible but avoid masking authorization result.

**Test cases required:**

- Route denial returns `403` even if audit recorder throws, if recommended behavior is accepted.
- Audit failure is logged/redacted.

**Acceptance criteria:** Authorization semantics are stable during audit subsystem degradation.

### M4. Add MySQL RBAC Integration And Concurrency Tests

**Severity:** Medium

**Affected files:** test harness and CI configuration.

**Root cause:** Current tests use fake repositories for DB-sensitive behavior.

**Risk if not fixed:** Migration, FK, unique constraint, and concurrency behavior are not proven.

**Exact fix approach:** Add optional MySQL integration tests for RBAC migration, assignment, revocation, and concurrency. Gate production acceptance on this job.

**Acceptance criteria:** CI can validate RBAC behavior against real MySQL before production release.

### M5. Add Active Assignment Query Index

**Severity:** Medium

**Affected files:**

- `backend-new/prisma/schema.prisma`
- RBAC migration artifact or follow-up migration

**Root cause:** Existing indexes do not match active assignment lookup.

**Risk if not fixed:** Assignment checks and effective access resolution degrade as user-role rows grow.

**Exact fix approach:** Add composite index for active lookup, for example `(clinic_id, user_id, role_id, is_deleted, revoked_at)`, reviewed against MySQL query plans.

**Acceptance criteria:** RBAC active assignment queries have matching indexes.

### M6. Return Scoped Permissions From Current User Context

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/auth/auth.service.js`
- `backend-new/src/common/context/requestContext.js`
- `backend-new/src/modules/users/users.service.js`
- `backend-new/docs/RBAC_API.md`

**Root cause:** Effective resolver returns scoped permissions but auth/current-user output drops them.

**Risk if not fixed:** Frontend and future API guards cannot reason about permission scopes from session bootstrap.

**Exact fix approach:** Preserve and expose `scopedPermissions` in context and `/users/me`.

**Acceptance criteria:** `/users/me` includes `scopedPermissions`.

### M7. Repair System Role Sync Semantics

**Severity:** Medium

**Affected files:**

- `backend-new/src/modules/rbac/rbac.repository.js`
- `backend-new/src/modules/rbac/rbac.service.js`

**Root cause:** Duplicate role-permission rows are ignored even if the existing row is soft-deleted.

**Risk if not fixed:** System roles can silently miss permissions.

**Exact fix approach:** Use upsert semantics for role permissions that restore `is_deleted=false`, or explicitly update existing grants on conflict.

**Acceptance criteria:** System role sync repairs soft-deleted grants.

## Low Fixes

### L1. Remove Stale Revocation TODO From Phase 03 Docs

**Severity:** Low

**Affected file:** `backend-new/docs/PHASE_03_RBAC.md`

**Fix approach:** Remove "Role revocation endpoint" from remaining work.

### L2. Improve Postman CSRF Automation

**Severity:** Low

**Affected file:** `backend-new/postman/Doctor-System-Phase-3-RBAC.postman_collection.json`

**Fix approach:** Add pre-request/test script guidance to read `csrf_token` from cookie jar or document exact manual setup steps.

### L3. Document Unpaginated Catalog Endpoint Contract

**Severity:** Low

**Affected files:**

- `backend-new/docs/RBAC_API.md`
- `backend-new/src/modules/rbac/rbac.validator.js`

**Fix approach:** State that Sprint 2 catalog endpoints are intentionally unpaginated small catalogs, or add bounded query validation.

### L4. Add Route-Permission Coverage Artifact

**Severity:** Low

**Affected files:** tests/docs.

**Fix approach:** Add a route-to-permission coverage test or generated checklist.

### L5. Split RBAC Service Responsibilities Later

**Severity:** Low

**Affected file:** `backend-new/src/modules/rbac/rbac.service.js`

**Fix approach:** Split policy helpers, catalog sync, and assignment workflow into focused internal modules once Sprint 3 starts adding more domain modules.

## Prioritized Fix Order

1. **High:** Scope-aware RBAC enforcement.
2. **High:** Move sync writes out of GET endpoints.
3. **High:** Concurrency-safe active assignment model.
4. **High:** Tenant-scoped repository reads.
5. **Medium:** Reject tenant roles for platform users.
6. **Medium:** Normalize duplicate role/grant errors.
7. **Medium:** Harden denial audit failure behavior.
8. **Medium:** Add MySQL integration/concurrency tests.
9. **Medium:** Add active assignment query index.
10. **Medium:** Return scoped permissions from `/users/me`.
11. **Medium:** Repair system role sync semantics.
12. **Low:** Documentation/Postman/coverage cleanup.

## Safe Groupings

- **RBAC scope group:** H1 and M6 should be fixed together because both require carrying scoped permissions through auth context and `/users/me`.
- **Repository/data integrity group:** H3, H4, M1, and M5 can be grouped because they touch tenant-scoped RBAC repository contracts and assignment persistence.
- **Bootstrap/API semantics group:** H2 and M7 can be grouped because both concern permission/system-role sync lifecycle.
- **Error/audit hardening group:** M2 and M3 can be grouped because both normalize failure behavior.
- **Docs/Postman cleanup group:** L1, L2, L3, and L4 can be completed together after behavior is finalized.

## Acceptance Criteria For Sprint 2 Production Readiness

- No High findings remain open.
- RBAC guards enforce permission scopes.
- GET endpoints are read-only.
- User-role assignment is concurrency-safe and revocation is reliable.
- Tenant-owned repository reads include trusted tenant scope.
- RBAC integration/concurrency tests run against MySQL or are explicitly tracked as a production blocker.
- Docs and Postman no longer contradict implemented behavior.
