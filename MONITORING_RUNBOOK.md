# Monitoring Runbook

## Purpose

This runbook defines required monitoring for the Doctor System healthcare SaaS product.

The launch target is a controlled outpatient MVP first, and `backend-new` is the canonical production backend.

Monitoring must prove that outpatient clinic workflows, tenant isolation, security-sensitive actions, billing, jobs, and infrastructure are healthy.

## Required Dashboards

| Dashboard | Required Signals |
| --- | --- |
| API | Request rate, p50/p95/p99 latency, error rate, route errors, saturation, status codes |
| DB | Connection pool, slow queries, lock waits, deadlocks, replication lag, storage, CPU, memory |
| Workers / Jobs | Queue depth, lag, claim rate, success rate, retry rate, dead letters, heartbeat |
| WebSockets | Active connections, room count, disconnects, emit failures, fanout latency |
| Auth / Security | Login failures, token reuse, suspicious IPs, session revokes, MFA/SSO events when available |
| Tenant / RBAC | RBAC denials, tenant mismatch attempts, platform override, cross-tenant guard failures |
| Billing | Invoice creation, payment success/failure, refund activity, duplicate prevention, reconciliation errors |
| Notifications / WhatsApp | Delivery success, provider errors, retries, failed templates, webhook failures |
| Storage | Upload failures, signed URL generation, malware scan status, orphan files, S3 errors |
| Backup / DR | Last backup time, PITR status, restore drill status, backup failures |
| Release / Migration | Deployment health, migration status, rollback readiness, schema drift, failed release checks |
| Business Workflows | Appointment success, queue wait time, consultation completion, prescription finalization, reminder delivery |

## Required Alerts

| Alert | Initial Severity |
| --- | --- |
| API 5xx error rate breach | SEV2 |
| API p95 latency breach | SEV2 |
| DB pool saturation | SEV2 |
| Slow query spike | SEV3 |
| Deadlock/lock wait spike | SEV2 |
| Queue lag breach | SEV2 |
| Dead-letter spike | SEV2 |
| Worker heartbeat missing | SEV2 |
| WebSocket disconnect spike | SEV3 |
| Failed login spike | SEV2 |
| RBAC denial spike | SEV3, SEV2 if suspicious |
| Tenant mismatch attempt | SEV2 |
| Backup failure | SEV2 |
| Reminder delivery failure | SEV3, SEV2 if broad |
| Payment failure spike | SEV2 |
| Audit write failure | SEV1 |
| Migration failure | SEV1 if production data/workflows are affected, otherwise SEV2 |

## SLO Placeholders

Define final SLOs before beta and revise after real usage.

Initial placeholders:

- API availability: 99.5% during beta.
- API p95 latency: less than 500ms for normal APIs.
- Appointment booking success: 99% excluding validation failures.
- Queue check-in success: 99%.
- Reminder delivery job processing: 95% within configured window.
- Backup success: 100% daily.
- Audit write success: 100% for critical workflows.

## Monitoring By Launch Stage

### Before Beta

- API, DB, worker, backup, auth/security, and business workflow dashboards active.
- Alerts route to on-call.
- Synthetic health checks active.
- At least one restore drill completed.

### During Beta

- Daily dashboard review for first 14 days.
- Weekly customer impact review.
- Tune thresholds from real clinic usage.

### Before Broad Rollout

- SLOs approved.
- Alert fatigue reviewed.
- Runbooks tested.
- On-call handoff practiced.
- Customer Success has visibility into workflow health.

## Escalation

- Security alerts page Security/Compliance Owner.
- DB and infrastructure alerts page DevOps/SRE.
- Billing alerts page Billing Lead.
- Clinical workflow alerts page Product Lead and Tech Lead.
- Tenant isolation or audit alerts page CTO immediately.

## Shared Policies

- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.
- No production release without monitoring coverage for changed critical workflows.
