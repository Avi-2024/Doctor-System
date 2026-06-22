# Sprint 02 Plan Review

## Review Scope

This review evaluates `SPRINT_02_EXECUTION_PLAN.md` as a Principal Engineer gate review before Sprint 2 implementation.

Reviewed against:

- Approved modular monolith architecture.
- Approved security architecture.
- Approved RBAC matrix.
- Approved database design.
- Sprint 1 acceptance report.
- Current Sprint 2 RBAC/User route intent.

Review categories:

- Architecture alignment.
- Security alignment.
- Tenant isolation.
- RBAC coverage.
- Validation coverage.
- API completeness.
- Database impact.
- Scalability impact.
- Testing coverage.

## Review Verdict

Overall plan quality is acceptable for an RBAC Foundation sprint, but the plan is not acceptance-ready until High findings are resolved.

Summary:

- **Critical:** none.
- **High:** privilege-subset enforcement, missing revocation path, Super Admin/platform-role ambiguity, incomplete tenant/security audit requirements.
- **Medium:** branch assignment schema timing, assignment uniqueness/concurrency, MySQL integration test gap, narrow permission catalog, missing permission cache strategy, list API query standards.
- **Low:** Postman CSRF detail, route-permission coverage artifact, broader RBAC matrix mapping, unresolved open questions.

## Critical Findings

No Critical findings.

Rationale:

- Sprint 2 preserves Sprint 1 Auth gating.
- RBAC/User routes remain explicit opt-in after Sprint 1.
- The plan does not directly expand into patient, clinical, financial, or reporting data.
- No immediate cross-tenant PHI exposure is introduced by the plan itself.

## High Findings

### H1. Custom Role Privilege-Subset Enforcement Is Unresolved

**Severity:** High

**Area:** Security alignment, RBAC coverage.

**Finding:**

The plan allows tenant custom role creation but leaves privilege-subset enforcement as an open question.

**Risk:**

A user with `rbac.roles.create` could create a role containing permissions or scopes stronger than their own authority. This violates least privilege and the approved RBAC rule that custom roles cannot exceed actor privileges.

**Required fix:**

Make actor privilege-subset enforcement a P0 Sprint 2 requirement before implementation:

- Actor cannot grant a permission they do not hold.
- Actor cannot grant a scope stronger than their own effective scope for that permission.
- `ALL` scope can only be granted by platform context.
- Platform/reserved permissions must be platform-only.

**Acceptance criteria:**

- Creating a role with a permission the actor lacks returns `403`.
- Creating a role with a stronger scope than the actor has returns `403`.
- Clinic users cannot grant `ALL`.
- Reserved/platform permissions cannot be granted by tenant users.

### H2. No Role Assignment Revocation Path In Sprint 2

**Severity:** High

**Area:** API completeness, security operations.

**Finding:**

Sprint 2 can assign roles but does not include a revoke role assignment API.

**Risk:**

The system can grant privileges but cannot remove bad, stale, or mistakenly assigned privileges through the same controlled API surface. This creates an operational security gap and makes role assignment unsafe for production use.

**Required fix:**

Choose one before implementation:

- Add `DELETE /api/v1/rbac/user-roles/:id` to Sprint 2.
- Or explicitly mark user-role assignment APIs as non-production until revocation exists.

**Acceptance criteria:**

- Active role assignment can be revoked transactionally.
- Revocation increments target user `token_version`.
- Revocation is audited.
- Revoked assignments no longer affect effective access.

### H3. Super Admin And Platform-Role Behavior Is Ambiguous

**Severity:** High

**Area:** Tenant isolation, RBAC coverage.

**Finding:**

The plan does not define whether Super Admin can create custom platform roles or how tenant-scoped platform operations must target a clinic.

**Risk:**

Platform role creation or tenant override can become inconsistent, overpowered, or under-audited. This is especially risky because platform permissions can cross tenant boundaries.

**Required fix:**

Define Sprint 2 platform behavior explicitly:

- Custom platform role creation through API is disallowed in Sprint 2.
- Platform/system roles come only from catalog/system-role sync.
- Super Admin tenant-scoped operations require an explicit clinic target.
- Platform tenant-scoped operations must be audited.

**Acceptance criteria:**

