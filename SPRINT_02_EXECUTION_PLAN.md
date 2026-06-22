# Sprint 02 Execution Plan

## 1. Sprint Goal

Enable the secure RBAC Foundation after accepted Sprint 1 Auth Core by delivering permission catalog sync, system roles, tenant custom roles, user-role assignment, effective permission resolution, and current-user access introspection through `/users/me`.

Sprint 2 treats `backend-new` as the canonical backend. RBAC/User routes remain gated behind explicit post-Sprint-1 enablement through `ENABLE_POST_SPRINT_1_ROUTES=true` or `createApp({ enablePostSprint1Routes: true })`.

## 2. Deliverables

- Permission catalog and scope model: `OWN`, `ASSIGNED`, `BRANCH`, `CLINIC`, `ALL`.
- System roles: Super Admin, Clinic Admin, Doctor, Receptionist.
- Idempotent permission catalog sync.
- Idempotent system role sync.
- Tenant custom role creation.
- User-role assignment.
- Effective permission resolver integrated with Auth middleware.
- `/users/me` current-user profile and effective access response.
- Gated RBAC/User API route surface.
- RBAC migration artifact.
- RBAC tests, docs, and Postman updates.

Out of scope:

- Tenant onboarding.
- Branch management.
- Full user CRUD.
- Invitations.
- Password reset.
- Logout-all.
- Role update/archive APIs.
- Role permission grant/revoke APIs unless explicitly approved.
- Break-glass/emergency access.

## 3. Database Changes

Use migration artifact:

- `backend-new/prisma/migrations/0002_rbac.sql`

Tables:

- `permissions`
- `roles`
- `role_permissions`
- `user_roles`
- `user_branch_assignments`

Required schema behavior:

- Permission key uniqueness.
- Role `scope_key + code` uniqueness.
- Tenant-first indexes for tenant-owned RBAC tables.
- Foreign keys from role permissions to roles and permissions.
- Foreign keys from user roles to users and roles.
- Soft-delete fields for roles, role permissions, user roles, and branch assignments where applicable.
- Active assignment protections through `revoked_at`, `is_deleted`, and service checks.

No patient, clinic onboarding, appointment, billing, or clinical schema changes are included in Sprint 2.

## 4. APIs

| Method | Path | Purpose | Permission |
| --- | --- | --- | --- |
| GET | `/api/v1/rbac/permissions` | List permission catalog | `rbac.permissions.read` |
| GET | `/api/v1/rbac/roles` | List roles visible to current scope | `rbac.roles.read` |
| POST | `/api/v1/rbac/roles` | Create tenant custom role | `rbac.roles.create` |
| POST | `/api/v1/rbac/user-roles` | Assign role to user | `rbac.user_roles.assign` |
| GET | `/api/v1/users/me` | Read sanitized current user and effective access | `users.me.read` |

API rules:

- All endpoints are protected.
- All endpoints require Auth middleware.
- All endpoints require RBAC permission checks.
- Unsafe requests require CSRF when cookie-authenticated.
- Responses use the standard success/error envelope.
- RBAC/User routes are not mounted by default in Sprint 1 mode.

## 5. Services

RBAC service:

- Sync permission catalog.
- Sync system roles.
- List permissions.
- List roles by platform/clinic scope.
- Create custom roles.
- Assign user roles.
- Resolve effective access for Auth middleware.
- Merge duplicate permissions and keep strongest permission scope.
- Increment target user `token_version` after role assignment.

Users service:

- Resolve current user from authenticated request context.
- Return sanitized profile fields only.
- Return effective roles/permissions from request context.
- Reject tenant mismatch for clinic users.

## 6. Repositories

RBAC repository:

- Owns Prisma access for `permissions`, `roles`, `role_permissions`, `user_roles`, and `users`.
- Does not perform authorization decisions.
- Enforces tenant-aware persistence filters where tenant scope is available.
- Exposes methods for catalog upsert, role upsert, role creation, permission lookup, user lookup, role assignment, token-version increment, and active role lookup.

