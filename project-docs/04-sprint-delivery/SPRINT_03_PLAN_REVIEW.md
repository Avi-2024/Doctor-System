# Sprint 3 Plan Review

## Review Verdict

**Verdict:** Request changes before Sprint 3 implementation.

The Sprint 3 execution plan is directionally correct and aligns with the next delivery milestone: Tenants, Users, Branches, Settings, and Minimal Subscription Foundation. It should not be implemented as-is. The plan has High gaps around tenant lifecycle enforcement, Super Admin tenant targeting, branch assignment, onboarding idempotency, invitation lifecycle, scoped settings, route permissions, and MySQL integration/concurrency gates.

## Source Files Reviewed

- `project-docs/04-sprint-delivery/SPRINT_03_EXECUTION_PLAN.md`
- `project-docs/04-sprint-delivery/SPRINT_02_ACCEPTANCE_REPORT.md`
- `backend-new/docs/API_ROADMAP.md`
- `backend-new/docs/DATABASE_DESIGN.md`
- `backend-new/docs/RBAC_MATRIX.md`
- `backend-new/docs/TENANT_ISOLATION_ARCHITECTURE.md`
- `backend-new/docs/PHASE_04_TENANTS.md`
- `backend-new/prisma/schema.prisma`

Notes:

- `SPRINT_03_EXECUTION_PLAN.md` now lives under `project-docs/04-sprint-delivery`.
- Root `PRODUCT_ROADMAP.md` is missing. `ROADMAP_12_MONTHS.md` is the closest current roadmap source.
- Root `IMPLEMENTATION_PHASES.md` is missing. The implementation phases source is `backend-new/docs/IMPLEMENTATION_PHASES.md`.

## Critical Findings

No Critical findings.

Rationale: This is a plan review, not live code. The plan does not directly introduce a production vulnerability yet. However, several High findings must be resolved before implementation starts because Sprint 3 creates the tenant root and operational boundaries for all future PHI workflows.

## High Findings

### H1. Super Admin Tenant Override Contract Is Undefined

**Area:** Missing tenant protections.

**Affected plan areas:**

- APIs
- Services
- Audit Requirements
- Tests

**Issue:** The plan says Super Admin tenant targeting must be validated and audited, but it does not define the mechanism. Without one explicit contract, implementation can drift between headers, query parameters, body fields, and service-level overrides.

**Risk:** Super Admin support/recovery operations could bypass tenant boundaries inconsistently or become impossible to audit reliably.

**Required fix:** Define one explicit tenant override contract before implementation:

- Use a single approved mechanism, such as `x-clinic-id` header or `clinicId` query.
- Require Super Admin context.
- Require `tenant.recovery` for recovery/lifecycle override routes.
- Validate the target clinic exists.
- Validate target clinic status, except for approved lifecycle/recovery actions.
- Require a support/recovery reason for sensitive tenant override operations.
- Audit both allow and deny outcomes.

**Acceptance criteria:**

- Non-platform users cannot supply override tenant context.
- Super Admin override succeeds only through the approved contract.
- Override denials are audited.
- Tests cover missing, invalid, inactive, suspended, archived, and cross-tenant override attempts.

### H2. Clinic Lifecycle Enforcement Is Not Centralized

**Area:** Missing tenant protections, missing tests.

**Affected plan areas:**

- Auth integration
- Tenant context
- Services
- Tests

**Issue:** The plan requires suspended/archived behavior but does not specify where enforcement lives. Lifecycle enforcement cannot be hand-rolled independently in every service.

**Risk:** Suspended clinics may still log in or perform writes; archived clinics may remain mutable; future modules may implement inconsistent lifecycle behavior.

**Required fix:** Add a central lifecycle guard contract:

- Auth/session resolution blocks login for suspended/archived clinics unless explicitly allowed.
- Protected write APIs block suspended clinics.
- Archived clinics are read-only except approved recovery routes.
- Services use one shared lifecycle helper before tenant-owned mutations.
- Platform lifecycle actions have explicit bypass rules and audit.

**Acceptance criteria:**

- Suspended clinic login is blocked.
- Suspended clinic writes are blocked.
- Archived clinic writes are blocked.
- Approved recovery/lifecycle routes still work for authorized Super Admin.
- Tests prove enforcement is centralized and reused.

### H3. Branch Assignment APIs Are Missing

**Area:** Missing APIs, missing permissions, missing tenant protections.

**Affected plan areas:**

- APIs
- Permissions
- Services
- Tests

