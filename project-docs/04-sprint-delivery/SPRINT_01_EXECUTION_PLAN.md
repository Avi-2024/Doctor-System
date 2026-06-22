# Sprint 01 Execution Plan

## Executive Summary

Sprint 1 delivers Auth Core for `backend-new`, the canonical backend for the Doctor System healthcare SaaS product.

This sprint is intentionally narrow. It implements secure backend authentication primitives needed before RBAC, tenant administration, patients, appointments, clinical workflows, billing, or launch operations can proceed.

Sprint 1 does not include password reset, invitations, logout-all, full account lockout enforcement, frontend implementation, or full RBAC.

## Sprint Boundary

| Area | Decision |
| --- | --- |
| Sprint name | Sprint 1: Auth Core |
| Backend target | `backend-new` only |
| Architecture | Modular monolith |
| Required flow | Route -> Validator -> Controller -> Service -> Repository -> Prisma |
| Public endpoints | Login and refresh only, with refresh requiring refresh cookie |
| Protected endpoints | Logout and current user |
| Auth storage model | HTTP-only cookies |
| Token model | JWT access token plus refresh token rotation |
| RBAC scope | Not enforced in Sprint 1 |
| Tenant scope | Auth resolves `clinicId`; tenant administration comes later |

## Exact Deliverables

| Deliverable | Description | Priority | Dependencies | Risk | Estimate |
| --- | --- | --- | --- | --- | --- |
| Auth module layering | Add Auth routes, validators, controller, service, repository, cookie helpers, middleware | P0 | Phase 1 app, validation, error handler, Prisma | Business logic leaking into route/controller layer | 1.5 days |
| Login | Authenticate clinic and platform users with email/password and tenant rules | P0 | `users`, bcrypt helpers, audit foundation | Account enumeration, wrong-tenant login | 1 day |
| Refresh rotation | Rotate refresh tokens and revoke reused tokens | P0 | `refresh_tokens`, JWT helpers | Stolen sessions survive replay | 1.5 days |
| Logout current session | Revoke presented refresh token and clear cookies | P0 | Refresh token lookup/revocation | Browser remains authenticated after logout | 0.5 day |
| Current user | Resolve current user and session from access cookie | P0 | Access JWT, session lookup, token version | Stale access token or wrong context | 1 day |
| Access middleware | Read access cookie, verify JWT, load active user/session, set request context | P0 | Auth service, request context | Later routes receive untrusted identity | 1 day |
| Login attempts | Record successful and failed login attempts | P0 | `login_attempts` | Security evidence missing | 0.5 day |
| Auth audit events | Audit login, refresh, logout, and token reuse events | P0 | Audit framework | Sensitive auth actions not traceable | 0.5 day |
| Auth migration artifact | Add reviewed SQL artifact for Foundation plus Auth tables | P0 | Prisma schema | Invalid migration or unsafe token constraints | 1 day |
| Auth docs | Update Auth and migration documentation | P1 | API behavior finalized | Contract drift | 0.5 day |
| Auth Postman collection | Add importable collection for Sprint 1 Auth APIs | P1 | API behavior finalized | Manual verification friction | 0.5 day |
| Verification | Run lint, build, tests and fix failures | P0 | Implementation complete | Broken sprint baseline | 0.5-1 day |

## Exact Database Changes

Sprint 1 database work establishes Auth foundation tables and constraints.

| Table / Change | Purpose | Priority | Dependencies | Risk | Estimate |
| --- | --- | --- | --- | --- | --- |
| `users` | Stores platform and clinic users, password hash, status, token version, and login metadata | P0 | Prisma setup | Bad login scope or weak token invalidation | 0.5 day |
| `users.login_scope` | Enforces deterministic login scope for platform and clinic users | P0 | `users` | MySQL nullable unique indexes allow duplicate platform emails | 0.25 day |
| `@@unique([login_scope, email])` | Protects platform and clinic login identity uniqueness | P0 | `login_scope` | Duplicate identity records | 0.25 day |
| `refresh_tokens` | Stores hashed refresh tokens, session IDs, rotation state, expiry, and revocation | P0 | `users` | Raw token storage or bad session lifecycle | 0.75 day |
| `refresh_tokens.token_hash` unique | Prevents duplicate active or historical refresh-token hashes | P0 | Refresh hashing | Token replay ambiguity | 0.25 day |
| `refresh_tokens.session_id` indexed, not unique | Allows multiple token rows per session during rotation | P0 | Refresh rotation design | Rotation fails if session is globally unique | 0.25 day |
| `password_reset_tokens` | Foundation table only; no reset APIs in Sprint 1 | P2 | `users` | Scope creep into reset flow | 0.25 day |
| `login_attempts` | Stores login success/failure attempts | P0 | Login service | Failed attempts not traceable | 0.25 day |
| `account_lockouts` | Foundation table only; no full lockout enforcement in Sprint 1 | P2 | Login attempts | False assumption lockout is active | 0.25 day |
| `0001_foundation_auth.sql` | Reviewed SQL migration artifact | P0 | Current Prisma schema | Production migration drift | 0.5 day |

