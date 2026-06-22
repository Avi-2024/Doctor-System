# Risks and Gaps

## Summary

The PDF is strong on architecture, tenancy, security, transactions, events, and operational principles. The main remaining gaps are product policy decisions, provider-specific implementation details, compliance jurisdiction decisions, and scale tradeoffs that need approval before coding.

## Missing or Unclear Requirements

| Gap | Risk | Recommendation |
| --- | --- | --- |
| Jurisdiction-specific compliance requirements are not specified. | Retention, consent, breach notification, and audit needs may vary. | Confirm target market and compliance baseline before production. |
| Patient portal is future scope. | Some notification and data sharing flows may need patient identity later. | Keep patient auth out of MVP but reserve clean identity extension points. |
| Payment provider is not specified. | Billing can record payments but not process online payments. | Build internal payment ledger first; add gateway abstraction later. |
| Virus scanning provider is not specified. | Upload security cannot be fully production-ready without scanner choice. | Select scanner strategy before enabling uploads in production. |
| Queue/job backend is not specified beyond DB tables/workers. | DB-backed queues may become bottleneck at high scale. | Start DB-backed for modular monolith; keep adapter boundary for Redis/BullMQ/SQS. |
| Real-time event bus is not specified. | Multi-node Socket.IO needs shared adapter. | Use Redis adapter or equivalent before horizontal socket scaling. |
| Field-level encryption scope is not specified. | PHI/PII protection may be insufficient for stricter customers. | Identify fields requiring application-level encryption. |
| Doctor/clinical staff exact privileges need business approval. | Over-broad access could expose PHI. | Approve RBAC defaults before implementation. |
| Lab report approval flow is not fully specified. | Publishing reports without review may be unsafe. | Decide whether doctor review is mandatory before publication. |
| Appointment slot rules need more detail. | Real clinics may require complex scheduling rules. | Start with deterministic schedule/leave/conflict model; add rules later. |
| Tax rules are not jurisdiction-specific. | Billing totals could be incorrect. | Make tax calculation configurable by clinic and jurisdiction. |
| Data migration from old backend is not specified. | Greenfield `backend-new` may need import path. | Treat migration as separate phase after schema approval. |

## Scalability Risks

### Shared Schema Hotspots

Risk:

- Large tenant tables may grow to millions of records.
- Poor indexes could cause table scans.

Recommendation:

- Tenant-first indexes everywhere.
- Strict pagination.
- Query review gates.
- Add read replicas and aggregates for reporting.
- Consider partitioning only after measured need.

### Serializable Transactions

Risk:

- PDF recommends `SERIALIZABLE` by default for correctness.
- High-volume appointment/queue/payment workflows may see lock contention.

Recommendation:

- Use strict isolation for critical workflows.
- Keep transactions short.
- Add idempotency and deadlock retries.
- Revisit isolation per workflow with tests and MySQL behavior before production load.

### DB-Backed Jobs

Risk:

- DB-backed jobs are simple but can increase transactional database load.

Recommendation:

- Use DB-backed jobs initially for monolith simplicity.
- Keep worker interface abstract.
- Move high-volume queues to Redis/SQS/BullMQ when metrics show pressure.

### Reports on Transactional DB

Risk:

- Heavy reports can degrade API performance.

Recommendation:

- Async reports.
- Aggregate tables.
- Snapshots.
- Read replicas.
- Hard query timeouts.

## Security Risks

### Cross-Tenant Access

Risk:

- The highest SaaS risk is missing `clinic_id` in one repository query.

Recommendation:

- Repository method signatures require `clinicId`.
- Static code review checklist for tenant filters.
- Automated tenant isolation tests per module.
- Cross-tenant fuzz tests before production.

### Over-Privileged Clinic Owner

Risk:

- Clinic Owner may receive too much clinical data by default.

Recommendation:

- Confirm whether owners can view full clinical records or only operational/reporting summaries.
- Apply least privilege defaults.

### Audit Payload Leakage

Risk:

- Audit logs may accidentally store PHI, secrets, or tokens.

Recommendation:

- Central redaction utility.
- Audit schema review.
- Tests for secret redaction.

### File Upload Threats

Risk:

- Malicious files, MIME spoofing, large upload DoS.

Recommendation:

- Size limits.
- MIME and extension validation.
- Checksum.
- Virus scanning.
- Quarantine if scanner is async.
- Signed URLs only.

### Webhook Spoofing

Risk:

