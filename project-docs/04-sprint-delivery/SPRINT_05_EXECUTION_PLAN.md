# Sprint 5 Execution Plan

## Sprint Goal

Build the operational clinic scheduling layer for `backend-new`: doctor schedules, doctor leaves, appointment booking and lifecycle, queue check-in, queue token generation, queue progression, and minimal realtime queue event contracts.

## Source Review Notes

- `PRODUCT_ROADMAP.md` is missing; `project-docs/00-executive-reviews/ROADMAP_12_MONTHS.md` is used as the roadmap source.
- `IMPLEMENTATION_PHASES.md` exists at `backend-new/docs/IMPLEMENTATION_PHASES.md`.
- `DELIVERY_MASTER_PLAN.md` exists at `project-docs/01-product-launch/DELIVERY_MASTER_PLAN.md`.
- `SPRINT_04_ACCEPTANCE_REPORT.md` exists at `project-docs/04-sprint-delivery/SPRINT_04_ACCEPTANCE_REPORT.md`.
- Sprint 5 maps to `backend-new/docs/PHASE_06_APPOINTMENTS.md` and `backend-new/docs/PHASE_07_QUEUE.md`.

## Sprint 4 Entry Risk

The user has accepted Sprint 4 as business direction. The current `SPRINT_04_ACCEPTANCE_REPORT.md` still says Sprint 4 is **not accepted yet** because MySQL evidence and artifact alignment remain open.

Sprint 5 may start only if this contradiction is handled one of two ways:

- CTO explicitly accepts the Sprint 4 MySQL/artifact gaps as carried technical debt.
- Sprint 4 acceptance artifacts are updated before Sprint 5 implementation begins.

## Business Value

Sprint 5 lets outpatient clinics run the daily front-desk workflow:

- Find doctor availability.
- Book appointments without double booking.
- Reschedule and cancel visits.
- Check patients in.
- Generate queue tokens.
- Call the next patient.
- Keep reception and doctor queue views synchronized from database-backed state.

## User Stories

- As a receptionist, I can view doctor availability and book an appointment without double booking.
- As a receptionist, I can reschedule or cancel appointments with a reason.
- As a clinic admin, I can maintain doctor schedules and leave periods.
- As a receptionist, I can check in a patient and receive a unique token for the branch and day.
- As a doctor, I can view my current queue and see called or in-progress patients.
- As a clinic owner or admin, I can audit appointment and queue lifecycle changes.
- As a platform admin, I can troubleshoot tenant appointment and queue state with explicit tenant targeting.

## Database Changes

Create migration artifact:

- `backend-new/prisma/migrations/0005_schedules_appointments_queue.sql`

Add Prisma models:

| Model | Purpose | Required Fields And Constraints |
| --- | --- | --- |
| `doctor_schedules` | Doctor weekly/date-based availability | `clinic_id`, `doctor_id`, `branch_id`, weekday/date rules, start/end time, slot duration, timezone, status, soft delete, tenant-first indexes |
| `doctor_leaves` | Doctor unavailable periods | `clinic_id`, `doctor_id`, optional `branch_id`, `starts_at`, `ends_at`, reason, status, soft delete, overlap indexes |
| `appointments` | Appointment lifecycle source of truth | `clinic_id`, patient/doctor/branch refs, appointment date, start/end, status, source, reason, cancellation fields, idempotency key, active conflict key, soft delete |
| `appointment_status_history` | Append-only appointment transition evidence | `clinic_id`, appointment id, previous status, next status, reason, actor, created timestamp |
| `queue_counters` | Atomic queue token counter | Unique per `clinic_id + branch_id + queue_date` |
| `queue_entries` | Queue lifecycle source of truth | `clinic_id`, patient/doctor/branch/appointment refs, queue date, token number, priority, status timestamps, soft delete |

Required indexes and constraints:

- Unique appointment idempotency key per clinic.
- Unique active appointment conflict key for doctor/branch/time active states.
- Unique queue counter per clinic, branch, and queue date.
- Unique queue token per clinic, branch, and queue date.
- Index appointments by clinic/doctor/start/status.
- Index appointments by clinic/patient/appointment date.
- Index appointments by clinic/branch/appointment date/status.
- Index queue entries by clinic/branch/queue date/status.
- Index queue entries by clinic/doctor/queue date/status.
- Index queue entries by clinic/appointment id.

