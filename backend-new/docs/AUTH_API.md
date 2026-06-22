# Auth API

## Scope

This document covers Sprint 1 Auth Core in `backend-new`:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Out of scope for Sprint 1: password reset, invitations, logout-all, frontend changes, and full RBAC route rollout.

## Response Envelope

Success responses use:

```json
{
  "success": true,
  "message": "Message",
  "data": {},
  "meta": {}
}
```

Error responses use the centralized error envelope and never include submitted passwords or token values.

## Cookie And CSRF Policy

`access_token`:

- Path: `/`
- `HttpOnly`
- `SameSite=Strict`
- `Secure=AUTH_COOKIE_SECURE`
- Max age: `ACCESS_TOKEN_TTL_SECONDS`

`refresh_token`:

- Path: `/api/v1/auth`
- `HttpOnly`
- `SameSite=Strict`
- `Secure=AUTH_COOKIE_SECURE`
- Max age: `REFRESH_TOKEN_TTL_SECONDS`

`csrf_token`:

- Path: `/`
- JavaScript-readable by design for double-submit CSRF.
- `SameSite=Strict`
- `Secure=AUTH_COOKIE_SECURE`
- Rotated on login and refresh.

Clients must not store access or refresh tokens in `localStorage` or JavaScript-readable storage.

Unsafe cookie-authenticated requests must include:

```http
x-csrf-token: <csrf_token cookie value>
```

Sprint 1 applies CSRF protection to:

- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- Later mounted unsafe RBAC/User routes when `ENABLE_POST_SPRINT_1_ROUTES=true`

`GET /api/v1/auth/me` does not require CSRF. Login is public but enforces configured `Origin`/`Referer` allow-list checks when those headers are present.

`AUTH_COOKIE_SECURE=false` is allowed for local/test HTTP only. Production startup rejects `NODE_ENV=production` with `AUTH_COOKIE_SECURE=false`.

## POST /api/v1/auth/login

Clinic user request:

```json
{
  "clinicId": "22222222-2222-4222-8222-222222222222",
  "email": "doctor@example.com",
  "password": "ValidPassword#123"
}
```

Platform user request:

```json
{
  "email": "admin@example.com",
  "password": "ValidPassword#123"
}
```

Success:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "11111111-1111-4111-8111-111111111111",
      "clinicId": "22222222-2222-4222-8222-222222222222",
      "fullName": "Dr Auth User",
      "email": "doctor@example.com",
      "phone": null,
      "userType": "CLINIC_USER",
      "status": "ACTIVE"
    },
    "session": {
      "sessionId": "session-uuid",
      "refreshTokenId": "refresh-token-row-uuid",
      "expiresAt": "2026-07-21T00:00:00.000Z"
    }
  },
  "meta": {}
}
```

Behavior:

- Sets `access_token`, `refresh_token`, and `csrf_token`.
- Records a login attempt.
- Audits success, failure, and lockout creation.
- Returns `401 Invalid credentials` for unknown user, wrong password, missing clinic context for clinic users, or active lockout.
- Returns `403 Account unavailable` for inactive, suspended, or deactivated users.
- Enforces auth-specific login rate limiting.
- Enforces lockout after 5 failed attempts per `clinicId/email/ip` within 15 minutes. The lockout duration is 15 minutes by default.

## POST /api/v1/auth/refresh

Request:

- No body required.
- Reads `refresh_token` from the HTTP-only cookie.
- Requires matching `csrf_token` cookie and `x-csrf-token` header.

Success:

```json
{
  "success": true,
  "message": "Session refreshed",
  "data": {
    "user": {},
    "session": {
      "sessionId": "same-session-uuid",
      "refreshTokenId": "new-refresh-token-row-uuid",
      "expiresAt": "2026-07-21T00:00:00.000Z"
    }
  },
  "meta": {}
}
```

Behavior:

- Verifies the refresh JWT.
- Finds the active refresh-token row by token hash.
- Uses refresh token row `id` as JWT `tokenId`.
- Atomically claims and revokes the previous active refresh-token row before replacement creation.
- Creates a replacement refresh-token row only after the previous row is successfully claimed.
- Sets replacement access, refresh, and CSRF cookies.
- Enforces auth-specific refresh rate limiting.
- If a valid refresh JWT points to a missing, revoked, expired, or replaced token row, active sessions for that user are revoked and the response is `401 Authentication required`.
- Concurrent reuse of the same refresh token allows at most one replacement token.

## POST /api/v1/auth/logout

Request:

- No body required.
- Reads `refresh_token` from the HTTP-only cookie when present.
- Requires matching `csrf_token` cookie and `x-csrf-token` header.

Success:

```json
{
  "success": true,
  "message": "Logged out",
  "data": {
    "loggedOut": true
  },
  "meta": {}
}
```

Behavior:

- Idempotent.
- Revokes the presented refresh token when valid and active.
- Clears access, refresh, and CSRF cookies.
- Audits logout when a valid refresh token is presented.

## GET /api/v1/auth/me

Request:

- Requires a valid `access_token` cookie.
- Does not require CSRF because it is a safe read request.

Success:

```json
{
  "success": true,
  "message": "Current user",
  "data": {
    "user": {},
    "session": {},
    "roles": [],
    "permissions": []
  },
  "meta": {}
}
```

Behavior:

- Verifies access JWT.
- Loads active user using trusted tenant/platform scope from the verified token.
- Validates `tokenVersion`.
- Validates active session using trusted tenant/platform scope.
- Sets request context with `userId`, `clinicId`, `sessionId`, `isAuthenticated`, and `isPlatform`.
- Returns empty `roles` and `permissions` until RBAC is enabled for later sprints.

## Sprint 1 Route Surface

By default, Sprint 1 mounts only foundation and Auth routes. Later RBAC/User routes require explicit opt-in with `ENABLE_POST_SPRINT_1_ROUTES=true` or `createApp({ enablePostSprint1Routes: true })`.