## Exact APIs

| Method | Path | Public | Request Source | Success Behavior | Failure Behavior |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Yes | JSON body | Sets access and refresh cookies, returns sanitized user/session | `401 Invalid credentials` or `403 Account unavailable` |
| `POST` | `/api/v1/auth/refresh` | Yes, requires refresh cookie | `refresh_token` cookie | Rotates refresh token, revokes old token, sets replacement cookies | `401 Authentication required`; reuse revokes active sessions |
| `POST` | `/api/v1/auth/logout` | No | `refresh_token` cookie | Idempotently revokes current refresh token and clears cookies | Still clears cookies when token is missing/invalid |
| `GET` | `/api/v1/auth/me` | No | `access_token` cookie | Returns sanitized current user/session and empty roles/permissions | `401 Authentication required` |

## Exact Validations

| Validation | Rule | Priority | Dependencies | Risk | Estimate |
| --- | --- | --- | --- | --- | --- |
| Login email | Required valid email, normalized | P0 | `express-validator` | Account lookup drift | 0.25 day |
| Login password | Required string, never returned in errors | P0 | Validation middleware | Secret exposure | 0.25 day |
| Login clinicId | Optional UUID; required by service for clinic users | P0 | User type rules | Clinic user logs in without tenant scope | 0.25 day |
| Platform login | `clinicId` omitted and user must have platform scope | P0 | `users.login_scope` | Platform identity collision | 0.25 day |
| Refresh | Reads HTTP-only refresh cookie only | P0 | Cookie parser | Refresh token accepted from unsafe source | 0.25 day |
| Logout | Reads HTTP-only refresh cookie only and remains idempotent | P0 | Cookie parser | Logout failure leaves cookies | 0.25 day |
| Current user | Requires valid access cookie, active user, active session, matching token version | P0 | Auth middleware | Stale or forged context | 0.5 day |
| Validation errors | Must not echo password/token values | P0 | Error handler, validation middleware | Secret leakage | 0.25 day |

## Exact Permissions

Sprint 1 does not enforce permissions.

| Area | Sprint 1 Behavior | Later Sprint |
| --- | --- | --- |
| Auth routes | Login and refresh are public by design; logout and `/auth/me` require valid session context | Sprint 2 adds RBAC foundation for protected business APIs |
| Request context | Auth sets `userId`, `clinicId`, `sessionId`, `isAuthenticated`, and `isPlatform` | Sprint 2 adds effective `roles` and `permissions` |
| Roles | Empty array | Sprint 2 |
| Permissions | Empty array | Sprint 2 |
| Authorization decisions | Not made by Auth | Sprint 2 and later service-level guards |

## Exact Tests

| Test | Priority | Dependencies | Risk Covered | Estimate |
| --- | --- | --- | --- | --- |
| Login success sets cookies and returns sanitized user/session | P0 | Login API | Token leakage, bad response contract | 0.25 day |
| Login failure returns generic 401 and records attempt/audit | P0 | Login service, audit | Enumeration, missing evidence | 0.5 day |
| Failed login writes commit before auth error is thrown | P0 | Transaction helper | Audit/login attempts rolled back | 0.25 day |
| Disabled/suspended/deactivated user blocked | P0 | User status | Inactive account access | 0.25 day |
| Clinic user requires `clinicId` | P0 | Login service | Tenantless clinic login | 0.25 day |
| Platform login works without `clinicId` | P0 | Login scope | Platform auth failure | 0.25 day |
| Refresh rotates token and revokes old token | P0 | Refresh service | Token replay | 0.5 day |
| Refresh token reuse revokes active sessions | P0 | Refresh service | Stolen token reuse | 0.5 day |
| Logout is idempotent and clears cookies | P0 | Logout API | Sticky sessions | 0.25 day |
| `/auth/me` resolves authenticated request context | P0 | Access middleware | Bad identity context | 0.25 day |
| Token version mismatch returns 401 | P0 | Access token validation | Stale access token | 0.25 day |
| Cookie flags and paths match policy | P0 | Cookie helpers | Browser token exposure | 0.25 day |
| Validation does not echo secrets | P0 | Validation middleware | Secret leakage | 0.25 day |
| Prisma schema validates | P0 | Prisma schema | Broken build/migration | 0.25 day |
| Migration artifact includes Auth tables and rotation-safe indexes | P0 | SQL artifact | Migration drift | 0.25 day |

