# Backup Recovery Runbook

## Purpose

This runbook defines backup and recovery expectations for the Doctor System healthcare SaaS product.

The launch target is a controlled outpatient MVP first, and `backend-new` is the canonical production backend.

Healthcare SaaS cannot rely on backups unless restore has been tested. Recovery evidence is required before production launch.

## Recovery Targets

Initial targets unless changed by CTO:

- **RPO:** 15 minutes.
- **RTO:** 4 hours.

These targets must be validated before broad rollout.

## Backup Requirements

- Enable automated database backups.
- Enable point-in-time recovery.
- Store backups encrypted.
- Validate backup completion daily.
- Keep backup access restricted and audited.
- Do not run production migrations unless backup status is healthy.

## Restore Drill Cadence

- Monthly restore drill before beta.
- Quarterly restore drill after launch.
- Additional restore drill before major migration or infrastructure change.

Every drill must produce evidence:

- Date and owner.
- Source backup/PITR timestamp.
- Restore target environment.
- Duration.
- Validation checks.
- Issues found.
- Follow-up actions.

## Tenant Restore Process

1. Confirm tenant, incident scope, requested restore point, and approval.
2. Restore database snapshot/PITR into isolated recovery environment.
3. Validate tenant ownership and row counts.
4. Extract tenant-scoped data through approved tooling.
5. Validate restored data against expected clinic records.
6. Import through approved recovery workflow.
7. Audit the restore.
8. Notify Customer Success and affected clinic.

Tenant restore must not expose other tenants' data.

## S3/Object Recovery

1. Identify missing or corrupted object keys.
2. Confirm tenant ownership.
3. Restore from versioning/backup if available.
4. Validate metadata in database.
5. Reconnect metadata and object state.
6. Audit recovery.
7. Run orphan detection after recovery.

## Failed Migration Recovery

1. Stop rollout.
2. Preserve logs and migration output.
3. Identify whether migration changed data, schema, or both.
4. Use rollback plan only if compatible.
5. If not compatible, restore from backup/PITR into recovery environment.
6. Decide repair, forward fix, or restore with CTO approval.
7. Run validation before reopening traffic.

## Accidental Tenant Deletion Response

1. Declare incident severity.
2. Freeze related destructive jobs.
3. Identify deletion scope.
4. Restore into isolated environment.
5. Reconstruct tenant data using tenant restore process.
6. Audit actor, request ID, and root cause.
7. Complete postmortem.

## Data Corruption Response

1. Stop writes to affected workflow if corruption is active.
2. Identify affected tenants, tables, and time window.
3. Preserve current state for forensic analysis.
4. Restore snapshot into recovery environment.
5. Compare corrupted and recovered data.
6. Repair or restore with CTO approval.
7. Notify affected customers if required.

## DR Rehearsal

Before broad rollout, run a disaster recovery rehearsal that validates:

- Database restore.
- Object storage recovery.
- Secrets availability.
- Application deployment.
- Worker startup.
- WebSocket/API health.
- Monitoring and alerting.
- Customer communication process.

## Shared Policies

- No production release without migration dry-run and rollback review.
- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.
- No P0 debt can remain open for paid beta.
