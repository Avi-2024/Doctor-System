# Delivery Master Plan

## Executive Summary

This master plan is the VP Engineering execution control document for delivering the Doctor System healthcare SaaS product from the approved architecture into controlled beta and production launch.

The launch strategy is intentionally staged:

- `backend-new` is the canonical backend.
- The first launch target is outpatient clinics.
- Controlled paid beta happens before broad production rollout.
- Phase 1 Foundation, Sprint 1 Auth Core, and Sprint 2 RBAC Foundation are treated as completed and merged into the delivery baseline.
- Future delivery stays sprint-based, gated, and evidence-driven.

The delivery objective is not only to ship features. The objective is to launch a tenant-safe, secure, auditable, operationally supportable SaaS product without damaging trust, clinical operations, billing correctness, or patient data confidentiality.

## Delivery Assumptions

| Assumption | Default |
| --- | --- |
| Sprint cadence | 2 weeks |
| Backend strategy | `backend-new` is canonical; legacy `backend` is reference only |
| Launch model | Controlled paid beta, then capped production rollout |
| MVP customer | Outpatient clinic, not hospital/inpatient enterprise |
| Initial team | 5 engineers for MVP execution |
| Expanded team before V1 rollout | Backend, frontend, QA, DevOps/SRE, Security/Compliance, Data/Migration, Customer Success/UAT |
| Sprint 1 status | Completed: Auth Core |
| Sprint 2 status | Completed: RBAC Foundation |
| Future sprints | Planned, not implemented |
| Delivery gates | Security, tenant isolation, migration safety, observability, backup/restore, QA, and UAT must pass before launch expansion |

## Sprint-By-Sprint Execution Plan

| Sprint | Status | Deliverables | Dependencies | Main Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| Sprint 1: Auth Core | Completed | Login, refresh rotation, logout, `/auth/me`, HTTP-only cookies, Auth tests, Auth docs, Auth Postman collection | Phase 1 Foundation, users schema, audit foundation | Token leakage, refresh reuse handling, missing failure audit | Auth APIs work through cookies; refresh token rotation and reuse detection verified | `lint`, `build`, and tests pass; auth cookies and refresh rotation verified |
| Sprint 2: RBAC Foundation | Completed | Permission catalog, roles, user roles, effective permission resolver, `/rbac/*`, `/users/me`, RBAC tests/docs/Postman | Auth Core, request context, audit foundation | Privilege escalation, weak route protection, stale tokens after role changes | RBAC allow/deny tests pass; role assignment invalidates old access tokens | RBAC denial/allow tests pass; token version invalidation works |
| Sprint 3: Tenants, Users, Branches, Settings | Planned | Clinic onboarding transaction, branches, settings, owner/default roles, tenant guards | Auth, RBAC | Partial tenant creation, bad default permissions, tenant override | New clinic can be onboarded with owner, branch, settings, roles, and audit evidence | Onboarding rollback tests, tenant isolation tests, and audit coverage pass |
| Sprint 4: Patients And Records | Planned | Patient CRUD, patient records, search/filter/sort/pagination, PHI audit | Tenants, RBAC | Cross-tenant PHI exposure, duplicate patients, weak search indexes | Clinic staff can safely create, search, update, and view patient records | Cross-tenant API tests and patient-code uniqueness pass |
| Sprint 5: Schedules, Appointments, Queue | Planned | Doctor schedules/leaves, booking/reschedule/cancel/check-in, queue call-next | Patients, branches, users | Double booking, duplicate queue tokens, race conditions | Reception can run daily appointment and queue workflows without conflicts | Concurrency tests for booking and queue token generation pass |
| Sprint 6: Clinical, Vitals, Prescriptions, Basic Billing | Planned | Consultation workflow, vitals, prescription finalization, invoice/payment/receipt baseline | Appointments, Queue, Patients | Mutable clinical records, decimal/money errors, payment inconsistency | Doctor and billing staff can complete a visit from consultation to payment | Immutability, audit, decimal, and payment idempotency tests pass |
| Sprint 7: Storage, Lab, Notifications | Planned | S3 abstraction, lab orders/reports, notification jobs/templates | Clinical, Billing, Jobs foundation | PHI file exposure, unsafe signed URLs, duplicate notifications | Files, lab reports, and reminders are tenant-safe and job-backed | File ownership tests, signed URL tests, and worker retry/dead-letter tests pass |
| Sprint 8: WhatsApp, Workers, WebSockets | Planned | WhatsApp provider adapter, webhook verification, durable outbox/jobs, Redis-backed Socket.IO | Notifications, tenant settings | Webhook replay, provider outages, realtime tenant leakage | Realtime queue and messaging workflows work across multiple instances | Webhook signature tests, queue lag metrics, and WebSocket tenant-room tests pass |
| Sprint 9: Reports, Exports, Subscriptions | Planned | Essential reports, async exports, usage metering, plan enforcement | Core workflow data, Jobs, Storage, Billing | OLTP overload, cross-tenant exports, bad plan enforcement | Clinic owners can export reports safely; subscriptions enforce limits | Export authorization tests, report query-plan review, and plan limit tests pass |
| Sprint 10: Launch Hardening | Planned | CI/CD gates, AWS IaC baseline, monitoring, alerts, backup/restore drill, load/soak tests, UAT closure | All MVP modules | Weak operations, untested rollback, insufficient observability | Platform is ready for controlled beta and staged production rollout | Production readiness review signed by CTO, QA, Security, DevOps, and Product |

