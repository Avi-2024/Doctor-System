# 12-Month CTO Product Roadmap

## Executive Direction

The next 12 months should turn the Doctor System from a broad prototype/reference implementation into a production-ready multi-tenant healthcare SaaS platform.

The operating decision is that `backend-new` becomes the canonical backend. The current `backend` remains a reference and migration source for product behavior, module coverage, and workflow details, but it should not remain a parallel production runtime.

The roadmap is organized around four outcomes:

- Build a secure, tenant-safe, auditable modular monolith.
- Deliver the core clinic workflows needed for daily operations.
- Add durable commercial, messaging, storage, and worker capabilities.
- Prove production readiness through infrastructure, observability, backup, security, and scale validation.

## Priority Legend

- **Must Have:** Required for safe production launch or core SaaS viability.
- **Should Have:** Important before broader rollout, but not a launch blocker for controlled beta.
- **Nice To Have:** Valuable future improvement after core stability.

## Month 1-3: Foundation And Canonical Backend

Focus: make `backend-new` the production foundation.

### Features

- **Must Have:** Consolidate backend strategy around `backend-new`.
- **Must Have:** Implement Auth, RBAC, Tenants, Users, Branches, and Settings.
- **Must Have:** Support JWT access tokens, refresh token rotation, HTTP-only cookies, session tracking, and token versioning.
- **Should Have:** Add OpenAPI baseline for the first stable `/api/v1` contract.
- **Should Have:** Add generated client strategy for frontend and future external consumers.
- **Nice To Have:** Add product onboarding notes for early pilot clinics.

### Technical Improvements

- **Must Have:** Lock API envelope, error contract, tenant context, audit contract, and repository standards.
- **Must Have:** Enforce Route -> Validator -> Controller -> Service -> Repository -> Prisma in `backend-new`.
- **Must Have:** Add DTO/schema validation for body, params, and query inputs.
- **Should Have:** Add RBAC route coverage checks.
- **Should Have:** Add tenant isolation contract tests.
- **Nice To Have:** Add ADRs for canonical backend, auth model, audit model, and worker strategy.

### Security Improvements

- **Must Have:** Remove frontend token storage from `localStorage`.
- **Must Have:** Remediate all critical/high dependency advisories.
- **Must Have:** Enforce secure HTTP-only cookie or BFF-style auth flow.
- **Must Have:** Ensure logs, validation errors, and audit payloads do not expose secrets.
- **Should Have:** Add dependency, SAST, and container scanning to CI.
- **Nice To Have:** Start formal threat modeling for Auth, RBAC, Tenancy, Audit, and Storage.

### Infrastructure Improvements

- **Must Have:** Add CI/CD for lint, build, tests, Prisma validation, npm audit, Docker build, and migration preflight.
- **Must Have:** Define production migration strategy and release gates.
- **Must Have:** Create production Docker image strategy for API and future workers.
- **Should Have:** Add staging environment parity checklist.
- **Should Have:** Add migration dry-run/review gate.
- **Nice To Have:** Add preview environments for product review.

### Scaling Improvements

- **Must Have:** Validate database connection pool sizing assumptions.
- **Must Have:** Move rate limiting and session-sensitive runtime state away from process-local assumptions.
- **Should Have:** Define Redis usage for rate limits, sessions, cache, queues, and Socket.IO scaling.
- **Should Have:** Define tenant-first indexing standards for every future module.
- **Nice To Have:** Draft read-replica and partitioning decision records for later scale.

### Monitoring Improvements

- **Must Have:** Add structured request logging with request ID, tenant ID, user ID, route, status, and duration.
- **Must Have:** Add baseline API latency, error, and throughput metrics.
- **Should Have:** Add Sentry-ready error reporting and alert routing.
- **Should Have:** Add synthetic health checks for API and readiness endpoints.
- **Nice To Have:** Add early business KPI tracking for signups, active clinics, and usage.

### Refactoring Requirements

- **Must Have:** Stop treating both backends as production candidates.
- **Must Have:** Migrate reusable behavior from `backend` into `backend-new` through explicit module contracts.
- **Must Have:** Remove or quarantine patterns that bypass tenant context or shared validation/error handling.
- **Should Have:** Document module boundaries and approved cross-module communication paths.
- **Nice To Have:** Create migration maps from legacy modules to `backend-new` modules.

## Month 4-6: Core Clinic Workflows

Focus: build the operational clinic product.

### Features

