# Launch Readiness Plan

## Summary

This plan defines the practical path from current state to a controlled paid MVP launch, then a broader V1.0 rollout.

The launch strategy is intentionally staged:

- `backend-new` is the canonical launch backend.
- The MVP launch is for outpatient clinics only.
- The first launch is a controlled paid beta, not open-ended public signup.
- V2 features stay out of launch scope.

Explicitly excluded from launch scope:

- Patient portal.
- Telemedicine.
- Insurance claims.
- Pharmacy inventory.
- Government integrations.
- Device integrations.
- AI.

## Launch Milestones

### Development Milestones

- **Milestone 1 - Product Freeze:** Freeze MVP scope around Auth, RBAC, Tenants, Users, Branches, Settings, Patients, Records, Schedules, Appointments, Queue, Clinical, Vitals, Prescriptions, Basic Billing, Notifications, Reports, Audit, Jobs.
- **Milestone 2 - Backend Canonicalization:** Make `backend-new` the only launch backend; legacy `backend` becomes reference only.
- **Milestone 3 - Core Workflow Completion:** Complete patient registration, appointment booking, queue check-in/call-next, consultation, vitals, prescription finalization, invoice/payment/receipt, reminders, essential reports.
- **Milestone 4 - Launch Hardening:** Complete tenant isolation, RBAC enforcement, audit coverage, error handling, logging, pagination, validation, and operational runbooks.
- **Milestone 5 - Scope Lock:** No new feature enters launch scope after beta begins unless it fixes safety, data correctness, security, billing, or critical usability.

### Testing Milestones

- Unit tests for services, validators, repositories, and permission helpers.
- Integration tests for Auth, RBAC, tenant isolation, patients, appointments, queue, clinical, prescriptions, billing, notifications, reports, and jobs.
- Cross-tenant tests proving one clinic cannot read, write, or export another clinic's data.
- Concurrency tests for appointment booking, queue token generation, payment recording, and job claiming.
- E2E tests for the clinic day flow: login -> patient -> appointment -> check-in -> consultation -> prescription -> payment -> report.
- Regression test gate: lint, build, tests, Prisma validation, npm audit, Docker build, migration dry-run.

### Security Milestones

- Remove frontend token storage; use secure HTTP-only cookie/session model.
- Clear critical/high dependency findings before beta.
- Validate RBAC on every protected route and sensitive service workflow.
- Harden validation responses, logging, audit payloads, file exports, and signed URLs.
- Add security event monitoring for login failures, RBAC denials, tenant override, token reuse, and suspicious exports.
- Complete pre-launch security review for Auth, RBAC, Tenancy, Audit, Billing, Storage, Jobs, and WebSockets.

### Infrastructure Milestones

- CI/CD pipeline for `backend-new`, frontend, Docker image, tests, Prisma validation, audit, and deploy gates.
- Production-style staging environment with MySQL, Redis, object storage, worker process, WebSocket path, logs, metrics, and alerts.
- AWS IaC baseline for VPC, ALB, ECS/EKS or equivalent compute, RDS, Redis, S3, KMS, IAM, CloudWatch, and secrets.
- RDS Multi-AZ, automated backups, PITR, restore drill, and migration runbook.
- Structured logging, dashboards, SLOs, alerts, synthetic checks, and on-call runbook.

### Data Migration Milestones

- Define source-of-truth migration scope: clinics, users, roles, patients, records, schedules, appointments, billing balances where applicable.
- Create migration mapping document from legacy/backend or spreadsheet imports to canonical schema.
- Dry-run migration on staging with data validation reports.
- Validate row counts, tenant ownership, duplicate patients, appointment integrity, billing totals, and audit seed records.
- Run final pre-production migration rehearsal with rollback plan and sign-off.

### UAT Milestones

- Recruit 2-3 friendly outpatient clinics for UAT.
- Prepare seeded demo and clinic-specific staging tenants.
- Run role-based UAT scripts for Clinic Owner, Doctor, Receptionist, Clinical Staff, and Billing.
- Capture blocker, major, minor, and training feedback separately.
- UAT pass criteria: no blocker issues in core day flow, no tenant/RBAC defects, no billing correctness defects, no data-loss bugs.

### Beta Launch Milestones

- Controlled paid beta with 2-5 clinics.
- Launch only MVP scope; explicitly exclude patient portal, telemedicine, insurance, pharmacy, AI, and government integrations.
- Daily monitoring review for first 14 days.
- Weekly customer success check-ins.
- Support SLA and incident response process active.
- Beta exit criteria: stable uptime, no critical security/data issues, successful backup restore drill, core workflows used daily, support burden understood.