## Team Allocation Plan

| Workstream | Responsible | Accountable | Consulted | Informed | Ownership |
| --- | --- | --- | --- | --- | --- |
| Backend Team | Backend Engineers | Tech Lead / Engineering Manager | Security, QA, DevOps | Product, Customer Success | Owns `backend-new`, Prisma schema, APIs, services, repositories, tests, docs, and Postman collections |
| Frontend Team | Frontend Engineers | Product Engineering Lead | Backend, QA, Security | Product, Customer Success | Owns cookie-auth integration, protected route shell, clinic workflows, doctor/reception/billing screens, and no-token-localStorage policy |
| QA Team | QA Lead / QA Engineers | Engineering Manager | Backend, Frontend, Product | CTO, Customer Success | Owns integration tests, E2E tests, tenant isolation tests, RBAC tests, concurrency tests, regression gates, and UAT scripts |
| Security/Compliance | Security Owner | CTO | Backend, DevOps, QA | Product, Customer Success | Owns auth review, RBAC review, PHI logging/redaction, audit coverage, dependency scanning, and pre-launch security gate |
| Platform/DevOps | DevOps/SRE | CTO / VP Engineering | Backend, Security, QA | Product, Support | Owns CI/CD, Docker, staging, AWS IaC, RDS, Redis, S3, monitoring, backups, releases, rollback, and on-call readiness |
| Data/Migration | Data Migration Owner | CTO / Product Lead | Backend, QA, Customer Success | Clinic stakeholders | Owns import mapping, dry-runs, validation reports, rollback plan, and final migration signoff |
| Customer Success/UAT | Customer Success Lead | Product Lead | QA, Backend, Frontend | CTO, Engineering Manager | Owns pilot clinic coordination, UAT scripts, training feedback, onboarding playbook, and support readiness |

Initial MVP staffing should prioritize backend and QA depth because tenant isolation, RBAC, appointment concurrency, billing correctness, and migration safety carry the highest launch risk. Before V1 broad rollout, add dedicated Platform/SRE, Security/Compliance, QA automation, and Customer Success Engineering capacity.

## Milestone Plan

### Backend Milestones