- **Must Have:** Implement Patients, Patient Records, Doctor Schedules, Leaves, Appointments, Queue, Clinical, Vitals, and Prescriptions.
- **Must Have:** Add pagination, search, filtering, sorting, and tenant-first list APIs.
- **Must Have:** Support appointment booking, cancellation, rescheduling, queue check-in, consultation start/finish, and prescription finalization.
- **Should Have:** Add frontend tests for auth, protected routes, patients, appointments, queue, and doctor workspace.
- **Should Have:** Add E2E tests for core clinic workflows.
- **Nice To Have:** Add clinic data import tooling.
- **Nice To Have:** Add provider availability intelligence.

### Technical Improvements

- **Must Have:** Add transactions for appointment booking, queue check-in, prescription finalization, and user/role workflows.
- **Must Have:** Add tenant-scoped indexes and unique constraints for patient codes, appointment slots, and queue tokens.
- **Must Have:** Add concurrency-safe appointment booking and queue claim patterns.
- **Must Have:** Add audit logs for sensitive reads and writes.
- **Should Have:** Add concurrency tests for appointment booking and queue claims.
- **Nice To Have:** Add domain event contracts for future notifications and reporting.

### Security Improvements

- **Must Have:** Verify every protected route has authentication, tenant resolution, RBAC, and validation.
- **Must Have:** Prevent client-provided tenant IDs from overriding authenticated tenant scope.
- **Must Have:** Add cross-tenant integration tests for critical clinic workflows.
- **Should Have:** Add route-level permission coverage reporting.
- **Should Have:** Add support-access reason code audit policy.
- **Nice To Have:** Evaluate field-level encryption needs for high-risk PHI fields.

### Infrastructure Improvements

- **Must Have:** Enable MySQL integration tests in CI.
- **Must Have:** Validate Prisma migrations against production-compatible MySQL.
- **Must Have:** Add seed/test data strategy for tenants, users, RBAC, patients, appointments, and queue.
- **Should Have:** Add repeatable local integration environment for developers.
- **Nice To Have:** Add anonymized production-like test datasets.

### Scaling Improvements

- **Must Have:** Add indexes for appointment calendar, queue, patient lookup, and doctor schedule access patterns.
- **Must Have:** Review query plans for high-volume list APIs.
- **Should Have:** Cache reference data such as doctors, branches, clinic settings, and RBAC grants.
- **Should Have:** Add API response limits and defensive pagination caps.
- **Nice To Have:** Define patient search/indexing options for later scale.

### Monitoring Improvements

- **Must Have:** Add metrics for appointment booking success/failure, queue wait time, and consultation completion.
- **Must Have:** Track validation failures, RBAC denials, and cross-tenant access attempts.
- **Should Have:** Add dashboards for clinic operations and doctor workload.
- **Should Have:** Add slow query and database lock-wait visibility.
- **Nice To Have:** Add product analytics for patient retention and visit frequency.

### Refactoring Requirements

- **Must Have:** Keep business logic out of routes and controllers.
- **Must Have:** Keep tenant-owned data access behind repositories or approved module services.
- **Must Have:** Replace generic legacy flows with explicit domain workflows where invariants matter.
- **Should Have:** Extract shared appointment, queue, and schedule policy helpers.
- **Nice To Have:** Create reusable import/export mapping utilities.

## Month 7-9: Commercial, Messaging, And Worker Platform

Focus: durable asynchronous workflows and SaaS commercialization.

### Features

- **Must Have:** Implement Storage, Billing, Lab, Notifications, WhatsApp, durable jobs/outbox, and webhook ingestion.
- **Must Have:** Support billing invoices, payments, receipts, lab orders, lab reports, file uploads, and WhatsApp delivery.
- **Must Have:** Add payment-provider abstraction even if manual payments ship first.
- **Should Have:** Add notification and WhatsApp provider reconciliation.
- **Should Have:** Add worker dashboard and retry controls.
- **Nice To Have:** Add add-ons, metering alerts, and integration marketplace groundwork.

### Technical Improvements

- **Must Have:** Add idempotency keys, retries, atomic claims, and dead-letter handling.
- **Must Have:** Replace unsafe money handling with decimal-safe storage and calculation in canonical schema.
- **Must Have:** Add unique constraints for invoice numbers, receipt numbers, provider message IDs, and active WhatsApp accounts.
- **Must Have:** Add durable outbox/event patterns for external side effects.
- **Should Have:** Add webhook replay tooling.
- **Nice To Have:** Add priority queues per workload.

### Security Improvements

