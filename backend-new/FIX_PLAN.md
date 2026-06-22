# FIX_PLAN.md

## Summary

This document captures the Principal Engineer review of the completed Phase 1 Foundation implementation in `backend-new`.

Review scope:

- Security
- Performance
- Scalability
- Tenant isolation
- RBAC
- Error handling
- Logging
- Testing
- Documentation

No fixes are implemented in this document.

## Severity Summary

- **Critical:** None identified.
- **High:** 3 issues fixed.
- **Medium:** 5 issues.
- **Low:** 3 issues.

## Critical Issues

None identified in the completed Phase 1 implementation.

## High Issues

### 1. Error Handler Can Leak Arbitrary `details` From Non-Exposable Errors

**Severity:** High

**Status:** Fixed

**Affected files:**

- `src/common/middleware/errorHandler.js`
- `src/common/errors/ApiError.js`
- `tests/foundation.test.js`

**Root cause:** `errorHandler` includes `error.details` in the response for any thrown error. The response message is sanitized, but `details` can still be returned for generic errors, internal errors, or future library errors if they carry a `details` property.

**Risk if not fixed:** Internal validation details, database metadata, provider error payloads, or PHI-adjacent debugging data can leak through a normalized error response.

**Exact fix approach:** Only include `details` when the error is an exposable `ApiError` and the details have already been converted to a safe response shape. Do not return `details` for generic errors or any 5xx response.

**Dependencies:** None.

**Test cases required:**

- Generic error with `details` and status 500 does not expose `details`.
- Generic error with `details` and status 400 does not expose `details`.
- Exposable `ApiError` with sanitized validation details still returns details.
- Non-exposable `ApiError` does not return details.

**Acceptance criteria:**

- Internal errors never expose arbitrary `details`.
- Validation errors still return safe `{ field, message, location }` objects.

---

### 2. Audit Hash Chain Is Not Concurrency-Safe

**Severity:** High

**Status:** Fixed

**Affected files:**

- `src/modules/audit/audit.service.js`
- `src/modules/audit/audit.repository.js`
- `prisma/schema.prisma`
- `tests/foundation.test.js`

**Root cause:** Audit writes read the latest hash and then insert a new audit row. Concurrent transactions can read the same latest hash and create forked audit chains.

**Risk if not fixed:** Audit records can appear chained while losing strict tamper-evident ordering under concurrent writes. This weakens forensic reliability for healthcare audit trails.

**Exact fix approach:** Introduce a serialized audit chain state. Preferred approach: add an `audit_chain_state` table keyed by chain scope, lock the chain state row inside the audit transaction, compute the next hash, insert the audit row, then update the chain state in the same transaction.

**Dependencies:** Prisma schema migration and migration plan update.

**Test cases required:**

- Sequential audit writes chain correctly.
- Simulated concurrent audit writes do not reuse the same `previous_hash`.
- First audit write initializes chain state safely.
- Transaction failure does not advance chain state.

**Acceptance criteria:**

- Each audit record has a unique predecessor relationship for its chain.
- Concurrent audit writes cannot fork the chain.
- Audit documentation describes actual integrity guarantees.

---

### 3. Request Identity Merge Can Retain Stale Tenant/User Context

**Severity:** High

**Status:** Fixed

**Affected files:**

- `src/common/context/requestContext.js`
- `src/common/middleware/tenantContext.js`
- `tests/foundation.test.js`

**Root cause:** `withIdentity` uses `identity.userId || context.userId`, `identity.clinicId || context.clinicId`, and similar fallback logic. This makes it impossible to intentionally clear an identity field and can retain stale tenant/user values when context changes.

**Risk if not fixed:** Future authentication, platform context, logout, or tenant-switching code can accidentally preserve an old clinic or user value, causing incorrect tenant scoping or authorization decisions.

**Exact fix approach:** Replace truthy fallback merging with explicit property-presence semantics. If an identity object contains `clinicId`, `userId`, `branchId`, `roles`, `permissions`, `isAuthenticated`, or `isPlatform`, use that value even when it is `null`, `false`, or an empty array. Preserve existing context only when the property is absent.

**Dependencies:** Phase 2 Auth implementation must use the corrected merge contract.

**Test cases required:**

- `withIdentity` can clear `clinicId`, `branchId`, and `userId`.
- `withIdentity` can set `isPlatform` to `false` over a previous `true`.
- `withIdentity` can set empty `roles` and `permissions`.
- `setTenantContext` does not retain stale clinic or branch values.

**Acceptance criteria:**

- Request context cannot retain stale tenant/user identity after explicit overwrite.
- Tenant resolution semantics are deterministic before Auth is implemented.

---

## Medium Issues

### 4. Security And RBAC Denials Are Not Structured As Security Events

