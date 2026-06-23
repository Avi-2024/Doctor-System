# Sprint 3 Execution Plan

## Implementation Status

Implemented in `backend-new`.

Verification evidence:

- `npm run lint`: passed.
- `npm run build`: passed; Prisma schema validated.
- `npm test`: passed; 91/91 tests.

Implemented artifacts:

- `backend-new/prisma/migrations/0003_tenants.sql`
- `backend-new/docs/PHASE_04_TENANTS.md`
- `backend-new/docs/TENANTS_API.md`
- `backend-new/postman/Doctor-System-Phase-4-Tenants.postman_collection.json`

Remaining production blocker:

- MySQL-backed FK and concurrency integration tests are still required before production launch.

## Sprint Goal

Build the tenant administration foundation required to onboard a paying outpatient clinic safely.

Sprint 3 converts the accepted Auth and RBAC foundation into a usable SaaS operating base: clinics, users, branches, settings, minimal trial subscription records, tenant lifecycle controls, and audit evidence.

## Current Baseline

| Area | Status |
| --- | --- |
| Canonical backend | `backend-new` |
| Sprint 2 status | Accepted |
| Lint | Passed from `backend-new` |
| Build | Passed from `backend-new`; Prisma schema validated |
| Tests | Passed from `backend-new`; 83/83 tests passed |
| Implementation phases source | `backend-new/docs/IMPLEMENTATION_PHASES.md` |
| Product roadmap source | `ROADMAP_12_MONTHS.md`; root `PRODUCT_ROADMAP.md` is missing |
| Current backend modules | Foundation, Audit, Auth, RBAC, Users `/me` only |
| Current tenant tables | Not implemented yet |

## Business Objectives

- Super Admin can create and manage clinic tenants.
- Each clinic starts with an owner, primary branch, default settings, default RBAC assignment, and trial subscription record.
- Clinic admins can manage staff, branches, and settings inside their own tenant.
- Suspended and archived clinics are blocked consistently from login and write APIs.
- Sprint 4 Patients can rely on trusted tenant, branch, user, and settings foundations.

## Scope Boundaries

Sprint 3 includes:

- Clinics and tenant lifecycle.
- Branch administration.
- Staff administration.
- User invitations and activation foundation.
- Settings foundation.
- Minimal trial subscription record creation and read-only current subscription access.
- Tenant-aware audit and outbox records.

Sprint 3 excludes:

- Patients and patient records.
- Schedules, appointments, and queue.
- Clinical, prescriptions, laboratory, billing, storage, notifications, WhatsApp, reports, and WebSockets.
- Full subscription plan enforcement, metering, renewals, invoices, and payment integration.
- Runtime notification delivery for invitations.

## Database Changes

Create migration artifact:

- `backend-new/prisma/migrations/0003_tenants.sql`

Update Prisma schema with these Sprint 3 models and relations.

### `clinics`

Tenant root and lifecycle table.

Required fields:

- `id`
- `code`
- `name`
- `status`
- `timezone`
- `contact`
- `address`
- `branding`
- `owner_user_id`
- `created_by`
- `updated_by`
- `deleted_by`
- `is_deleted`
- `created_at`
- `updated_at`
- `deleted_at`
- `archived_at`

Required constraints and indexes:

- Unique `code`.
- Index `status`.
- Index `is_deleted`.
- Index `created_at`.
- Index `owner_user_id`.

### `clinic_branches`

Tenant-owned branch/location table.

Required fields:

- `id`
- `clinic_id`
- `branch_code`
- `name`
- `timezone`
- `contact`
- `address`
- `is_primary`
- `primary_branch_key`
- `status`
- `created_by`
- `updated_by`
- `deleted_by`
- `is_deleted`
- `created_at`
- `updated_at`
- `deleted_at`

Required constraints and indexes:

- Unique `(clinic_id, branch_code)`.
- Unique nullable `primary_branch_key` populated only for active primary branch.
- Tenant-first indexes: `(clinic_id)`, `(clinic_id, is_deleted)`, `(clinic_id, created_at)`, `(clinic_id, updated_at)`.
- Query indexes: `(clinic_id, status, is_deleted)`, `(clinic_id, is_primary, status)`.
- FK `clinic_id -> clinics.id`.

### `settings`

Scoped configuration table for platform, clinic, branch, and user settings.

Required fields:

- `id`
- `clinic_id`
- `branch_id`
- `user_id`
- `setting_key`
- `setting_value`
- `scope`
- `is_encrypted`
- `active_setting_key`
- `status`
- `created_by`
- `updated_by`
- `deleted_by`
- `is_deleted`
- `created_at`
- `updated_at`
- `deleted_at`