**Issue:** Sprint 3 introduces branches and references branch assignments, but no branch-assignment API is defined. Branch isolation cannot work if users cannot be assigned to branches through a controlled workflow.

**Risk:** Branch-scoped permissions and future branch workflows will be weak or impossible to enforce. Implementers may add ad hoc assignment writes through users or branches.

**Required APIs:**

- `GET /api/v1/users/:id/branches`
- `POST /api/v1/users/:id/branches`
- `DELETE /api/v1/users/:id/branches/:assignmentId`
- `POST /api/v1/users/:id/branches/:assignmentId/primary`

**Required permissions:**

- `users.branch_assign` or `branches.assign_users`

**Acceptance criteria:**

- User and branch must belong to the same clinic.
- Cross-tenant branch assignment is rejected and audited.
- Only one active primary branch assignment is allowed per user.
- Branch assignment changes invalidate affected access/session state where required.

### H4. Onboarding Idempotency And Concurrency Are Underspecified

**Area:** Missing validations, missing indexes, missing tests.

**Affected plan areas:**

- Database Changes
- Services
- Validations
- Tests

**Issue:** The plan requires transaction rollback but does not require idempotency or concurrency behavior for repeated onboarding requests. Transaction rollback alone does not protect against retry storms, double-clicks, network retries, or concurrent Super Admin actions.

**Risk:** Duplicate clinics, duplicate owners, duplicate primary branches, or duplicate trial subscriptions can be created under concurrent requests.

**Required fix:**

- Require idempotency key for clinic onboarding.
- Add deterministic active keys for primary branch, trial subscription, and active onboarding request.
- Require unique active owner email handling within tenant creation flow.
- Add concurrency tests for duplicate onboarding attempts.

**Acceptance criteria:**

- Retried onboarding with the same idempotency key returns the original result or a deterministic conflict response.
- Concurrent onboarding with the same clinic code creates at most one clinic.
- Concurrent default primary branch creation creates at most one active primary branch.
- Concurrent trial subscription creation creates at most one active/trial subscription.

### H5. Invitation Lifecycle Is Incomplete

**Area:** Missing APIs, missing audit logs, missing tests.

**Affected plan areas:**

- APIs
- Services
- Audit Requirements
- Tests
- Postman

**Issue:** The plan includes create and accept invitation flows only. Operational staff onboarding also needs list, revoke, and resend paths.

**Risk:** Clinics cannot manage stale or incorrect invitations. Bad invitations may remain usable until expiry. Support burden increases because there is no controlled recovery workflow.

**Required APIs:**

- `GET /api/v1/users/invitations`
- `POST /api/v1/users/invitations/:id/revoke`
- `POST /api/v1/users/invitations/:id/resend`

**Required audit events:**

- Invitation created.
- Invitation accepted.
- Invitation revoked.
- Invitation resent.
- Invitation expired/replay denied.

**Acceptance criteria:**

- Raw invitation tokens are never stored.
- Revoked, accepted, expired, or reused tokens cannot activate a user.
- Resend creates a new token hash and invalidates the old active token.
- All invitation state transitions are audited.

### H6. Settings Scope And Sensitive Settings Rules Are Too Vague

**Area:** Missing validations, missing tenant protections, missing audit logs.

**Affected plan areas:**

- Database Changes
- Validations
- Services
- Audit Requirements

**Issue:** The plan allows platform, clinic, branch, and user-scoped settings, but it does not define consistency rules for those scopes or sensitive settings.

**Risk:** A branch/user setting could point outside the current clinic. Sensitive settings could be logged, returned, or audited unsafely.

**Required fix:**

- Define allowed setting keys and schemas.
- Validate scope-to-owner consistency:
  - Platform scope requires `clinic_id`, `branch_id`, and `user_id` to be null.
  - Clinic scope requires `clinic_id`.
  - Branch scope requires `clinic_id` and `branch_id`, and branch must belong to clinic.
  - User scope requires `clinic_id` and `user_id`, and user must belong to clinic.
- Define sensitive setting allowlist.
- Encrypt or reference sensitive values.
- Redact sensitive values in logs, audit payloads, and API responses.
- Audit sensitive reads and writes.

**Acceptance criteria:**

- Cross-tenant branch/user settings are rejected.
- Sensitive values are not returned by default.
- Sensitive writes are audited with redacted payloads.
- Unknown setting keys are rejected unless explicitly allowed.

### H7. Route Permission Matrix Is Not Concrete Enough

**Area:** Missing permissions.