**Severity:** Medium

**Affected files:**

- `src/common/middleware/rbac.js`
- `src/common/middleware/tenantContext.js`
- `src/common/middleware/errorHandler.js`
- `src/common/utils/logger.js`
- `tests/foundation.test.js`

**Root cause:** RBAC and tenant guard failures return `ApiError(403)`, but the error handler logs only 5xx failures. Request logging records only the final status code, not denial reason or security context.

**Risk if not fixed:** Permission probing, tenant mismatch attempts, and repeated authorization failures are hard to detect or alert on.

**Exact fix approach:** Add structured security logging for RBAC denial, tenant context missing, tenant ownership mismatch, and platform-context denial. Include request ID, user ID, clinic ID, route, method, denial type, required role/permission where safe, and status.

**Dependencies:** Logging context improvement.

**Test cases required:**

- Missing permission emits a security-denial log.
- Tenant ownership mismatch emits a tenant-denial log.
- Platform context denial emits a structured log.
- Logs do not include secrets or raw request payloads.

**Acceptance criteria:**

- Authorization and tenant denials are observable.
- Security-relevant 403s are distinguishable from ordinary validation failures.

---

### 5. Request Logs Do Not Include User Or Clinic Context

**Severity:** Medium

**Affected files:**

- `src/common/middleware/requestLogger.js`
- `src/common/context/requestContext.js`
- `tests/foundation.test.js`

**Root cause:** Request completion logs include request ID, method, path, status, and duration, but not `userId`, `clinicId`, `branchId`, or platform flag, even though the request context defines those fields.

**Risk if not fixed:** Production incidents cannot be reliably scoped by tenant or actor. This slows investigation of healthcare workflow, billing, and tenant-isolation incidents.

**Exact fix approach:** Add context fields to request completion logs: `userId`, `clinicId`, `branchId`, `isPlatform`, and optionally route path/original path. Keep values nullable for public Phase 1 routes.

**Dependencies:** None.

**Test cases required:**

- Request logs include request ID, method, path, status, duration, user ID, clinic ID, and branch ID.
- Public routes log null context fields without crashing.
- Redaction still applies to all log metadata.

**Acceptance criteria:**

- Every request log can be correlated to tenant and actor when those values exist.
- Phase 1 public endpoints continue to work without identity context.

---

### 6. Public Readiness Endpoint Exposes Dependency State

**Severity:** Medium

**Affected files:**

- `src/modules/foundation/foundation.controller.js`
- `src/modules/foundation/foundation.service.js`
- `docs/PHASE_01_FOUNDATION_IMPLEMENTATION.md`
- `postman/Doctor-System-Phase-1.postman_collection.json`
- `tests/foundation.test.js`

**Root cause:** `/health/ready` is public and returns `database: "mysql"` or `database: "disconnected"`.

**Risk if not fixed:** External callers can infer database technology and dependency outage state. This is useful reconnaissance and can expose operational instability.

**Exact fix approach:** Keep `/health` as the public load-balancer endpoint. Restrict `/health/ready` to internal networks or deployment health checks, or return generic dependency status without naming MySQL. Document deployment expectations.

**Dependencies:** Deployment topology and load balancer health-check design.

**Test cases required:**

- Public health remains available.
- Readiness response no longer exposes database technology publicly.
- Internal readiness behavior still supports deployment checks.

**Acceptance criteria:**

- External callers cannot learn database technology from readiness responses.
- Operations still have a reliable readiness check.

---

### 7. No Reproducible Prisma Migration Artifact Exists

**Severity:** Medium

**Affected files:**

- `prisma/schema.prisma`
- `docs/PHASE_01_MIGRATION_PLAN.md`
- `package.json`

**Root cause:** The repository has a Prisma schema and migration plan, but no committed Prisma migration folder or reviewed SQL artifact for the Phase 1 schema.

**Risk if not fixed:** Production database creation depends on ad hoc migration generation. Review, rollback, and deployment evidence become weak.

**Exact fix approach:** Generate and commit a reviewed Phase 1 migration artifact using the agreed migration workflow. Update the migration plan with exact command outputs and review checklist.

**Dependencies:** Database migration policy and target MySQL version.

**Test cases required:**

- `npx prisma validate` passes.
- Migration SQL creates only Phase 1 operational tables.
- Migration can be applied to an empty MySQL database.
- Migration review confirms indexes and relations.

**Acceptance criteria:**

- Phase 1 schema can be recreated reproducibly from committed artifacts.
- Migration execution does not depend on developer-local generation.

---

### 8. Base Repository Updates Can Silently No-Op

**Severity:** Medium

**Affected files:**

- `src/common/repositories/BaseRepository.js`
- `tests/foundation.test.js`