Users repository:

- Owns Prisma access for current-user profile read.
- Reads active, non-deleted users only.
- Does not return password hashes or token material.

## 7. Validations

Role creation:

- `clinicId`: optional UUID v4.
- `name`: required string, 2-190 characters.
- `code`: optional string matching role code pattern.
- `description`: optional string, max 500 characters.
- `permissions`: optional array, max 100 entries.
- `permissions.*.key`: permission key format.
- `permissions.*.scope`: one of `OWN`, `ASSIGNED`, `BRANCH`, `CLINIC`, `ALL`.

Role assignment:

- `clinicId`: optional UUID v4.
- `userId`: required UUID v4.
- `roleId`: required UUID v4.

General validation rules:

- Validation errors must not echo submitted secrets.
- Business rules stay in services, not validators.
- Unknown permission keys are rejected by service logic.
- Cross-tenant assignments are rejected by service logic.

## 8. Permissions

Sprint 2 permission catalog:

- `rbac.permissions.read`
- `rbac.roles.read`
- `rbac.roles.create`
- `rbac.user_roles.assign`
- `users.me.read`

Scope behavior:

- `ALL` is platform-level and reserved for Super Admin/system roles.
- `CLINIC` grants tenant-wide access.
- `BRANCH`, `ASSIGNED`, and `OWN` are included in the scope model for future modules.
- Strongest scope wins when a user has duplicate permission grants through multiple roles.

## 9. Audit Requirements

Always audit:

- Role creation.
- User role assignment.
- Cross-tenant role assignment attempts where service logic reaches the authorization check.
- Privilege escalation attempts where detected.

Audit payloads must include safe metadata:

- Actor user ID.
- Actor clinic ID.
- Target user ID when applicable.
- Role ID.
- Permission keys and scopes where applicable.
- Request ID.
- Tenant scope.
- Safe before/after data.

Audit payloads must never include:

- Password hashes.
- JWTs.
- Refresh tokens.
- CSRF tokens.
- Provider credentials.

## 10. Tests

Required tests:

- Prisma schema includes RBAC tables and indexes.
- `0002_rbac.sql` includes RBAC tables, indexes, and foreign keys.
- Permission catalog sync is idempotent.
- System role sync is idempotent.
- Role creation persists tenant custom role with permission grants.
- Role creation rejects unknown permission keys.
- Role assignment rejects cross-tenant assignment.
- Role assignment increments target user `token_version`.
- Effective access merges roles and keeps strongest permission scope.
- Protected RBAC API allows authorized user.
- Protected RBAC API rejects missing permission.
- `/users/me` returns sanitized current user and effective access.
- RBAC/User routes are 404 by default when post-Sprint-1 routes are disabled.
- RBAC/User route tests opt in with `enablePostSprint1Routes: true`.
- Validation errors remain structured and safe.

Verification commands:

```powershell
cd backend-new
npm run lint
npm run build
npm test
```

## 11. Documentation

Required documentation updates:

- RBAC implementation notes.
- RBAC API contract.
- Permission catalog and scope model.
- Route-gating behavior.
- Migration plan reference to `0002_rbac.sql`.
- Sprint 2 acceptance report after implementation.

Documentation must state:

- Sprint 2 is RBAC Foundation only.
- Full user administration is deferred.
- Tenant onboarding is deferred.
- Role update/archive and permission grant/revoke APIs are deferred unless explicitly approved.
- `backend-new` is canonical.

## 12. Postman Updates

Required Postman artifacts:

- Add or update a Sprint 2 RBAC collection.
- Include requests for:
  - `GET /api/v1/rbac/permissions`
  - `GET /api/v1/rbac/roles`
  - `POST /api/v1/rbac/roles`
  - `POST /api/v1/rbac/user-roles`
  - `GET /api/v1/users/me`
- Reuse Auth cookie session from Sprint 1.
- Send `x-csrf-token` for unsafe RBAC requests.
- Include tests for status codes, success envelope, response shape, and permission denial where practical.

## Task Matrix

