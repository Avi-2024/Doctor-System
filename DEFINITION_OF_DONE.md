# Definition Of Done

## Purpose

This document defines when a phase, module, API, or production change is done for the Doctor System healthcare SaaS product.

Done means safe, tested, documented, observable, deployable, and supportable.

## Universal Done Criteria

- [ ] Scope matches approved outpatient MVP/V1 plan.
- [ ] `backend-new` remains canonical.
- [ ] Required layering is preserved.
- [ ] No P0 debt introduced.
- [ ] Lint passes.
- [ ] Build passes.
- [ ] Tests pass.
- [ ] Prisma validation passes.
- [ ] Documentation updated.
- [ ] Rollback considerations documented.

## API Done

- [ ] Route -> Validator -> Controller -> Service -> Repository -> Prisma.
- [ ] Request body, params, and query validated.
- [ ] Response envelope matches API standards.
- [ ] Error behavior is sanitized.
- [ ] Auth/tenant/RBAC enforced for protected APIs.
- [ ] Tenant-owned data uses trusted tenant context.
- [ ] Pagination/search/filter/sort implemented for lists.
- [ ] Audit logs added where required.
- [ ] Postman/OpenAPI/API docs updated.

## Database Done

- [ ] Schema follows naming standards.
- [ ] Tenant-owned tables include required tenant fields.
- [ ] Tenant-first indexes exist.
- [ ] Unique constraints enforce business rules.
- [ ] Foreign keys match lifecycle policy.
- [ ] Soft delete policy is explicit.
- [ ] Migration is reviewed and dry-run.
- [ ] Rollback or forward-fix plan exists.

## Security Done

- [ ] No hardcoded secrets.
- [ ] No sensitive data in logs, errors, audit payloads, or tests.
- [ ] Auth/session behavior follows security standards.
- [ ] RBAC and tenant isolation tested.
- [ ] Dependency scan reviewed.
- [ ] Security owner reviewed high-risk changes.
- [ ] Security events are logged and auditable.

## Testing Done

- [ ] Unit tests for services/utilities.
- [ ] Integration/API tests for route behavior.
- [ ] Validation failure tests.
- [ ] RBAC allow/deny tests.
- [ ] Tenant isolation tests.
- [ ] Error handling tests.
- [ ] Concurrency tests for critical workflows.
- [ ] Migration/schema tests where applicable.
- [ ] Manual smoke steps documented.

## Observability Done

- [ ] Request logs include request ID.
- [ ] Tenant/user context logged where available.
- [ ] Errors are observable and sanitized.
- [ ] Audit events exist for sensitive workflows.
- [ ] Metrics/alerts updated for new operational behavior.
- [ ] Runbook updated for new failure modes.

## Deployment Done

- [ ] CI green.
- [ ] Migration dry-run complete.
- [ ] Backup status confirmed for production migration.
- [ ] Rollback plan reviewed.
- [ ] On-call and Customer Support notified where applicable.
- [ ] Post-deploy smoke tests defined.
- [ ] Release evidence recorded.

## Phase Done

- [ ] Phase deliverables complete.
- [ ] Phase tests complete.
- [ ] Documentation complete.
- [ ] Postman/API contract updated where applicable.
- [ ] Migration plan updated where applicable.
- [ ] Known gaps documented.
- [ ] Principal Engineer review completed.
- [ ] Fix plan created for open findings.
- [ ] Critical and High findings fixed or formally accepted by CTO.

## Not Done If

- A protected route lacks auth, tenant resolution, RBAC, validation, logging, or required audit.
- A tenant-owned query can bypass trusted tenant context.
- A critical write lacks transaction safety.
- Retryable workflow can duplicate side effects.
- Stack traces or internal errors are public.
- Secrets can leak through logs, audit, validation, or tests.
- Production migration lacks review and rollback plan.
- Tests are skipped without explicit CTO acceptance.