- Fake WhatsApp events could update message states or trigger workflows.

Recommendation:

- Raw body signature validation.
- Timestamp/replay prevention.
- Idempotency by provider event id.
- Rate limiting.

## Database Design Risks

### JSON Overuse

Risk:

- JSON fields can hide queryable business data and weaken validation.

Recommendation:

- Use JSON only for flexible metadata, snapshots, provider payloads, and structured clinical details that do not require relational querying in MVP.
- Normalize statuses, ownership, dates, money, and searchable fields.

### Missing Versioning

Risk:

- Clinical records may need immutable history after finalization.

Recommendation:

- Add `version` and `previous_version_id` for consultations, prescriptions, and lab reports.
- Use amendment workflows instead of edits after finalization.

### Financial Precision

Risk:

- Floating point money causes incorrect totals.

Recommendation:

- Use Decimal for all money and quantity calculations.
- Server-side totals only.

### Foreign Key Gaps

Risk:

- Orphan records can break auditability and tenant recovery.

Recommendation:

- Explicit foreign keys for core relationships.
- Restrict cascade delete.
- Soft delete business records.

## Operational Risks

### Backup and Restore Not Proven

Risk:

- Backups without restore tests do not satisfy recovery needs.

Recommendation:

- Define RPO 15 minutes and RTO 4 hours as production targets.
- Automate backup validation.
- Test tenant-level restore before go-live.

### Observability Deferred

Risk:

- Production issues become hard to diagnose.

Recommendation:

- Add request IDs, structured logs, Sentry-ready errors, metrics hooks, and worker health in early phases.

### Secret Management

Risk:

- Local `.env` practices can leak into production.

Recommendation:

- Use environment variables locally.
- Use secrets manager in production.
- Validate required secrets at startup.

### Deployment Rollbacks and Migrations

Risk:

- Schema changes can break rolling deployments.

Recommendation:

- Forward-only migrations.
- Expand/backfill/contract pattern.
- Migration tests.
- Rollback runbooks.

## SaaS and Multi-Tenancy Risks

### Tenant Suspension Semantics

Risk:

- Suspension must block writes/login without losing access for recovery.

Recommendation:

- Define precise allowed APIs for suspended and archived tenants.

### Tenant Export Scope

Risk:

- Full exports may leak another tenant's data if a query is unscoped.

Recommendation:

- Export-specific tenant isolation tests.
- Signed URLs.
- Audit every export.

### Subscription Enforcement

Risk:

- Limits can be bypassed if enforcement is scattered.

Recommendation:

- Central SubscriptionEnforcementService.
- Enforce limits in service layer before creation workflows.

### Super Admin Tenant Override

Risk:

- Platform users could accidentally act in the wrong tenant.

Recommendation:

- Require explicit tenant context.
- Audit every override.
- Show tenant context in admin UI later.
- Consider reason codes for sensitive support actions.

## Deployment Risks

| Risk | Recommendation |
| --- | --- |
| Socket.IO horizontal scaling not configured. | Add Redis adapter or shared event bus before multi-node sockets. |
| Workers deployed without concurrency controls. | Use row locking, worker IDs, lock timeouts, and heartbeat. |
| Nginx/body size limits mismatched with API upload limits. | Define shared upload limits. |
| Webhook raw body parsing conflicts with JSON middleware. | Mount raw webhook parser before JSON parser. |
| Prisma migrations run unsafely in production. | Use controlled migration job with preflight and backup. |

## Product Decisions Needed Before Coding

1. Target country/jurisdiction and compliance baseline.
2. Whether Clinic Owner sees full clinical records.
3. Whether lab reports require doctor approval before publishing.
4. Payment methods and whether online gateway is in MVP.
5. Exact default roles for clinic onboarding.
6. Exact subscription plan limits and feature flags.
7. File size/type policy by module.
8. Whether field-level encryption is required for PHI in MVP.
9. Whether patient portal is excluded from all MVP APIs or only auth.
10. Preferred worker backend: DB-backed first, Redis/BullMQ, or AWS SQS.
11. Preferred Socket.IO scaling adapter.
12. Backup/restore infrastructure target.

## Recommended Risk Burn-Down Order

1. Approve RBAC defaults and clinical access policy.
2. Approve database table plan and tenant ownership rules.
3. Decide worker and socket scaling adapters.
4. Decide upload virus scanning strategy.
5. Decide compliance jurisdiction and retention policy.
6. Decide payment provider scope.
7. Approve phase order and MVP cut.

