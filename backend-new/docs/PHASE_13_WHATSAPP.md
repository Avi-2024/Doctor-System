# PHASE 13 - WhatsApp

## Objective

Build WhatsApp provider integration as a delivery adapter behind Notifications.

## Modules

- WhatsApp
- WhatsApp Accounts
- WhatsApp Templates
- WhatsApp Messages
- Webhooks

## Dependencies

- Phase 12 Notifications.
- Phase 11 Storage where files are involved.
- Jobs and audit.

## Deliverables

- WhatsApp account linking.
- Encrypted credential references.
- Template CRUD/status tracking.
- Template variable validation.
- Outbound message persistence.
- Provider adapter boundary.
- Raw webhook endpoint.
- Signature/timestamp/replay validation.
- Message status synchronization.
- Reconciliation worker.

## Tests

- Invalid signature rejected.
- Duplicate webhook ignored.
- Invalid template variables rejected.
- Provider timeout retries.
- Non-retriable provider errors fail fast.
- Cross-tenant message access blocked.

## Exit Criteria

- WhatsApp is a provider implementation, not a business source of truth.

## Risks

- Provider outage must not affect appointments, clinical workflows, or billing.