- **Must Have:** Add private S3 buckets, KMS encryption, signed URL expiration, upload limits, and malware scanning strategy.
- **Must Have:** Validate file type, file size, ownership, and tenant scope before upload and download.
- **Must Have:** Secure WhatsApp webhook verification and replay protection.
- **Must Have:** Audit billing, payment, lab, storage, and messaging state changes.
- **Should Have:** Add secrets management through AWS Secrets Manager or SSM Parameter Store.
- **Nice To Have:** Add storage retention policies by document type.

### Infrastructure Improvements

- **Must Have:** Add production worker process model for jobs, outbox, notifications, and webhooks.
- **Must Have:** Add Redis-backed Socket.IO scaling.
- **Must Have:** Add S3 bucket policies, CORS, lifecycle baseline, and encryption configuration.
- **Should Have:** Add queue admin dashboard with restricted RBAC.
- **Should Have:** Add deployment separation for API and workers.
- **Nice To Have:** Add storage tiering policy.

### Scaling Improvements

- **Must Have:** Move external side effects out of request/response paths.
- **Must Have:** Add queue lag, retry, and dead-letter capacity planning.
- **Must Have:** Add indexes for jobs by tenant, status, run time, and attempt state.
- **Should Have:** Cache active WhatsApp account, templates, billing plan limits, and tenant settings.
- **Should Have:** Add WebSocket connection limits and rate limits.
- **Nice To Have:** Define extraction criteria for notifications and reporting services.

### Monitoring Improvements

- **Must Have:** Add worker heartbeat, queue lag, failed job, dead-letter, and retry metrics.
- **Must Have:** Add WebSocket connection, room, emit failure, disconnect reason, and fanout latency metrics.
- **Must Have:** Add S3 upload/download failure and malware scan metrics.
- **Should Have:** Add WhatsApp delivery dashboards and provider error tracking.
- **Should Have:** Add billing/payment reconciliation dashboards.
- **Nice To Have:** Add integration provider scorecards.

### Refactoring Requirements

- **Must Have:** Move notification, WhatsApp, storage, billing, and lab side effects behind module services and job contracts.
- **Must Have:** Remove synchronous provider calls from user-facing request paths where reliability or latency is at risk.
- **Must Have:** Standardize money, status, and external reference models.
- **Should Have:** Create provider adapter interfaces for WhatsApp, payments, and storage scanning.
- **Nice To Have:** Prepare service extraction boundaries without splitting services prematurely.

## Month 10-12: Launch Hardening And Scale Readiness

Focus: production readiness for controlled launch.

### Features

- **Must Have:** Implement Reports, Exports, Subscriptions, usage metering, and plan enforcement.
- **Must Have:** Add async export flows for reports and audit data.
- **Must Have:** Add subscription lifecycle, plan limits, usage counters, and billing enforcement.
- **Should Have:** Add admin support workflows with reason codes and audit trails.
- **Should Have:** Add patient communication consent management.
- **Nice To Have:** Add public SDK/client generation.

### Technical Improvements

- **Must Have:** Move heavy reports to async exports, aggregate tables, snapshots, and read-optimized paths.
- **Must Have:** Run load, soak, backup/restore, migration rollback, WebSocket, worker, and disaster recovery tests.
- **Must Have:** Add migration rollback and failed-deployment recovery runbooks.
- **Should Have:** Add query-plan review for high-volume APIs.
- **Should Have:** Add compatibility/deprecation policy for API changes.
- **Nice To Have:** Add chaos and fault-injection tests.

### Security Improvements

- **Must Have:** Complete final security review for Auth, RBAC, Tenancy, Audit, Storage, Billing, Workers, and WebSockets.
- **Must Have:** Block release on critical/high vulnerabilities.
- **Must Have:** Verify audit coverage for every sensitive write and required read.
- **Must Have:** Validate backup encryption, object storage encryption, and secret rotation.
- **Should Have:** Add formal incident response and breach notification runbooks.
- **Nice To Have:** Add compliance readiness mapping for enterprise customers.

### Infrastructure Improvements

- **Must Have:** Add AWS IaC for VPC, ALB, ECS/EKS, RDS, Redis, S3, KMS, IAM, CloudWatch, and secrets.
- **Must Have:** Deploy RDS Multi-AZ with automated backups and PITR.
- **Must Have:** Add production Nginx/load-balancer TLS, security headers, upload limits, and WebSocket upgrade validation.
- **Should Have:** Add blue/green or canary deployment.
- **Should Have:** Add centralized structured log retention and access policies.
- **Nice To Have:** Add cross-region backup replication.

