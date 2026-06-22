# PHASE 02 - Auth

## Objective

Build secure identity, session, token, password reset, and logout flows for `backend-new`.

## Sprint 1 Status

Sprint 1 Auth Core is implemented as the Phase 2 identity foundation.

Completed:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- HTTP-only access and refresh cookies.
- JavaScript-readable `csrf_token` cookie for double-submit CSRF protection.
- CSRF enforcement on refresh/logout and later mounted unsafe RBAC/User routes.
- Login `Origin`/`Referer` allow-list enforcement when browser origin headers are present.
- JWT access tokens with `userId`, `clinicId`, `sessionId`, and `tokenVersion`.
- Refresh-token rotation using refresh token row `id` as the JWT `tokenId`.
- Refresh-token rotation atomically claims the old active token before creating a replacement.
- Refresh-token reuse detection that revokes active user sessions.
- Access-token middleware that resolves user/session context and does not make RBAC decisions.
- Tenant-scoped user/session repository reads during access-token resolution.
- Login attempt recording.
- Account lockout after 5 failed attempts per `clinicId/email/ip` within 15 minutes, locked for 15 minutes by default.
- Auth-specific rate limits for login and refresh.
- Production startup rejection when `NODE_ENV=production` and `AUTH_COOKIE_SECURE=false`.
- Auth audit events for login, refresh, logout, token reuse detection, and lockout creation.
- Prisma Auth foundation tables: `users`, `refresh_tokens`, `password_reset_tokens`, `login_attempts`, `account_lockouts`.
- Migration artifact: `prisma/migrations/0001_foundation_auth.sql`.
- Postman collection: `postman/Doctor-System-Phase-2-Auth.postman_collection.json`.
- Login failure attempts and audit writes commit before returning authentication errors.
- Platform login uniqueness is enforced through `users.login_scope + email` because MySQL nullable unique indexes do not protect `clinic_id = null`.
- Sprint 1 default app surface exposes Auth only; RBAC/User routes require explicit post-Sprint-1 opt-in.

Remaining for later sprints:

- Full RBAC route rollout and permission loading.
- Tenant administration flows.
- User invitation flows.
- Password reset request and confirm.
- Logout-all sessions endpoint.
- Frontend cookie and CSRF integration.
- MySQL-backed auth integration and concurrency tests.

## Auth Boundary

Auth resolves identity only. It must not make authorization decisions.

Current request identity fields:

- `userId`
- `clinicId`
- `sessionId`
- `isAuthenticated`
- `isPlatform`
- `roles: []`
- `permissions: []`

Roles and permissions intentionally remain empty until RBAC is enabled for later sprints.

## Login Rules

Clinic users authenticate with:

- `clinicId`
- `email`
- `password`

Platform users authenticate with:

- `email`
- `password`

Platform users must have `clinic_id = null`.

Invalid credentials and active lockouts return generic `401 Invalid credentials`. Inactive, suspended, or deactivated accounts return `403 Account unavailable`.

## Cookie And CSRF Policy

Access cookie:

- Name: `access_token`
- Path: `/`
- `HttpOnly`
- `SameSite=Strict`
- `Secure=env.AUTH_COOKIE_SECURE`
- Max age: `ACCESS_TOKEN_TTL_SECONDS`

Refresh cookie:

- Name: `refresh_token`
- Path: `/api/v1/auth`
- `HttpOnly`
- `SameSite=Strict`
- `Secure=env.AUTH_COOKIE_SECURE`
- Max age: `REFRESH_TOKEN_TTL_SECONDS`

CSRF cookie:

- Name: `csrf_token`
- Path: `/`
- JavaScript-readable by design.
- `SameSite=Strict`
- `Secure=env.AUTH_COOKIE_SECURE`
- Rotated on login and refresh.

Unsafe cookie-authenticated requests must send `x-csrf-token` matching the `csrf_token` cookie. Logout clears all auth cookies and is idempotent.

## Runtime Configuration

Auth hardening settings:

- `AUTH_LOGIN_RATE_LIMIT_WINDOW_MS`
- `AUTH_LOGIN_RATE_LIMIT_MAX`
- `AUTH_REFRESH_RATE_LIMIT_WINDOW_MS`
- `AUTH_REFRESH_RATE_LIMIT_MAX`
- `AUTH_LOCKOUT_MAX_FAILURES`
- `AUTH_LOCKOUT_WINDOW_MS`
- `AUTH_LOCKOUT_DURATION_MS`
- `AUTH_COOKIE_SECURE`
- `ENABLE_POST_SPRINT_1_ROUTES`

`AUTH_COOKIE_SECURE=false` is valid only for local/test HTTP. Production startup rejects insecure cookie configuration.

## API Documentation

Endpoint contracts are documented in `docs/AUTH_API.md`.

## Tests

Sprint 1 coverage includes:

- Login success and cookie setting.
- Generic login failure.
- Disabled/suspended/deactivated user blocking.
- Clinic `clinicId` requirement.
- Platform login without `clinicId`.
- CSRF rejection and success paths for refresh/logout.
- Login origin rejection.
- Auth-specific rate limiting.
- Account lockout creation, active blocking, and expired lockout behavior.
- Refresh rotation.
- Refresh token reuse detection.
- Concurrent refresh safety.
- Logout idempotency.
- Current user context resolution.
- Trusted tenant/platform scope during access-token resolution.
- Token version mismatch rejection.
- Cookie flags and paths.
- Validation responses that do not echo password values.
- Prisma refresh-token schema rules.
- Migration artifact existence and schema coverage.
- Sprint 1 default route gating for RBAC/User APIs.

## Exit Criteria

- Every authenticated request can resolve user identity and session context.
- Auth does not make authorization decisions.
- Cookie-authenticated unsafe Auth requests enforce CSRF.
- Login has brute-force and lockout controls.
- Production cannot boot with insecure auth cookies.
- Sprint 1 route surface is Auth-only by default.
- `npm run lint`, `npm run build`, and `npm test` pass from `backend-new`.

## Sprint 1 Fix Status

- C1 refresh-token rotation concurrency risk: fixed.
- H1 CSRF protection for cookie auth: fixed.
- H2 auth-specific brute-force and lockout controls: fixed.
- H3 production secure-cookie enforcement: fixed.
- H4 Sprint 1 app-surface route gating: fixed.
- H5 tenant-scoped auth repository reads: fixed.

## Remaining Technical Debt

- Login timing can still differ between unknown-user and wrong-password paths.
- `login_scope` consistency is still enforced by application conventions and indexes, not a database check constraint.
- JWT issuer, audience, and JTI are not implemented.
- Some invalid refresh/logout paths still need broader audit coverage.
- Request logs do not yet include full user and clinic context.
- MySQL-backed auth integration and concurrency tests are still missing.
- Phase 2 Auth Postman environment file is still missing.
- Auth operational retention policy is still pending.
