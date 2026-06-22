# Deployment Checklist

## Purpose

This checklist defines the pre-deploy, deploy, and post-deploy process for the Doctor System healthcare SaaS product.

The launch target is a controlled outpatient MVP first. The canonical backend is `backend-new`. Deployments must protect tenant data, clinical workflows, billing correctness, and production reliability.

## Pre-Deployment Checklist

- [ ] Release scope approved.
- [ ] Branch is clean and release tag/commit is identified.
- [ ] CI is green.
- [ ] Lint passes.
- [ ] Build passes.
- [ ] Tests pass.
- [ ] Prisma validation passes.
- [ ] npm audit gate passes.
- [ ] Security scan reviewed.
- [ ] Environment variables verified.
- [ ] Secrets verified through approved secret manager.
- [ ] Migrations reviewed.
- [ ] Migration dry-run completed.
- [ ] Backup completed and backup health confirmed.
- [ ] Rollback plan ready.
- [ ] On-call notified.
- [ ] Customer Support notified for customer-visible changes.
- [ ] Monitoring dashboards open.

## Deployment Checklist

- [ ] Apply migrations through approved migration job.
- [ ] Verify migration success.
- [ ] Deploy `backend-new`.
- [ ] Deploy workers.
- [ ] Deploy frontend.
- [ ] Validate API health.
- [ ] Validate readiness checks.
- [ ] Validate database connectivity.
- [ ] Validate Redis/cache connectivity where applicable.
- [ ] Validate WebSocket path.
- [ ] Validate jobs/worker claiming.
- [ ] Validate providers: WhatsApp, email/SMS, storage, payment where applicable.
- [ ] Confirm logs are flowing.
- [ ] Confirm metrics are flowing.

## Post-Deployment Checklist

- [ ] Smoke test login.
- [ ] Smoke test patient lookup/registration.
- [ ] Smoke test appointment booking.
- [ ] Smoke test queue check-in.
- [ ] Smoke test consultation workflow.
- [ ] Smoke test prescription export.
- [ ] Smoke test billing invoice/payment path.
- [ ] Smoke test reminder/job path.
- [ ] Monitor API errors.
- [ ] Monitor p95 latency.
- [ ] Monitor DB connections and slow queries.
- [ ] Monitor queue lag and dead letters.
- [ ] Monitor WebSocket disconnects.
- [ ] Monitor auth/security events.
- [ ] Confirm no tenant/RBAC anomalies.
- [ ] Update release board.
- [ ] Notify Customer Support deployment is complete.
- [ ] Keep heightened monitoring for 60 minutes.

## Rollback Checklist

- [ ] Incident Commander or Release Owner approves rollback.
- [ ] Confirm rollback compatibility with database migration.
- [ ] Stop or pause affected workers if needed.
- [ ] Roll back application version.
- [ ] Validate health/readiness.
- [ ] Run smoke tests.
- [ ] Monitor errors, latency, DB, and queues.
- [ ] Communicate status.
- [ ] Open postmortem if customer impact occurred.

## Migration Safety Checklist

- [ ] Migration is reviewed by backend and DevOps/SRE.
- [ ] Backup is healthy.
- [ ] Migration dry-run completed.
- [ ] Lock/time impact reviewed.
- [ ] Rollback or forward-fix path documented.
- [ ] Migration owner is present.

## Shared Policies

- No production release without passing lint, build, tests, Prisma validation, npm audit, migration dry-run, and rollback review.
- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.