| Milestone | Deliverables | Dependencies | Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| Foundation/Auth/RBAC complete | Foundation middleware, Auth Core, RBAC Foundation, migration artifacts, docs, Postman collections | Approved architecture, Prisma foundation | Auth drift, missing route permissions, weak test coverage | Authenticated requests resolve identity and effective permissions | Lint/build/tests pass; Auth/RBAC route tests pass; docs current |
| Tenants/Users/Branches/Settings complete | Clinic onboarding, users, branches, settings, default roles/settings, tenant guards | Auth/RBAC | Partial onboarding, tenant override, bad defaults | New clinic can be created with usable owner and branch | Transaction rollback tests, audit tests, tenant tests pass |
| Patients/Appointments/Queue complete | Patient registry, records, schedules, booking, queue | Tenants, users, branches, RBAC | PHI leakage, double booking, queue races | Clinic can run registration, appointment, and reception workflows | Cross-tenant, concurrency, and state transition tests pass |
| Clinical/Prescriptions/Billing complete | Consultation, vitals, prescriptions, invoices, payments, receipts | Patients, appointments, queue | Medical record mutation, decimal errors, payment inconsistency | Visit can move from doctor workflow to receipt correctly | Immutability, audit, decimal, and payment idempotency tests pass |
| Notifications/Storage/Reports complete | S3 abstraction, notifications, lab files, essential reports, async exports | Jobs/outbox, billing, clinical | PHI file exposure, duplicate sends, OLTP overload | Files, messages, and reports are tenant-safe and observable | Signed URL, worker, export, and report query-plan tests pass |

### Frontend Milestones

| Milestone | Deliverables | Dependencies | Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| Secure login and session bootstrap | Login screen, cookie auth flow, session bootstrap, logout | Auth Core | Token storage regression, bad session state | Users can log in/out without JavaScript-readable tokens | No token in `localStorage`; auth smoke tests pass |
| Protected shell and permission-aware navigation | Protected route shell, permission-aware menu, current-user display | RBAC Foundation | Hidden routes accessible directly, stale permission UI | UI reflects permissions and direct-route denial works | Route guard and RBAC UI tests pass |
| Patient registry/profile | Patient list, create/edit forms, profile, records timeline | Patients APIs | PHI overexposure, poor search UX | Staff can register and find patients quickly | E2E patient flow passes |
| Appointment/queue workspaces | Calendar, booking, check-in, queue dashboard, doctor queue view | Appointments/Queue APIs | State mismatch, realtime drift | Reception can operate daily schedule and queue | E2E appointment/queue flow passes |
| Doctor clinical workspace and billing screens | Consultation, vitals, prescription builder, invoice/payment UI | Clinical/Billing APIs | Clinical data loss, billing confusion | Doctor and billing workflows complete without re-entry | Clinic-day E2E flow passes |

### QA Milestones

| Milestone | Deliverables | Dependencies | Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| Unit/integration baseline | Service, repository, validator, API tests | Backend modules | Low confidence merges | Every module has focused tests | CI blocks failed tests |
| Tenant isolation and RBAC matrix coverage | Cross-tenant tests, route-permission coverage | Auth/RBAC/Tenants | PHI exposure | Every protected route has auth/RBAC/tenant test coverage | Coverage report reviewed |
| Concurrency tests | Appointment booking, queue tokens, payment idempotency, job claims | Core workflows | Race conditions in production | Concurrent actions produce consistent results | Concurrency suite passes repeatedly |
| E2E clinic-day flow | Login -> patient -> appointment -> queue -> consultation -> prescription -> payment -> report | Frontend/backend stable APIs | Workflow gaps found too late | Full day-in-clinic workflow passes | E2E suite required before beta |
| Regression gate for beta and production | Smoke, regression, migration validation, UAT checklist | Feature-complete MVP | Release regression | Release candidate is repeatably verifiable | QA signs beta/prod release |

### Security Milestones

