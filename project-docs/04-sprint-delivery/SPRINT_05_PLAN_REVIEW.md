# Sprint 5 Plan Review

## Review Verdict

**Request changes before implementation.**

The Sprint 5 plan is directionally correct and business-critical, but it is not implementation-ready. Appointment and queue workflows are concurrency-heavy and operationally sensitive. The plan needs stronger decisions for conflict prevention, queue claim semantics, status machines, timezone rules, RBAC scope enforcement, WebSocket scope, and MySQL evidence gates before implementation starts.

## Sources Reviewed

- `project-docs/04-sprint-delivery/SPRINT_05_EXECUTION_PLAN.md`
- `project-docs/04-sprint-delivery/SPRINT_04_ACCEPTANCE_REPORT.md`
- `project-docs/01-product-launch/DELIVERY_MASTER_PLAN.md`
- `backend-new/docs/IMPLEMENTATION_PHASES.md`
- `backend-new/docs/PHASE_06_APPOINTMENTS.md`
- `backend-new/docs/PHASE_07_QUEUE.md`
- `backend-new/docs/API_ROADMAP.md`
- `backend-new/docs/RBAC_MATRIX.md`
- `backend-new/docs/DATABASE_SCHEMA_V1.md`
- `backend-new/docs/BUSINESS_WORKFLOWS.md`
- `backend-new/docs/WEBSOCKET_ARCHITECTURE.md`

## Critical Issues

### C1. Sprint 4 Acceptance Contradiction Blocks Sprint 5 Entry

**Area:** Delivery governance, database risk.

**Issue:** The user says Sprint 4 has been accepted, but `SPRINT_04_ACCEPTANCE_REPORT.md` says Sprint 4 is not accepted yet because MySQL evidence and artifact alignment remain open.

**Risk:** Sprint 5 builds appointment and queue workflows on patient and tenant foundations whose database evidence is not closed. This can compound unverified transaction, FK, and concurrency behavior.

**Required fix:** Either update Sprint 4 acceptance artifacts with explicit CTO acceptance of the remaining risk, or block Sprint 5 implementation until Sprint 4 evidence is closed.

## High Issues

### H1. Appointment Conflict Prevention Is Underspecified

**Area:** Database impact, scalability, correctness.

**Issue:** The plan names active conflict keys and concurrency tests, but does not define the exact transaction, locking, overlap, or retry strategy.

**Risk:** Double booking can occur under concurrent booking or reschedule requests.

**Required fix:** Define active appointment states, active conflict key generation, overlap windows, transaction isolation assumptions, retry behavior, and gated MySQL concurrency tests.

### H2. Queue Call-Next Atomicity Is Underspecified

**Area:** Queue workflow, concurrency.

**Issue:** `call-next` is listed, but deterministic claim semantics are not defined.

**Risk:** Two receptionists can call the same waiting patient or skip queue entries during contention.

**Required fix:** Define atomic claim behavior using tenant/branch/date/status predicates and a single winning update. Add concurrent call-next tests.

### H3. Queue Token Generation Needs Live DB Proof

**Area:** Database impact, testing coverage.

**Issue:** The plan requires unique queue tokens but does not make live DB proof non-negotiable.

**Risk:** Concurrent check-ins can create duplicate or skipped queue tokens.

**Required fix:** Add gated MySQL tests for concurrent check-ins, counter row creation races, retry behavior, and duplicate-token prevention.

### H4. Timezone And Branch Local-Date Rules Are Not Concrete

**Area:** Validation coverage, API correctness.

**Issue:** The plan says validate timezone and local queue date, but does not define the canonical policy.

**Risk:** DST boundaries, late-night bookings, branch timezone differences, and past-slot checks can behave incorrectly.

**Required fix:** Define one timezone policy for schedules, appointments, queue dates, DST, and past-slot checks. Store UTC instants plus explicit branch/clinic timezone context where needed.

### H5. RBAC Scope Enforcement Is Not Fully Implementable As Written

**Area:** RBAC coverage, tenant isolation.

**Issue:** Doctor own/assigned and receptionist branch scopes are listed, but the plan does not define the source of truth for each scope check.

**Risk:** Route protection can become either over-permissive or unusably strict.

