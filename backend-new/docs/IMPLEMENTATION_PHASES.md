# Implementation Phases

## Phase Strategy

The platform must not be implemented in one step. Build the backend in controlled phases with verification gates.

Every phase should include:

- Architecture review.
- Schema review where applicable.
- Unit tests.
- Integration/API tests.
- RBAC tests.
- Tenant isolation tests.
- Validation failure tests.
- Error handling tests.
- Lint/build/test execution.
- Changed file summary.

## Phase 0: Discovery and Planning

Status: current phase.

Deliverables:

- Executive summary.
- Module breakdown.
- Business workflows.
- Database design.
- Prisma schema plan.
- API roadmap.
- RBAC matrix.
- Auth architecture.
- Tenant isolation architecture.
- Audit logging strategy.
- WebSocket architecture.
- Background jobs architecture.
- Storage architecture.
- Security architecture.
- Implementation phases.
- Risks and gaps.

Exit criteria:

- Owner approval to begin coding.

## Phase 1: Backend Foundation

Deliverables:

- `backend-new` Node.js project scaffold.
- Express app/server.
- Environment config and startup validation.
- Request ID middleware.
- Structured logger.
- Standard response envelope.
- Centralized error classes and error handler.
- Validation middleware.
- Health, readiness, startup checks.
- Test harness.
- Lint/build scripts.

Verification:

- Unit tests for response/error helpers.
- API tests for health/error behavior.
- No public stack traces.

## Phase 2: Prisma and Database Foundation

Deliverables:

- Prisma setup.
- MySQL datasource.
- Base models: clinics, users, audit_logs, settings, outbox_events.
- Migration workflow.
- Transaction/unit-of-work helper.
- Base repository pattern.
- Pagination/filter/sort utilities.

Verification:

- Prisma validate/generate.
- Migration test.
- Repository tenant-filter tests.
- Transaction rollback tests.

## Phase 3: Authentication and Session Security

Deliverables:

- Login.
- Refresh token rotation.
- Logout.
- Logout all.
- Current user.
- Password reset request/confirm.
- Invitation token foundation.
- HTTP-only cookie handling.
- Session tracking.
- Token versioning.
- Auth rate limiting.

Verification:

- Login success/failure tests.
- Refresh rotation tests.
- Refresh reuse detection tests.
- Password reset enumeration safety tests.
- Session revocation tests.
- Cookie security tests.

## Phase 4: RBAC and Tenant Context

Deliverables:

- Tenant resolution middleware.
- RBAC permission catalog.
- System roles.
- Role permissions.
- Role assignments.
- Effective permission resolver.
- Permission cache/invalidation design.
- RBAC APIs.
- Service-level authorization helper.

Verification:

- Role assignment restriction tests.
- Scope resolution tests.
- Privilege escalation prevention tests.
- Tenant override tests.
- Protected endpoint denial tests.

## Phase 5: Clinic Onboarding and Tenant Administration

Deliverables:

- Clinic onboarding transaction.
- Default owner.
- Default branch.
- Default roles and assignments.
- Trial subscription.
- Default settings.
- Clinic lifecycle status changes.
- Branch APIs.
- User invitation acceptance.

Verification:

- Onboarding rollback tests.
- Duplicate clinic code tests.
- Suspension login/API denial tests.
- Branch primary uniqueness tests.
- Audit/outbox creation tests.

## Phase 6: Patient and Storage Foundation

Deliverables:

- Patients APIs.
- Patient records APIs.
- Storage metadata.
- S3 adapter abstraction.
- Signed URL service.
- Upload validation.
- Storage audit logs.
- Initial retention status model.

Verification:

- Patient tenant isolation tests.
- Patient search/index tests.
- File ownership tests.
- Signed URL authorization tests.
- Upload validation failure tests.

## Phase 7: Scheduling, Appointments, and Queue

Deliverables:

- Doctor schedules.
- Doctor leaves.
- Availability service.
- Appointment booking/reschedule/cancel.
- Queue counters and entries.
- Queue check-in/call/complete/no-show.
- Socket.IO foundation and queue broadcasts.

Verification:

