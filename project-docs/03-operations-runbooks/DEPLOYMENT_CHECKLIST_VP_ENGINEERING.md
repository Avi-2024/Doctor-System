# Deployment Checklist VP Engineering

## Purpose

This is the VP Engineering deployment checklist for the Doctor System healthcare SaaS platform.

This file is intentionally parallel to the existing `DEPLOYMENT_CHECKLIST.md`. It does not replace that document.

## Deployment Principles

- `backend-new` is canonical.
- Controlled outpatient MVP launch comes first.
- No deployment proceeds while P0 debt is open.
- No deployment proceeds without rollback review.
- No production release proceeds without monitoring and on-call coverage.

## Pre-Deploy Gate

- [ ] Release scope approved.
- [ ] Release owner assigned.
- [ ] Incident commander/on-call identified.
- [ ] Customer Support notified if customer-visible.
- [ ] Branch is clean and commit/tag identified.
- [ ] CI is green.
- [ ] `npm run lint` passed.
- [ ] `npm run build` passed.
- [ ] `npm test` passed.
- [ ] Prisma validation passed.
- [ ] npm audit gate passed.
- [ ] Security scan reviewed.
- [ ] Migration dry-run completed.
- [ ] Backup status healthy.
- [ ] Rollback plan reviewed.
- [ ] Monitoring dashboards ready.

## Environment And Secrets

- [ ] Required environment variables present.
- [ ] Secrets stored in approved secret manager.
- [ ] No secrets committed.
- [ ] Cookie settings reviewed for environment.
- [ ] CORS origins reviewed.
- [ ] Rate limits reviewed.
- [ ] Database connection pool settings reviewed.

## Migration Gate

- [ ] SQL reviewed.
- [ ] Lock risk reviewed.
- [ ] Data backfill plan reviewed if applicable.
- [ ] Rollback/forward-fix plan documented.
- [ ] Backup or snapshot completed.
- [ ] Migration owner present.
- [ ] Migration is applied through approved job, not developer laptop.

## Deploy Steps

- [ ] Pause or drain affected workers if required.
- [ ] Apply migration.
- [ ] Verify migration success.
- [ ] Deploy `backend-new`.
- [ ] Deploy workers.
- [ ] Deploy frontend.
- [ ] Validate health endpoint.
- [ ] Validate readiness endpoint.
- [ ] Validate database connectivity.
- [ ] Validate Redis/cache/WebSocket path where applicable.
- [ ] Validate S3/provider connectivity where applicable.

## Post-Deploy Smoke Tests

- [ ] Login.
- [ ] Current user/session.
- [ ] Patient lookup or registration.
- [ ] Appointment booking.
- [ ] Queue check-in.
- [ ] Consultation workflow.
- [ ] Prescription workflow.
- [ ] Billing workflow.
- [ ] Worker/job path.
- [ ] WebSocket event path where applicable.
- [ ] Audit/log entries visible.

## Monitoring Window

Monitor for at least 60 minutes:

- [ ] API error rate.
- [ ] API p95 latency.
- [ ] DB pool and slow queries.
- [ ] Queue lag and dead letters.
- [ ] Worker failures.
- [ ] WebSocket disconnects.
- [ ] Auth failures and token reuse.
- [ ] RBAC denials and tenant mismatch attempts.
- [ ] Billing/payment failures.
- [ ] Backup/DR alerts.

## Rollback Decision Rules

Rollback when:

- Auth/session behavior is broken.
- Tenant isolation is suspect.
- RBAC bypass exists.
- Billing correctness is broken.
- Clinical workflow is blocked.
- Error rate or latency breaches release threshold.
- Migration causes broad workflow failure and rollback is compatible.

Do not roll back blindly when migrations are not backward-compatible. Use the approved migration recovery plan.

## Release Evidence

Record:

- Commit/tag.
- Migration version.
- CI run.
- Tests run.
- Deployment start/end time.
- Smoke test result.
- Monitoring result.
- Incidents or anomalies.
- Rollback decision if applicable.

## Completion Criteria

- [ ] All post-deploy checks pass.
- [ ] Monitoring window completed.
- [ ] Release board updated.
- [ ] Customer Support notified.
- [ ] Known issues documented.
- [ ] Follow-up tickets created.
