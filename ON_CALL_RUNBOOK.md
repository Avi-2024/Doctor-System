# On-Call Runbook

## Purpose

This runbook defines on-call responsibilities for the Doctor System healthcare SaaS product.

The launch target is a controlled outpatient MVP first, and `backend-new` is the canonical production backend.

On-call exists to protect patient safety, tenant safety, clinical workflow continuity, billing correctness, and customer trust.

## Rotation Expectations

- Every production week has a primary and secondary on-call engineer.
- Primary owns acknowledgement, triage, and coordination until handed off.
- Secondary assists with investigation, rollback, escalation, and customer impact review.
- Security incidents page Security/Compliance Owner immediately.
- Database, deployment, and infrastructure incidents page DevOps/SRE immediately.

## Handoff Checklist

At shift handoff, review:

- Open incidents.
- Recent deployments.
- Known degraded providers.
- Queue/backlog state.
- Backup status.
- Error-rate and latency trends.
- Upcoming migrations or releases.
- Customer escalations.

## Alert Triage Flow

1. Acknowledge alert.
2. Check dashboard for scope and blast radius.
3. Identify affected tenant(s), route(s), worker(s), or provider(s).
4. Classify severity.
5. Open incident if SEV1/SEV2 or uncertain.
6. Stabilize customer workflow.
7. Roll back if release-caused and safe.
8. Escalate according to domain.
9. Record timeline and actions.

## Escalation Ladder

| Incident Type | Escalate To |
| --- | --- |
| Auth/RBAC/tenant issue | Security Owner + Tech Lead |
| PHI/data exposure | Security Owner + CTO |
| Database saturation/data issue | DevOps/SRE + Backend Lead |
| Billing correctness | Billing Lead + Product Lead |
| Clinical workflow outage | Product Lead + Tech Lead |
| Queue/job failure | Platform Lead + DevOps/SRE |
| Provider outage | Platform Lead + Customer Success |
| Deployment failure | DevOps/SRE + Release Owner |

## Common Playbooks

### API Errors Spike

- Check recent deployments.
- Compare errors by route, tenant, and status code.
- Inspect logs with request IDs.
- Roll back if deployment-caused.
- Page module owner if route-specific.

### DB Saturation

- Check connection pool, slow queries, lock waits, and deadlocks.
- Identify top queries and tenants.
- Disable non-critical reports/exports if needed.
- Page DevOps/SRE and Backend Lead.

### Queue Lag

- Check worker health, claim rate, dead letters, and retry volume.
- Pause non-critical job types if needed.
- Scale workers only if DB capacity allows.
- Page Platform Lead.

### Worker Failure

- Check worker heartbeat and recent deploys.
- Inspect dead letters and poison messages.
- Restart worker only after confirming idempotency.
- Escalate if reminders, billing, exports, or audit are affected.

### WebSocket Failure

- Check connection count, room count, disconnect rate, and Redis adapter health.
- Confirm HTTP APIs still work.
- Notify Customer Success if queue display is degraded.
- Fall back to polling if available.

### Login/Auth Failures

- Check auth error rate, failed login spike, token reuse, cookie/session issues.
- Page Security Owner if suspicious or broad.
- Disable suspicious sessions if needed.

### Billing Failure

- Stop retrying payment/receipt jobs if duplicates are possible.
- Page Billing Lead.
- Preserve evidence and affected transaction IDs.
- Do not manually edit financial state without approval.

### WhatsApp/Provider Outage

- Confirm provider status.
- Queue messages for retry.
- Notify Customer Success.
- Avoid duplicate sends.

### Backup Failure

- Page DevOps/SRE.
- Confirm last successful backup and PITR window.
- Open SEV2 if backup failure exceeds policy.
- Do not deploy risky migrations until backup status is healthy.

## When To Roll Back

Roll back when:

- A release causes elevated SEV1/SEV2 errors.
- Auth, tenant, billing, or clinical workflow correctness is broken.
- A feature flag cannot isolate the issue.
- Customer impact is expanding.

Do not roll back if the database migration is not backward compatible without following the release rollback plan.

## When To Page Security

Page Security immediately for:

- PHI exposure.
- Cross-tenant data access.
- Auth bypass.
- Token/session compromise.
- Suspicious exports.
- Admin/support misuse.
- Webhook spoofing.
- Malware or unsafe file upload.

## Shared Policies

- No production incident without a postmortem if customer data, uptime, billing, security, or clinical workflow was affected.
- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.
