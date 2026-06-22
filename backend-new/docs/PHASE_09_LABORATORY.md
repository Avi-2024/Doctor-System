# PHASE 09 - Laboratory

## Objective

Build lab catalog, lab orders, lab order items, and lab reports.

## Modules

- Lab Tests
- Lab Orders
- Lab Order Items
- Lab Reports

## Dependencies

- Phase 08 Clinical.
- Phase 05 Patients.
- Phase 11 Storage integration for files.
- Phase 12 Notifications for publication alerts.

## Deliverables

- Lab categories.
- Lab tests and pricing.
- Lab order creation/cancel/complete.
- Lab order items with test and price snapshots.
- Lab report draft/upload/review/publish.
- Lab report download through storage.
- Lab report audit and events.

## Tests

- Inactive tests cannot be ordered.
- Lab order requires at least one item.
- Price snapshot preserved.
- Published report immutable.
- Report download authorized and audited.
- Cross-tenant order/report blocked.

## Exit Criteria

- Lab records can feed clinical timeline, billing, reports, and notifications.

## Risks

- Report publish approval must be finalized.
- File upload security depends on Storage phase.