| Task | Priority | Dependencies | Risks | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| Confirm Sprint 2 boundary | P0 | Sprint 1 accepted | Scope creep into tenant onboarding or full user admin | Plan excludes tenants, branches, invitations, password reset, and full staff CRUD |
| Enable gated RBAC/User route surface | P0 | Sprint 1 route gating | Exposing routes before RBAC review | Routes mount only with explicit flag and remain 404 by default |
| Implement/sync permission catalog | P0 | RBAC constants, Prisma | Permission drift and missing grants | Catalog sync is idempotent and tested |
| Implement/sync system roles | P0 | Permission catalog | Bad default privileges | System roles are immutable templates and grant expected permissions |
| Implement list permissions/roles APIs | P0 | Auth middleware, RBAC service | Unauthorized discovery of permissions | Authenticated, permission-guarded APIs return scoped data |
| Implement tenant custom role creation | P0 | Role/permission tables | Privilege escalation or invalid permission keys | Unknown permissions rejected; role creation audited |
| Implement user-role assignment | P0 | Users, roles, RBAC service | Cross-tenant assignment, stale token permissions | Cross-tenant assignment rejected; token version increments |
| Implement effective access resolver | P0 | User roles and role permissions | Wrong strongest-scope calculation | Roles and permissions merge correctly; strongest scope wins |
| Implement `/users/me` | P1 | Auth context, RBAC resolver | Tenant mismatch in profile read | Returns sanitized user and effective access only |
| Add tests | P0 | RBAC APIs/services | Privilege bugs escaping | Service/API, denial, tenant, token-version, validation tests pass |
| Add docs/Postman | P1 | API behavior finalized | Contract drift | RBAC docs and Postman collection match implemented APIs |
| Run verification | P0 | Implementation complete | Broken baseline | `npm run lint`, `npm run build`, `npm test` pass |

## Sprint 2 Blockers

- Sprint 1 Auth must remain accepted and passing.
- `0002_rbac.sql` and Prisma schema must validate.
- Route gating must be explicitly enabled only for Sprint 2 runtime/tests.
- Permission catalog must be approved before broad use.
- No live MySQL integration harness exists by default.
- Tenant onboarding is not available yet, so clinic/owner/default-role workflows remain simulated or deferred.

## Missing Requirements

- Full role update/archive APIs are not Sprint 2.
- Role permission grant/revoke APIs are not Sprint 2 unless explicitly added.
- User CRUD, invitations, branch assignments, tenant onboarding, and default clinic owner provisioning are Sprint 3+.
- Permission cache/invalidation design is minimal: token version invalidation exists, cache is not implemented.
- Break-glass/emergency access is not defined.
- Full privilege-subset enforcement for custom role creation is not finalized.
- Super Admin tenant override workflow is not defined for Sprint 2.

## Open Questions

- Should Clinic Owner be able to manage all clinic RBAC in Sprint 2, or only after tenant onboarding in Sprint 3?
- Should custom role creation prevent grants beyond the actor's own effective permissions in Sprint 2, or defer full privilege-subset enforcement?
- Should Super Admin be able to create platform roles through APIs in Sprint 2, or only through system catalog sync?
- Should `/api/v1/rbac/effective/:userId` be included now, or deferred because current code resolves effective access internally only?
- Should branch-scoped role assignments wait for Branches in Sprint 3, or should the schema stay dormant until then?

## Acceptance Criteria

Sprint 2 is accepted only when:

- Sprint 1 Auth remains accepted.
- RBAC/User routes are explicitly gated.
- All Sprint 2 APIs are protected by Auth and RBAC.
- Permission catalog and system role sync are idempotent.
- Role creation and user-role assignment are transactional and audited.
- Cross-tenant assignment is rejected.
- Role assignment invalidates stale access through token-version increment.
- Effective access resolver returns roles, permissions, and scoped permissions.
- `/users/me` returns sanitized current user and effective access.
- Documentation and Postman artifacts match actual behavior.
- `npm run lint`, `npm run build`, and `npm test` pass from `backend-new`.
