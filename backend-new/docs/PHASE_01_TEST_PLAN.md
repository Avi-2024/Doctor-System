# Phase 01 Test Plan

## Objective

Verify that the `backend-new` foundation is safe for later modules to build on. Phase 01 tests focus on infrastructure behavior, request safety, tenant scaffolding, RBAC helpers, audit integrity, validation safety, and repository contracts.

## Required Commands

Run from `backend-new`:

```bash
npm run lint
npm run build
npm test
```

All commands must pass before Phase 01 is accepted.

## Test Areas

| Area | Required Coverage |
| --- | --- |
| Health endpoints | `/health` returns standard success envelope and request ID. |
| Readiness endpoint | `/health/ready` returns success when DB ping passes and normalized 503 when it fails. |
| API metadata | `/api/v1/meta` returns name, version, phase, and request ID. |
| Rate limiting | Health routes are exempt; API routes remain limited. |
| Config validation | Invalid port, CORS, proxy, rate limit, and database URL values fail fast. |
| Request ID | Generated IDs and valid incoming IDs propagate to headers and payloads. |
| Error handling | ApiError messages expose safely; generic/internal messages are sanitized. |
| Validation | Validation errors are structured and do not echo rejected secret values. |
| Transactions | Unit-of-work helper commits and propagates rollback failures. |
| Tenant framework | Missing clinic context is rejected; tenant ownership mismatch fails. |
| Base repository | Tenant repositories derive clinic ID from context; global repositories require platform context. |
| Soft delete | Soft-delete behavior is explicit per repository. |
| RBAC helpers | Role, permission, all/any matching, and platform bypass behavior are covered. |
| Audit framework | Audit payloads redact secrets, include metadata, and compute chained hashes. |
| Logger | Sensitive metadata is redacted and circular metadata does not crash logging. |
| Prisma schema | Operational indexes and job relations are present. |

## Manual Smoke Tests

Start the service from `backend-new`:

```bash
npm start
```

Then call:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/ready
curl http://localhost:8080/api/v1/meta
```

Expected behavior:

- `/health` returns HTTP 200 with `success: true`.
- `/health/ready` returns HTTP 200 if MySQL is reachable, otherwise HTTP 503 with a normalized dependency failure.
- `/api/v1/meta` returns HTTP 200 with `phase: "foundation"`.

## Regression Rules

- Do not accept a Phase 01 change that removes request IDs from responses or logs.
- Do not accept a Phase 01 change that exposes stack traces or database details.
- Do not accept a Phase 01 change that bypasses tenant repository guards.
- Do not accept a Phase 01 change that logs or audits raw secrets.
- Do not accept a Phase 01 change unless lint, build, and tests pass.
