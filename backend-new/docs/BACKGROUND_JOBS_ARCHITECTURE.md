# Background Jobs Architecture

## Purpose

Background jobs execute asynchronous, retryable, and long-running work outside request-response paths.

Primary responsibilities:

- Notification delivery.
- WhatsApp delivery and reconciliation.
- Outbox event publishing.
- Report generation.
- Export generation.
- Audit export generation.
- Storage orphan detection.
- File retention and purge.
- Subscription expiration and usage enforcement.
- Appointment reminders.
- Dead-letter recovery.
- Webhook processing.

## Principles

- Business transactions do not wait for external providers.
- Workers are idempotent.
- Jobs are tenant-aware.
- Job state is persisted.
- Failed jobs retry with backoff.
- Retry exhaustion moves jobs to dead letter.
- Workers use the same logging, request/correlation, tenant, and audit standards as APIs.
- External calls never occur inside database business transactions.

## Core Tables

`jobs`:

- id.
- clinic_id nullable for platform jobs.
- job_type.
- status.
- priority.
- payload_json.
- attempts.
- max_attempts.
- run_at.
- locked_by.
- locked_at.
- completed_at.
- last_error.
- idempotency_key.
- created_at.
- updated_at.

`job_attempts`:

- id.
- job_id.
- attempt_number.
- status.
- started_at.
- finished_at.
- error_message.
- metadata_json.

`dead_letter_jobs`:

- id.
- job_id.
- clinic_id.
- failure_reason.
- payload_json.
- failed_at.
- resolved_at.
- resolution_notes.

Specialized queues/tables:

- notification_jobs.
- outbox_events.
- export_jobs.
- webhook_events.

## Worker Transaction Pattern

Claim:

1. Find due job by status, priority, and run_at.
2. Lock row.
3. Mark processing.
4. Increment attempt count.
5. Commit claim.

Execute:

1. Run job logic.
2. Use idempotency guard.
3. Persist result.
4. Mark completed or schedule retry.

Failure:

1. Record attempt failure.
2. If attempts remain, schedule next retry.
3. If exhausted, move to dead letter.
4. Emit audit/alert where required.

## Outbox Publisher

Purpose:

- Reliably publish domain events after business transaction commit.

Flow:

1. Business service writes outbox event inside transaction.
2. Outbox worker scans pending events.
3. Worker locks event.
4. Publishes to internal event bus.
5. Marks event published.
6. Consumers process idempotently.
7. Failures retry.
8. Exhausted failures move to `dead_letter_events`.

Rules:

- Events are immutable.
- Events are versioned.
- Tenant-owned events include tenantId.
- Consumers track processed event ids.
- Sensitive payloads are prohibited.
- `processed_events` and `dead_letter_events` intentionally do not enforce foreign keys to `outbox_events` because outbox retention may purge published source rows while consumer idempotency and dead-letter diagnostics must remain queryable.

## Notification Workers

Responsibilities:

- Claim notification jobs.
- Resolve provider/channel adapter.
- Enforce quiet hours and priority.
- Deliver message.
- Persist provider response.
- Update notification status.
- Create delivery record.
- Retry transient failures.
- Dead-letter permanent failures.

Retry schedule:

- 1 minute.
- 5 minutes.
- 15 minutes.
- 1 hour.
- 6 hours.
- Dead letter.

## WhatsApp Workers

Worker types:

- outbound message delivery.
- webhook processing.
- provider status reconciliation.
- template status synchronization.

Rules:

- Provider calls are asynchronous.
- Every outbound message is persisted before delivery.
- Webhooks are signature-validated and idempotent.
- Provider status maps to internal status.
- Reconciliation repairs missing delivery updates.

Retry schedule:

- 1 minute.
- 5 minutes.
- 15 minutes.
- 1 hour.
- 6 hours.
- Dead letter.

Non-retriable failures:

- Invalid phone number.
- Invalid template.
- Blocked recipient.
- Rejected content.

## Scheduled Jobs

Recommended scheduled jobs:

- Appointment reminder generation.
- Subscription expiry scan.
- Subscription usage reset.
- WhatsApp reconciliation.
- Notification retry scan.
- Storage orphan detection.
- Storage retention and purge scan.
- Report aggregate rebuild.
- Audit tamper verification.
- Session cleanup.
- Expired token cleanup.
- Dead-letter alerting.
- Backup validation hook, if infrastructure exposes status.

## Report and Export Workers

Responsibilities:

- Generate heavy reports asynchronously.
- Use read replicas or aggregate tables where available.
- Persist report snapshots.
- Generate CSV/PDF/archive files.
- Store exports through Storage module.
- Apply retention and signed URL access.
- Notify requester when ready.

Rules:

- Heavy reports must not run in request path.
- Exports are tenant-scoped.
- Failed exports retain diagnostics.

## Storage Workers

Responsibilities:

- Virus scan coordination if scanning is asynchronous.
- Orphan object detection.
- Retention transition.
- Archive transition.
- Purge after retention.
- Storage metrics aggregation.

Orphan detection:

- Object exists but metadata missing.
- Metadata exists but object missing.
- Run daily.
- Audit and repair or flag for manual review.

## Webhook Workers

Flow:

1. Raw webhook endpoint validates signature enough to reject invalid source.
2. Persist webhook event.
3. Worker processes event idempotently.
4. Update provider-related records.
5. Audit processing.
6. Emit domain event if needed.

Rules:

- Duplicate provider events are ignored safely.
- Invalid signatures return `401`.
- Replay protection is mandatory.

## Priorities

Priority order:

1. Critical security notifications.
2. Appointment/queue operational notifications.
3. Payment and billing notifications.
4. Lab report notifications.
5. Reports and exports.
6. Maintenance and cleanup.

Priority must not bypass tenant isolation or idempotency.

## Monitoring

Metrics:

- queued jobs by type.
- processing jobs by type.
- completed jobs.
- failed jobs.
- dead-letter jobs.
- average job latency.
- retry count.
- worker heartbeat.
- lock age.
- stuck jobs.
- provider latency.

Alerts:

- worker offline.
- dead-letter growth.
- stuck processing jobs.
- outbox lag.
- notification queue backlog.
- webhook failure spike.
- export failure spike.

## Invariants

- Workers are idempotent.
- Jobs are persisted.
- Jobs are tenant-aware.
- Failed jobs retry with backoff.
- Retry exhaustion moves to dead letter.
- Worker crashes do not lose jobs.
- External calls do not run inside business transactions.
- Every critical job is observable.
- Dead-letter records are recoverable.