- Platform custom role creation through API is rejected or out of scope.
- Platform role mutations are limited to system sync.
- Tenant-scoped Super Admin action requires explicit clinic target.
- Audit captures platform actor, target clinic, and reason/metadata where available.

### H4. Tenant Violation And Authorization Denial Audit Requirements Are Incomplete

**Severity:** High

**Area:** Audit, security alignment.

**Finding:**

The plan requires audit for successful role creation and assignment, but denial and violation coverage is not strong enough.

**Risk:**

Cross-tenant assignment attempts, reserved permission attempts, and privilege escalation attempts may fail without durable audit evidence. That weakens traceability and security monitoring.

**Required fix:**

Require audit events for:

- RBAC denial on protected routes.
- Cross-tenant role assignment attempts.
- Privilege escalation attempts.
- Reserved/platform permission grant attempts.
- Platform tenant override attempts.

**Acceptance criteria:**

- Tests prove denial/violation attempts generate safe audit events.
- Audit payloads include actor, clinic, target user/role, permission/scope where applicable, request ID, and outcome.
- Audit payloads do not include tokens, passwords, or secrets.

## Medium Findings

### M1. `user_branch_assignments` Is Ahead Of Branches

**Severity:** Medium

**Area:** Database impact, architecture alignment.

**Finding:**

The Sprint 2 schema includes `user_branch_assignments`, but the Branches module is not part of Sprint 2.

**Risk:**

`branch_id` cannot be fully validated with a branch foreign key until the Branches sprint exists. This can leave dormant data that later needs repair or migration.

**Required fix:**

Keep `user_branch_assignments` dormant in Sprint 2 and document no runtime use until Branches. Add branch FK/migration review when Branches are introduced.

**Acceptance criteria:**

- No Sprint 2 API writes `user_branch_assignments`.
- Documentation states branch assignment runtime behavior is deferred.
- Branches sprint includes FK and integrity review.

### M2. Active User-Role Assignment Uniqueness Is Service-Enforced Only

**Severity:** Medium

**Area:** Database consistency, scalability.

**Finding:**

The plan relies on service checks to prevent duplicate active assignments.

**Risk:**

Concurrent assignment requests can create duplicate active role assignments unless the database or idempotency strategy prevents it.

**Required fix:**

Add a database-backed uniqueness strategy, deterministic idempotency guard, or transactional lock strategy before broad production use.

**Acceptance criteria:**

- Concurrent duplicate assignment creates one active assignment.
- Duplicate assignment returns idempotent success or deterministic conflict.
- Tests cover duplicate/concurrent assignment behavior.

### M3. No MySQL-Backed RBAC Integration Tests

**Severity:** Medium

**Area:** Testing coverage.

**Finding:**

The plan depends primarily on unit/fake repository tests.

**Risk:**

Fake repository tests do not prove foreign keys, unique constraints, transaction behavior, or concurrent role assignment behavior against MySQL.

**Required fix:**

Add MySQL integration tests before production acceptance or explicitly track this as a production blocker.

**Acceptance criteria:**

- MySQL test validates `0002_rbac.sql` behavior.
- MySQL test validates FK behavior.
- MySQL test validates uniqueness/duplicate assignment behavior.
- MySQL test validates transactional audit/role assignment behavior.

### M4. Permission Catalog Is Intentionally Narrow

**Severity:** Medium

**Area:** API completeness, future module readiness.

**Finding:**

Sprint 2 catalog covers RBAC and `/users/me` only, while the approved RBAC matrix defines permissions for the full healthcare product.

**Risk:**

Future modules may implement route protections without first expanding and reviewing the catalog, causing inconsistent permission naming and coverage.

**Required fix:**

Document Sprint 2 as foundation-only and add a catalog expansion gate before patient, tenant, appointment, billing, clinical, storage, notification, and reporting modules.

**Acceptance criteria:**

- Sprint 2 docs explicitly map implemented permissions to the broader RBAC matrix.
- Next module plans require catalog updates before route implementation.

### M5. No Permission Cache Strategy

**Severity:** Medium

**Area:** Scalability impact.

**Finding:**

Effective permission resolution is DB-backed and uncached.

**Risk:**

As route traffic and role assignment volume grow, resolving effective access on every request can add avoidable database load.

**Required fix:**

Keep uncached resolver for Sprint 2 if necessary, but add cache/invalidation design before high-volume modules.

**Acceptance criteria:**

