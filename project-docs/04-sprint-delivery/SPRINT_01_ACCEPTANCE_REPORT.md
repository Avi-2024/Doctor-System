# Sprint 01 Acceptance Report

## Scope

Sprint 1 covers Auth Core for `backend-new` only:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Sprint 1 does not include password reset, invitations, logout-all, frontend integration, broad RBAC rollout, tenant administration, patients, appointments, billing, or clinical modules.

## Final Verdict

| Question | Answer |
| --- | --- |
| Is Sprint 1 complete? | Yes, for the approved Auth Core scope. |
| Is Sprint 1 merge-ready? | Yes. Lint, build, and tests pass. |
| Is Sprint 1 production-ready? | Yes for the Sprint 1 Auth-only route surface with documented Medium/Low debt accepted. It is not a full-product production launch approval. |

## Verification Results

Commands run from `backend-new`:

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | Passed | `scripts/check-syntax.js` completed successfully. |
| `npm run build` | Passed | Prisma schema validated and syntax check completed successfully. |
| `npm test` | Passed | 76 tests passed, 0 failed. |

## Critical Issues

| ID | Issue | Status | Evidence |
| --- | --- | --- | --- |
| C1 | Refresh rotation was not concurrency-safe | Resolved | Old refresh tokens are conditionally claimed before replacement creation; concurrent refresh test passes. |

## High Issues

| ID | Issue | Status | Evidence |
| --- | --- | --- | --- |
| H1 | Cookie-based auth had no CSRF enforcement | Resolved | Refresh/logout require matching `csrf_token` cookie and `x-csrf-token` header; login rejects disallowed origin. |
| H2 | Auth-specific brute-force and lockout controls were missing | Resolved | Auth login/refresh rate limits exist; repeated failed logins create lockout and block correct password until expiry. |
| H3 | Production could start with insecure auth cookies | Resolved | `NODE_ENV=production` with `AUTH_COOKIE_SECURE=false` fails config validation. |
| H4 | Sprint 1 exposed later RBAC/User routes by default | Resolved | RBAC/User routes return 404 by default; later-sprint tests explicitly opt in. |
| H5 | Access-token repository reads were not tenant-scoped | Resolved | Access-token resolution passes trusted tenant/platform scope into user/session repository reads. |

## Documentation Status

Updated:

- `SPRINT_01_REVIEW.md`
- `SPRINT_01_FIX_PLAN.md`
- `backend-new/docs/AUTH_API.md`
- `backend-new/docs/PHASE_02_AUTH.md`
- `backend-new/.env.example`

Documentation now describes:

- CSRF double-submit behavior.
- Login origin checks.
- Auth-specific rate limits.
- Account lockout thresholds.
- Production secure-cookie enforcement.
- Sprint 1 route-surface gating.
- Tenant-scoped Auth repository reads.
- Remaining Medium/Low technical debt.

## Postman Status

Updated:

- `backend-new/postman/Doctor-System-Phase-2-Auth.postman_collection.json`

Postman now:

- Captures `csrf_token` after login.
- Sends `x-csrf-token` on refresh.
- Captures rotated `csrf_token` after refresh.
- Sends `x-csrf-token` on logout.
- Clears the collection CSRF variable after logout.

## Remaining Technical Debt

| ID | Debt | Severity |
| --- | --- | --- |
| M1 | Login timing can still differ between unknown-user and wrong-password paths. | Medium |
| M2 | `login_scope` consistency is enforced by application convention and indexes, not a DB check constraint. | Medium |
| M3 | JWT issuer, audience, and JTI are not implemented. | Medium |
| M4 | Some invalid refresh/logout paths need broader audit coverage. | Medium |
| M5 | Request logs do not yet include full user and clinic context. | Medium |
| M6 | Auth integration and concurrency behavior are not proven against live MySQL in the default test suite. | Medium |
| M7 | Broader cross-document Auth/database documentation cleanup may still be needed. | Medium |
| M8 | Lockout/security metrics are not yet part of runtime observability. | Medium |
| L1 | Phase 2 Auth Postman environment file is missing. | Low |
| L2 | Invalid-login Postman assertion remains permissive. | Low |
| L3 | Password validation messages can be more precise. | Low |
| L4 | Logger circular serialization should remain tracked as an operational hardening item. | Low |
| L5 | Auth operational retention policy is missing. | Low |

## Acceptance Decision

Sprint 1 is accepted for merge as the Auth Core foundation.

Production readiness is scoped strictly to the Sprint 1 Auth-only route surface. Broader healthcare SaaS production launch remains blocked on later modules, integration testing, infrastructure readiness, monitoring, backup/restore evidence, and remaining launch gates.
