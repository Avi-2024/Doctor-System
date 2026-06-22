# Code Review Checklist

## Purpose

This checklist defines the required VP Engineering review gate for changes to the Doctor System healthcare SaaS product.

Use this checklist in addition to existing engineering guidelines. `backend-new` is canonical.

## Required Review Order

1. Product correctness.
2. Security.
3. Tenant isolation.
4. RBAC.
5. Data consistency.
6. Performance and scalability.
7. Error handling and logging.
8. Testing.
9. Documentation and rollout.

## Blocker Findings

Block the PR if it introduces:

- Unscoped tenant query.
- Missing auth/tenant/RBAC guard on a protected route.
- Business logic in route or controller.
- Prisma access outside repository or approved infrastructure module.
- Raw secret, token, cookie, credential, PHI, or payment data logging.
- Critical workflow mutation without transaction.
- Retryable write without idempotency.
- Unsafe migration.
- Missing rollback plan for production schema change.
- New API without tests and documentation.

## Product Correctness

- [ ] Change is within approved MVP/V1 scope.
- [ ] State transitions are valid.
- [ ] Missing, deleted, archived, suspended, and unauthorized resources are handled.
- [ ] User-facing behavior matches API contract.
- [ ] No V2 feature complexity is pulled into launch scope.

## Architecture

- [ ] Route -> Validator -> Controller -> Service -> Repository -> Prisma is preserved.
- [ ] Business logic is in services.
- [ ] Data access is in repositories.
- [ ] Cross-module calls use service contracts or events.
- [ ] Shared helpers are used instead of local one-off patterns.

## Security

- [ ] Input is validated.
- [ ] Secrets and PHI are redacted.
- [ ] Cookies/tokens/session handling follow standards.
- [ ] Webhook/upload/provider paths are verified.
- [ ] Dependency risk is reviewed.
- [ ] Security owner reviewed high-risk changes.

## Tenant Isolation

- [ ] Tenant-owned reads/writes use trusted tenant context.
- [ ] Client tenant IDs cannot override authenticated scope.
- [ ] Cross-tenant access is impossible without explicit platform context.
- [ ] Platform access is audited and reasoned.
- [ ] Cross-tenant tests exist for high-risk paths.

## RBAC

- [ ] Protected endpoints declare permission.
- [ ] Required scope is correct.
- [ ] Platform bypass is explicit.
- [ ] Service-level ownership checks exist where needed.
- [ ] Allow and deny tests exist.

## Data Consistency

- [ ] Critical write is transactional.
- [ ] Idempotency is implemented where retries are possible.
- [ ] Unique constraints enforce invariants.
- [ ] Decimal is used for money.
- [ ] Audit/outbox writes occur in the correct transaction.

## Performance

- [ ] Lists are paginated.
- [ ] Sort/filter/search are allowlisted.
- [ ] Tenant-first indexes exist.
- [ ] No N+1 query pattern is introduced.
- [ ] Heavy reports/exports are async or read-optimized.

## Error Handling And Logging

- [ ] Errors use standard envelope.
- [ ] No stack trace or internal detail is public.
- [ ] Logs include request ID and tenant/user context where available.
- [ ] Security denials and tenant mismatches are observable.
- [ ] Errors are not swallowed silently.

## Tests

- [ ] Unit tests cover service behavior.
- [ ] Integration/API tests cover route behavior.
- [ ] Validation failure tests exist.
- [ ] RBAC allow/deny tests exist.
- [ ] Tenant isolation tests exist.
- [ ] Concurrency tests exist for high-risk workflows.
- [ ] Regression tests cover bug fixes.

## Documentation And Rollout

- [ ] API docs/Postman/OpenAPI updated.
- [ ] Migration plan updated.
- [ ] Test plan updated.
- [ ] Rollback plan documented.
- [ ] Monitoring/alerts updated for new production behavior.
- [ ] Customer Support notes added for customer-visible changes.