**Affected plan areas:**

- APIs
- Permissions
- Tests

**Issue:** Several APIs reuse broad permissions where dedicated permissions are safer. The plan also uses "status-specific permission" without mapping every status action to a permission.

**Risk:** Implementers may use overly broad permissions such as `users.update` or `branches.manage` for sensitive operations, creating avoidable privilege escalation.

**Required permission additions:**

- `clinics.activate`
- `branches.activate`
- `branches.set_primary`
- `users.reactivate`
- `users.branch_assign`
- `users.invite.revoke`
- `settings.read_sensitive`
- `settings.update_sensitive`

**Acceptance criteria:**

- Every Sprint 3 route has one explicit required permission.
- Every status transition has a dedicated permission or a documented mapping.
- Permission tests cover allow and deny for every route.

### H8. MySQL Integration And Concurrency Gates Are Missing

**Area:** Missing tests.

**Affected plan areas:**

- Tests
- Acceptance Criteria
- Database Changes

**Issue:** Sprint 3 creates the tenant root and multiple uniqueness/FK constraints. Unit and fake repository tests are not enough to prove MySQL behavior.

**Risk:** Prisma schema may validate while MySQL uniqueness, FK, nullable-key, and concurrency behavior still fails under real migrations.

**Required tests:**

- MySQL onboarding rollback test.
- Active primary branch uniqueness test.
- Active invitation uniqueness test.
- Active subscription uniqueness test.
- FK behavior for clinic/user/branch/setting/subscription relationships.
- Concurrent onboarding duplicate clinic code test.

**Acceptance criteria:**

- Sprint 3 cannot be accepted without a MySQL-backed integration test path or explicit CTO acceptance of that risk.
- Migration artifact is validated against production-compatible MySQL.

## Medium Findings

### M1. Missing `GET /api/v1/clinics/current`

**Area:** Missing APIs.

Clinic users need a safe current-tenant read path that derives clinic from authenticated context instead of requiring client-supplied tenant IDs.

**Recommended fix:** Add `GET /api/v1/clinics/current` with `clinics.read` scoped to the actor's current tenant.

### M2. Subscription Plan Bootstrap Is Ambiguous

**Area:** Missing validations, database impact.

Onboarding creates trial subscriptions but does not define how the default trial plan exists.

**Recommended fix:** Choose one:

- Seed a default platform trial plan as part of migration/bootstrap.
- Add minimal platform-only subscription plan APIs in Sprint 3.

Do not implement full metering, billing, renewal, or usage enforcement in Sprint 3.

### M3. Required Indexes Are Incomplete

**Area:** Missing indexes.

Add or explicitly review these indexes:

- `clinic_branches`: `(clinic_id, updated_at)`, `(clinic_id, name)`.
- `settings`: `(clinic_id, updated_at)`, `(clinic_id, branch_id, scope, is_deleted)`, `(clinic_id, user_id, scope, is_deleted)`.
- `user_invitations`: `(clinic_id, status, expires_at)`, `(invited_by)`, `(user_id)`.
- `clinic_subscriptions`: `(clinic_id, is_deleted)`, `(clinic_id, updated_at)`, `(clinic_id, status, ends_at)`.
- `setting_history`: `(clinic_id, changed_by, created_at)`.

### M4. Status Transition Validation Needs More Detail

**Area:** Missing validations.

The plan lists status enums but does not define transition matrices or reason requirements.

**Recommended fix:** Require transition matrix and reason fields for clinic, branch, user, invitation, and subscription status changes.

### M5. Postman Requirements Need Role And CSRF Setup Detail

**Area:** Missing tests/Postman quality.

The plan says include CSRF but does not specify collection bootstrap.

**Recommended fix:** Postman collection should include:

- Super Admin login.
- CSRF capture.
- Clinic onboarding.
- Clinic Owner login or session setup.
- Negative missing-permission examples.
- Environment variables for `clinicId`, `branchId`, `userId`, `invitationId`, and `csrfToken`.

## Low Findings

### L1. Review File Path Should Follow New Docs Organization

**Area:** Documentation organization.

Review files should live under `project-docs/04-sprint-delivery`, not repo root.

### L2. Plan Should Reference Missing Product Roadmap Source

**Area:** Documentation accuracy.

The root `PRODUCT_ROADMAP.md` is missing. The plan correctly uses `ROADMAP_12_MONTHS.md` as the closest roadmap source, but this should be retained as an explicit note.

### L3. Outbox Event Payload Shape Is Not Defined