Required constraints and indexes:

- Unique nullable `active_setting_key`.
- Tenant-first indexes for clinic settings.
- Index `(clinic_id, scope, is_deleted)`.
- Index `(clinic_id, setting_key, is_deleted)`.
- Index `branch_id`.
- Index `user_id`.

### `setting_history`

Append-only setting change history.

Required fields:

- `id`
- `clinic_id`
- `setting_id`
- `old_value`
- `new_value`
- `changed_by`
- `change_reason`
- `created_at`

Required constraints and indexes:

- FK `setting_id -> settings.id`.
- Tenant-first indexes: `(clinic_id)`, `(clinic_id, setting_id, created_at)`.

### `user_invitations`

Tenant-owned staff invitation table.

Required fields:

- `id`
- `clinic_id`
- `user_id`
- `email`
- `full_name`
- `phone`
- `token_hash`
- `active_invitation_key`
- `status`
- `expires_at`
- `accepted_at`
- `revoked_at`
- `invited_by`
- `created_by`
- `updated_by`
- `deleted_by`
- `is_deleted`
- `created_at`
- `updated_at`
- `deleted_at`

Required constraints and indexes:

- Unique `token_hash`.
- Unique nullable `active_invitation_key` populated only for active invitations.
- Tenant-first indexes: `(clinic_id)`, `(clinic_id, email, status)`, `(clinic_id, expires_at)`.
- FK `user_id -> users.id`.
- FK `invited_by -> users.id`.
- Raw invitation tokens must never be stored.

### `subscription_plans`

Minimal internal trial/default plan support.

Required fields:

- `id`
- `code`
- `name`
- `status`
- `plan_type`
- `currency`
- `monthly_price`
- `yearly_price`
- `version`
- `limits`
- `features`
- `is_deleted`
- `created_at`
- `updated_at`

Required constraints and indexes:

- Unique `(code, version)`.
- Index `code`.
- Index `(status, plan_type)`.

### `clinic_subscriptions`

Minimal trial subscription lifecycle record created during onboarding.

Required fields:

- `id`
- `clinic_id`
- `plan_id`
- `status`
- `billing_period`
- `starts_at`
- `ends_at`
- `trial_ends_at`
- `grace_ends_at`
- `usage_snapshot`
- `active_subscription_key`
- `created_by`
- `updated_by`
- `deleted_by`
- `is_deleted`
- `created_at`
- `updated_at`
- `deleted_at`

Required constraints and indexes:

- Unique nullable `active_subscription_key` populated only for active/trial subscription.
- Tenant-first indexes: `(clinic_id)`, `(clinic_id, status)`, `(clinic_id, starts_at, ends_at)`.
- Index `plan_id`.
- FK `clinic_id -> clinics.id`.
- FK `plan_id -> subscription_plans.id`.

### Existing Model Changes

- Add FKs from `users.clinic_id` to `clinics.id`.
- Add FKs from RBAC tenant-owned tables to `clinics.id`.
- Add FK from `user_branch_assignments.branch_id` to `clinic_branches.id`.
- Review auth/session tables for tenant-root FK compatibility.
- Preserve platform users where `clinic_id = null`.

## APIs

All protected APIs must use:

`Auth -> Tenant Context -> RBAC -> CSRF for unsafe methods -> Validator -> Controller -> Service -> Repository -> Prisma`

### Clinics

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/clinics` | Super Admin clinic list | `clinics.read` with `ALL` |
| POST | `/api/v1/clinics` | Transactional clinic onboarding | `clinics.create` with `ALL` |
| GET | `/api/v1/clinics/:id` | Clinic details | `clinics.read` |
| PATCH | `/api/v1/clinics/:id` | Update clinic metadata | `clinics.update` |
| PATCH | `/api/v1/clinics/:id/status` | Activate, suspend, archive, restore | status-specific permission |

### Branches

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/branches` | List branches in current tenant | `branches.read` |
| POST | `/api/v1/branches` | Create branch | `branches.create` |
| GET | `/api/v1/branches/:id` | Branch details | `branches.read` |
| PATCH | `/api/v1/branches/:id` | Update branch | `branches.update` |
| PATCH | `/api/v1/branches/:id/status` | Activate/deactivate branch | `branches.deactivate` |

