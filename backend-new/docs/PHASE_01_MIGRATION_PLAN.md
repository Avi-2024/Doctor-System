# Phase 01 Migration Plan

## Objective

Create the initial database foundation for `backend-new` without introducing business workflow data. Phase 01 migrations establish operational tables for audit, outbox, jobs, processed events, and dead-letter handling. Sprint 1 Auth extends the initial reviewed SQL artifact with Auth foundation tables needed for login and session management.

## Current Schema Tables

| Table | Purpose |
| --- | --- |
| `schema_migrations` | Tracks manually reviewed migration execution. |
| `audit_logs` | Stores redacted, chained audit records for critical future actions. |
| `audit_chain_state` | Stores serialized audit-chain state used to prevent concurrent hash-chain forks. |
| `outbox_events` | Stores durable events for asynchronous delivery. |
| `processed_events` | Tracks idempotent consumer processing. |
| `jobs` | Stores durable background job work items. |
| `job_attempts` | Stores job execution attempts with FK to `jobs`. |
| `dead_letter_jobs` | Stores failed jobs with FK to `jobs`. |
| `dead_letter_events` | Stores failed event payloads and failure reasons. |
| `users` | Stores Sprint 1 Auth users and token-version state. |
| `refresh_tokens` | Stores hashed refresh tokens, session IDs, rotation state, and expiry. |
| `password_reset_tokens` | Reserved Auth foundation table for later password reset flow. |
| `login_attempts` | Stores login success/failure attempts for audit and future lockout enforcement. |
| `account_lockouts` | Reserved Auth foundation table for later lockout enforcement. |

## Reviewed SQL Artifact

The reviewed SQL artifact for Phase 1 Foundation plus Sprint 1 Auth is:

```text
prisma/migrations/0001_foundation_auth.sql
```

The artifact is generated from the current Prisma schema and must be reviewed before production execution. It intentionally keeps `refresh_tokens.session_id` indexed but not globally unique so refresh-token rotation can store multiple token rows for one session. `refresh_tokens.token_hash` remains unique.

## Pre-Migration Checklist

- Confirm `DATABASE_URL` points to the intended MySQL database.
- Confirm database user has only required schema migration privileges.
- Confirm no production deployment is using the target database during first migration.
- Confirm automated backup or manual snapshot exists.
- Run Prisma schema validation.
- Review generated SQL before execution.
- Confirm rollback plan and owner.

## Dry Run

Run from `backend-new`:

```bash
npm run build
npx prisma validate
```

For a production migration process, generate SQL in a controlled environment and review:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

The reviewed SQL should create only Phase 01 operational tables, Sprint 1 Auth foundation tables, indexes, and declared foreign keys.

## Production Migration Flow

1. Announce migration window and owner.
2. Confirm backup status.
3. Confirm application release artifact is fixed.
4. Run migration through the approved migration job, not from a developer laptop.
5. Validate table creation and indexes.
6. Run readiness check.
7. Run smoke checks for `/health`, `/health/ready`, and `/api/v1/meta`.
8. Record migration evidence.

## Rollback Strategy

Phase 01 should be deployed before customer data exists. If migration fails before launch:

- Stop deployment.
- Preserve migration logs.
- Drop partially created Phase 01 tables only after database owner approval.
- Restore from backup if table state is ambiguous.
- Re-run migration only after SQL review.

After customer data exists, do not drop tables as a rollback shortcut. Use backup/restore and forward-fix procedures approved by the CTO and database owner.

## Acceptance Criteria

- Prisma schema validates.
- All Phase 01 tables exist, including `audit_chain_state`.
- Sprint 1 Auth tables exist: `users`, `refresh_tokens`, `password_reset_tokens`, `login_attempts`, and `account_lockouts`.
- `refresh_tokens.token_hash` is unique.
- `refresh_tokens.session_id` is indexed but not unique.
- Required indexes exist.
- Job attempt and dead-letter job relations enforce parent job ownership.
- Health and readiness endpoints behave as expected.
- Migration evidence is stored with release notes.

## Out Of Scope

- Auth business flows beyond Sprint 1 login, refresh, logout, and current user.
- Clinic, patient, appointment, queue, billing, storage, lab, notification, WhatsApp, and subscription business tables.
- Data migration from legacy backend.
