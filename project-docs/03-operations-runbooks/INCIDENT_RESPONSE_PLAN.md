# Incident Response Plan

## Purpose

This plan defines how the team responds to production incidents affecting the Doctor System healthcare SaaS product.

The launch target is a controlled outpatient MVP first, and `backend-new` is the canonical production backend.

Production incidents involving customer data, uptime, billing, security, or clinical workflow require disciplined response and postmortem review.

## Severity Levels

| Severity | Definition | Examples |
| --- | --- | --- |
| SEV1 | Critical customer, data, security, or availability incident | PHI leak, auth bypass, full outage, data loss, payment corruption, cross-tenant access |
| SEV2 | Major workflow outage or serious degradation | Degraded DB, queue/job failure affecting clinics, appointment booking down, billing unavailable |
| SEV3 | Partial workflow issue or provider degradation | WhatsApp provider outage, non-critical report failure, degraded WebSocket updates |
| SEV4 | Minor bug or support-only issue | Cosmetic issue, non-critical admin bug, low-impact support request |

## Incident Roles

| Role | Responsibility |
| --- | --- |
| Incident Commander | Owns incident coordination, severity, decisions, escalation, and closure. |
| Tech Lead | Owns technical investigation and remediation. |
| Comms Lead | Owns internal and customer-facing updates. |
| Scribe | Maintains timeline, actions, decisions, and evidence. |
| Customer Support Lead | Coordinates affected customers and support tickets. |
| Security Lead | Leads PHI, auth, tenant isolation, or suspicious activity incidents. |

## Response Timelines

| Severity | Acknowledge | First Update | Update Cadence |
| --- | ---: | ---: | ---: |
| SEV1 | 5 minutes | 15 minutes | Every 15 minutes |
| SEV2 | 15 minutes | 30 minutes | Every 30 minutes |
| SEV3 | 1 hour | 2 hours | Every 4 hours |
| SEV4 | 1 business day | As needed | As needed |

## Triage Flow

1. Acknowledge alert or report.
2. Assign Incident Commander.
3. Confirm severity.
4. Create incident channel or ticket.
5. Identify customer impact and affected tenants.
6. Stabilize first, root-cause second.
7. Decide rollback, failover, mitigation, or hotfix.
8. Communicate status.
9. Confirm recovery with metrics and customer workflow checks.
10. Close only after follow-up work is captured.

## PHI And Security Handling

Page Security Lead immediately for:

- Suspected PHI exposure.
- Cross-tenant access.
- Auth bypass.
- Token/session compromise.
- Suspicious export behavior.
- Unauthorized support/admin access.
- Malware or unsafe file upload.

Do not paste PHI, tokens, credentials, raw request bodies, or patient screenshots into chat channels or tickets.

## Customer Notification Policy

Notify customers when:

- Their workflow is materially disrupted.
- Their data may have been exposed or corrupted.
- A billing or clinical workflow may be incorrect.
- They need to take action.

Security and PHI notifications require CTO and Security/Compliance Owner approval.

## Rollback Rules

Rollback immediately when:

- A release causes auth, tenant, billing, clinical, or data integrity failures.
- Error rate or latency breaches SEV1/SEV2 thresholds after deploy.
- A migration causes data corruption or broad workflow failure.

Do not rollback blindly if a database migration is not backward compatible. Use the release rollback plan.

## Postmortem Rules

Postmortem is required for:

- All SEV1 incidents.
- All SEV2 incidents.
- Any security incident.
- Any data loss, data corruption, billing correctness, tenant isolation, or PHI event.

Postmortems must include:

- Timeline.
- Impact.
- Detection source.
- Root cause.
- What worked.
- What failed.
- Action items.
- Owners.
- Due dates.

## Operating Rules

- No production incident without a postmortem if customer data, uptime, billing, security, or clinical workflow was affected.
- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.
