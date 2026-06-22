# Phase 01 Foundation Implementation

## Scope

Phase 01 establishes the backend platform foundation for `backend-new`. It does not implement Auth, Patients, Appointments, Billing, Notifications, Storage, or any business workflow module.

The implemented foundation supports the Modular Monolith rule:

Route -> Validator -> Controller -> Service -> Repository -> Prisma

## Implemented Modules

- Common utilities: async handling, response envelopes, pagination, query sanitization, redaction, and structured logging.
- Config: environment normalization and startup validation.
- Logger: structured JSON logs with sensitive metadata redaction and circular-safe serialization.
- Error Handling: centralized `ApiError`, normalized error responses, status clamping, and public message sanitization.
- Request Context: request ID, actor placeholders, tenant placeholders, roles, permissions, platform context, and request metadata.
- Audit Framework: audit repository and service with redaction and transaction-serialized chained hashes.
- Tenant Framework: tenant context helpers and ownership assertions.
- RBAC Framework: role and permission helper middleware for future protected routes.
- Base Repository: tenant-scoped repository contract with explicit platform/global access and configurable soft delete.
- Prisma Setup: MySQL Prisma client, ping, transaction helper, and initial operational schema.
- Validation Framework: Express validator result normalization without rejected values.
- Foundation Module: health, readiness, and API metadata endpoints implemented with layered route structure.

## Public Endpoints

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/health` | Process health check | Public |
| GET | `/health/ready` | Dependency readiness check | Public |
| GET | `/api/v1/meta` | API metadata for Phase 01 | Public |

## Layering

The Foundation module is implemented under `src/modules/foundation`.

- `foundation.routes.js` defines routes only.
- `foundation.validator.js` exports route validator arrays.
- `foundation.controller.js` translates service results into response envelopes.
- `foundation.service.js` builds health, readiness, and metadata payloads.
- `foundation.repository.js` wraps the injected readiness ping dependency.

Controllers do not call Prisma. Routes do not contain business logic.

## Tenant And Security Rules

- No tenant-owned business tables are introduced in Phase 01.
- Tenant-owned future repositories must derive clinic scope from trusted request context.
- Global repositories require platform context.
- Health and readiness routes are intentionally exempt from rate limiting.
- API routes remain rate limited.
- Validation responses do not echo rejected secret values.
- Logs and audit payloads use centralized redaction.

## Database Foundation

The Prisma schema includes the operational tables required for later phases:

- `schema_migrations`
- `audit_logs`
- `audit_chain_state`
- `outbox_events`
- `processed_events`
- `jobs`
- `job_attempts`
- `dead_letter_jobs`
- `dead_letter_events`

The schema includes audit indexes, serialized audit chain state, job queue indexes, job attempt relations, and dead-letter relations required for Phase 01 operational safety.

## Verification Commands

Run from `backend-new`:

```bash
npm run lint
npm run build
npm test
```

Expected result: all commands pass before Phase 01 is accepted.

## Phase Boundary

Do not add Auth, user login, refresh token rotation, clinic onboarding, patient records, appointments, billing, or worker execution in this phase. Those belong to later phases.
