# Migration Plan

## Objective

Track reviewed SQL artifacts for `backend-new` as the canonical backend evolves from foundation into tenant administration.

## Migration Artifacts

| Artifact | Scope |
| --- | --- |
| `prisma/migrations/0001_foundation_auth.sql` | Phase 1 Foundation plus Sprint 1 Auth tables. |
| `prisma/migrations/0002_rbac.sql` | Sprint 2 RBAC permissions, roles, role grants, user roles, and branch assignment placeholder. |
| `prisma/migrations/0003_tenants.sql` | Sprint 3 tenant root, branches, settings, invitations, minimal subscriptions, and clinic FKs. |
| `prisma/migrations/0004_patients.sql` | Sprint 4 patient registry, idempotent registration state, patient code counters, and append-only patient records. |

## Current Schema Tables

Foundation:

- `schema_migrations`
- `audit_logs`
- `audit_chain_state`
- `outbox_events`
- `processed_events`
- `jobs`
- `job_attempts`
- `dead_letter_jobs`
- `dead_letter_events`

Auth:

- `users`
- `refresh_tokens`
- `password_reset_tokens`
- `login_attempts`
- `account_lockouts`

RBAC:

- `permissions`
- `roles`
- `role_permissions`
- `user_roles`
- `user_branch_assignments`

Tenants:

- `clinics`
- `clinic_branches`
- `settings`
- `setting_history`
- `user_invitations`
- `subscription_plans`
- `clinic_subscriptions`

Patients:

- `patient_code_counters`
- `patient_registration_requests`
- `patients`
- `patient_records`

## Sprint 3 Migration Notes

`0003_tenants.sql` adds:

- Tenant root table `clinics`.
- Tenant-owned branches with primary branch uniqueness key.
- Scoped settings and append-only history.
- Staff invitation lifecycle with hashed token storage only.
- Minimal trial subscription plan and clinic subscription records.
- FK relations from users, RBAC, Auth, and branch assignment tables to tenant roots where appropriate.
- Tenant-first indexes for list, status, lifecycle, settings, invitation, and subscription queries.

## Sprint 4 Migration Notes

`0004_patients.sql` adds:

- Tenant-owned patient registry table with `clinic_id`, patient-code uniqueness, normalized lookup fields, and PHI-safe lifecycle columns.
- Patient registration idempotency table keyed by `clinic_id + idempotency_key`.
- Clinic-local patient code counters using an atomic increment pattern.
- Append-only patient records with archive status instead of mutable clinical update behavior.
- Tenant-first indexes for patient lists, searches, record lists, status filters, and updated-at scans.

## Pre-Migration Checklist

- Confirm `DATABASE_URL` points to the intended MySQL database.
- Confirm database user has only required migration privileges.
- Confirm automated backup or manual snapshot exists.
- Run `npm run build` from `backend-new`.
- Review SQL artifact before execution.
- Confirm rollback plan and owner.
- Confirm release artifact and application image are fixed.
- Confirm no broad rollout while P0 debt remains open.

## Dry Run

Run from `backend-new`:

```bash
npm run build
npx prisma validate
```

For production review:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

## Production Migration Flow

1. Announce migration window and owner.
2. Confirm backup status.
3. Run migration through approved migration job.
4. Validate table creation, FKs, and indexes.
5. Run readiness check.
6. Run smoke checks for health, auth, RBAC, and tenant routes.
7. Record migration evidence.

## Rollback Strategy

Before customer data exists:

- Stop deployment.
- Preserve migration logs.
- Drop partially created tables only after database owner approval.
- Restore from backup if table state is ambiguous.

After customer data exists:

- Do not drop tables as a rollback shortcut.
- Use backup/restore or forward-fix procedures approved by CTO and database owner.

## Acceptance Criteria

- Prisma schema validates.
- Reviewed SQL artifact exists for each sprint.
- Required tenant-first indexes exist.
- Active uniqueness keys exist for partial unique behavior in MySQL.
- Health/readiness endpoints behave as expected.
- Auth/RBAC/Tenant smoke checks pass.
- Migration evidence is stored with release notes.

## Out Of Scope

- Legacy backend migration.
- Appointment, queue, clinical, lab, billing, storage, WhatsApp, report, and WebSocket schema.
- Live data migration from production clinics.
