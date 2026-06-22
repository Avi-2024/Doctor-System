# 5-Year Principal Engineering Ownership Roadmap

## Ownership Thesis

`backend-new` should become the canonical backend. The current `backend` should be treated as a reference implementation to mine for product behavior, API coverage, and migration lessons, not as the long-term runtime.

The product should stay a production-grade modular monolith until scale, isolation, or team ownership creates a clear need to split services. The first priority is not microservices. The first priority is correctness: strict module boundaries, tenant safety, auditability, security, operability, and repeatable deployment.

## What To Redesign

- Replace the two-backend situation with one clear product backend.
- Redesign auth around secure httpOnly cookies or a BFF flow; remove frontend token storage.
- Redesign appointments, queue, billing, WhatsApp, and workers around idempotency, database constraints, and atomic claims.
- Move reporting off hot OLTP queries into aggregates, snapshots, async exports, and read replicas.
- Redesign audit as append-only, tamper-evident, searchable, exportable, and retention-aware.
- Standardize API contracts with OpenAPI, generated clients, and compatibility rules.
- Build infrastructure as code from the start: AWS, RDS, Redis, S3, KMS, ECS/EKS, alarms, backups, and CI/CD.

## Current Technical Debt And Risks

### Architecture

- Duplicate backend lines create unclear ownership and release risk.
- Legacy modules mix generic resource patterns with custom workflows.
- Some cross-module boundaries are service-level conventions rather than enforced contracts.
- API and behavior contracts are documented in places but not generated or enforced.

### Scalability

- Process-local rate limiting does not scale across API instances.
- PM2-style workers and polling are not enough for reliable high-volume job execution.
- Socket.IO lacks a Redis adapter and multi-node fanout strategy.
- Reports read too much transactional data into memory.
- Appointment and queue workflows need stronger concurrency controls before scale.

### Database

- Several business-critical uniqueness constraints are missing.
- Legacy schema uses floating point values for money.
- Appointment booking and queue claiming need atomic database-level safety.
- Reporting needs aggregates/read replicas instead of heavy OLTP scans.
- Tenant-first indexes are present in many places but need query-plan review against real workloads.

### Security

- Critical/high dependency advisories exist in the current legacy backend/frontend stack.
- Frontend token storage in `localStorage` creates XSS token-theft exposure.
- Legacy validation can return raw rejected values.
- Legacy logging does not consistently redact secrets.
- Upload, WebSocket, and provider webhook surfaces need stronger abuse controls.

### RBAC And Multi-Tenancy

- Tenant isolation is primarily app-enforced.
- Super-admin tenant override needs stronger guardrails, reason codes, and audit.
- RBAC needs route-level coverage checks and service-level ownership tests.
- Clinical access policy needs explicit product approval.

### Operations

- CI/CD is incomplete.
- Production infrastructure is not defined as code.
- Deployment, migration, rollback, and restore runbooks are missing.
- Docker coverage is incomplete for API, workers, and frontend.
- Backup/restore validation is not proven.

### Observability

- Sentry exists, but metrics, traces, dashboards, SLOs, queue lag, DB pool visibility, worker health, and WebSocket metrics are missing.
- Logs need consistent request, tenant, user, route, status, duration, and correlation fields.
- Alerting needs to cover API health, DB saturation, queue lag, failed workers, webhook failures, and storage errors.

## Future SaaS Features

- Clinic onboarding automation with trial and subscription lifecycle.
- Plan limits, metering, usage alerts, add-ons, invoices, and payment gateway integration.
- Patient portal with consent-aware communications and document sharing.
- Multi-branch operations, staff scheduling, and provider availability intelligence.
- Advanced reports, exports, BI snapshots, and clinic benchmarking.
- Audit exports, compliance retention policies, support-access reason codes, and access reviews.
- Marketplace-style integrations for labs, payment gateways, WhatsApp providers, insurance, and accounting.
- Data import and migration tooling for clinics switching from other systems.
- Enterprise features: SSO/SAML, SCIM, custom retention, data residency, and advanced admin controls.

## Service Boundary Strategy

### Move To Microservices Later

- Notifications and WhatsApp delivery workers.
- Reporting and export generation.
- Storage scanning and retention workers.
- Billing and payment gateway integration.
- Webhook ingestion, replay, and provider reconciliation.
- Search/indexing if patient, clinical, or report search becomes heavy.

### Keep In The Modular Monolith

- Auth/session core.
- RBAC and tenant context.
- Clinic, branch, user, and settings.
- Patients and patient records.
- Appointments and queue until measured scale proves otherwise.
- Clinical, prescriptions, and lab core workflow.
- Audit write API and authorization policy enforcement.

## 1-Year Roadmap

### Quarter 1: Canonical Backend And Platform Foundation