| Milestone | Deliverables | Dependencies | Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| Cookie auth and token storage review | HTTP-only cookie verification, refresh rotation review, no localStorage check | Auth/frontend integration | Token theft | Browser auth flow has no JavaScript-readable tokens | Security owner signs Auth review |
| Critical/high dependency remediation | npm audit, dependency review, remediation evidence | CI/CD | Known vulnerable dependencies ship | No critical/high findings before beta | Security gate passes |
| RBAC route coverage | Route-permission matrix, platform bypass review, denial tests | RBAC APIs | Privilege escalation | Every protected route declares permission | RBAC coverage report approved |
| PHI logging/redaction/audit review | Log redaction tests, validation safety, audit matrix | Core modules | PHI or secrets leak | No passwords/tokens/PHI in logs/errors | Security/QA signoff |
| Final pre-launch security review | Auth, RBAC, tenancy, audit, storage, billing, jobs, WebSockets review | Feature-complete release candidate | Launching with critical exposure | No critical/high security issues remain | CTO/Security signoff |

### Infrastructure Milestones

| Milestone | Deliverables | Dependencies | Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| CI/CD gates | Lint, build, tests, Prisma validation, npm audit, Docker build, migration dry-run | Repo scripts, Docker | Unsafe releases | CI blocks broken or vulnerable releases | Required checks enabled |
| Production-like staging | MySQL, Redis, S3-compatible storage, workers, WebSockets, logs, metrics | IaC baseline | Environment drift | Staging mirrors production topology | Staging parity checklist complete |
| AWS IaC baseline | VPC, ALB, ECS/EKS, RDS, Redis, S3, KMS, IAM, CloudWatch, secrets | Platform design | Manual, unreproducible infra | Environments are reproducible | IaC review complete |
| Monitoring/alerts/logging | Dashboards, SLOs, alerts, structured logs, synthetic checks | App metrics/logging | Blind incidents | On-call can diagnose failures quickly | Alert drills pass |
| Backup/restore and DR drill | RDS PITR, restore drill, rollback rehearsal, DR runbook | Production-like staging | Unrecoverable data loss | Restore process works within target RTO/RPO | Restore evidence attached to launch review |

### UAT Milestones

| Milestone | Deliverables | Dependencies | Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| Friendly clinic selection | 2-3 outpatient clinics, contacts, schedules, expectations | Product/Customer Success | Wrong pilot users | Pilot clinics match MVP scope | UAT roster approved |
| Seeded staging tenants | Clinic-specific test tenants, users, roles, demo data | Tenants, users, RBAC | Bad UAT data invalidates feedback | Clinics can test realistic workflows | Data validation complete |
| Role-based UAT scripts | Owner, doctor, receptionist, clinical staff, billing scripts | Core workflows | Unstructured feedback | UAT follows repeatable workflow scripts | Scripts approved by Product/QA |
| UAT issue triage | Blocker/major/minor/training classification | UAT execution | Support noise blocks engineering | Issues are classified and owned | No untriaged blockers |
| UAT signoff | UAT summary, unresolved-risk list, go/no-go recommendation | UAT closure | Launching with known blockers | No blockers in core day flow | Product/QA/Customer Success signoff |

### Beta Launch Milestones

| Milestone | Deliverables | Dependencies | Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| Controlled paid beta | 2-5 outpatient clinics, capped onboarding, launch checklist | UAT signoff, production readiness | Too many clinics too early | Small cohort runs core workflows daily | No critical data/security/billing issues |
| Daily monitoring for first 14 days | Daily health review, incident review, support review | Monitoring/alerts | Slow issue detection | Issues are found and owned daily | 14-day review complete |
| Weekly customer success reviews | Clinic feedback, adoption metrics, support themes | Customer Success | Customer churn from training gaps | Clinics know how to use core workflows | Weekly notes and action items complete |
| Support/on-call active | On-call schedule, escalation, support SLA | Runbooks, monitoring | Long unresolved incidents | Incidents are triaged quickly | On-call review passes |
| Beta exit review | Stability, security, support, workflow, revenue evidence | Beta data | Scaling before proof | Beta cohort is stable and supportable | CTO approves production rollout gate |

