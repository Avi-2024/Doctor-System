# PHASE 04 - Tenants

## Status

Implemented in Sprint 3 for `backend-new`.

Verification:

- `npm run lint`: passed.
- `npm run build`: passed; Prisma schema validates.
- `npm test`: passed; 101 tests passed and 2 MySQL-gated integration tests skipped by default.

## Scope

Phase 04 adds the SaaS tenant administration foundation:

- Clinics and tenant lifecycle.
- Branches and primary branch support.
- Staff users.
- Invitations and public invitation acceptance.
- Scoped settings.
- Minimal trial subscription records.
- Tenant lifecycle enforcement in Auth and tenant-owned write services.
- Sensitive settings encryption at rest using `SETTINGS_ENCRYPTION_KEY`.
- Audited platform tenant override decisions for `x-clinic-id`.
- Sprint 3 RBAC permissions and `clinic_owner` system role.

Out of scope:

- Patients, appointments, queue, clinical workflows, billing payments, reports, WebSockets, notification delivery, WhatsApp, and full subscription enforcement.

## Implemented APIs

Protected APIs require Auth, RBAC, and CSRF for unsafe methods.

- `GET /api/v1/clinics`
- `POST /api/v1/clinics`
- `GET /api/v1/clinics/current`
- `GET /api/v1/clinics/:id`
- `PATCH /api/v1/clinics/:id`
- `PATCH /api/v1/clinics/:id/status`
- `GET /api/v1/branches`
- `POST /api/v1/branches`
- `GET /api/v1/branches/:id`
- `PATCH /api/v1/branches/:id`
- `PATCH /api/v1/branches/:id/status`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`
- `POST /api/v1/users/invite`
- `GET /api/v1/users/invitations`
- `POST /api/v1/users/invitations/:id/revoke`
- `POST /api/v1/users/invitations/:id/resend`
- `POST /api/v1/users/invitations/accept`
- `POST /api/v1/users/:id/deactivate`
- `POST /api/v1/users/:id/reactivate`
- `GET /api/v1/users/:id/branches`
- `POST /api/v1/users/:id/branches`
- `DELETE /api/v1/users/:id/branches/:assignmentId`
- `POST /api/v1/users/:id/branches/:assignmentId/primary`
- `GET /api/v1/settings`
- `GET /api/v1/settings/:key`
- `PUT /api/v1/settings/:key`
- `DELETE /api/v1/settings/:key`
- `GET /api/v1/subscriptions/current`

Public API:

- `POST /api/v1/users/invitations/accept`

## Tenant Override Contract

Platform users target a tenant by sending:

- `x-clinic-id`: target clinic UUID.
- `x-support-reason`: required for sensitive lifecycle/recovery operations.

Clinic users cannot provide `x-clinic-id`. Services reject client-provided tenant override for non-platform contexts.

## Lifecycle Enforcement

- Suspended clinics cannot log in.
- Suspended and archived clinics cannot perform tenant writes.
- Archived clinic restore requires platform context, `tenant.recovery`, and support reason.
- Auth access-token, refresh-token, login, and invitation-session issuance fail closed when clinic lifecycle relation data is missing or unavailable.

## Database

Migration artifact:

```text
prisma/migrations/0003_tenants.sql
```

New Prisma models:

- `clinics`
- `clinic_branches`
- `settings`
- `setting_history`
- `user_invitations`
- `subscription_plans`
- `clinic_subscriptions`

Existing model updates:

- `users.clinic_id` relation to `clinics`.
- RBAC tenant tables relate to `clinics`.
- Auth session/attempt tables relate to `clinics`.
- `user_branch_assignments.branch_id` relation to `clinic_branches`.
- Active uniqueness keys added for primary branch, settings, invitations, subscriptions, and branch assignments.

## RBAC

Sprint 3 permissions were added for clinics, branches, users, settings, subscriptions, and tenant recovery.

System roles:

- `super_admin`: platform permissions with `ALL`.
- `clinic_owner`: default tenant owner role with tenant administration permissions.
- `clinic_admin`: limited tenant administration role.
- `doctor` and `receptionist`: remain minimal until workflow sprints.

## Audit And Outbox

Audited:

- Clinic onboarding, update, status changes.
- Tenant override allow and deny decisions.
- Branch create, update, status, primary changes.
- Staff create, update, deactivate, reactivate.
- Invitation create, accept, revoke, resend, expired/replay denial.
- Settings update, archive, sensitive read.
- Tenant lifecycle and override-sensitive operations.

Outbox events:

- `clinic.created.v1`
- `clinic.status_changed.v1`
- `branch.created.v1`
- `branch.status_changed.v1`
- `user.invited.v1`
- `user.activated.v1`
- `settings.updated.v1`
- `subscription.trial_started.v1`

Notification delivery remains deferred.

## Sensitive Settings Encryption

Sensitive setting keys are encrypted before persistence with AES-256-GCM and stored as a JSON envelope in `settings.value`.

Required runtime configuration for sensitive setting writes:

```text
SETTINGS_ENCRYPTION_KEY=<base64 encoded 32-byte key>
```

If the key is missing or invalid, sensitive writes fail closed. Setting history and audit payloads store encrypted summaries or redacted placeholders, not raw secret values.

## Tests

Added:

- `tests/tenants.phase4.test.js`
- `tests/tenants.mysql.test.js` gated by `RUN_MYSQL_INTEGRATION_TESTS=true`

Coverage includes:

- Sprint 3 schema and migration artifact.
- RBAC catalog and `clinic_owner`.
- Route gating.
- Clinic onboarding transaction behavior.
- Onboarding idempotency.
- Suspended clinic login blocking.
- Sensitive setting permission enforcement.
- Sensitive setting encryption and redacted history/audit payloads.
- Invitation acceptance lifecycle blocking and origin/rate-limit controls.
- Branch assignment route-user matching.
- Tenant override allow/deny auditing.
- User self/owner/last-admin deactivation protections.
- Prisma conflict mapping.

## Deferred Debt

- MySQL-backed FK/concurrency tests are still required before production launch; the gated harness is present but was not run without a configured MySQL test database.
- Notification worker delivery for invitations is deferred.
- Full subscription enforcement, billing, metering, and payment provider logic are deferred.
- WebSocket broadcasts are deferred.