## APIs

### Doctor Schedules

- `GET /api/v1/doctor-schedules`
- `POST /api/v1/doctor-schedules`
- `GET /api/v1/doctor-schedules/:id`
- `PATCH /api/v1/doctor-schedules/:id`
- `DELETE /api/v1/doctor-schedules/:id`
- `GET /api/v1/doctor-schedules/availability`

### Doctor Leaves

- `GET /api/v1/doctor-leaves`
- `POST /api/v1/doctor-leaves`
- `GET /api/v1/doctor-leaves/:id`
- `PATCH /api/v1/doctor-leaves/:id`
- `POST /api/v1/doctor-leaves/:id/cancel`

### Appointments

- `GET /api/v1/appointments`
- `POST /api/v1/appointments`
- `GET /api/v1/appointments/:id`
- `PATCH /api/v1/appointments/:id`
- `POST /api/v1/appointments/:id/reschedule`
- `POST /api/v1/appointments/:id/cancel`
- `POST /api/v1/appointments/:id/confirm`
- `POST /api/v1/appointments/:id/no-show`
- `POST /api/v1/appointments/:id/complete`

### Queue

- `POST /api/v1/queue/check-in`
- `POST /api/v1/queue/call-next`
- `GET /api/v1/queue/dashboard`
- `GET /api/v1/queue/:id`
- `PATCH /api/v1/queue/:id`
- `POST /api/v1/queue/:id/no-show`
- `POST /api/v1/queue/:id/complete`

## Services

All services must follow:

`Route -> Validator -> Controller -> Service -> Repository -> Prisma`

| Service | Responsibilities |
| --- | --- |
| `doctorSchedules` | Schedule CRUD, schedule overlap checks, availability calculation |
| `doctorLeaves` | Leave CRUD, leave cancel, approved leave overlap checks |
| `appointments` | Booking, reschedule, cancel, confirm, no-show, complete, status history, idempotency |
| `queue` | Check-in, atomic token allocation, call-next, queue transitions, dashboard read model |

Service rules:

- Keep business logic out of routes and controllers.
- Use transactions for booking, reschedule, check-in, token generation, and call-next.
- Use idempotency for booking and reschedule.
- Treat database state as the source of truth for queue and appointment status.

## Repositories

Repository methods must:

- Require trusted `clinicId` for every tenant-owned query and mutation.
- Filter every tenant-owned read/write by `clinic_id`.
- Use tenant-scoped mutation predicates.
- Never accept client-provided tenant scope directly.
- Wrap Prisma access only; no business decisions in repositories.
- Provide transaction-compatible methods accepting the transaction connection.

Required repository groups:

- `doctorSchedules.repository.js`
- `doctorLeaves.repository.js`
- `appointments.repository.js`
- `queue.repository.js`

## Validations

Validate:

- UUID params and tenant override headers.
- Timezone names.
- Weekday/date rules.
- Slot duration range.
- Start-before-end rules.
- Appointment start/end cannot be in the past.
- Patient, doctor, and branch must belong to the same clinic.
- Doctor must have an active schedule.
- Doctor must not have an approved leave conflict.
- Appointment status transitions must follow the allowed state machine.
- Queue check-in must reference either a valid appointment or valid patient/doctor/branch payload.
- Queue token date must be derived from clinic/branch local date.
- List and dashboard query pagination/filter/sort caps.
- Unsafe methods require CSRF.

## Permissions

Add RBAC catalog entries:

| Module | Permissions |
| --- | --- |
| Doctor Schedules | `doctor_schedules.read`, `doctor_schedules.create`, `doctor_schedules.update`, `doctor_schedules.archive`, `doctor_schedules.manage` |
| Doctor Leaves | `doctor_leaves.read`, `doctor_leaves.create`, `doctor_leaves.update`, `doctor_leaves.cancel` |
| Appointments | `appointments.read`, `appointments.create`, `appointments.update`, `appointments.reschedule`, `appointments.cancel`, `appointments.confirm`, `appointments.no_show`, `appointments.complete`, `appointments.manage` |
| Queue | `queue.read`, `queue.check_in`, `queue.call`, `queue.update`, `queue.no_show`, `queue.complete`, `queue.manage` |