**Root cause:** `updateById` uses `updateMany`, ignores the affected row count, then returns `findById`. If no row matches because the record is missing, deleted, or belongs to another tenant, the method returns `null`.

**Risk if not fixed:** Future services can treat an update as successful when no row was changed, leading to confusing API behavior and missed tenant mismatch signals.

**Exact fix approach:** Check `updateMany().count`. Return a controlled 404 or 403-safe not-found response when count is zero, depending on the repository policy. Keep tenant mismatch non-disclosing.

**Dependencies:** Standard repository not-found policy.

**Test cases required:**

- Updating an existing tenant-owned row succeeds.
- Updating a missing row throws a controlled error.
- Updating a row outside tenant scope does not leak whether the row exists.

**Acceptance criteria:**

- Repository mutations never silently no-op.
- Services receive deterministic errors for missing or inaccessible records.

---

## Low Issues

### 9. Readiness Failures Are Swallowed Without Root-Cause Logging

**Severity:** Low

**Affected files:**

- `src/modules/foundation/foundation.controller.js`
- `src/common/utils/logger.js`
- `tests/foundation.test.js`

**Root cause:** The readiness controller catches dependency errors and returns a normalized 503, but it does not log the underlying failure.

**Risk if not fixed:** Readiness failures are visible as HTTP 503s but lack root-cause detail in logs, making startup and deployment incidents slower to diagnose.

**Exact fix approach:** Log readiness failure internally with request ID and a redacted error message before returning the normalized response.

**Dependencies:** None.

**Test cases required:**

- Readiness failure emits a structured error log.
- Response body remains sanitized.
- Logs do not expose connection strings or secrets.

**Acceptance criteria:**

- Operators can diagnose readiness failures from logs without exposing details to clients.

---

### 10. Not Found Response Echoes Full Requested URL

**Severity:** Low

**Affected files:**

- `src/common/middleware/errorHandler.js`
- `tests/foundation.test.js`

**Root cause:** `notFound` returns `Route ${req.method} ${req.originalUrl} not found`. `originalUrl` can include query strings.

**Risk if not fixed:** If clients accidentally send tokens or sensitive values in a missing-route query string, the API echoes that URL back in the response.

**Exact fix approach:** Return a generic `Route not found` message. Log method and sanitized path internally if needed, excluding query string values.

**Dependencies:** None.

**Test cases required:**

- Missing route response does not include query parameters.
- Missing route still returns normalized 404 with request ID.

**Acceptance criteria:**

- 404 responses do not echo user-controlled URLs.

---

### 11. Postman Collection Does Not Validate Request ID Headers

**Severity:** Low

**Affected files:**

- `postman/Doctor-System-Phase-1.postman_collection.json`

**Root cause:** The Postman tests validate response bodies but do not assert the `X-Request-Id` response header.

**Risk if not fixed:** Manual smoke testing can miss request ID propagation regressions.

**Exact fix approach:** Add Postman tests for `X-Request-Id` on `/health`, `/health/ready`, and `/api/v1/meta`.

**Dependencies:** None.

**Test cases required:**

- Each Postman request checks that `X-Request-Id` exists.
- Optional: send a custom `X-Request-Id` and assert it is preserved.

**Acceptance criteria:**

- Postman smoke tests cover request ID propagation.

---

## Prioritized Fix Order

1. **High:** Error handler arbitrary details leak.
2. **High:** Audit hash chain concurrency.
3. **High:** Request identity merge stale tenant/user context.
4. **Medium:** Security and RBAC denial logging.
5. **Medium:** Request logs missing user/clinic context.
6. **Medium:** Public readiness dependency disclosure.
7. **Medium:** Reproducible Prisma migration artifact.
8. **Medium:** Base repository silent update no-op.
9. **Low:** Readiness failure root-cause logging.
10. **Low:** Generic 404 response.
11. **Low:** Postman request ID tests.

## Safe Fix Groupings

- **Error response hardening:** Issues 1 and 10 can be fixed together in `errorHandler`.
- **Audit integrity group:** Issue 2 should be fixed independently because it likely needs schema and migration changes.
- **Context and tenant-safety group:** Issues 3 and 8 can be grouped if repository error semantics are finalized first.
- **Observability group:** Issues 4, 5, and 9 can be fixed together because they share logging structure.
- **Operational artifact group:** Issues 7 and 11 can be grouped as release-readiness artifacts.

## Verification Required After Fixes

Run from `backend-new`:

```bash
npm run lint
npm run build
npm test
```

Additional manual checks:

- Import the Phase 1 Postman collection and run all requests.
- Confirm readiness behavior matches the selected deployment policy.
- Confirm migration artifact can create the Phase 1 schema in a clean MySQL database.
