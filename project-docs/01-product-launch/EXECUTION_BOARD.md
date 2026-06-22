# Execution Board

## Executive Summary

`backend-new` is the canonical backend. Phase 1 Foundation is merged at the Critical/High gate, with Medium/Low hardening tracked separately. Phase 2 Auth has started with schema, token, and password primitives, but the actual Auth APIs and middleware are not complete.

The fastest safe path is:

Foundation -> Auth -> RBAC -> Tenants/Users/Branches/Settings -> Patients -> Appointments/Queue -> Clinical/Prescriptions -> Billing/Storage/Notifications -> Reports/Operations.

## Phase Board

| Phase | Status | Dependencies | Blockers | Risk Level | Estimated Effort | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Phase 1: Foundation | Merged with Medium/Low hardening open | None | Reproducible migration artifact, request/security logging hardening | Medium | Complete, plus 1 week hardening | P0 |
| Phase 2: Auth | Started | Phase 1, users schema, audit foundation | Login/refresh/logout/me APIs incomplete; cookie wiring incomplete; password reset not built | High | 2-3 weeks | P0 |
| Phase 3: RBAC | Not started | Auth identity context, users, audit | Permission catalog, role assignment model, route coverage not built | High | 2-3 weeks | P0 |
| Phase 4: Tenants | Not started | Auth, RBAC, clinics/branches/users/settings schema | Clinic onboarding transaction and default seed workflow not built | High | 2-3 weeks | P0 |
| Phase 5: Patients | Not started | Tenants, RBAC, audit | Patient code uniqueness, duplicate detection, PHI read audit policy | Medium | 2 weeks | P1 |
| Phase 6: Appointments | Not started | Patients, users/doctors, branches, schedules | Slot concurrency, schedule/leave rules, idempotency | Very High | 3-4 weeks | P1 |
| Phase 7: Queue | Not started | Appointments, branches, Socket.IO foundation | Token counter concurrency, realtime tenant rooms | High | 2 weeks | P1 |
| Phase 8: Clinical | Not started | Patients, appointments, RBAC, audit | Clinical immutability, sensitive read audit, versioning | Very High | 3 weeks | P1 |
| Phase 9: Laboratory | Not started | Clinical, storage, notifications | Price snapshots, report publication controls, file access | High | 2-3 weeks | P2 |
| Phase 10: Billing | Not started | Patients, appointments/lab, audit | Decimal correctness, idempotent payments, ledger consistency | Very High | 3-4 weeks | P1 |
| Phase 11: Storage | Not started | Tenants, RBAC, audit, S3 config | S3 security, signed URLs, malware scanning policy | High | 2 weeks | P1 |
| Phase 12: Notifications | Not started | Jobs/outbox, patients/users, templates | Durable delivery, retries, dead letters, preferences | High | 2-3 weeks | P2 |
| Phase 13: WhatsApp | Not started | Notifications, webhooks, tenant settings | Provider verification, replay protection, reconciliation | High | 2-3 weeks | P2 |
| Phase 14: Reports/Exports | Not started | Business modules, jobs, storage | OLTP query pressure, export authorization, async generation | High | 2-3 weeks | P2 |
| Phase 15: Operations/Deployment | Not started | All launch modules | IaC, CI/CD gates, monitoring, backups, DR drills | High | 3-4 weeks | P0 |
| Phase 16: Subscriptions | Not started | Tenants, billing, plans | Plan limits, usage metering, lifecycle enforcement | Medium | 2-3 weeks | P2 |

## Sprint 1

### Features

- Complete Phase 2 Auth core: login, refresh rotation, logout, current user.
- Keep password reset and invitations out unless Auth core finishes early.

### APIs

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Database Work

- Finalize users, refresh tokens, login attempts, lockouts, password reset token schema.
- Add reviewed Phase 1 and Phase 2 migration artifacts.

### Frontend Work

- Replace frontend token storage with HTTP-only cookie session flow.
- Add login screen integration and current-user bootstrap.

### Testing Work

- Login success/failure.
- Refresh rotation.
- Refresh token reuse detection.
- Cookie flags.
- Disabled user and token version tests.

