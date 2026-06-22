# PHASE 06 - Appointments

## Objective

Build scheduling, availability, and appointment lifecycle workflows.

## Modules

- Doctor Schedules
- Doctor Leaves
- Appointments

## Dependencies

- Phase 04 Tenants.
- Phase 05 Patients.
- Users with doctor roles.
- RBAC.

## Deliverables

- Doctor schedule CRUD.
- Doctor leave CRUD/cancel.
- Availability lookup.
- Appointment booking transaction.
- Appointment reschedule.
- Appointment cancel.
- Confirm/no-show/complete transitions.
- Appointment audit and events.
- Idempotency for booking/reschedule.

## Tests

- Past booking rejected.
- Schedule conflict rejected.
- Leave conflict rejected.
- Double booking blocked.
- Invalid status transition blocked.
- Patient/doctor/branch clinic ownership enforced.
- Idempotent retry returns existing booking.

## Exit Criteria

- Appointment workflows are transactional and safe for queue/check-in.

## Risks

- Appointment overlap cannot be solved by a simple unique key; service checks and transaction locks are required.
- Timezone and branch schedule rules must be explicit.