**Required fix:** Define scope sources: doctor identity from `user.id`, branch scope from active user-branch assignments, assigned scope from appointment doctor ownership, and clinic scope from trusted tenant context.

### H6. Doctor Eligibility And Branch Assignment Rules Are Missing

**Area:** Validation coverage, tenant isolation.

**Issue:** The plan requires doctor, branch, and patient ownership checks, but not doctor eligibility checks.

**Risk:** Inactive, deactivated, non-doctor, suspended-clinic, or unassigned users can be booked or queued.

**Required fix:** Validate doctor user type/status, clinic ownership, active branch assignment, and clinic lifecycle before schedule, leave, appointment, and queue mutations.

### H7. Appointment And Queue State Machines Are Incomplete

**Area:** API completeness, error handling, audit.

**Issue:** State transitions are mentioned, but exact statuses, allowed transitions, terminal states, reason requirements, and side effects are not specified.

**Risk:** Invalid transitions can corrupt clinic workflow, billing readiness, and future clinical handoff.

**Required fix:** Add explicit appointment and queue state-machine tables before implementation. Include reason requirements, actor requirements, timestamp side effects, outbox events, and audit action names.

### H8. Check-In Workflow Boundary Is Ambiguous

**Area:** API completeness, workflow design.

**Issue:** The plan does not define whether check-in happens only through `POST /api/v1/queue/check-in`, whether it changes appointment status, and how walk-ins differ from appointment check-ins.

**Risk:** Duplicate queue entries, inconsistent appointment status, and unclear frontend behavior.

**Required fix:** Define check-in as the only queue entry creation boundary. Appointment-backed check-in must update appointment state transactionally. Walk-in check-in must require patient, doctor, and branch and must not create an appointment unless explicitly added later.

### H9. WebSocket Runtime Scope Is Not Decision-Complete

**Area:** WebSocket events, architecture alignment.

**Issue:** The plan says to implement minimal Socket.IO room foundation if approved. That leaves implementation scope undecided.

**Risk:** Sprint 5 can accidentally drift into infrastructure-heavy realtime work or ship inconsistent event behavior.

**Required fix:** Choose one Sprint 5 policy: reserve event names only, or implement minimal authenticated tenant/branch rooms. The safer default is reserve event names and test dashboard refresh unless Socket.IO foundation already exists.

### H10. Outbox/Event Payload Contracts Are Too Vague

**Area:** Background jobs, audit, security.

**Issue:** Event names are listed, but event payload shape is not defined.

**Risk:** Events may leak PHI or drift across appointment, queue, and future notification consumers.

**Required fix:** Define safe event payloads with event id, tenant id, aggregate type/id, event version, correlation id, actor id, status fields, appointment/queue ids, patient id/code only, doctor id, branch id, and no PHI.

### H11. Dashboard Query And Index Strategy Needs More Detail

**Area:** Scalability impact, database impact.

**Issue:** Queue dashboard and appointment lists are hot paths, but the plan does not define exact filters and matching indexes.

**Risk:** Dashboard and calendar views can become slow-query hotspots under normal clinic traffic.

**Required fix:** Define bounded query contracts and composite indexes for queue dashboard, doctor queue, branch appointment day view, doctor calendar, and patient appointment history.

## Medium Issues

### M1. Calendar API Contract Is Missing

The plan should add `GET /api/v1/appointments/calendar` or document a bounded list query contract for calendar views.

### M2. Appointment Availability Alias Is Missing Or Undecided

The plan should either add `GET /api/v1/appointments/availability` or explicitly state availability lives only under `GET /api/v1/doctor-schedules/availability`.

### M3. Schedule Archive Uses `DELETE`

`DELETE /doctor-schedules/:id` uses archive semantics. This may confuse API clients unless docs make archive behavior explicit.

### M4. Leave Update/Cancel Conflict Behavior Is Not Specified

The plan should define whether changing or cancelling leave recalculates existing appointments, blocks when affected appointments exist, or only affects future availability.

### M5. Appointment Reschedule Idempotency Is Incomplete

Booking and reschedule both need idempotency behavior. The plan should define replay, conflict, and active-key behavior for reschedule.

### M6. Duplicate Check-In Prevention Is Missing

The plan should define whether the same appointment, patient, doctor, and branch can check in more than once per day.

### M7. Postman Bootstrap Requirements Need More Detail