### Documentation Work

- Update Auth API documentation.
- Update Postman collection for Auth endpoints.
- Update migration plan with Phase 2 tables.

## Sprint 2

### Features

- Complete RBAC foundation.
- Build tenant resolution and protected-route middleware.
- Add initial Users dependency subset needed for Auth/RBAC.

### APIs

- `GET /api/v1/rbac/permissions`
- `GET /api/v1/rbac/roles`
- `POST /api/v1/rbac/roles`
- `POST /api/v1/rbac/user-roles`
- `GET /api/v1/users/me`

### Database Work

- Add permissions, roles, role permissions, user roles, user branch assignments.
- Add tenant-first indexes and uniqueness constraints.

### Frontend Work

- Protected route shell.
- Permission-aware navigation.
- Basic user/session display.

### Testing Work

- Permission resolver tests.
- Role assignment tests.
- Tenant override tests.
- Protected route denial tests.

### Documentation Work

- Update RBAC matrix with implemented route permissions.
- Add route-permission coverage table.

## Sprint 3

### Features

- Implement tenant administration: clinics, branches, settings, onboarding transaction.
- Add default owner, branch, roles, settings, and trial subscription seed.

### APIs

- `POST /api/v1/clinics`
- `GET /api/v1/clinics/:id`
- `PATCH /api/v1/clinics/:id`
- `GET /api/v1/branches`
- `POST /api/v1/branches`
- `GET /api/v1/settings`
- `PATCH /api/v1/settings`

### Database Work

- Add clinics, clinic branches, settings, setting history, minimal subscription state.
- Add unique clinic code and branch code constraints.

### Frontend Work

- Super Admin clinic onboarding.
- Clinic owner branch/settings screens.
- Staff invite entry point if ready.

### Testing Work

- Onboarding rollback.
- Duplicate clinic code.
- Primary branch uniqueness.
- Suspended clinic login/API denial.
- Audit and outbox creation.

### Documentation Work

- Clinic onboarding workflow doc.
- Tenant administration Postman folder.

## Sprint 4

### Features

- Implement Patients and Patient Records.
- Implement Storage metadata and S3 abstraction if patient records require files.

### APIs

- `GET /api/v1/patients`
- `POST /api/v1/patients`
- `GET /api/v1/patients/:id`
- `PATCH /api/v1/patients/:id`
- `DELETE /api/v1/patients/:id`
- `GET /api/v1/patients/:id/records`
- `POST /api/v1/patients/:id/records`

### Database Work

- Add patients and patient records.
- Add patient code uniqueness and patient lookup indexes.
- Add storage tables if file upload enters scope.

### Frontend Work

- Patient registry.
- Patient profile.
- Patient record timeline.

### Testing Work

- Tenant isolation for patient list/read/write.
- PHI read/write audit tests.
- Pagination/search/filter/sort tests.
- Duplicate patient code tests.

### Documentation Work

- Patient API docs.
- Patient workflow smoke test plan.

## Sprint 5

### Features

- Implement schedules, leaves, appointments, and queue.
- Add Socket.IO tenant room foundation for queue updates.

### APIs

- Schedule and leave CRUD APIs.
- Appointment book/reschedule/cancel/check-in APIs.
- Queue check-in/call-next/complete/no-show APIs.

### Database Work

- Add doctor schedules, doctor leaves, appointments, queue counters, queue entries.
- Add appointment conflict constraints and queue token uniqueness.

### Frontend Work

- Appointment calendar.
- Reception queue dashboard.
- Doctor queue view.

### Testing Work

- Appointment conflict and idempotency tests.
- Queue token concurrency tests.
- State transition tests.
- WebSocket tenant room tests.

### Documentation Work

- Appointment workflow doc.
- Queue workflow doc.
- Realtime event contract.

## Sprint 6

### Features

- Implement clinical, vitals, prescriptions, and basic billing.
- Keep lab, WhatsApp, advanced reports, and subscriptions for later unless core workflows finish early.

### APIs

- Consultation start/update/finalize APIs.
- Vitals create/list APIs.
- Prescription create/finalize/template APIs.
- Invoice/payment/receipt APIs.

