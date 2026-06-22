# PHASE 04 - Tenants

## Objective

Build tenant lifecycle, branch management, staff administration, settings, and minimal subscription records required for clinic onboarding.

## Modules

- Clinics
- Branches
- Users
- Settings
- Minimal clinic subscriptions

## Dependencies

- Phase 01 Foundation.
- Phase 02 Auth.
- Phase 03 RBAC.

## Deliverables

- Transactional clinic onboarding.
- Owner user creation.
- Default branch.
- Default settings.
- Default roles and assignments.
- Minimal trial subscription record.
- Branch CRUD/status.
- User invitation and activation.
- Clinic suspend/archive/restore.
- Tenant context enforcement.
- Super Admin tenant override audit.

## Tests

- Onboarding full rollback.
- Duplicate clinic code blocked.
- Default branch uniqueness.
- Suspended clinic login/API denial.
- Archived clinic read-only behavior.
- Cross-tenant user/branch access blocked.
- Tenant override requires Super Admin.

## Exit Criteria

- New clinics can be created transactionally without partial tenant state.
- Tenant context exists for all protected modules.

## Risks

- Nullable platform records need strict allowlists.
- Tenant suspension semantics must be consistent across APIs, workers, and sockets.

