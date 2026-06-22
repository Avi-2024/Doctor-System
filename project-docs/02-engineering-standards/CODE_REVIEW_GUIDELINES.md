# Code Review Guidelines

## Purpose

Code review protects patient data, tenant isolation, billing correctness, clinical workflow integrity, and production reliability.

Reviews must assume `backend-new` is the canonical backend and the launch target is a controlled outpatient MVP.

## Required Review Order

1. Product correctness.
2. Security.
3. Tenant isolation.
4. RBAC.
5. Data consistency.
6. Performance.
7. Observability.
8. Tests.

## Blocker Findings

Block the change if it introduces:

- Unscoped tenant query.
- Missing permission guard on a protected route.
- Critical workflow mutation without transaction.
- Retryable write without idempotency where duplicates are possible.
- Raw secret, token, PHI, or credential logging.
- Unsafe migration.
- Missing rollback plan for production schema changes.
- Billing, appointment, or queue mutation without data consistency guarantees.
- File upload without validation and security controls.
- Report/export without tenant authorization and signed URL controls.
- New production behavior without tests.

## Product Correctness Checklist

- Does the change match MVP/V1 launch scope?
- Does it preserve outpatient clinic workflow assumptions?
- Does it avoid pulling V2 features into launch?
- Are invalid state transitions rejected?
- Does it handle missing, archived, suspended, or unauthorized resources?

## Security Checklist

- Are secrets redacted from logs, audit, errors, and validation responses?
- Are auth/session assumptions explicit?
- Are cookies, tokens, redirects, uploads, and webhooks handled safely?
- Does the change introduce dependency or supply-chain risk?
- Does the change require security owner review?

## Tenant Isolation Checklist

- Does every tenant-owned query use trusted tenant context?
- Does the API ignore client-provided tenant ID as authority?
- Are exports tenant-scoped?
- Are platform/global reads restricted to platform context?
- Are cross-tenant tests present for high-risk paths?

## RBAC Checklist

- Does every protected endpoint declare required permission?
- Is platform bypass explicit and justified?
- Are service-level checks present for ownership-sensitive operations?
- Are role/permission changes audited?
- Does the test suite cover allow and deny cases?

## Data Consistency Checklist

- Are critical writes transactional?
- Are uniqueness and business invariants enforced at the database where possible?
- Are idempotency keys used for retryable writes?
- Are financial values decimal-safe?
- Are audit/outbox records created inside the transaction where required?

## Performance Checklist

- Does list behavior use pagination and deterministic ordering?
- Are tenant-first indexes present for expected queries?
- Does the change avoid synchronous heavy reports or exports?
- Does it avoid unbounded JSON payloads or file sizes?
- Does it introduce cache invalidation needs?

## Observability Checklist

- Are request ID, tenant ID, actor, resource, and workflow state traceable?
- Are critical failure modes logged with redaction?
- Are metrics needed for this feature?
- Does the feature affect dashboards, alerts, or runbooks?

## Test Checklist

- Unit tests exist for service and policy logic.
- Integration tests exist for auth, tenant, RBAC, validation, and error handling.
- Regression tests cover edge cases and failure paths.
- Concurrency tests exist for appointment, queue, billing, jobs, and idempotent writes where applicable.
- No skipped critical-path tests without CTO approval.

## Approval Rules

- Normal changes require module owner approval.
- High-risk changes require module owner plus platform/security reviewer.
- Schema migrations require backend owner plus DevOps/SRE review.
- Security-sensitive changes require Security/Compliance Owner approval.
- Release-critical changes require Tech Lead approval.

## Shared Release Policy

No production release without passing lint, build, tests, Prisma validation, npm audit, migration dry-run, and rollback review.
