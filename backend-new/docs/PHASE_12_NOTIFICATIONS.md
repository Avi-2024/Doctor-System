# PHASE 12 - Notifications

## Objective

Build channel-agnostic notification orchestration with retries and delivery tracking.

## Modules

- Notifications
- Notification Jobs
- Notification Deliveries
- Dead-letter Notifications

## Dependencies

- Phase 01 Jobs.
- Phase 05 Patients.
- Phase 04 Users.
- Outbox events.

## Deliverables

- Notification create/schedule/cancel.
- Recipient resolution.
- Template/preference baseline.
- Delivery job creation.
- Worker claim/retry/dead-letter.
- Appointment reminder scheduling.
- Delivery status persistence.
- Notification audit.

## Tests

- Duplicate delivery prevented.
- Invalid recipient rejected.
- Quiet hours honored where configured.
- Retry backoff.
- Dead-letter after max attempts.
- Scheduled notification cancellation.
- Tenant isolation in workers.

## Exit Criteria

- Business modules can request notifications without provider coupling.

## Risks

- Notification preferences and templates must be explicit before multi-channel expansion.