- Sprint 2 docs identify uncached permission resolution as accepted foundation behavior.
- Cache keys include tenant/user/token version.
- Role assignment/revocation invalidates or bypasses stale cache.

### M6. List APIs Lack Pagination And Query Standards

**Severity:** Medium

**Area:** Validation coverage, API standards.

**Finding:**

`GET /rbac/permissions` and `GET /rbac/roles` are planned without pagination/filter/sort/query validation.

**Risk:**

The catalog may be small in Sprint 2, but unbounded list patterns can spread into later modules and violate API standards.

**Required fix:**

Add bounded query validation or explicitly document that these endpoints are intentionally unpaginated because they return small system catalogs.

**Acceptance criteria:**

- Either list endpoints include bounded query validation.
- Or docs state why pagination is intentionally omitted for Sprint 2 catalog endpoints.

## Low Findings

### L1. Postman Requirements Need Explicit CSRF Handling

**Severity:** Low

**Area:** Postman/API quality.

**Finding:**

The plan mentions `x-csrf-token`, but Postman requirements should explicitly state how it is captured and reused from Sprint 1 Auth.

**Required fix:**

State that unsafe RBAC requests must send `x-csrf-token` captured from Sprint 1 login/refresh responses.

### L2. Route-Permission Coverage Report Is Missing

**Severity:** Low

**Area:** Testing, documentation.

**Finding:**

The plan does not require a route-to-permission coverage artifact.

**Required fix:**

Add a simple checklist mapping every Sprint 2 route to its required permission and tests.

### L3. Docs Should Map Sprint 2 Permissions To Broader RBAC Matrix

**Severity:** Low

**Area:** Documentation.

**Finding:**

The plan lists implemented Sprint 2 permissions but does not explicitly reconcile them with the broader approved RBAC matrix.

**Required fix:**

Add a note that roadmap permissions are not fully implemented in Sprint 2 and must be added module by module.

### L4. Open Questions Should Be Resolved Before Implementation

**Severity:** Low

**Area:** Planning quality.

**Finding:**

The plan leaves important decisions as open questions.

**Required fix:**

Promote privilege-subset, platform-role creation, effective-access endpoint, and branch assignment decisions into explicit Sprint 2 scope decisions before coding.

## Category Assessment

| Category | Assessment |
| --- | --- |
| Architecture alignment | Mostly aligned. Modular monolith boundaries and route/service/repository shape are respected. |
| Security alignment | Directionally aligned, but High gaps remain around privilege-subset enforcement and audit of denials. |
| Tenant isolation | Good intent, but platform tenant targeting and branch assignment timing need clearer rules. |
| RBAC coverage | Foundation coverage is clear, but broader RBAC matrix coverage is intentionally incomplete. |
| Validation coverage | Basic body validation is covered; query/list validation and privilege business validation need strengthening. |
| API completeness | Foundation APIs are coherent, but assignment revocation is a High gap. |
| Database impact | Reasonable for foundation; branch assignment and active assignment uniqueness need follow-up. |
| Scalability impact | Acceptable for low-volume foundation; permission cache strategy is needed before high-volume modules. |
| Testing coverage | Unit/API coverage is planned; MySQL-backed integration and concurrency tests are missing. |

## Recommended Plan Changes

Before implementing Sprint 2:

1. Add privilege-subset enforcement to the P0 task matrix.
2. Add role assignment revocation or explicitly mark assignment APIs non-production until revoke exists.
3. Define Super Admin behavior: no platform custom roles through API; tenant-scoped platform operations require explicit clinic target and audit.
4. Require denial, tenant-violation, and reserved-permission audit tests.
5. Add concurrency/idempotency requirement for user-role assignment.
6. Add MySQL integration tests as a Sprint 2 acceptance gate or documented production blocker.
7. Keep branch assignments dormant until Branches sprint.
8. Add route-permission coverage artifact.
9. Explicitly document that Sprint 2 permission catalog is foundation-only.
10. Document why list endpoints are unpaginated or add bounded query validation.

## Acceptance Recommendation

Sprint 2 plan is directionally aligned with the approved modular monolith architecture, but it should not be implemented as-is.

Fix High findings before Sprint 2 implementation starts. Medium findings may be accepted only if they are explicitly tracked as Sprint 2 technical debt and do not affect production route exposure.
