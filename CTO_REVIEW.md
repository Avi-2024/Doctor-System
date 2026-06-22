# CTO Final Ownership Review

## Executive Position

This product should not be launched at meaningful scale until the backend strategy is consolidated, production infrastructure is defined as code, critical/high dependency advisories are remediated, and concurrency-sensitive workflows are hardened.

The current repo contains two backend lines:

- `backend`: broad product surface with many modules, but significant production hardening gaps.
- `backend-new`: stronger foundation patterns, but currently only Phase 1 plus hardening work.

As CTO, I would make `backend-new` the canonical backend and use `backend` as a reference implementation and migration source.

## Scale Breakpoints

### 1. What Would Break First At 1,000 Clinics?

- Operational reliability would break first: no complete CI/CD, no infrastructure as code, no repeatable production deployment, and no proven restore process.
- Process-local rate limiting would behave incorrectly across multiple instances.
- Single-process or PM2-style workers would become unreliable for notifications, WhatsApp, exports, and retries.
- Support/admin operations would become risky because tenant override and audit controls are not strong enough.
- Reporting APIs would begin pressuring the transactional database for larger clinics.

### 2. What Would Break First At 10,000 Clinics?

- Database and worker throughput would become the first major bottlenecks.
- WebSocket fanout would fail without Redis adapter, sticky-session/load-balancer strategy, and cross-node room coordination.
- Background processing would fall behind without durable jobs, idempotent claims, dead-letter management, and worker autoscaling.
- Tenant isolation review would become unmanageable without automated route/repository coverage.
- Backup and restore windows would become operationally risky without partitioning, read replicas, and rehearsed recovery.

### 3. What Would Break First At 1,000,000 Patients?

- Patient search and list APIs would degrade without a dedicated search/indexing strategy.
- `patients`, `patient_records`, `appointments`, `consultations`, `prescriptions`, `lab_reports`, `attachments`, and `audit_logs` would become high-growth tables.
- Reports reading from OLTP tables would become unsafe.
- Storage metadata and S3 lifecycle workflows would need retention, malware scanning, orphan detection, and archive policies.
- Backup, restore, and tenant export workflows would become too slow without data lifecycle design.

## Database Review

### 4. Tables That Will Become Hotspots

- `appointments`: booking, transitions, reporting, doctor calendars.
- `queue_entries` and `queue_counters`: front-desk realtime contention and token generation.
- `patients`: search, registration, deduplication, demographic updates.
- `patient_records`, `consultations`, `prescriptions`, `lab_orders`, `lab_reports`: clinical history growth.
- `notifications`, `whatsapp_messages`, `whatsapp_accounts`, `whatsapp_templates`: messaging and delivery state.
- `audit_logs`: high write volume from sensitive reads/writes.
- `invoices`, `invoice_items`, `payments`: billing writes and financial reports.
- `attachments`: storage metadata and signed URL reads.
- `refresh_tokens`, `password_reset_tokens`, `user_invitations`: auth/session churn.
- `jobs`, `job_attempts`, `outbox_events`, `processed_events`, `dead_letter_jobs`, `dead_letter_events` in `backend-new` once business workers are built.

### 6. Missing Or Weak Indexes And Constraints

- Appointment slot protection needs DB-level uniqueness or locking beyond app-level overlap checks.
- Queue claim and waiting-list queries need indexes matching `clinic_id`, `doctor_id`, `queue_date`, `status`, `priority`, and `token_number`.
- Patient search needs a real search approach; current compound indexes are not enough for flexible name/phone/email search at large scale.
- `invoice_number` and `receipt_number` need tenant-scoped uniqueness.
- `patient_code` needs tenant-scoped uniqueness.
- WhatsApp provider message IDs need uniqueness/idempotency constraints.
- Active WhatsApp account per clinic needs an enforceable invariant.
- Audit logs need date/tenant indexes and retention/partition strategy.
- Reporting needs aggregate tables or materialized snapshots, not only source-table indexes.

## API And Workflow Review

### 5. APIs That Will Become Bottlenecks

- Report summary and doctor utilization APIs.
- Patient list/search APIs.
- Appointment booking, list, and calendar APIs.
- Queue check-in and call-next APIs.
- Billing invoice/payment APIs.
- Storage upload and signed URL APIs.
- WhatsApp send, webhook, message history, and template APIs.
- Audit-log list/export APIs.
- Auth `/me` and RBAC effective-permission resolution if not cached.

### 7. Workflows That Need Queues

- WhatsApp outbound delivery and provider reconciliation.
- Notification scheduling, retry, and dead-letter handling.
- Report and audit export generation.
- Storage malware scanning, orphan cleanup, retention, and archive.
- Appointment reminders.
- Billing invoice PDF/receipt generation and payment-provider reconciliation.
- Webhook ingestion and replay.
- Subscription usage rollups and limit alerts.
- Audit tamper verification.

### 8. Workflows That Need Caching

- RBAC effective permissions.
- Tenant settings and feature flags.
- Clinic subscription limits and usage counters.
- Reference data such as doctors, branches, lab catalog, and active WhatsApp account.
- Calendar availability windows.
- Dashboard/report summaries.
- WebSocket room/session lookup.
- Rate limiting and abuse controls.

## Architecture And Service Boundaries

### 9. Modules That Should Eventually Become Microservices

- Notifications and WhatsApp delivery.
- Reporting and export generation.
- Storage scanning and retention.
- Payment gateway and billing reconciliation.
- Webhook ingestion/replay.
- Search/indexing for patients, clinical records, and reports.
- Analytics/BI workloads.

