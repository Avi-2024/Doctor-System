# PHASE 10 - Billing

## Objective

Build invoice, payment, receipt, refund, credit note, and financial ledger workflows.

## Modules

- Billing
- Invoices
- Payments
- Receipts
- Refunds
- Credit Notes
- Financial Transactions

## Dependencies

- Phase 05 Patients.
- Phase 06 Appointments.
- Phase 09 Laboratory.
- Audit logs.

## Deliverables

- Invoice create/update/finalize/cancel.
- Invoice items.
- Server-side subtotal, discount, tax, total, paid, due.
- Payment recording.
- Payment allocation.
- Receipt generation.
- Refund processing.
- Credit notes.
- Append-only financial ledger.

## Tests

- Decimal precision.
- Overpayment rejected.
- Negative balance impossible.
- Duplicate payment idempotency.
- Refund requires original payment.
- Finalized invoice immutable except adjustment/refund.
- Tenant-scoped financial access.

## Exit Criteria

- Financial source of truth is reliable and auditable.

## Risks

- Tax/payment provider details are not jurisdiction-specific yet.
- Financial records must not use floating point numbers.

