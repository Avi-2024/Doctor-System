# Team Structure

## Purpose

This document defines the engineering organization for launching and operating the Doctor System healthcare SaaS product.

The launch target is a controlled outpatient MVP first. `backend-new` is the canonical backend. V2 expansion areas such as patient portal, telemedicine, insurance, pharmacy, AI, government integrations, and device integrations remain out of launch scope.

## Launch Organization

| Role | Primary Accountability |
| --- | --- |
| VP Engineering / CTO | Final technical owner for launch readiness, architecture, risk acceptance, release approval, and incident escalation. |
| Product Lead | MVP scope, customer workflow validation, UAT criteria, launch messaging, and product tradeoff decisions. |
| Engineering Manager | Delivery planning, staffing, execution rhythm, cross-team coordination, and blocker removal. |
| Tech Lead | Technical design, module boundaries, code quality, review standards, and implementation sequencing. |
| Backend Engineers | `backend-new` modules, Prisma/MySQL, RBAC, tenant isolation, audit, jobs, APIs, and transactions. |
| Frontend Engineers | Staff-facing clinic workflows, protected routes, UX consistency, frontend tests, and release readiness. |
| QA Lead | Test strategy, UAT scripts, regression gates, E2E coverage, and release quality signoff. |
| DevOps / SRE | CI/CD, IaC, environments, monitoring, deployment, on-call tooling, backup, and recovery. |
| Security / Compliance Owner | Security reviews, vulnerability gates, PHI controls, audit evidence, access reviews, and incident handling. |
| Data Migration Owner | Migration mapping, staging dry-runs, validation reports, rollback plans, and production migration signoff. |
| Customer Success Lead | Pilot clinic coordination, onboarding, support workflow, training, feedback capture, and customer communication. |

## Domain Ownership

| Domain | Owner | Backup |
| --- | --- | --- |
| Identity / RBAC / Tenant | Backend Lead | Security Owner |
| Patients / Appointments / Queue | Product Engineering Lead | QA Lead |
| Clinical / Prescriptions / Lab | Clinical Workflow Lead | Product Lead |
| Billing / Subscriptions | Billing Engineering Lead | Security Owner |
| Notifications / WhatsApp / Jobs | Platform Engineering Lead | Backend Lead |
| Infrastructure / Monitoring / DR | DevOps / SRE Lead | CTO |

## Launch Staffing Model

### 90-Day MVP Team

- 1 foundation/backend engineer for Auth, RBAC, tenant, users, audit.
- 1 clinic workflow engineer for patients, records, branches, settings, schedules.
- 1 operations workflow engineer for appointments, queue, realtime views.
- 1 clinical/billing engineer for consultations, vitals, prescriptions, invoices, payments.
- 1 platform/QA engineer for notifications, reports, jobs, tests, monitoring, backup validation.

### V1 Broad Rollout Expansion

Before V1 broad rollout, add or formally assign:

- Dedicated Platform / Infrastructure owner.
- Dedicated Security / Compliance owner.
- Dedicated QA automation owner.
- Dedicated SRE/on-call owner.
- Dedicated Customer Success Engineering owner.

## Escalation Paths

| Trigger | First Escalation | Final Escalation |
| --- | --- | --- |
| Release blocker | Engineering Manager | CTO |
| Security finding | Security Owner | CTO |
| Data migration issue | Data Migration Owner | CTO |
| Production incident | Incident Commander | CTO |
| Customer escalation | Customer Success Lead | Product Lead / CTO |
| Scope disagreement | Product Lead | CTO |
| Architecture disagreement | Tech Lead | CTO |

## RACI

| Activity | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| Normal release | Engineering Manager | CTO | QA, DevOps, Security | Customer Success |
| Hotfix release | Tech Lead | CTO | QA, DevOps | Customer Success |
| Production incident | Incident Commander | CTO | Tech Lead, SRE, Security | Product, Customer Success |
| Data migration | Data Migration Owner | CTO | QA, Backend Lead, Product | Customer Success |
| Security finding | Security Owner | CTO | Tech Lead, DevOps | Product, Customer Success |
| UAT signoff | QA Lead | Product Lead | Customer Success, Engineering Manager | CTO |
| Beta launch | Product Lead | CTO | Engineering Manager, QA, Security, DevOps | Entire team |

## Operating Rules

- No production release without passing lint, build, tests, Prisma validation, npm audit, migration dry-run, and rollback review.
- No protected route without auth, tenant resolution, RBAC, validation, logging, and audit where required.
- No tenant-owned query without trusted tenant context.
- No critical workflow without transaction safety and idempotency where retries are possible.
- No production incident without a postmortem if customer data, uptime, billing, security, or clinical workflow was affected.
- No launch expansion while P0 debt remains open.
- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.