Default grants:

- Super Admin: `ALL`.
- Clinic Owner/Admin: `CLINIC`.
- Doctor: own/assigned appointment and queue read/update where enforceable.
- Receptionist: `BRANCH` schedule read, appointment create/reschedule/cancel/check-in, queue manage.
- Clinical Staff: branch read/update support only where safe.

## Audit Requirements

Audit:

- Schedule create/update/archive.
- Leave create/update/cancel.
- Appointment book/reschedule/cancel/confirm/check-in/no-show/complete.
- Queue check-in/call-next/update/no-show/complete.
- Appointment conflict denial.
- Queue token conflict/retry.
- Cross-tenant denial.
- Platform tenant override allow/deny.

Audit payloads must include:

- Appointment or queue IDs.
- Status before/after.
- Appointment date and start/end times.
- Branch ID.
- Doctor ID.
- Patient ID and patient code only.
- Request ID.
- Reason fields.

Audit payloads must not copy PHI details, demographics, medical summaries, clinical notes, or queue free-text clinical context.

## WebSocket Events

Reserve and document these event names:

- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `appointment.checked_in`
- `queue.created`
- `queue.called`
- `queue.updated`
- `queue.completed`
- `queue.no_show`

Implementation rule:

- Implement only minimal Socket.IO tenant/branch room foundation if aligned with the existing WebSocket architecture.
- Socket events are never the source of truth.
- Clients must refresh from `GET /api/v1/queue/dashboard` to recover missed events.

## Background Jobs

No external worker runtime is required in Sprint 5.

Create outbox events:

- `doctor_schedule.created.v1`
- `doctor_schedule.updated.v1`
- `doctor_leave.created.v1`
- `doctor_leave.cancelled.v1`
- `appointment.created.v1`
- `appointment.rescheduled.v1`
- `appointment.cancelled.v1`
- `appointment.confirmed.v1`
- `appointment.checked_in.v1`
- `appointment.no_show.v1`
- `appointment.completed.v1`
- `queue.created.v1`
- `queue.called.v1`
- `queue.updated.v1`
- `queue.no_show.v1`
- `queue.completed.v1`

Deferred:

- Reminder notification delivery.
- WhatsApp delivery.
- Email/SMS providers.
- Worker retry dashboards.

## Tests

Required tests:

- Prisma schema and migration include Sprint 5 tables, FKs, tenant-first indexes, and uniqueness constraints.
- Schedule overlap and invalid time validation.
- Leave overlap and leave conflict checks.
- Availability excludes leaves, past slots, archived schedules, and booked slots.
- Appointment booking is idempotent.
- Double booking is blocked in deterministic service tests.
- Double booking is blocked in gated MySQL concurrency tests.
- Reschedule/cancel/confirm/no-show/complete enforce state transitions.
- Queue check-in allocates unique token per clinic, branch, and date.
- Queue call-next is atomic and does not call two entries.
- Cross-tenant patient/doctor/branch/appointment/queue access is rejected.
- RBAC route coverage exists for every Sprint 5 route.
- Audit/outbox assertions exist for all sensitive lifecycle operations.
- WebSocket tenant/branch event contract tests exist if runtime room foundation is included.
- Postman collection parses as valid JSON.
- `npm run lint`, `npm run build`, and `npm test` pass.

## Documentation

Create/update:

- `project-docs/04-sprint-delivery/SPRINT_05_EXECUTION_PLAN.md`
- `backend-new/docs/PHASE_06_APPOINTMENTS.md`
- `backend-new/docs/PHASE_07_QUEUE.md`
- `backend-new/docs/APPOINTMENTS_API.md`
- `backend-new/docs/QUEUE_API.md`
- `backend-new/docs/PHASE_01_MIGRATION_PLAN.md`

## Postman Updates

Create:

- `backend-new/postman/Doctor-System-Phase-6-Appointments-Queue.postman_collection.json`

The collection must include:

