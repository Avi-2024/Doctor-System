# PHASE 14 - Reports and Exports

## Objective

Build dashboards, report requests, exports, snapshots, aggregates, and audit exports.

## Modules

- Reports
- Exports
- Audit Exports
- Report Aggregates

## Dependencies

- Business modules.
- Jobs.
- Storage.
- Audit logs.

## Deliverables

- Dashboard metrics.
- Report request API.
- Report generation jobs.
- Report snapshots.
- Aggregate tables.
- Report export jobs.
- Audit export jobs.
- Storage-backed export files.
- Signed URL access.

## Tests

- Tenant-scoped report queries.
- Super Admin cross-tenant reports only.
- Heavy reports are async.
- Export authorization.
- Export signed URL expiry.
- Aggregate rebuild correctness.

## Exit Criteria

- Reports do not degrade transactional API workloads.

## Risks

- Running heavy reports on primary OLTP MySQL can harm production latency.