These should be extracted only after the modular monolith has stable contracts, metrics prove pressure, and team ownership can support service operations.

### 10. Modules That Should Remain In The Modular Monolith

- Auth/session core.
- RBAC and tenant context.
- Clinics, branches, users, settings.
- Patients and patient records.
- Appointments and queue until measured contention requires extraction.
- Clinical, vitals, prescriptions, lab core workflow.
- Audit write API and authorization policy enforcement.
- Subscription enforcement core.

## Technical Debt

### 11. Current Technical Debt

- Duplicate backend strategy creates product and release ambiguity.
- Legacy backend has broad functionality but weaker foundation standards than `backend-new`.
- `backend-new` has stronger architecture but lacks business modules.
- Generic resource factory reduces repetition but can hide module-specific invariants.
- API docs are not generated from enforceable OpenAPI contracts.
- Legacy schema uses floating point money values.
- Integration tests are skipped by default.
- Frontend has no test files.
- Root production deployment docs and Docker Compose files are deleted in the current worktree.
- CI/CD and IaC are absent.

## Security Review

### 12. Security Risks Still Existing

- Frontend dependency audit includes a critical `jspdf` advisory.
- Legacy backend audit includes high advisories for upload/WebSocket-related dependencies.
- Frontend stores tokens in `localStorage`.
- Legacy validation can expose raw rejected values.
- Legacy logger does not consistently redact sensitive metadata.
- File upload path needs malware scanning, checksum, quarantine, and stricter MIME/content validation.
- WebSocket lacks connection limits, abuse throttling, distributed session revocation, and multi-node controls.
- Super-admin tenant override needs reason codes, explicit confirmation, and audit.
- Field-level PHI encryption scope is not defined.
- Compliance baseline, retention policy, and breach response requirements are not defined.

## Operational Review

### 13. Operational Risks Still Existing

- No first-party CI workflow.
- No AWS infrastructure as code.
- No production-grade deployment pipeline.
- No migration preflight/rollback strategy.
- No blue/green or canary deployment process.
- No image scanning, SBOM, signing, or provenance.
- No worker autoscaling/runbook model.
- No production-ready Redis/WebSocket topology.
- Dirty worktree and untracked `backend-new`/docs prevent a clean release handoff.

### 14. Missing Monitoring

- API latency, saturation, error rate, and throughput metrics.
- DB connection pool, slow query, lock wait, deadlock, and replica lag metrics.
- Queue lag, attempts, dead letters, worker heartbeat, and stuck job metrics.
- WebSocket connection count, room count, emit failures, disconnect reasons, and fanout latency.
- S3 upload/download failures, scan failures, orphan counts, and signed URL usage.
- Auth failures, token reuse detection, suspicious tenant override, and RBAC denial metrics.
- Business SLOs: appointment booking success, queue wait time, WhatsApp delivery rate, report export completion.
- Dashboards, alerts, synthetic checks, and on-call runbooks.

### 15. Backup And Disaster Recovery Gaps

- No documented RPO/RTO ownership.
- No automated restore drill.
- No tenant-level restore strategy.
- No RDS PITR validation.
- No cross-region backup strategy.
- No backup integrity validation job.
- No runbook for failed migrations, data corruption, accidental tenant deletion, S3 object loss, or provider outage.
- No disaster recovery environment rehearsal.

## Scorecard

| Area | Score | CTO Assessment |
| --- | ---: | --- |
| Architecture | 38/100 | Direction is improving through `backend-new`, but duplicate backend lines and incomplete module migration block launch confidence. |
| Security | 30/100 | Some good controls exist, but dependency advisories, token storage, upload hardening, validation leakage, and compliance gaps are launch blockers. |
| Scalability | 28/100 | Current worker, WebSocket, reporting, and rate-limit designs will not support the stated scale. |
| Database | 35/100 | Tenant-first indexing exists in places, but constraints, money precision, concurrency safety, reporting design, and lifecycle strategy are insufficient. |
| Maintainability | 42/100 | Modular intent is good, but mixed backend patterns, generic resources, and missing contracts reduce long-term maintainability. |
| Observability | 22/100 | Sentry is not enough; metrics, tracing, dashboards, SLOs, alerting, worker visibility, and runbooks are missing. |
| Testing | 30/100 | Backend tests exist, but integration tests are skipped by default and frontend tests are absent. |
| Production Readiness | 24/100 | Not production-ready for launch at the assumed scale. |

## CTO Launch Decision

Do not launch to real clinics at scale in the current state.

The product is a credible prototype/reference implementation plus a stronger new backend foundation. It needs one canonical backend, dependency remediation, CI/CD, production infrastructure, database hardening, concurrency safety, observability, backup/DR validation, and security cleanup before launch.

## Immediate CTO Priorities

1. Freeze the target runtime: make `backend-new` canonical or explicitly harden `backend`; do not maintain both as production candidates.
2. Block release on critical/high dependency advisories.
3. Remove frontend token storage from `localStorage`.
4. Add CI/CD with integration tests, audit, schema validation, build, and Docker gates.
5. Define AWS IaC for RDS, Redis, S3, KMS, ALB, ECS/EKS, CloudWatch, and secrets.
6. Harden appointment booking, queue claiming, billing, and WhatsApp around idempotency and database constraints.
7. Build worker/outbox infrastructure and Redis-backed WebSocket scaling.
8. Move reporting to aggregate/async architecture.
9. Add observability, dashboards, alerts, runbooks, and synthetic checks.
10. Prove backup restore and disaster recovery before onboarding production tenants.