## Exact Documentation

| Document | Required Update | Priority | Dependencies | Risk | Estimate |
| --- | --- | --- | --- | --- | --- |
| `backend-new/docs/PHASE_02_AUTH.md` | Mark Sprint 1 Auth Core complete and list remaining deferred gaps | P1 | Auth implementation | Misstated sprint status | 0.25 day |
| `backend-new/docs/AUTH_API.md` | Document login, refresh, logout, `/auth/me`, cookies, errors | P1 | API behavior finalized | Frontend/API contract drift | 0.25 day |
| `backend-new/docs/PHASE_01_MIGRATION_PLAN.md` | Reference `0001_foundation_auth.sql` and Auth tables | P1 | SQL artifact | Migration process ambiguity | 0.25 day |

## Exact Postman Collections

| Collection | Required Requests | Priority | Dependencies | Risk | Estimate |
| --- | --- | --- | --- | --- | --- |
| `backend-new/postman/Doctor-System-Phase-2-Auth.postman_collection.json` | Login, refresh, logout, `/auth/me`, invalid login | P1 | Auth API complete | Manual verification friction | 0.5 day |

## Critical Path

1. Freeze Sprint 1 scope to Auth Core only.
2. Finalize Auth schema and refresh-token rotation model.
3. Implement login, cookies, refresh, logout, and `/auth/me`.
4. Add audit and login-attempt behavior.
5. Add tests for token, cookie, validation, and refresh reuse cases.
6. Generate docs, Postman collection, and migration artifact.
7. Run `npm run lint`, `npm run build`, and `npm test`.

## Sprint Blockers

| Blocker | Impact | Required Control |
| --- | --- | --- |
| Missing `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` | App cannot start safely | Startup env validation and test env defaults |
| Prisma schema validation failing | Build blocked | Fix schema before API work closes |
| Missing or inconsistent `DATABASE_URL` | Build/test/migration drift | Use validated MySQL URL in env |
| Platform email uniqueness ambiguous | Duplicate Super Admin identity possible | Use `users.login_scope + email` uniqueness |
| `refresh_tokens.session_id` accidentally unique | Refresh rotation breaks | Keep `session_id` indexed, not unique |
| Failed login writes inside rollbacking transaction | Login attempts/audit lost | Commit failure evidence before throwing API error |
| Frontend expects `localStorage` tokens | Browser integration conflict | Frontend must use cookie session flow |

## Missing Requirements

- Password reset request/confirm is not Sprint 1 despite appearing in broader Auth phase docs.
- Logout-all is not Sprint 1.
- Invitations are not Sprint 1.
- Full account lockout enforcement is not Sprint 1.
- Auth-specific rate-limit tuning is not Sprint 1 unless global limiter is insufficient.
- CSRF policy needs browser integration review before public frontend launch.
- Initial production user/seed strategy must be defined before real environment deployment.

## Open Questions

| Question | Why It Matters | Proposed Default |
| --- | --- | --- |
| What is the approved initial Super Admin creation path: SQL seed, CLI seed, or protected platform bootstrap? | Production cannot be administered without a secure bootstrap path | CLI seed in a controlled environment |
| Should Sprint 1 include a minimal Auth-specific rate limiter? | Login abuse prevention | Defer to global limiter in Sprint 1; add Auth-specific limiter during security hardening |
| Should account lockout be enforced immediately after login attempts exist? | Brute-force protection | Defer full enforcement; keep attempt evidence in Sprint 1 |
| What frontend origins are approved for cookie/CORS staging tests? | Cookie auth depends on browser/CORS behavior | Use configured staging frontend origin only |
| What exact password policy should production enforce? | Weak passwords increase account takeover risk | Enforce minimum length and complexity in user creation/invitation sprint |

## Acceptance Criteria

Sprint 1 is accepted only when:

- All four Auth APIs exist and use Route -> Validator -> Controller -> Service -> Repository -> Prisma layering.
- Access and refresh tokens are stored only in HTTP-only cookies.
- Raw refresh tokens are never stored.
- Refresh rotation and reuse detection are tested.
- Auth failure responses are generic and validation errors do not echo secrets.
- Login attempts and Auth audit events are recorded.
- `users.login_scope + email` protects platform email uniqueness.
- `refresh_tokens.session_id` is indexed but not unique.
- `npm run lint`, `npm run build`, and `npm test` pass from `backend-new`.
- Auth docs, Postman collection, and migration artifact are current.
