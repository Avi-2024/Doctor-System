# Engineering Handbook

## Purpose

This handbook is the entrypoint for engineering standards, launch operations, and production ownership for the Doctor System healthcare SaaS product.

The launch target is a controlled outpatient MVP first. `backend-new` is the canonical backend. V2 expansion features remain out of scope until MVP/V1 gates are met.

## Engineering Principles

- **Patient safety:** Clinical workflows must be correct, traceable, and recoverable.
- **Tenant safety:** Cross-tenant data access must be impossible through normal product paths.
- **Auditability:** Sensitive actions must leave reliable evidence.
- **Operational discipline:** We do not ship what we cannot observe, roll back, or support.
- **Simple before clever:** A disciplined modular monolith beats premature distributed architecture.

## Architecture Summary

- Build inside `backend-new`.
- Use Node.js, Express.js, Prisma, MySQL, Socket.IO, AWS S3, and background workers.
- Follow Route -> Validator -> Controller -> Service -> Repository -> Prisma.
- Keep core domain logic in the modular monolith until scale, resilience, compliance, or ownership requires extraction.
- Treat legacy `backend` as reference and migration source only.

## Launch Scope Summary

MVP includes:

- Auth, RBAC, tenants, users, branches, settings.
- Patients and records.
- Doctor schedules and leaves.
- Appointments and queue.
- Clinical consultations, vitals, prescriptions.
- Basic billing.
- Notifications/reminders.
- Essential reports.
- Audit logs and jobs.

MVP excludes:

- Patient portal.
- Telemedicine.
- Insurance claims.
- Pharmacy inventory.
- Government integrations.
- Device integrations.
- AI.

## Non-Negotiables

- No production release without passing lint, build, tests, Prisma validation, npm audit, migration dry-run, and rollback review.
- No protected route without auth, tenant resolution, RBAC, validation, logging, and audit where required.
- No tenant-owned query without trusted tenant context.
- No critical workflow without transaction safety and idempotency where retries are possible.
- No production incident without a postmortem if customer data, uptime, billing, security, or clinical workflow was affected.
- No launch expansion while P0 debt remains open.
- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.

## Operating Documents

- [Team Structure](TEAM_STRUCTURE.md)
- [Development Guidelines](DEVELOPMENT_GUIDELINES.md)
- [Code Review Guidelines](CODE_REVIEW_GUIDELINES.md)
- [Incident Response Plan](INCIDENT_RESPONSE_PLAN.md)
- [On-Call Runbook](ON_CALL_RUNBOOK.md)
- [Monitoring Runbook](MONITORING_RUNBOOK.md)
- [Backup Recovery Runbook](BACKUP_RECOVERY_RUNBOOK.md)
- [Release Process](RELEASE_PROCESS.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

## Engineering Rituals

| Ritual | Cadence | Owner |
| --- | --- | --- |
| Weekly launch review | Weekly until beta | Engineering Manager |
| Incident review | After every SEV1/SEV2/security/data incident | Incident Commander |
| Security review | Weekly during launch, monthly after | Security Owner |
| Architecture review | Biweekly during launch | Tech Lead |
| Tech debt review | Monthly | CTO / Tech Lead |
| Release readiness review | Before every production release | Release Owner |
| Customer feedback review | Weekly during beta | Product Lead |

## New Engineer Onboarding

New engineers must read:

1. `ENGINEERING_HANDBOOK.md`.
2. `DEVELOPMENT_GUIDELINES.md`.
3. `CODE_REVIEW_GUIDELINES.md`.
4. `MVP_SCOPE.md`.
5. `LAUNCH_READINESS_PLAN.md`.
6. `TECHNICAL_DEBT_REGISTER.md`.

Then they should:

- Set up local development.
- Run lint, build, tests, and Prisma validation.
- Review module boundaries.
- Pair on one code review.
- Pair on one incident or runbook drill.
- Ship one low-risk change through the full review process.

## Ownership Standard

Every feature must have:

- Product owner.
- Engineering owner.
- QA owner.
- Security/compliance reviewer if sensitive.
- Operational owner if it affects production runtime.
- Monitoring and rollback plan.

## Launch Discipline

The product should launch only when it is safe to operate, not when the feature list is impressive.

The first goal is a trustworthy outpatient clinic operating system. Enterprise expansion comes after production proof.