- Appointment conflict tests.
- Leave conflict tests.
- Past booking tests.
- Queue token concurrency tests.
- Socket tenant room tests.
- State transition tests.

## Phase 8: Clinical and Prescription Workflows

Deliverables:

- Consultations.
- Clinical timeline.
- Vitals.
- Prescriptions.
- Prescription items.
- Prescription templates.
- Finalization immutability.
- Clinical audit rules.

Verification:

- Finalized consultation immutability tests.
- Prescription finalization tests.
- Clinical tenant ownership tests.
- Timeline query tests.
- Audit-on-view tests for sensitive records.

## Phase 9: Laboratory

Deliverables:

- Lab test categories.
- Lab tests.
- Lab orders.
- Lab order items.
- Lab reports.
- Lab report file upload/download.
- Report publication.
- Lab notifications event hooks.

Verification:

- Inactive test cannot be ordered.
- Lab order requires at least one test.
- Price snapshot tests.
- Published report immutability tests.
- Signed URL download tests.

## Phase 10: Billing and Payments

Deliverables:

- Invoices.
- Invoice items.
- Server-side totals.
- Payments.
- Payment allocations.
- Receipts.
- Refunds.
- Credit notes.
- Financial transactions.

Verification:

- Overpayment rejection.
- Duplicate payment idempotency.
- Invoice state transitions.
- Refund original-payment validation.
- Decimal precision tests.
- Financial audit tests.

## Phase 11: Events, Jobs, Notifications, and WhatsApp

Deliverables:

- Outbox publisher.
- Processed event idempotency.
- Generic jobs.
- Dead-letter handling.
- Notification records/jobs/deliveries.
- WhatsApp accounts/templates/messages.
- Webhook validation.
- WhatsApp reconciliation.
- Appointment reminders.

Verification:

- Outbox publish-after-commit tests.
- Duplicate event consumer tests.
- Notification retry tests.
- Dead-letter tests.
- Webhook signature/idempotency tests.
- Provider adapter mock tests.

## Phase 12: Reports, Exports, and Dashboards

Deliverables:

- Report request APIs.
- Dashboard metrics.
- Report snapshots.
- Report aggregates.
- Export jobs.
- Audit exports.
- Storage-backed export files.

Verification:

- Report tenant filtering tests.
- Export authorization tests.
- Async export tests.
- Large report does not block request path.
- Signed URL retention tests.

## Phase 13: Observability and Operations

Deliverables:

- Sentry-ready error reporting.
- Structured logs across APIs and workers.
- Metrics hooks.
- Worker health.
- Readiness/startup checks.
- Graceful shutdown.
- Operational runbooks.
- Backup/restore validation hooks.

Verification:

- Error reporting test with sanitized payload.
- Request ID propagation tests.
- Worker heartbeat tests.
- Graceful shutdown test.

## Phase 14: Security Hardening and Production Readiness

Deliverables:

- Security headers finalization.
- Rate limit tuning.
- CORS hardening.
- Secret validation.
- Audit tamper detection.
- Dependency audit.
- Load/performance tests.
- Tenant isolation test suite across all modules.
- Deployment checklist.

Verification:

- OWASP-focused API tests.
- Cross-tenant fuzz tests.
- Upload security tests.
- WebSocket abuse tests.
- Worker replay tests.
- Full regression suite.

## Recommended MVP Build Cut

MVP backend should include phases 1 through 10 plus minimal outbox/audit/jobs needed by those phases.

Do not defer:

- Tenant isolation.
- Auth/session security.
- RBAC.
- Audit foundation.
- Transactions for critical workflows.
- Validation.
- Error handling.
- Tests.

Can be phased later if needed:

- Advanced report aggregates.
- Audit hash chaining.
- Multi-provider notifications.
- Patient portal auth.
- Field-level encryption beyond provider credentials.
- Full analytics dashboards.

## Phase Gate Template

Each phase closeout should report:

- Changed files.
- Implemented APIs/modules.
- Database changes.
- Security controls added.
- Tenant isolation tests added.
- RBAC tests added.
- Audit coverage added.
- Commands run.
- Failures fixed.
- Known gaps.
- Next phase recommendation.

