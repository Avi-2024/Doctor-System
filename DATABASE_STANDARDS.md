# Database Standards

## Purpose

These standards define how `backend-new` uses Prisma and MySQL for a production healthcare SaaS platform.

The database must protect tenant isolation, PHI, clinical correctness, billing correctness, auditability, and operational reliability.

RBAC decisions are enforced in application services and middleware, but the database must still support RBAC safely through tenant-scoped role, permission, and assignment tables with appropriate constraints and indexes.

## Core Rules

- MySQL is the production database.
- Prisma is the application ORM.
- Primary keys use application-generated UUID strings stored as `CHAR(36)`.
- Database table and column names use snake_case.
- Prisma access is owned by repositories or approved infrastructure modules.
- No tenant-owned table ships without tenant-first indexes.
- No production migration ships without dry-run, review, backup, and rollback plan.

## Tenant-Owned Tables

Every tenant-owned mutable business table must include:

- `id`
- `clinic_id`
- `created_by`
- `updated_by`
- `deleted_by`
- `is_deleted`
- `created_at`
- `updated_at`
- `deleted_at`

Mandatory indexes:

- `(clinic_id)`
- `(clinic_id, is_deleted)`
- `(clinic_id, created_at)`
- `(clinic_id, updated_at)`

Query-specific indexes must be added for list, search, dashboard, worker, and workflow access patterns.

## Tenant Isolation

- Every tenant-owned query filters by trusted `clinic_id`.
- Do not trust client-provided tenant IDs as authority.
- Platform/global reads require explicit platform context.
- Indirect child records still carry `clinic_id` for defense in depth and tenant-first query performance.
- Cross-tenant support operations require platform role, reason code, audit log, and approval policy.

## Soft Delete

- Business records use soft delete unless explicitly append-only.
- Repositories must enable soft delete explicitly per model.
- Deleted records are excluded from normal reads and lists.
- Hard deletes require CTO/security approval after retention policy review.

## Foreign Keys And Integrity

- Use foreign keys for strict parent-child ownership where lifecycle is coupled.
- Use `Restrict` or `NoAction` for business records unless cascade is explicitly safe.
- Job attempts and dead letters must reference parent jobs when strict lifecycle ownership exists.
- Event/outbox records may avoid FKs only when an intentional event-store policy is documented.

## Transactions

Use transactions for:

- Clinic onboarding.
- User creation and role assignment.
- Appointment booking and rescheduling.
- Queue check-in and token generation.
- Consultation finalization.
- Prescription finalization.
- Lab order creation and report publication.
- Invoice finalization, payment recording, refunds, and credit notes.
- Subscription updates, renewals, expiry, and limit enforcement.
- Audit/outbox writes that must be atomic with business state.

## Money And Decimal Rules

- Never use floating point for money.
- Use Prisma `Decimal` and MySQL decimal columns.
- Store currency explicitly where money crosses billing or payment boundaries.
- Totals must be calculated server-side.
- Invoices, payments, refunds, credits, and ledger entries require tests for precision and rounding.

## Migrations

Migration rules:

- Forward-only by default.
- Reviewed SQL before production.
- Dry-run against production-compatible MySQL.
- Backup confirmed before production execution.
- Rollback strategy documented before merge.
- Migration owner present during deployment.
- No destructive migration without data retention and restore plan.

Migration PRs must include:

- Schema diff.
- Index impact.
- Lock risk.
- Backfill plan if needed.
- Rollback or forward-fix plan.
- Expected runtime.

## Audit, Outbox, Jobs

Audit:

- Append-only.
- No soft delete.
- Redacted payloads.
- Serialized hash-chain state when integrity guarantees are claimed.

Outbox:

- Written in the same transaction as the business change.
- Published after commit.
- Idempotent consumers required.

Jobs:

- Durable table or managed queue.
- Atomic claim semantics.
- Retry and max-attempt policy.
- Dead-letter handling.
- Tenant-aware payloads and indexes.

## Performance Standards

- No unbounded list queries.
- No full table scans on expected production paths.
- No heavy report reads on hot OLTP tables once data grows.
- High-volume reports must use aggregates, snapshots, async exports, or read-optimized paths.
- Query plans must be reviewed for patients, appointments, queue, billing, reports, jobs, and audit logs.

## Done Checklist

- [ ] Tenant-owned table includes required fields.
- [ ] Tenant-first indexes exist.
- [ ] Unique constraints enforce business invariants.
- [ ] Foreign keys match lifecycle policy.
- [ ] Transaction boundaries are defined.
- [ ] Money uses Decimal.
- [ ] Migration is reviewed, dry-run, and rollback-aware.
- [ ] Tests cover tenant isolation, uniqueness, transactions, and concurrency where relevant.