- Auth/CSRF prerequisites.
- Schedule CRUD smoke requests.
- Availability request.
- Leave create/cancel requests.
- Appointment book/reschedule/cancel/confirm/no-show/complete requests.
- Queue check-in/call-next/dashboard/no-show/complete requests.
- Negative examples for double booking, invalid state transition, missing CSRF, and cross-tenant denial.
- Collection tests for response envelope and IDs needed by later requests.

## Task Matrix

| Task | Priority | Dependencies | Risks | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| Resolve Sprint 4 acceptance contradiction | P0 | Sprint 4 artifacts | Starting Sprint 5 on unresolved PHI/DB debt | Sprint 4 status is explicitly accepted by CTO or blockers are carried as Sprint 5 entry risks |
| Confirm Sprint 5 boundary | P0 | Delivery plan | Scope creep into clinical/billing/notifications | Sprint excludes consultations, vitals, prescriptions, billing, storage, notification delivery |
| Add Sprint 5 schema/migration | P0 | Patients, branches, users | Bad FKs/indexes break core workflows | Prisma validates and migration has required tenant-first indexes |
| Extend RBAC catalog/system roles | P0 | Sprint 2 RBAC | Overbroad permissions | Sprint 5 permissions are tested and mapped to routes |
| Implement schedule/leave modules | P0 | Users/doctors, branches | Bad availability causes booking errors | CRUD, overlap, leave conflict tests pass |
| Implement availability resolver | P0 | Schedules/leaves/appointments | Incorrect timezone or slot rules | Availability excludes conflicts and past slots |
| Implement appointment booking | P0 | Patients/schedules/users | Double booking and idempotency failure | Concurrent booking tests and idempotency tests pass |
| Implement appointment lifecycle APIs | P0 | Appointment model | Invalid state transitions | State machine tests pass |
| Implement queue check-in and counters | P0 | Appointments/patients/branches | Duplicate or skipped tokens | Queue token concurrency tests pass |
| Implement queue progression APIs | P0 | Queue entries | Race in call-next or wrong patient called | Atomic call-next and transition tests pass |
| Add audit/outbox coverage | P0 | Audit/outbox foundation | Missing operational evidence | Lifecycle audit/outbox assertions pass |
| Add WebSocket room/event foundation | P1 | Socket.IO architecture | Tenant leakage or realtime source-of-truth drift | Room validation and dashboard-refresh tests pass |
| Add docs/Postman | P1 | API behavior finalized | Contract drift | Docs and Postman match APIs and parse successfully |
| Run verification | P0 | Implementation complete | Broken baseline | Lint/build/tests pass |

## Why Sprint 5 Is Important

Sprint 5 turns the platform from patient administration into a daily clinic operations system. Without schedules, appointments, and queue, clinics cannot run the front desk, doctor assignment, check-in, or patient flow.

## What Customer Value Sprint 5 Delivers

Sprint 5 gives clinics:

- Appointment booking.
- Rescheduling and cancellation.
- Doctor availability.
- Patient check-in.
- Queue token generation.
- Queue progression.
- Doctor queue visibility.
- Operational audit trails.

This is one of the highest-value outpatient workflows because it directly affects waiting time, staff productivity, and patient experience.

## What Can Fail During Sprint 5

- Double booking.
- Timezone bugs.
- Invalid schedule or leave logic.
- Duplicate queue tokens.
- Queue call-next races.
- Cross-tenant appointment leakage.
- Stale realtime state.
- Missing audit evidence.
- Slow appointment and queue dashboard queries.
- Wrong status transitions blocking clinic operations.

## What Must Be Tested Carefully

- Appointment concurrency.
- Queue token allocation.
- Queue call-next atomicity.
- Appointment and queue state transitions.
- Tenant isolation.
- RBAC route coverage.
- Timezone/date boundaries.
- Idempotency replay and conflict behavior.
- Audit/outbox payload safety.
- Socket.IO tenant and branch room isolation.
- Dashboard refresh after missed realtime events.

## Assumptions

- `backend-new` remains canonical.
- Sprint 5 route surface stays gated behind the existing post-Sprint route flag until accepted.
- Production readiness still requires live MySQL evidence; local fake tests alone are not enough for appointment and queue concurrency.
- WebSocket runtime should remain minimal and read-model-backed.
- Database state remains source of truth.
- No clinical, prescription, billing, storage, exports, notification delivery, or WhatsApp work starts in Sprint 5.
