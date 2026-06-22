# RBAC API

## Scope

This document covers Sprint 2 RBAC Foundation in `backend-new`.

Implemented:

- Permission catalog.
- Role listing.
- Custom role creation.
- User role assignment.
- User role revocation.
- Current user profile and effective access.

Out of scope:

- Role update/delete.
- Permission cache.
- Tenant onboarding.
- Branch entity management.

## Permission Format

Permissions use dot notation:

```text
module.action
```

Examples:

- `rbac.permissions.read`
- `rbac.roles.create`
- `rbac.user_roles.assign`
- `rbac.user_roles.revoke`
- `users.me.read`

## Scopes

Supported scopes:

- `OWN`
- `ASSIGNED`
- `BRANCH`
- `CLINIC`
- `ALL`

The strongest scope wins when the same permission is granted by multiple roles.

## Shared Rules

- All endpoints require an authenticated `access_token` HTTP-only cookie.
- Unsafe requests require `x-csrf-token` matching the `csrf_token` cookie.
- Validation errors use the standard error envelope and do not echo secrets.
- Platform context bypasses route-level permission checks, but service-level tenant and privilege rules still apply.
- Permission scopes are exposed through `scopedPermissions`; future routes can require a minimum scope such as `CLINIC`.
- Custom platform roles cannot be created through the Sprint 2 API. Platform/system roles come only from catalog/system-role sync.
- Platform tenant-scoped role operations require an explicit tenant target where the target cannot be derived safely.
- RBAC list endpoints are read-only. Permission catalog and system roles must be synchronized before runtime use through the explicit bootstrap/sync path.

## GET /api/v1/rbac/permissions

Required permission:

```text
rbac.permissions.read
```

Success:

```json
{
  "success": true,
  "message": "Permissions",
  "data": {
    "permissions": [
      {
        "id": "uuid",
        "key": "rbac.roles.create",
        "moduleName": "rbac",
        "action": "roles.create",
        "description": "Create custom roles",
        "isSystem": true
      }
    ]
  },
  "meta": {}
}
```

## GET /api/v1/rbac/roles

Required permission:

```text
rbac.roles.read
```

Success:

```json
{
  "success": true,
  "message": "Roles",
  "data": {
    "roles": [
      {
        "id": "uuid",
        "clinicId": null,
        "code": "clinic_admin",
        "name": "Clinic Admin",
        "isSystem": true,
        "isPlatform": false,
        "permissions": [
          {
            "key": "users.me.read",
            "scope": "CLINIC"
          }
        ]
      }
    ]
  },
  "meta": {}
}
```

## POST /api/v1/rbac/roles

Required permission:

```text
rbac.roles.create
```

Request:

```json
{
  "name": "Billing Manager",
  "code": "billing_manager",
  "description": "Can manage billing workflows",
  "permissions": [
    {
      "key": "users.me.read",
      "scope": "CLINIC"
    }
  ]
}
```

Platform users may include `clinicId` to create a tenant role for a clinic. Clinic users can only create roles in their own clinic context.

Privilege rules:

- The actor cannot grant a permission they do not hold.
- The actor cannot grant a scope stronger than their own effective scope.
- Clinic actors cannot grant `ALL`.
- Reserved platform/system permissions cannot be granted by tenant users.
- Platform custom role creation without `clinicId` is rejected in Sprint 2.

## POST /api/v1/rbac/user-roles

Required permission:

```text
rbac.user_roles.assign
```

Request:

```json
{
  "userId": "11111111-1111-4111-8111-111111111111",
  "roleId": "33333333-3333-4333-8333-333333333333",
  "clinicId": "22222222-2222-4222-8222-222222222222"
}
```

Behavior:

- Rejects cross-tenant assignment.
- Rejects assigning a role with permissions or scopes stronger than the actor's effective access.
- Rejects platform-role assignment through the Sprint 2 API.
- Is idempotent when the active assignment already exists.
- Uses a database-backed active assignment key so concurrent duplicate assignment resolves to one active assignment.
- Increments target user `token_version` so existing access tokens are invalidated.
- Audits assignment.

## DELETE /api/v1/rbac/user-roles/:id

Required permission:

```text
rbac.user_roles.revoke
```

Behavior:

- Revokes an active role assignment.
- Rejects cross-tenant revocation.
- Platform actors must provide `clinicId` as a query parameter for tenant assignment revocation.
- Rejects revoking a role stronger than the actor's effective access.
- Increments target user `token_version` so existing access tokens are invalidated.
- Audits successful revocation and denied revoke attempts.

Success:

```json
{
  "success": true,
  "message": "Role revoked",
  "data": {
    "assignment": {
      "id": "44444444-4444-4444-8444-444444444444",
      "revoked": true
    }
  },
  "meta": {}
}
```

## GET /api/v1/users/me

Required permission:

```text
users.me.read
```

Success:

```json
{
  "success": true,
  "message": "Current user",
  "data": {
    "user": {
      "id": "11111111-1111-4111-8111-111111111111",
      "clinicId": "22222222-2222-4222-8222-222222222222",
      "fullName": "Doctor User",
      "email": "doctor@example.com",
      "userType": "CLINIC_USER",
      "status": "ACTIVE"
    },
    "access": {
      "roles": ["doctor"],
      "permissions": ["users.me.read"],
      "scopedPermissions": {
        "users.me.read": "CLINIC"
      },
      "isPlatform": false
    }
  },
  "meta": {}
}
```