**Area:** Missing audit/event detail.

The plan lists outbox events but does not define minimum payload shape.

**Recommended fix:** Require:

- `eventId`
- `tenantId`
- `eventName`
- `eventVersion`
- `aggregateType`
- `aggregateId`
- `correlationId`
- `causationId`
- safe payload only

## Missing APIs

Required before Sprint 3 implementation:

- `GET /api/v1/users/:id/branches`
- `POST /api/v1/users/:id/branches`
- `DELETE /api/v1/users/:id/branches/:assignmentId`
- `POST /api/v1/users/:id/branches/:assignmentId/primary`
- `GET /api/v1/users/invitations`
- `POST /api/v1/users/invitations/:id/revoke`
- `POST /api/v1/users/invitations/:id/resend`

Recommended:

- `GET /api/v1/clinics/current`

Potentially required depending on bootstrap decision:

- Minimal platform-only subscription plan bootstrap APIs, or a documented seed/bootstrap path.

## Missing Validations

- Super Admin tenant override source and reason validation.
- Clinic lifecycle status transition matrix.
- Branch status transition matrix.
- User status transition matrix.
- Invitation status transition matrix.
- Subscription status transition matrix.
- Onboarding idempotency key validation.
- Settings key schema validation.
- Settings scope ownership validation.
- Sensitive settings key allowlist and response redaction.
- Branch assignment active/primary uniqueness validation.

## Missing Permissions

Add these permissions or explicitly reject them with rationale:

- `clinics.activate`
- `branches.activate`
- `branches.set_primary`
- `users.reactivate`
- `users.branch_assign`
- `users.invite.revoke`
- `settings.read_sensitive`
- `settings.update_sensitive`

Every Sprint 3 route should have an explicit route-to-permission mapping.

## Missing Indexes

Add or explicitly review:

- `clinic_branches`: `(clinic_id, updated_at)`, `(clinic_id, name)`.
- `settings`: `(clinic_id, updated_at)`, `(clinic_id, branch_id, scope, is_deleted)`, `(clinic_id, user_id, scope, is_deleted)`.
- `user_invitations`: `(clinic_id, status, expires_at)`, `(invited_by)`, `(user_id)`.
- `clinic_subscriptions`: `(clinic_id, is_deleted)`, `(clinic_id, updated_at)`, `(clinic_id, status, ends_at)`.
- `setting_history`: `(clinic_id, changed_by, created_at)`.

## Missing Audit Logs

Add explicit audit requirements for:

- Tenant override allow and deny.
- Branch assignment create/revoke/set primary.
- Invitation list access where sensitive.
- Invitation revoke/resend.
- Expired invitation attempt.
- Invitation replay attempt.
- Sensitive setting read.
- Sensitive setting write.
- Onboarding idempotency replay/conflict.
- Status transition deny events.

## Missing Tests

Add tests for:

- Super Admin tenant override success/deny.
- Suspended clinic login block.
- Suspended clinic write block.
- Archived clinic read-only behavior.
- Branch assignment same-tenant enforcement.
- Branch assignment primary uniqueness.
- Onboarding idempotency replay.
- Concurrent duplicate onboarding.
- Concurrent active primary branch creation.
- Concurrent active invitation creation.
- Concurrent active subscription creation.
- Invitation revoke/resend/replay/expiry.
- Sensitive settings redaction.
- Settings branch/user ownership mismatch.
- Route-permission coverage for every Sprint 3 route.
- MySQL-backed FK and uniqueness behavior.

## Missing Tenant Protections

- Single approved Super Admin tenant override mechanism.
- Central lifecycle guard for suspended and archived clinic behavior.
- Branch assignment ownership checks.
- Settings scope ownership checks.
- Explicit platform-only handling for subscription plans and platform settings.
- Tenant-aware idempotency keys for onboarding and invitations.
- Denial audits for cross-tenant attempts.

## Recommendation

Do not implement Sprint 3 as currently written.

Before coding starts:

1. Resolve all High findings in the Sprint 3 execution plan.
2. Add the missing APIs and route-permission matrix.
3. Define lifecycle guard and tenant override contracts.
4. Add MySQL integration/concurrency tests as an acceptance gate or get explicit CTO risk acceptance.
5. Update Sprint 3 Postman requirements with auth/CSRF/bootstrap sequencing.

Medium findings can be tracked as Sprint 3 technical debt only if the CTO explicitly accepts them and they do not weaken tenant isolation, security, or onboarding correctness.
