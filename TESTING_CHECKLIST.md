# Testing Checklist

## Purpose

This checklist defines the minimum testing bar for `backend-new` and the outpatient MVP launch.

Every phase must pass lint, build, tests, Prisma validation, and relevant integration checks before merge.

No production release can proceed unless the applicable testing gates in this checklist are complete or explicitly accepted by the CTO.

## Required Test Types

- Unit tests.
- Integration/API tests.
- Tenant isolation tests.
- RBAC tests.
- Validation tests.
- Error handling tests.
- Migration/schema tests.
- Concurrency tests for critical workflows.
- Worker/job tests.
- WebSocket tests.
- Security tests.
- E2E workflow tests where frontend behavior is involved.

## Backend Unit Tests

- [ ] Services cover business rules.
- [ ] Repositories cover query scoping and not-found behavior.
- [ ] Validators cover valid and invalid input.
- [ ] Utility functions cover edge cases.
- [ ] Audit/logging helpers redact secrets.

## API And Integration Tests

- [ ] Success path.
- [ ] Validation failure.
- [ ] Missing auth.
- [ ] Invalid/expired session.
- [ ] RBAC denial.
- [ ] Tenant mismatch.
- [ ] Not found.
- [ ] Conflict.
- [ ] Unexpected error sanitization.

## Tenant Isolation Tests

For every tenant-owned module:

- [ ] Tenant A cannot list Tenant B records.
- [ ] Tenant A cannot read Tenant B record by ID.
- [ ] Tenant A cannot update Tenant B record.
- [ ] Tenant A cannot delete Tenant B record.
- [ ] Exports are tenant-scoped.
- [ ] Platform access requires platform context and audit.

## RBAC Tests

- [ ] Permission allows intended action.
- [ ] Missing permission returns 403.
- [ ] Scope restrictions are enforced.
- [ ] Platform bypass works only when allowed.
- [ ] Role/permission changes are audited.
- [ ] Protected route has route-level and service-level checks where needed.

## Validation Tests

- [ ] Body validation.
- [ ] Param validation.
- [ ] Query validation.
- [ ] UUID validation.
- [ ] Enum validation.
- [ ] Date validation.
- [ ] Email/phone validation.
- [ ] File validation.
- [ ] Rejected values are not echoed for sensitive fields.

## Database And Migration Tests

- [ ] Prisma schema validates.
- [ ] Migration applies to clean MySQL.
- [ ] Migration dry-run reviewed.
- [ ] Indexes exist for expected queries.
- [ ] Unique constraints enforce business rules.
- [ ] Foreign keys enforce lifecycle policy.
- [ ] Rollback/forward-fix plan is documented.

## Concurrency Tests

Required for:

- Appointment booking.
- Queue check-in and token generation.
- Prescription finalization.
- Lab order finalization.
- Invoice payment.
- Subscription update.
- Job claiming.
- Audit hash-chain writes.

## Worker And WebSocket Tests

Workers:

- [ ] Atomic claim.
- [ ] Retry.
- [ ] Dead-letter.
- [ ] Idempotency.
- [ ] Backoff.
- [ ] Failure logging.

WebSockets:

- [ ] Auth handshake.
- [ ] Tenant room assignment.
- [ ] Room pattern `clinic:{clinicId}`.
- [ ] Cross-tenant event isolation.
- [ ] Disconnect on session revocation.

## Security Tests

- [ ] npm audit has no unresolved critical/high findings.
- [ ] Auth cookie flags are correct.
- [ ] Refresh token reuse detection works.
- [ ] Logs and errors are redacted.
- [ ] Uploads reject unsafe files.
- [ ] Webhooks reject invalid signatures and replays.

## E2E MVP Workflow Tests

Required before controlled beta:

- [ ] Login.
- [ ] Create/find patient.
- [ ] Book appointment.
- [ ] Check in queue.
- [ ] Start consultation.
- [ ] Record vitals.
- [ ] Finalize prescription.
- [ ] Create invoice/payment.
- [ ] Generate basic report/export if included.

## Done Checklist

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm test` passes.
- [ ] Prisma validation passes.
- [ ] New behavior has tests.
- [ ] Regression scenarios are covered.
- [ ] Manual smoke test steps are documented.
