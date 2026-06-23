# Tenants API

## Scope

This document describes Sprint 3 tenant administration APIs in `backend-new`.

All protected APIs use:

`Auth -> Tenant Context -> RBAC -> CSRF for unsafe methods -> Validator -> Controller -> Service -> Repository -> Prisma`

All unsafe protected requests must include `x-csrf-token` matching the `csrf_token` cookie.

Platform tenant targeting uses:

- `x-clinic-id`: explicit target clinic.
- `x-support-reason`: required for sensitive lifecycle/recovery operations.

Every `x-clinic-id` override allow or deny decision is audited with actor, requested clinic, operation, request context, and support reason where present.

## Clinics

### `GET /api/v1/clinics`

Permission: `clinics.read`

Returns platform clinic list or current tenant list for clinic users.

Query:

- `page`
- `limit`
- `search`
- `status`

### `POST /api/v1/clinics`

Permission: `clinics.create`

Requires `Idempotency-Key` header.

Creates:

- clinic
- owner user
- primary branch
- default settings
- trial subscription
- `clinic_owner` role assignment
- audit and outbox records

Body:

```json
{
  "code": "clinic_a",
  "name": "Clinic A",
  "timezone": "Asia/Calcutta",
  "owner": {
    "fullName": "Clinic Owner",
    "email": "owner@example.com",
    "password": "StrongPassword123"
  },
  "branch": {
    "branchCode": "main",
    "name": "Main Branch"
  }
}
```

### `GET /api/v1/clinics/current`

Permission: `clinics.read`

Returns the authenticated tenant.

### `GET /api/v1/clinics/:id`

Permission: `clinics.read`

Clinic users can only read their own clinic.

### `PATCH /api/v1/clinics/:id`

Permission: `clinics.update`

Updates clinic metadata. Suspended or archived clinics are not writable.

### `PATCH /api/v1/clinics/:id/status`

Permission:

- `clinics.activate`
- `clinics.suspend`
- `clinics.archive`
- `clinics.restore`
- `tenant.recovery` for archived restore

Requires platform context and `x-support-reason`.

## Branches

All branch APIs are tenant-scoped. Platform users must send `x-clinic-id`.

### `GET /api/v1/branches`

Permission: `branches.read`

### `POST /api/v1/branches`

Permission: `branches.create`

If `isPrimary=true`, `branches.set_primary` is also required.

### `GET /api/v1/branches/:id`

Permission: `branches.read`

### `PATCH /api/v1/branches/:id`

Permission: `branches.update`

If setting primary branch, `branches.set_primary` is also required.

### `PATCH /api/v1/branches/:id/status`

Permission:

- `branches.activate`
- `branches.deactivate`

## Users And Invitations

All protected user APIs are tenant-scoped. Platform users must send `x-clinic-id`.

### `GET /api/v1/users/me`

Permission: `users.me.read`

### `GET /api/v1/users`

Permission: `users.read`

### `POST /api/v1/users`

Permission: `users.create`

Creates an active clinic staff user.

### `GET /api/v1/users/:id`

Permission: `users.read`

### `PATCH /api/v1/users/:id`

Permission: `users.update`

### `POST /api/v1/users/invite`

Permission: `users.invite`

Creates a pending user and invitation. The raw invitation token is returned once and only the hash is stored.

### `GET /api/v1/users/invitations`

Permission: `users.invite`

### `POST /api/v1/users/invitations/:id/revoke`

Permission: `users.invite.revoke`

### `POST /api/v1/users/invitations/:id/resend`

Permission: `users.invite`

Rotates the invitation token and returns the new raw token once.

### `POST /api/v1/users/invitations/accept`

Public endpoint. CSRF is not required. The endpoint enforces the same allowed Origin/Referer policy used by Auth login and has a dedicated route-level rate limit.

Body:

```json
{
  "token": "raw-invitation-token",
  "password": "StrongPassword123"
}
```

Accepts a single-use invitation, activates the user, and starts an HTTP-only cookie session. Invitation acceptance fails if the target clinic is suspended, archived, deleted, or missing. Session issuance reloads the user through Auth with verified clinic lifecycle data.

### `POST /api/v1/users/:id/deactivate`

Permission: `users.deactivate`

Requires body:

```json
{
  "reason": "Staff left the clinic"
}
```

Increments `token_version` and revokes active refresh sessions. Self-deactivation, clinic-owner deactivation without ownership transfer, and last-admin deactivation are blocked.

### `POST /api/v1/users/:id/reactivate`

Permission: `users.reactivate`

Requires body:

```json
{
  "reason": "Staff returned"
}
```

## User Branch Assignments

### `GET /api/v1/users/:id/branches`

Permission: `users.branch_assign`

### `POST /api/v1/users/:id/branches`

Permission: `users.branch_assign`

Body:

```json
{
  "branchId": "uuid",
  "isPrimary": true
}
```

### `DELETE /api/v1/users/:id/branches/:assignmentId`

Permission: `users.branch_assign`

The assignment must belong to the route `:id` user and the resolved tenant.

### `POST /api/v1/users/:id/branches/:assignmentId/primary`

Permission: `users.branch_assign`

The assignment must belong to the route `:id` user and the resolved tenant.

## Settings

All settings APIs are scoped by `PLATFORM`, `CLINIC`, `BRANCH`, or `USER`.

Allowed setting keys:

- `clinic.timezone`
- `clinic.locale`
- `clinic.branding`
- `notifications.whatsapp`
- `security.session`
- `billing.defaults`

Sensitive keys:

- `notifications.whatsapp`
- `security.session`

Sensitive reads require `settings.read_sensitive`.
Sensitive writes require `settings.update_sensitive`.
Sensitive writes are encrypted before persistence with AES-256-GCM and require `SETTINGS_ENCRYPTION_KEY` to contain a base64-encoded 32-byte key. Missing or invalid encryption configuration fails closed. Audit and history payloads redact or summarize sensitive values rather than storing raw secrets.

### `GET /api/v1/settings`

Permission: `settings.read`

### `GET /api/v1/settings/:key`

Permission: `settings.read`

### `PUT /api/v1/settings/:key`

Permission: `settings.update`

### `DELETE /api/v1/settings/:key`

Permission: `settings.update`

## Subscriptions

### `GET /api/v1/subscriptions/current`

Permission: `subscriptions.read`

Returns the current trial or active subscription for the tenant.

Full billing, plan enforcement, usage metering, renewals, invoices, and payments are deferred.

## Error Behavior

Responses use the standard envelope:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

Validation errors do not echo submitted passwords, tokens, or sensitive setting values.

## Deferred

- Live execution of MySQL-backed FK/concurrency integration tests. The gated harness exists and runs only when `RUN_MYSQL_INTEGRATION_TESTS=true`.
- Invitation delivery worker.
- Full subscription/billing enforcement.
- WebSocket broadcasts.