### Users

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/users` | List clinic staff | `users.read` |
| POST | `/api/v1/users` | Create staff user | `users.create` |
| GET | `/api/v1/users/:id` | User details | `users.read` |
| PATCH | `/api/v1/users/:id` | Update staff profile/status fields | `users.update` |
| POST | `/api/v1/users/invite` | Create invitation | `users.invite` |
| POST | `/api/v1/users/invitations/accept` | Accept invitation | Public token endpoint with strict validation |
| POST | `/api/v1/users/:id/deactivate` | Deactivate staff and revoke sessions | `users.deactivate` |
| POST | `/api/v1/users/:id/reactivate` | Reactivate eligible staff | `users.update` |

### Settings

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/settings` | List scoped settings | `settings.read` |
| GET | `/api/v1/settings/:key` | Get setting by key | `settings.read` |
| PUT | `/api/v1/settings/:key` | Upsert setting | `settings.update` |
| DELETE | `/api/v1/settings/:key` | Archive setting | `settings.manage` |

### Subscriptions

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/subscriptions/current` | Read current clinic trial subscription | `subscriptions.read` |

## Services

### Clinics Service

Owns:

- Clinic onboarding transaction.
- Clinic list/detail/update.
- Clinic status transitions.
- Suspension/archive enforcement policy.
- Super Admin tenant targeting checks.
- Onboarding outbox events and audit records.

Onboarding transaction must create:

1. Clinic.
2. Owner user.
3. Primary branch.
4. Default settings.
5. Trial subscription.
6. Default `clinic_owner` role assignment.
7. Audit records.
8. Outbox events.

No partial tenant creation is allowed.

### Branches Service

Owns:

- Branch list/detail/create/update/status.
- Primary branch uniqueness.
- Tenant-scoped branch ownership checks.
- Branch deactivation rules.

### Users Service

Owns:

- Staff list/detail/create/update.
- User deactivate/reactivate.
- Invitation create/accept.
- Token version invalidation.
- Session revocation when status or role-sensitive fields change.
- Role assignment coordination through RBAC service contract.

### Settings Service

Owns:

- Settings read/upsert/archive.
- Scope validation.
- Setting history creation.
- Sensitive setting restrictions.
- Safe redaction for audit/logging.

### Subscriptions Service

Owns:

- Minimal trial subscription creation during onboarding.
- Current clinic subscription read.
- No payment, invoice, usage enforcement, renewal, or metering logic in Sprint 3.

## Repositories

Create repository modules following Prisma-only persistence access:

- `clinics.repository.js`
- `branches.repository.js`
- `users.repository.js` expansion beyond `/me`
- `settings.repository.js`
- `subscriptions.repository.js`

Repository rules:

- Tenant-owned repository methods require trusted `context.clinicId`.
- Platform operations require `context.isPlatform`.
- No repository method accepts client-provided tenant IDs without service validation.
- All tenant-owned queries filter by `clinic_id`.
- Soft-delete filters are explicit.
- Business rules stay in services.

## Validations

Required validation coverage:

- UUID params and query values.
- Clinic code format, name length, timezone, contact/address/branding object shape and size.
- Branch code format, name length, timezone, status enum, primary flag.
- User full name, email, phone, user type, status, password policy for invitation acceptance.
- Invitation token format, expiry, and single-use state.
- Settings key allowlist, scope enum, JSON value size, encrypted setting restrictions.
- Pagination/search/filter/sort caps for list APIs.
- Status transition enums for clinic, branch, user, invitation, plan, and subscription records.
- Validation errors must not echo passwords, raw tokens, secrets, or sensitive setting values.

## Permissions

Extend RBAC catalog with Sprint 3 permissions.

### Clinics

- `clinics.read`
- `clinics.create`
- `clinics.update`
- `clinics.suspend`
- `clinics.archive`
- `clinics.restore`

### Branches

- `branches.read`
- `branches.create`
- `branches.update`
- `branches.deactivate`
- `branches.manage`

### Users

- `users.read`
- `users.create`
- `users.update`
- `users.deactivate`
- `users.invite`
- `users.manage`

### Settings

- `settings.read`
- `settings.update`
- `settings.manage`

### Subscriptions

- `subscriptions.read`

### Reserved Platform

- `tenant.recovery`

System role changes:

- Add `clinic_owner` as the default owner role.
- Super Admin gets `ALL`.
- Clinic Owner gets `CLINIC` for tenant administration permissions.
- Clinic Admin gets limited `CLINIC` tenant-administration permissions.
- Doctor and Receptionist remain minimal until later workflow sprints.

## Audit Requirements

Audit these actions:

- Clinic onboarding, update, suspend, archive, restore.
- Branch create, update, status change, primary branch change.
- User create, invite, invitation accept, update, deactivate, reactivate.
- Role assignment during onboarding and staff management.
- Setting update, archive, and sensitive setting read.
- Trial subscription creation.
- Super Admin tenant override success and denial.
- Cross-tenant access attempts as security events.

Audit payloads must include:

- `request_id`
- `actor_user_id`
- `clinic_id`
- `resource_type`
- `resource_id`
- `action`
- safe before/after payloads
- reason metadata for status changes and tenant overrides

## Background Jobs

No new worker runtime is implemented in Sprint 3.

Create outbox events only:

- `clinic.created.v1`
- `clinic.status_changed.v1`
- `branch.created.v1`
- `branch.status_changed.v1`
- `user.invited.v1`
- `user.activated.v1`
- `settings.updated.v1`
- `subscription.trial_started.v1`

Invitation email delivery is deferred to Notifications. Sprint 3 APIs must not depend on external email, SMS, WhatsApp, or provider calls.

## WebSocket Events

No Socket.IO runtime implementation is included in Sprint 3.

Reserve future event names:

- `tenant.updated`
- `branch.updated`
- `user.updated`
- `settings.updated`

Runtime broadcasts remain deferred until the WebSocket sprint.

## Tests

Required tests:

- Onboarding success creates clinic, owner, branch, settings, trial subscription, owner role assignment, audit records, and outbox events.
- Onboarding rollback leaves no partial tenant state.
- Duplicate clinic code is blocked.
- Duplicate owner email in tenant scope is blocked.
- Default primary branch uniqueness is enforced.
- Suspended clinic blocks login and tenant writes.
- Archived clinic allows approved read/recovery paths only.
- Branch APIs are tenant-scoped.
- User APIs are tenant-scoped.
- Settings APIs are tenant-scoped.
- Clinic users cannot override `clinicId`.
- Super Admin explicit tenant targeting is validated and audited.
- Invitation token is hashed, single-use, expiry-aware, and never stored raw.
- User deactivation increments token version and revokes sessions.
- Settings updates write history and redact/encrypt sensitive values where applicable.
- Migration artifact contains Sprint 3 tables, FKs, tenant-first indexes, and uniqueness constraints.
- Postman collection parses as valid JSON.
- `npm run lint`, `npm run build`, and `npm test` pass from `backend-new`.

## Documentation

Create or update:

- `SPRINT_03_EXECUTION_PLAN.md`
- `backend-new/docs/PHASE_04_TENANTS.md`
- `backend-new/docs/TENANTS_API.md`
- `backend-new/docs/PHASE_01_MIGRATION_PLAN.md` or migration index to reference `0003_tenants.sql`

Documentation must state:

- Sprint 3 scope and exclusions.
- API contracts.
- Tenant isolation rules.
- RBAC permission requirements.
- Audit requirements.
- Migration artifact.
- Test plan.
- Known deferred items.

## Postman Updates

Create:

- `backend-new/postman/Doctor-System-Phase-4-Tenants.postman_collection.json`

Collection must include:

- Clinic onboarding.
- Clinic lifecycle status changes.
- Branch CRUD/status.
- Staff list/create/update/deactivate/reactivate.
- Invitation create/accept.
- Settings list/get/upsert/archive.
- Current subscription read.
- Negative examples for cross-tenant access and missing permissions.
- CSRF header usage for unsafe authenticated requests.
- Basic tests for status code, `success`, `message`, expected data fields, and safe error envelope.

Add or update environment variables if needed:

- `baseUrl`
- `csrfToken`
- `clinicId`
- `branchId`
- `userId`
- `invitationToken`
- `subscriptionId`

## Task Matrix

| Task | Priority | Dependencies | Risks | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| Confirm Sprint 3 boundary | P0 | Sprint 2 accepted | Scope creep into Patients/Billing | Sprint excludes Patients, Appointments, Billing, full Subscriptions, Notifications, WebSockets |
| Add tenant schema/migration | P0 | Prisma foundation | Invalid FK order, missing indexes, wrong nullable tenant rules | Prisma validates; migration has tenant-first indexes, FKs, uniqueness constraints |
| Extend RBAC catalog/system roles | P0 | Sprint 2 RBAC | Bad default privileges, privilege escalation | `clinic_owner` and tenant admin permissions are tested |
| Implement clinic onboarding transaction | P0 | Auth, RBAC, Audit, Prisma | Partial tenant creation | Rollback tests prove no partial records |
| Implement clinic lifecycle APIs | P0 | Clinics schema | Suspended/archived semantics drift | Login/write denial tests pass |
| Implement branch APIs | P0 | Clinics schema | Branch scope leakage | Cross-tenant branch tests pass |
| Expand user/staff APIs | P0 | Users, RBAC, Auth | Stale sessions, privilege escalation | Token version and session revocation tests pass |
| Implement invitations | P1 | Users, Auth | Token leakage, replay, external delivery assumption | Hash/single-use/expiry tests pass; provider delivery deferred |
| Implement settings APIs | P1 | Settings schema | Sensitive config exposure | Validation, history, redaction tests pass |
| Add minimal subscription read/create | P1 | Onboarding transaction | Premature billing complexity | Trial record is created; full enforcement remains deferred |
| Add audit/outbox coverage | P0 | Audit/outbox foundation | Missing compliance evidence | Audit and outbox assertions pass |
| Add docs/Postman | P1 | API behavior finalized | Contract drift | Docs and collection match APIs |
| Run verification | P0 | Implementation complete | Broken baseline | Lint, build, and tests pass |

## Issues Found During Review

- Requested root `IMPLEMENTATION_PHASES.md` is missing; actual source is `backend-new/docs/IMPLEMENTATION_PHASES.md`.
- Requested `PRODUCT_ROADMAP.md` is missing; closest approved roadmap source is `ROADMAP_12_MONTHS.md`.
- Current schema has no tenant root tables, so Sprint 3 is a real schema expansion.
- Current RBAC catalog lacks tenant, user-admin, branch, settings, and subscription permissions.
- Current `users` module only supports `/users/me`; staff administration is not implemented.
- Current `user_branch_assignments` exists before `clinic_branches`; Sprint 3 must add branch FK and ownership enforcement.
- No Sprint 3 migration artifact exists.
- No Sprint 3 Postman collection exists.

## Why Sprint 3 Is Important

Sprint 3 is the bridge between security foundation and real product workflows.

Auth and RBAC are not useful for a healthcare SaaS product until the system can create a clinic, assign an owner, define branches, manage staff, apply settings, and enforce tenant lifecycle rules. Patients, appointments, queue, clinical records, and billing all depend on this tenant foundation.

Without Sprint 3, the product has authentication and authorization mechanics but no reliable tenant boundary for actual clinic operations.

## Business Value

Sprint 3 delivers the first operational SaaS value:

- A clinic can be onboarded.
- A clinic owner can administer the tenant.
- Staff can be created or invited.
- Branches can be configured.
- Default settings and trial subscription records exist.
- The business can support controlled paid beta onboarding.

This is the first sprint that turns the platform from an internal backend foundation into something a paying clinic can start using.

## What Can Go Wrong

Highest-risk failure modes:

- Partial tenant creation leaves orphan clinic, user, role, branch, setting, or subscription records.
- Default roles accidentally grant too much or too little authority.
- Clinic users can override `clinicId` and access another tenant.
- Suspended clinics can still log in or perform writes.
- Archived clinics are accidentally mutable.
- Duplicate primary branches cause operational ambiguity.
- Invitation tokens leak, can be replayed, or are stored raw.
- Staff deactivation leaves active sessions or stale permissions.
- Settings expose secrets or are not audited.
- Super Admin tenant override is not explicitly audited.
- Minimal subscription records expand into premature billing complexity.

## Acceptance Criteria

Sprint 3 can be accepted only when:

- All Sprint 3 APIs are implemented with approved layering.
- Tenant-owned records include `clinic_id` and tenant-first indexes.
- All tenant-owned queries filter by trusted tenant context.
- Clinic onboarding is transactional and rollback-safe.
- Suspended and archived clinic behavior is enforced consistently.
- Staff lifecycle changes invalidate sessions where required.
- Invitation tokens are hashed and single-use.
- RBAC permissions cover all protected Sprint 3 APIs.
- Audit and outbox records exist for required workflows.
- Docs and Postman are current.
- `npm run lint`, `npm run build`, and `npm test` pass from `backend-new`.

## Deferred Items

- Patient management.
- Appointment and queue workflows.
- Clinical workflows.
- Billing and payment processing.
- Full subscription plans, limits, metering, renewal, and enforcement.
- Notification worker delivery for invitations.
- WebSocket runtime broadcasting.
- Storage and file uploads.
- Reports and exports.

## Assumptions

- `backend-new` remains canonical.
- Sprint 3 maps to Delivery Master Plan Sprint 3 and Phase 04 Tenants.
- Minimal subscription records are included only because clinic onboarding requires them.
- Full subscription and billing enforcement remains deferred.
- WebSocket event names are reserved only; runtime broadcasting is not implemented in Sprint 3.
- Notification delivery for invitations is represented by outbox event only; provider delivery is deferred.
