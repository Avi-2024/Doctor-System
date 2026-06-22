# PHASE 07 - Queue

## Objective

Build real-time clinic queue management with atomic token generation.

## Modules

- Queue
- Queue counters
- Queue WebSocket events

## Dependencies

- Phase 06 Appointments.
- Phase 04 Branches.
- Phase 03 RBAC.
- Initial WebSocket foundation.

## Deliverables

- Queue check-in.
- Atomic queue counter locking.
- Token generation per clinic/branch/day.
- Call next.
- In-progress.
- Complete.
- No-show.
- Cancel.
- Queue dashboard API.
- Queue socket broadcasts.

## Tests

- Concurrent check-ins do not duplicate tokens.
- Branch queue isolation.
- Invalid state transitions blocked.
- Appointment ownership validated.
- Socket broadcasts only to tenant/branch rooms.
- API refresh recovers missed socket state.

## Exit Criteria

- Reception workflows can run without manual token conflicts.

## Risks

- Race conditions in counters are high-impact.
- Socket events must never become source of truth.

