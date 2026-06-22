# Sprint 01 Fix Plan

## Summary

This file tracks the Sprint 1 Gate Review fixes for Auth Core in `backend-new`.

Current status:

- Critical fixes: completed.
- High fixes: completed.
- Medium fixes: pending.
- Low fixes: pending.

Sprint 1 can move through final acceptance only after `npm run lint`, `npm run build`, and `npm test` pass from `backend-new`.

## Completed Critical Fixes

### C1. Make Refresh Rotation Concurrency-Safe

**Severity:** Critical

**Status:** Completed

**Affected files:**

- `backend-new/src/modules/auth/auth.service.js`
- `backend-new/src/modules/auth/auth.repository.js`
- `backend-new/tests/auth.phase2.test.js`

**Resolution:**

Refresh rotation now conditionally claims the old active refresh token before creating the replacement token. The conditional update requires the old token `id`, `token_hash`, `ACTIVE` status, `revoked_at=null`, and `expires_at > now`. If the claim count is not exactly `1`, the request is treated as refresh-token reuse and active sessions are revoked.

**Acceptance evidence:**

- Deterministic concurrent refresh test allows exactly one successful refresh.
- Reuse path revokes active sessions and returns `401`.
- Replacement creation failure rolls back without leaving the session without an active token.

## Completed High Fixes

### H1. Add CSRF Protection For Cookie-Based Auth

**Severity:** High

**Status:** Completed

**Affected files:**

- `backend-new/src/common/middleware/csrf.js`
- `backend-new/src/app.js`
- `backend-new/src/modules/auth/auth.routes.js`
- `backend-new/src/modules/auth/auth.cookies.js`
- `backend-new/tests/auth.phase2.test.js`
- `backend-new/docs/AUTH_API.md`
- `backend-new/postman/Doctor-System-Phase-2-Auth.postman_collection.json`

**Resolution:**

Added double-submit CSRF protection using a JavaScript-readable `csrf_token` cookie and required `x-csrf-token` header for unsafe cookie-authenticated requests. Login enforces configured `Origin`/`Referer` allow-list checks when browser origin headers are present. Login and refresh rotate the CSRF cookie.

**Acceptance evidence:**

- Refresh/logout without matching CSRF are rejected.
- Refresh/logout with matching cookie/header succeed.
- Login rejects disallowed origin.
- `GET /auth/me` remains CSRF-exempt.

### H2. Add Auth-Specific Brute-Force And Lockout Controls

**Severity:** High

**Status:** Completed

**Affected files:**

- `backend-new/src/app.js`
- `backend-new/src/config/env.js`
- `backend-new/src/modules/auth/auth.service.js`
- `backend-new/src/modules/auth/auth.repository.js`
- `backend-new/tests/auth.phase2.test.js`
- `backend-new/.env.example`

**Resolution:**

Added auth-specific login and refresh rate limiters. Login now enforces lockout after 5 failed attempts per `clinicId/email/ip` within 15 minutes, with a 15-minute default lockout. Lockout responses remain generic.

**Acceptance evidence:**

- Repeated failed login attempts create an active lockout.
- Correct password during active lockout is blocked.
- Expired lockout no longer blocks login.
- Auth-specific login limiter rejects excessive requests.

### H3. Fail Production Startup When Secure Cookies Are Disabled

**Severity:** High

**Status:** Completed

**Affected files:**

- `backend-new/src/config/env.js`
- `backend-new/.env.example`
- `backend-new/tests/foundation.test.js`

**Resolution:**

Environment validation rejects `NODE_ENV=production` with `AUTH_COOKIE_SECURE=false`. Local development and tests can still use insecure cookies over HTTP.

**Acceptance evidence:**

- Production with `AUTH_COOKIE_SECURE=false` fails config validation.
- Production with `AUTH_COOKIE_SECURE=true` passes.
- Test/development false still passes.

### H4. Gate Sprint 1 App Surface To Auth Core Only

**Severity:** High

**Status:** Completed

**Affected files:**

- `backend-new/src/app.js`
- `backend-new/tests/foundation.test.js`
- `backend-new/tests/rbac.phase3.test.js`
- `backend-new/docs/PHASE_02_AUTH.md`

**Resolution:**

Sprint 1 mounts Auth routes by default. RBAC/User routes mount only when `ENABLE_POST_SPRINT_1_ROUTES=true` or `createApp({ enablePostSprint1Routes: true })` is set.

**Acceptance evidence:**

- `/api/v1/rbac/*` and `/api/v1/users/*` return 404 by default.
- Later-sprint RBAC/User tests opt into the route surface explicitly.

### H5. Enforce Tenant Context In Auth Repository Reads

**Severity:** High

**Status:** Completed

**Affected files:**

- `backend-new/src/modules/auth/auth.repository.js`
- `backend-new/src/modules/auth/auth.service.js`
- `backend-new/tests/auth.phase2.test.js`

**Resolution:**

Access-token resolution now passes trusted tenant/platform scope from the verified JWT into repository user/session reads. Clinic users require `clinic_id` match. Platform users require `clinic_id=null`.

**Acceptance evidence:**

- Tenant access token cannot resolve mismatched clinic data.
- Repository receives trusted clinic filters.
- Platform token resolves only platform-scoped user/session data.

## Pending Medium Fixes

| ID | Issue | Status |
| --- | --- | --- |
| M1 | Reduce login enumeration timing leakage | Pending |
| M2 | Add `login_scope` integrity controls | Pending |
| M3 | Add JWT issuer, audience, and JTI | Pending |
| M4 | Expand Auth audit coverage | Pending |
| M5 | Add user and clinic context to request logs | Pending |
| M6 | Add MySQL-backed Auth integration tests | Pending |
| M7 | Repair remaining cross-document Auth drift | Pending |
| M8 | Add runtime metrics/warnings for lockout and security events | Pending |

## Pending Low Fixes

| ID | Issue | Status |
| --- | --- | --- |
| L1 | Add Phase 2 Auth Postman environment | Pending |
| L2 | Tighten invalid-login Postman assertions | Pending |
| L3 | Improve password validation messages | Pending |
| L4 | Make logger serialization circular-safe if not covered by foundation baseline | Pending |
| L5 | Add Auth retention policy | Pending |

## Gate Exit Criteria

Sprint 1 final acceptance requires:

- Critical and High findings completed.
- Documentation and Postman collection match actual behavior.
- `npm run lint` passes.
- `npm run build` passes.
- `npm test` passes.

## Production Readiness Decision

Pending final acceptance verification. Critical and High fixes are implemented, but Medium/Low technical debt remains for later hardening.
