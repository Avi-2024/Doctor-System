# PHASE 03 - RBAC

## Objective

Build role, permission, scope, and authorization infrastructure before business APIs.

## Sprint 2 Status

Sprint 2 RBAC Foundation is implemented.

Completed:

- Permission catalog.
- RBAC scopes: `OWN`, `ASSIGNED`, `BRANCH`, `CLINIC`, `ALL`.
- Scope precedence where the strongest scope wins.
- System role templates: `super_admin`, `clinic_admin`, `doctor`, `receptionist`.
- Role-permission links.
- User-role assignments.
- User-role revocation.
- Effective permission resolver.
- Scoped permission propagation through authenticated request context.
- Protected endpoint permission guards with denial audit events.
- User token-version increment on role assignment and revocation.
- Concurrency-safe active user-role assignment key.
- Read-only RBAC list endpoints after explicit catalog/system-role bootstrap.
- RBAC audit events for role creation, role assignment, role revocation, authorization denial, tenant violation, and privilege-escalation denial.
- Initial Users dependency endpoint: `GET /api/v1/users/me`.
- Migration artifact: `prisma/migrations/0002_rbac.sql`.
- Postman collection: `postman/Doctor-System-Phase-3-RBAC.postman_collection.json`.

## APIs

- `GET /api/v1/rbac/permissions`
- `GET /api/v1/rbac/roles`
- `POST /api/v1/rbac/roles`
- `POST /api/v1/rbac/user-roles`
- `DELETE /api/v1/rbac/user-roles/:id`
- `GET /api/v1/users/me`

## Authorization Rules

Protected RBAC routes require:

1. Authenticated access-token cookie.
2. Trusted request context from Auth middleware.
3. Required permission in `req.context.permissions`, unless the user is platform context.
4. Required minimum scope from `req.context.scopedPermissions` where a route declares one.

Current route permissions:

| Route | Permission |
| --- | --- |
| `GET /api/v1/rbac/permissions` | `rbac.permissions.read` |
| `GET /api/v1/rbac/roles` | `rbac.roles.read` |
| `POST /api/v1/rbac/roles` | `rbac.roles.create` |
| `POST /api/v1/rbac/user-roles` | `rbac.user_roles.assign` |
| `DELETE /api/v1/rbac/user-roles/:id` | `rbac.user_roles.revoke` |
| `GET /api/v1/users/me` | `users.me.read` |

Unsafe RBAC requests require the Sprint 1 double-submit CSRF token: `x-csrf-token` must match the `csrf_token` cookie.

## Privilege Rules

- Custom role grants must be a subset of the actor's effective permissions.
- Actors cannot grant permissions they do not hold.
- Actors cannot grant a scope stronger than their own effective scope.
- Clinic users cannot grant `ALL`.
- Reserved platform/system permissions are platform-only.
- Role assignment rejects roles stronger than the actor's effective access.
- Custom platform role creation through API is not supported in Sprint 2. Platform/system roles are managed only by catalog and system-role sync.
- Platform users can create tenant roles only with an explicit `clinicId`.
- Platform users must include an explicit `clinicId` query value when revoking tenant role assignments by ID.
- RBAC list endpoints are read-only. Permission catalog and system roles must be synchronized through the explicit bootstrap/sync path before runtime route use.

## Scope Rules

Scope strength:

1. `OWN`
2. `ASSIGNED`
3. `BRANCH`
4. `CLINIC`
5. `ALL`

When a user receives the same permission from multiple roles, the strongest scope wins.

## Database Tables

- `permissions`
- `roles`
- `role_permissions`
- `user_roles`
- `user_branch_assignments`

Tenant-owned RBAC tables include tenant-first indexes and standard soft-delete metadata.

`user_roles.active_assignment_key` is unique while an assignment is active and is cleared on revocation. This provides MySQL-compatible active assignment idempotency.

## Remaining For Later Phases

- Full tenant administration.
- Branch model FK enforcement after branches table exists.
- Permission cache and invalidation layer.
- Route-permission coverage automation.
- Role update/delete endpoints.
- Service-level ownership checks for business resources.

## Tests

Sprint 2 adds targeted coverage for:

- RBAC schema and migration artifact.
- Permission catalog sync through explicit bootstrap path.
- Read-only RBAC list service behavior.
- Role creation with permission grants.
- Unknown permission rejection.
- Custom role privilege-subset denial.
- Platform custom-role creation denial.
- Cross-tenant role assignment denial.
- Role assignment privilege-subset denial.
- User-role revocation.
- Active assignment idempotency.
- Cross-tenant revoke denial.
- Route authorization denial audit.
- Strongest-scope permission resolution.
- Token-version increment on role assignment and revocation.
- Protected RBAC route denial.
- Current user endpoint effective access response.

## Exit Criteria

- Protected APIs can declare exact permissions.
- Authenticated request context can carry effective roles, permissions, and scoped permissions.
- User role assignment and revocation invalidate existing access tokens through token-version increment.
- Custom roles and role assignments cannot exceed actor authority.
- Duplicate active role assignment attempts return deterministic idempotent success.
- RBAC denials are audited without secrets.

## Risks

- Full route-permission coverage must be automated before many business APIs exist.
- Branch-scoped checks remain conceptual until Branches are implemented.
- MySQL-backed RBAC integration tests remain deferred production hardening items.