- Consolidate on `backend-new` as the canonical backend.
- Treat legacy `backend` as a reference and migration source.
- Finish Auth, RBAC, Tenants, Users, Branches, and Settings.
- Lock API envelope, error contract, tenant context, audit contract, and repository standards.
- Add OpenAPI baseline and generated client strategy.
- Add CI/CD with lint, test, build, Prisma validation, audit, Docker build, and migration preflight.
- Remediate critical/high dependency advisories.
- Define production migration strategy and release gates.

### Quarter 2: Core Clinic Workflows

- Implement Patients, Patient Records, Doctor Schedules, Leaves, Appointments, Queue, Clinical, Vitals, and Prescriptions.
- Add tenant isolation tests for every tenant-owned module.
- Add audit logs for all sensitive writes and reads where required.
- Add concurrency tests for appointments and queue.
- Add MySQL integration tests to CI.
- Add frontend coverage for auth, protected routes, patient workflows, appointments, queue, and doctor workspace.

### Quarter 3: Commercial And Communication Capabilities

- Implement Storage, Billing, Lab, Notifications, WhatsApp, durable jobs/outbox, and webhook processing.
- Add S3 private bucket policy, KMS encryption, signed URL validation, upload limits, and malware scanning strategy.
- Add Redis-backed WebSocket scaling.
- Add worker dead-letter handling, idempotency keys, retry controls, and operational dashboards.
- Replace money floats with decimal-safe storage and calculations in the canonical schema.
- Add payment-provider abstraction even if manual payments ship first.

### Quarter 4: Launch Hardening

- Implement Reports, Exports, Subscriptions, usage metering, and plan enforcement.
- Move heavy reports to async generation, snapshots, and aggregate tables.
- Add production AWS infrastructure as code.
- Add load, soak, backup/restore, migration rollback, WebSocket, worker, and disaster recovery tests.
- Add dashboards, SLOs, alerts, runbooks, and on-call procedures.
- Run final launch-readiness review and staging-to-production release rehearsal.

## 3-Year Roadmap

### Year 1: Production-Grade Modular Monolith

- Launch-ready SaaS platform.
- Strong tenant isolation, RBAC, audit, auth, and operational foundations.
- Core clinic workflows implemented in one backend.
- Repeatable deployment, migration, backup, restore, monitoring, and incident response.

### Year 2: Scale, Resilience, And Enterprise Readiness

- Add read replicas, reporting aggregates, query-plan review gates, and tenant-aware cache layers.
- Upgrade workers to Redis, BullMQ, SQS, or another durable queue adapter when metrics justify it.
- Add automated DR drills, backup validation, and restore automation.
- Add patient portal, advanced billing, payment gateway integrations, and integration marketplace foundations.
- Add enterprise controls: SSO/SAML, SCIM-ready identity model, advanced audit exports, and retention policies.

### Year 3: Selective Service Extraction

- Extract notifications/WhatsApp delivery if throughput and provider isolation justify it.
- Extract reporting/export generation if OLTP isolation or compute cost demands it.
- Extract storage scanning/retention workers if file volume grows materially.
- Extract payment/webhook processing if provider reliability and compliance require separate blast radius.
- Add multi-region disaster recovery, enterprise compliance features, data residency options, and platform analytics.

## Non-Negotiable Engineering Standards

- Every tenant-owned query is scoped by trusted context.
- Every sensitive write is audited.
- Every external side effect is idempotent.
- Every money value uses decimal-safe storage and calculation.
- Every deployment is reproducible through CI/CD and infrastructure as code.
- Every production incident has logs, metrics, traces, alerts, and runbooks.
- No module directly accesses another module's tables except through approved service contracts or domain events.
- Every schema change is forward-only, reviewed, tested, and deployable through expand/backfill/contract where needed.
- Every background job has retry, idempotency, dead-letter, and observability behavior.
- Every customer-facing feature has tenant isolation, RBAC, validation, audit, and integration tests.

## Ownership Decision Records To Create

- Canonical backend decision: `backend-new` as product runtime.
- Auth transport decision: httpOnly cookie/BFF model.
- Worker backend decision: DB-backed first, with Redis/SQS/BullMQ adapter boundary.
- WebSocket scaling decision: Redis adapter before multi-node production.
- Reporting architecture decision: aggregates/snapshots/async exports.
- Money precision decision: decimal-only financial schema.
- Audit integrity decision: append-only hash chain and export policy.
- Infrastructure decision: AWS IaC baseline and deployment model.
- Backup/DR decision: RPO, RTO, restore cadence, and ownership.

## Success Measures

- Zero known critical/high production dependency advisories.
- Zero unscoped tenant-owned data access in route/repository coverage.
- 95th percentile API latency and error-rate SLOs defined and monitored.
- Appointment and queue concurrency tests pass under realistic contention.
- All integration tests run in CI against MySQL.
- Restore drill completes inside agreed RTO.
- All production deploys are repeatable, observable, and reversible.
- Every support/admin tenant override is audited with reason and actor context.