### Database Work

- Add consultations, vitals, prescriptions, prescription items, templates.
- Add invoices, invoice items, payments, receipts, financial transaction baseline.
- Add decimal-safe money fields and billing idempotency keys.

### Frontend Work

- Doctor consultation workspace.
- Vitals panel.
- Prescription builder.
- Basic billing/payment screen.

### Testing Work

- Finalization immutability tests.
- Prescription tenant and audit tests.
- Billing totals/decimal precision tests.
- Payment idempotency tests.

### Documentation Work

- Clinical workflow doc.
- Prescription workflow doc.
- Billing workflow doc.
- MVP launch readiness checklist update.

## Critical Path

1. Phase 1 hardening and migration artifact.
2. Auth session correctness.
3. RBAC and tenant resolution.
4. Clinic onboarding and users.
5. Patients.
6. Appointments and queue.
7. Clinical and prescriptions.
8. Billing.
9. Operations, monitoring, backup, deployment gates.

No clinic workflow can safely launch before Auth, RBAC, tenant isolation, audit, and migrations are stable.

## Team Bottlenecks

- Backend architecture ownership: too many modules depend on one consistent repository/context/audit pattern.
- Database review: appointment, queue, billing, and audit need strong constraints and transaction review.
- Security review: Auth, RBAC, tenant override, audit, storage, and billing require senior review before merge.
- QA capacity: concurrency, tenant isolation, and billing correctness tests are heavier than normal CRUD tests.
- DevOps/SRE capacity: CI/CD, migrations, observability, backups, and deployment gates are launch blockers.
- Frontend/backend contract coordination: protected route handling and cookie auth must be aligned early.

## Highest-Risk Modules

- Auth: token theft, refresh reuse handling, session drift.
- RBAC: privilege escalation and inconsistent route protection.
- Tenant onboarding: partial tenant creation and bad default permissions.
- Appointments: double booking and invalid state transitions.
- Queue: duplicate tokens and realtime tenant leakage.
- Clinical/prescriptions: immutable medical record violations.
- Billing: decimal precision, overpayment, ledger inconsistency.
- Storage: PHI file exposure and unsafe signed URLs.
- Notifications/WhatsApp: provider retries, webhook spoofing, duplicate sends.
- Reports/exports: cross-tenant export leakage and OLTP overload.

## Highest-Value Modules

- Auth/RBAC/Tenants: required for paid SaaS trust.
- Patients: core data foundation.
- Appointments/Queue: daily clinic operational value.
- Clinical/Prescriptions: doctor productivity and retention value.
- Billing: revenue workflow and monetization proof.
- Notifications/WhatsApp: reduces no-shows and improves clinic communication.
- Reports/Exports: management value for clinic owners.
- Operations/Monitoring: launch confidence and enterprise diligence value.

## Recommended Implementation Order For Maximum Delivery Speed

1. Finish Auth core before adding more business APIs.
2. Finish RBAC and tenant resolution immediately after Auth.
3. Implement clinic onboarding, users, branches, and settings as one transaction-safe slice.
4. Build Patients and Patient Records before scheduling workflows.
5. Build Schedules, Appointments, and Queue together because their invariants overlap.
6. Build Clinical, Vitals, and Prescriptions after appointments are stable.
7. Build Basic Billing before Lab so invoices/payments are ready for revenue workflows.
8. Add Storage when the first file-backed workflow needs it, but complete S3 security before production file uploads.
9. Add Notifications and WhatsApp only after jobs/outbox are durable.
10. Add Reports/Exports after core data models stabilize.
11. Add Operations/Deployment gates continuously, not at the end.
12. Add full Subscriptions after tenant onboarding and billing are stable.

## Operating Rules

- No sprint closes without lint, build, tests, Prisma validation, and updated docs.
- No protected route ships without auth, tenant resolution, RBAC, validation, logging, and audit where required.
- No tenant-owned query ships without trusted tenant context.
- No critical workflow ships without transaction safety and idempotency where retries are possible.
- No broad rollout while P0 debt remains open.