### Scaling Improvements

- **Must Have:** Load test for 10,000 concurrent users and 100,000 appointments/day target assumptions.
- **Must Have:** Validate DB connection pool sizing, worker concurrency, Redis capacity, and WebSocket topology.
- **Must Have:** Prove report generation does not overload OLTP queries.
- **Should Have:** Add tenant-aware cache invalidation strategy.
- **Should Have:** Add read replica strategy for reports and dashboards.
- **Nice To Have:** Add partitioning/sharding strategy for very large tenants.

### Monitoring Improvements

- **Must Have:** Add dashboards, SLOs, alerts, runbooks, synthetic checks, and on-call procedures.
- **Must Have:** Monitor API latency, errors, DB pool, slow queries, lock waits, queue lag, worker failures, WebSocket connections, storage failures, and audit integrity.
- **Must Have:** Add backup validation and restore drill reporting.
- **Should Have:** Add business KPI monitoring for clinic activation, appointments, queue wait time, message delivery, and revenue.
- **Should Have:** Add release health scorecards.
- **Nice To Have:** Add executive availability and reliability reporting.

### Refactoring Requirements

- **Must Have:** Remove launch-blocking legacy code paths from the production runtime.
- **Must Have:** Freeze module contracts and migration state before production onboarding.
- **Must Have:** Ensure every module follows tenant, RBAC, audit, validation, logging, and error-handling standards.
- **Should Have:** Create extraction-ready boundaries for notifications, reporting, storage scanning, payment/webhook processing, and search.
- **Nice To Have:** Create long-term architecture scorecards per module.

## Priority Summary

### Must Have Before Launch

- Canonical backend selection: `backend-new` as the production runtime.
- Secure auth with HTTP-only cookies, refresh rotation, session tracking, and token versioning.
- Standard RBAC and tenant isolation across every protected API.
- Audit logging for sensitive writes and required reads.
- Critical/high dependency remediation.
- CI/CD with lint, build, tests, Prisma validation, npm audit, Docker build, and migration preflight.
- Production migration strategy and release gates.
- Core clinic workflows: patients, records, schedules, appointments, queue, clinical, vitals, prescriptions.
- Database constraints and indexes for patient codes, appointment slots, queue tokens, invoice numbers, receipt numbers, provider IDs, and active WhatsApp accounts.
- Durable worker/outbox platform with idempotency, retries, atomic claims, and dead letters.
- Redis-backed rate limiting, cache, worker, and WebSocket infrastructure where needed.
- Observability with logs, metrics, dashboards, alerts, SLOs, runbooks, and synthetic checks.
- Backup, restore, PITR, and disaster recovery validation.
- AWS IaC for VPC, ALB, ECS/EKS, RDS, Redis, S3, KMS, IAM, CloudWatch, and secrets.

### Should Have Before Broad Rollout

- OpenAPI baseline and generated client strategy.
- RBAC route coverage and tenant isolation contract tests.
- Frontend and E2E tests for core clinic workflows.
- Query-plan review for high-volume APIs.
- Worker dashboard and retry controls.
- Payment-provider abstraction and reconciliation dashboards.
- Blue/green or canary deployment.
- Centralized log retention and access policies.
- Cache strategy for RBAC grants, settings, reference data, billing limits, and WhatsApp configuration.
- API compatibility and deprecation policy.

### Nice To Have After Launch

- ADR library for major architecture decisions.
- Clinic data import tooling and anonymized test datasets.
- Provider availability intelligence.
- Integration marketplace groundwork.
- Priority queues per workload.
- Cross-region backup replication.
- Public SDK/client generation.
- Business KPI monitoring and executive reporting.
- Partitioning/sharding strategy for very large tenants.
- Long-term service extraction scorecards.

## CTO Success Criteria

- One backend is clearly selected, maintained, deployed, and monitored.
- Every tenant-owned query is scoped by trusted tenant context.
- Every protected route has authentication, tenant resolution, RBAC, validation, and audit where required.
- Every external side effect is idempotent, queued when appropriate, retryable, and observable.
- Every financial value uses decimal-safe storage and calculation.
- Every deployment is reproducible through CI/CD and infrastructure as code.
- Every production incident has enough logs, metrics, traces, alerts, and runbooks to diagnose quickly.
- Backup restore and disaster recovery are tested before onboarding real clinics.
- Load tests prove the platform can support the stated launch assumptions.
