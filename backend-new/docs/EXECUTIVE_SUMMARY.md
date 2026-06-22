# Executive Summary

## Phase 0 Scope

This document set is the Phase 0 architectural discovery and implementation plan for the Doctor Platform backend. It is based on the uploaded `Doctor Architecture.pdf`, plus a read-only inspection of the repository.

No application code, migrations, generated Prisma schema, or runtime configuration was created in this phase.

## Repository Discovery

`backend-new` is currently a greenfield backend target. The existing sibling `backend` folder was inspected read-only and already reflects many conventions expected by the PDF:

- Node.js and Express.js API surface.
- Prisma with MySQL.
- Route -> Validator -> Controller -> Service -> Repository structure.
- Common middleware for request IDs, logging, auth, tenant context, RBAC, validation, and error handling.
- Sentry-ready error integration.
- Socket.IO dependency.
- AWS S3 dependencies.
- Modular `src/modules/*` layout.
- Tests under `backend/tests`.

`backend-new` should not copy the old backend blindly. It should use the same broad conventions while implementing the full PDF-driven architecture more rigorously.

## Product Boundary

The platform is a production-ready multi-tenant outpatient healthcare SaaS product for clinics, medical centers, healthcare practices, and hospital groups.

Included scope:

- Platform administration.
- Clinic onboarding and lifecycle.
- Branch management.
- User, invitation, session, and RBAC management.
- Patient registry and patient records.
- Doctor schedules and doctor leaves.
- Appointments and queue management.
- Consultations, vitals, prescriptions, and prescription templates.
- Lab tests, lab orders, lab order items, and lab reports.
- Billing, invoices, payments, receipts, refunds, and credit notes.
- Notifications and WhatsApp communications.
- AWS S3 based storage.
- Audit logs, reporting, exports, background jobs, webhooks, observability, and security controls.

Explicitly out of current scope:

- Inpatient management.
- Pharmacy inventory.
- Insurance claims.
- Medical device integration.
- Telemedicine.
- Government EHR integrations.
- Patient authentication, except as a future extension.

## Architectural Direction

The recommended backend architecture is a modular monolith with strict internal boundaries.

Core stack:

- Node.js
- Express.js
- Prisma
- MySQL
- Socket.IO
- AWS S3
- Background workers
- Structured logging
- Sentry-ready error reporting

Canonical request flow:

`Client -> Nginx -> Express middleware -> Route -> Validator -> Auth -> Tenant resolution -> RBAC -> Controller -> Service -> Repository -> Prisma -> MySQL`

Layer rules:

- Routes register middleware, validators, and controller handlers only.
- Validators reject malformed body, params, and query input.
- Controllers map HTTP requests to service calls and format responses.
- Services own business rules, workflow orchestration, transaction ownership, audit generation, and event creation.
- Repositories own persistence and must require explicit `clinicId` for tenant-owned queries.
- Prisma is the ORM layer only.
- MySQL is the authoritative source of truth.

## Tenant Model

The root tenant entity is `clinic`.

Tenant strategy:

- Shared database.
- Shared schema.
- Logical isolation through mandatory `clinic_id`.
- Every tenant-owned table contains `clinic_id`.
- Every tenant query filters by `clinic_id`.
- Repositories are the final enforcement point for tenant-scoped persistence.
- Storage keys are tenant-scoped under `tenant/{clinicId}/...`.
- Socket.IO rooms are tenant-scoped.
- Cache keys include `clinicId`.
- Events include `tenantId`.
- Reports and exports are tenant-scoped unless explicitly platform-only for Super Admin.

## Security Baseline

Mandatory controls:

- JWT access tokens with short lifetime.
- Refresh token rotation.
- Refresh token hashing.
- HTTP-only secure cookies.
- Session tracking per device.
- Token versioning for mass invalidation.
- Password hashing with bcrypt.
- Password reset and invitation tokens hashed at rest.
- Authentication rate limiting and lockout.
- RBAC with scopes.
- Tenant resolution after authentication and before authorization.
- Centralized validation.
- Centralized error handling with no public stack traces.
- Structured request logging with request IDs.
- Audit logging for critical actions.
- Sentry-ready error reporting.
- Webhook signature validation.
- Signed URLs for storage access.
- Encrypted secrets and provider credentials.

## Primary Roles

- Super Admin: platform-wide administration, subscription plan management, platform audits, tenant recovery, and incident response.
- Clinic Owner: tenant administration, users, branches, subscriptions, settings, reports.
- Doctor: patients, consultations, prescriptions, lab orders, patient history.
- Receptionist: patient registration, appointment booking, queue, check-in, billing collection.
- Clinical Staff/Nurse: vitals, patient records, consultation assistance.
- Lab Technician: lab order processing and lab report preparation.
- Billing Specialist: invoices, payments, receipts, refunds where assigned.
- Patient: future extension; no required authentication in current architecture.

## Estimated Scope

- Estimated domains: 10
- Estimated primary modules: 31
- Estimated additional platform modules: 3
- Estimated tables: 65 to 75
- Estimated API groups: 34
- Estimated endpoint operations: 150 to 190
- Estimated implementation phases: 14
- Estimated development effort: 16 to 26 engineering weeks for a production-grade MVP backend, assuming one senior backend engineer plus periodic architecture/security review.

## Recommended Build Order

1. Backend foundation, standards, configuration, logging, errors, validation, and test harness.
2. Prisma/MySQL base schema standards and migration workflow.
3. Authentication, sessions, token rotation, tenant context, and Super Admin bootstrap.
4. RBAC, scopes, system roles, permission resolver, and audit foundation.
5. Clinic onboarding transaction with branch, owner user, default roles, settings, and trial subscription.
6. Patient, patient records, and storage metadata foundation.
7. Scheduling, appointments, and queue with Socket.IO events.
8. Clinical, vitals, prescriptions, and lab workflows.
9. Billing and payments.
10. Notifications, WhatsApp, webhooks, and delivery workers.
11. Reports, exports, aggregates, and background jobs.
12. Observability, security hardening, operational runbooks, and performance tests.

## Approval Gate

After Phase 0, implementation should not begin until the owner approves:

- Module boundaries.
- RBAC matrix.
- Database table plan.
- API roadmap.
- Implementation phase order.
- Open risks and unresolved business requirements.