### Production Launch Milestones

| Milestone | Deliverables | Dependencies | Risks | Success Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| CTO/Security/QA/DevOps/Product signoff | Final launch review and signoff evidence | All launch gates | Accountability gaps | Every owner signs readiness | Written go/no-go captured |
| Migration/rollback approved | Migration plan, dry-run evidence, rollback plan | Data/Migration, DevOps | Data loss or downtime | Migration can be repeated safely | DBA/CTO signoff |
| Load/soak/backup/restore passed | Load tests, soak tests, restore drill, DR evidence | Production-like staging | Production collapse under load | System meets launch assumptions | Test evidence attached |
| Dashboards and alerts active | API, DB, worker, WebSocket, billing, notification, backup dashboards | Monitoring stack | Blind launch | On-call sees system health clearly | Alert routing verified |
| Capped staged rollout | Growth cap, onboarding approval, support readiness | Beta exit approval | Uncontrolled growth | Clinics are added at supportable pace | Weekly rollout review active |

## Launch Gates

- No protected route without auth, tenant context, RBAC, validation, logging, and audit where required.
- No tenant-owned query without trusted tenant context.
- No critical workflow without transactions and idempotency where retries are possible.
- No beta while critical/high security findings remain open.
- No production launch without backup restore drill, migration rollback rehearsal, monitoring, alerts, and on-call.
- No broad rollout while P0 debt remains open.
- No launch expansion without Product, QA, Security, DevOps, and CTO signoff.
- No customer migration without dry-run evidence and rollback approval.

## Top 20 Failure Reasons And Controls

| Failure Reason | Control |
| --- | --- |
| 1. Scope creep before MVP freeze | Scope change board and CTO approval |
| 2. Running two backends in parallel | `backend-new` only for launch |
| 3. Weak tenant isolation | Mandatory cross-tenant tests and repository contracts |
| 4. Incomplete RBAC coverage | Route-permission coverage report |
| 5. Auth token leakage | HTTP-only cookies, no `localStorage`, security review |
| 6. Missing audit coverage | Audit matrix per module |
| 7. Double booking appointments | DB constraints and concurrency tests |
| 8. Queue token races | Atomic counters and transactions |
| 9. Billing money errors | Decimal-safe storage and payment idempotency |
| 10. PHI in logs/errors | Redaction tests and logging review |
| 11. Poor migration discipline | Dry-run, rollback plan, DBA signoff |
| 12. No production-like staging | Staging parity checklist |
| 13. Weak CI/CD gates | Block merge/deploy on failed lint/build/tests/audit |
| 14. Missing observability | Dashboards, SLOs, alerts, runbooks |
| 15. Backup not proven | Restore drills before launch |
| 16. Worker/job failures | Durable queues, retries, dead letters, metrics |
| 17. WebSocket tenant leakage | Clinic-scoped rooms and tenant join validation |
| 18. Reporting overloads OLTP | Async exports and aggregate/read-optimized paths |
| 19. UAT feedback ignored | Blocker/major/minor triage and signoff gates |
| 20. Support burden underestimated | Beta support SLA, daily review, onboarding playbook |

## VP Engineering Operating Rules

- The sprint is not done until code, tests, docs, Postman/API artifacts, and migration notes are current.
- Every sprint must end with `lint`, `build`, tests, Prisma validation, and security/dependency checks where applicable.
- Engineering, QA, Security, DevOps, Product, and Customer Success must share one launch blocker board.
- P0 issues block beta and production expansion.
- P1 issues require explicit CTO acceptance if deferred.
- Any tenant isolation, RBAC, billing correctness, clinical record integrity, or PHI exposure defect is treated as launch blocking.
- UAT feedback must be triaged as blocker, major, minor, or training before release decisions.
- Production rollout must remain capped until operating metrics prove the product is stable and supportable.