### Production Launch Milestones

- Final production readiness review signed by CTO, Security, QA, DevOps, and Product.
- Production migration and rollback plan approved.
- Load, soak, backup/restore, WebSocket, worker, billing, and tenant-isolation tests passed.
- Monitoring dashboards and alerts active.
- Customer onboarding playbook complete.
- Launch with a capped clinic count and staged rollout, not open-ended signup.

## Day Roadmap

### Day 0 - Launch Program Start

- Freeze MVP and V1 launch scope.
- Confirm `backend-new` as canonical backend.
- Assign ownership for Development, QA, Security, DevOps, Data Migration, UAT, and Customer Success.
- Create release board with launch blockers, risks, milestones, and decision log.
- Define launch success metrics: uptime, error rate, appointment success, queue success, payment correctness, reminder delivery, support tickets.

### Day 30 - Foundation And Core Workflow Alpha

- Auth, RBAC, tenant, users, branches, and settings complete enough for internal testing.
- Patients, records, schedules, appointments, queue, clinical, vitals, prescriptions, and basic billing in alpha.
- CI baseline active with lint, build, tests, Prisma validation, and npm audit.
- Security baseline underway: cookie auth, redaction, validation hardening, dependency cleanup.
- First internal E2E clinic-day flow running.

### Day 60 - Feature Complete Beta Candidate

- MVP feature-complete for staff-only clinic operations.
- Notifications/reminders, essential reports, audit logs, jobs, exports, and basic dashboards active.
- Cross-tenant, RBAC, appointment concurrency, queue concurrency, and payment correctness tests passing.
- Staging environment mirrors production topology.
- Migration dry-run completed with validation report.
- UAT scripts complete and first friendly clinic walkthroughs started.

### Day 90 - Controlled Paid Beta

- Launch controlled paid beta to 2-5 outpatient clinics.
- Block broad launch until no critical/high security findings remain.
- Backup restore drill completed.
- Monitoring dashboards, alerts, logs, runbooks, and support process live.
- Daily launch review for first 14 days.
- Beta success gate: stable core workflows, no tenant/RBAC breaches, no billing correctness issues, acceptable support volume.

### Day 180 - V1.0 Launch Readiness

- Expand from MVP to V1.0 outpatient platform: lab workflows, richer billing, storage, WhatsApp tracking, durable jobs, reports/exports, subscriptions.
- Complete load/soak tests and query-plan review.
- Add customer onboarding toolkit, training docs, migration templates, and support playbooks.
- Launch broader rollout with capped growth and onboarding approval.
- Product positioning remains outpatient clinic SaaS, not hospital/insurance/pharmacy/telemedicine platform.

### Day 365 - Scale And Competitive Expansion

- Add V1.1/V2 candidates based on customer evidence: patient portal-lite, digital intake, online payments, no-show/waitlist automation, advanced analytics, customer success dashboard.
- Add enterprise controls: access reviews, audit packages, retention policies, compliance evidence, stronger data export/offboarding.
- Add integration roadmap: payment gateway, lab partners, eRx/pharmacy path, FHIR/HL7 only after core stability.
- Improve scale posture: read replicas, report aggregates, cache strategy, queue backend upgrade if metrics demand it.
- Prepare valuation-ready operating evidence: uptime, retention, usage, security, compliance, support, revenue, and onboarding metrics.

## Acceptance Criteria

- `LAUNCH_READINESS_PLAN.md` exists at repo root.
- It includes the eight milestone groups requested: Development, Testing, Security, Infrastructure, Data Migration, UAT, Beta Launch, Production Launch.
- It includes Day 0, Day 30, Day 60, Day 90, Day 180, Day 365 roadmap sections.
- It preserves the MVP boundary and does not pull V2 features into launch.
- It is documentation-only; no code, schema, config, or infrastructure files are changed.
- Manual validation is enough: confirm headings, launch gates, roadmap dates, and scope exclusions.

## Assumptions

- Launch means controlled paid MVP first, then V1.0 broader rollout after pilot evidence.
- `backend-new` is the launch backend.
- The first launch target is outpatient clinics, not hospitals.
- Patient portal, telemedicine, insurance claims, pharmacy inventory, government EHR integrations, device integrations, and AI are postponed.
- The launch plan is a CTO/product operating artifact, not an implementation ticket list.
