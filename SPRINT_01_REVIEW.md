# Sprint 01 Gate Review

## Review Scope

Sprint 1 scope is Auth Core for `backend-new`:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- JWT access token, refresh token rotation, HTTP-only cookies, CSRF token, session tracking, token versioning, login attempts, lockout enforcement, and auth audit events.

## Gate Verdict

Critical and High Sprint 1 findings are fixed in the implementation. Final acceptance still depends on a clean verification run and the acceptance report.

Sprint 1 is stronger than the original Gate Review baseline because it now includes:

- Concurrency-safe refresh-token rotation.
- CSRF protection for cookie-authenticated unsafe requests.
- Login origin checks.
- Auth-specific login/refresh rate limits.
- Account lockout enforcement.
- Production secure-cookie enforcement.
- Strict Sprint 1 route-surface gating.
- Tenant-scoped auth repository reads.

## Critical Findings

| ID | Finding | Status |
| --- | --- | --- |
| C1 | Refresh rotation was not concurrency-safe | Fixed |

### C1. Refresh Rotation Is Concurrency-Safe

Refresh rotation conditionally claims the old active token before replacement creation. A single old refresh token can produce at most one replacement token. Concurrent reuse is handled as token reuse and revokes active sessions.

## High Findings

| ID | Finding | Status |
| --- | --- | --- |
| H1 | Cookie-based auth had no CSRF enforcement | Fixed |
| H2 | Auth-specific brute-force and lockout controls were missing | Fixed |
| H3 | Production could be misconfigured with insecure auth cookies | Fixed |
| H4 | Sprint 1 exposed later RBAC/User routes by default | Fixed |
| H5 | Access-token user/session resolution was not tenant-scoped at repository boundaries | Fixed |

### H1. CSRF Protection For Cookie-Based Auth

Fixed with double-submit CSRF:

- `csrf_token` cookie is JavaScript-readable by design.
- `x-csrf-token` must match the cookie on unsafe cookie-authenticated requests.
- Refresh/logout are protected.
- Later unsafe RBAC/User routes are protected when explicitly mounted.
- Login enforces configured `Origin`/`Referer` allow-list checks when browser origin headers are present.

### H2. Auth-Specific Brute-Force And Lockout Controls

Fixed with auth-specific rate limiters and account lockout:

- Login limiter is configured independently from the global limiter.
- Refresh limiter is configured independently from the global limiter.
- Five failed attempts per `clinicId/email/ip` within 15 minutes creates a 15-minute lockout by default.
- Locked login attempts return generic `401 Invalid credentials`.

### H3. Production Secure-Cookie Enforcement

Fixed in environment validation:

- `NODE_ENV=production` with `AUTH_COOKIE_SECURE=false` fails startup validation.
- Development/test can still use false for local HTTP.

### H4. Sprint 1 Route-Surface Gating

Fixed with explicit opt-in:

- RBAC/User routes are not mounted by default.
- `ENABLE_POST_SPRINT_1_ROUTES=true` or `createApp({ enablePostSprint1Routes: true })` is required for later-sprint route tests/runtime.

### H5. Tenant-Scoped Auth Repository Reads

Fixed by passing trusted tenant/platform scope from verified JWT claims into user/session repository reads:

- Clinic user access-token resolution filters by `id`, `clinic_id`, and `is_deleted=false`.
- Platform user access-token resolution requires `clinic_id=null`.
- Active session lookup filters by tenant scope.

## Medium Findings

| ID | Finding | Status |
| --- | --- | --- |
| M1 | Login timing can leak whether a user exists | Open |
| M2 | `login_scope` consistency is app-enforced only | Open |
| M3 | JWTs are missing issuer, audience, and JWT ID claims | Open |
| M4 | Auth audit coverage is incomplete for invalid refresh/logout paths | Open |
| M5 | Request logs omit user and clinic context | Open |
| M6 | Integration tests rely on fake repositories only | Open |
| M7 | Some broader Auth/database docs may still need cross-document cleanup | Open |
| M8 | Lockout/security metrics are not yet part of runtime observability | Open |

## Low Findings

| ID | Finding | Status |
| --- | --- | --- |
| L1 | Phase 2 Auth Postman environment file is missing | Open |
| L2 | Invalid login Postman assertion remains permissive | Open |
| L3 | Password validation message is imprecise | Open |
| L4 | Logger circular serialization should remain covered by foundation tests | Open |
| L5 | Operational auth retention policy is missing | Open |

## Category Assessment

| Category | Gate Assessment |
| --- | --- |
| Architecture compliance | Auth follows Route -> Validator -> Controller -> Service -> Repository -> Prisma. |
| CODEX_RULES.md compliance | Critical/High Auth requirements are covered for Sprint 1. |
| Security compliance | Critical/High issues fixed; Medium/Low hardening remains. |
| Tenant isolation | Access-token user/session resolution now uses trusted tenant/platform scope. |
| RBAC implementation | RBAC is not part of Sprint 1 production surface by default. |
| Database design compliance | Auth schema supports rotation and lockout; MySQL integration tests remain Medium debt. |
| API standards compliance | Auth envelope and cookie behavior are documented. |
| Validation coverage | Auth validation remains safe and does not echo secrets. |
| Error handling | Centralized error handling remains in place. |
| Logging | Request logging works, but user/clinic context is still Medium debt. |
| Audit logging | Primary Auth flows and lockout creation are audited. |
| Testing coverage | Service/API coverage exists; live MySQL integration is pending. |
| Documentation quality | Sprint 1 Auth docs now reflect Critical/High behavior. |
| Postman quality | Collection now includes CSRF behavior; separate environment remains Low debt. |

## Production Readiness Answer

Sprint 1 Auth Core can be considered production-ready only for the approved Sprint 1 route surface after final verification passes. Medium/Low hardening remains tracked technical debt and should be resolved before broader product launch.