Postman should include auth login, CSRF capture, clinic owner/receptionist/doctor contexts, and reusable IDs.

### M8. Reminder Event Boundary Is Not Explicit

Reminder notification delivery is deferred, but the plan should define whether appointment events are sufficient or whether placeholder reminder jobs/events are intentionally omitted.

### M9. Route-Permission Matrix Is Required

Every Sprint 5 route should have a human-reviewable route-to-permission matrix before implementation acceptance.

### M10. MySQL Tests Must Be Acceptance Gates

Gated MySQL tests should block Sprint 5 acceptance, not only production acceptance.

## Low Issues

### L1. `PRODUCT_ROADMAP.md` Is Missing

The review should note that `ROADMAP_12_MONTHS.md` was used instead.

### L2. Phase Mapping Needs To Stay Explicit

Sprint 5 spans Phase 06 Appointments and Phase 07 Queue. This should remain explicit in implementation docs.

### L3. WebSocket Event Names Need Consistent Namespacing

Use consistent event naming and tense, such as `appointment.created`, `appointment.rescheduled`, `queue.entry_called`, and `queue.entry_completed`.

### L4. Manual Verification Should Include Postman JSON Parse

Sprint 5 acceptance should include Postman collection JSON parse verification.

### L5. Frontend Screens Are Out Of Scope

Docs should explicitly state frontend calendar and queue screens are not implemented unless separately requested.

## Dedicated Gap Summaries

### Architecture Alignment

The plan follows the modular monolith direction and approved layering, but it combines schedules, appointments, queue, and optional WebSockets. Implementation needs strict module boundaries and clear transaction ownership.

### Security Alignment

The plan requires auth, CSRF, and audit, but needs stronger no-PHI guarantees for audit and outbox payloads.

### Tenant Isolation

The intent is correct. Every appointment and queue relation must prove patient, doctor, branch, appointment, and queue entry belong to the same clinic.

### RBAC Coverage

The permission list is broad enough, but scope enforcement rules are not concrete enough for doctor assigned access and receptionist branch access.

### API Completeness

Core APIs are present. Calendar/list query contracts, availability alias decision, check-in boundary, and dashboard filters need detail.

### Database Impact

This is a high-risk schema because appointment and queue workflows are concurrency-heavy. Live MySQL evidence is mandatory.

### Validation Coverage

The plan covers the right categories, but date/time/timezone/status/idempotency/reason validation must be exact before implementation.

### Audit Requirements

Audit coverage is directionally good. Payload shape, conflict denial, queue retry, and no-PHI rules need tightening.

### WebSocket Events

The plan correctly treats REST/MySQL as source of truth. Runtime scope is undecided and must be resolved.

### Background Jobs

Outbox-only is acceptable for Sprint 5. Reminder delivery must stay explicitly deferred.

### Testing Coverage

The categories are strong, but live MySQL concurrency tests must be Sprint 5 acceptance gates.

### Scalability Impact

Queue dashboards, appointment lists, and conflict checks can become hotspots unless bounded filters and matching indexes are defined up front.

## Answers

### 1. What Is Missing?

Concrete conflict-locking strategy, queue claim semantics, status-transition tables, timezone policy, branch/doctor eligibility rules, dashboard query contracts, WebSocket runtime decision, outbox payload shape, route-permission matrix, and live MySQL acceptance evidence.

### 2. What Is Risky?

Double booking, duplicate queue tokens, call-next races, DST/date bugs, cross-tenant joins, overbroad RBAC scopes, stale socket state, slow queue dashboards, and starting Sprint 5 while Sprint 4 acceptance remains contradictory.

### 3. What Should Be Redesigned Before Implementation?

Redesign the appointment conflict model, queue token/call-next claim model, check-in workflow boundary, status machines, RBAC scope enforcement, and WebSocket scope decision before writing code.

### 4. What Can Cause Production Issues Later?

Lock contention, deadlocks, slow dashboard queries, invalid transitions, missed socket events, wrong branch local dates, duplicate check-ins, unbounded appointment lists, and audit/outbox payload drift.

## Recommendation

Do not implement Sprint 5 as currently written.

Fix the Critical and High plan findings first. Medium issues may be tracked only if they do not weaken concurrency safety, tenant isolation, RBAC enforcement, or appointment/queue correctness.
