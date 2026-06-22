# Final Execution Roadmap

## Summary

Build `backend-new` as a production-grade modular monolith. The build order protects the system boundaries first: foundation, database standards, audit, authentication, RBAC, tenant isolation, then business workflows. Full commercial subscription enforcement is phase 16, but minimal subscription records are introduced during tenant onboarding so clinic creation remains transactional.

Roadmap phase files:

1. `PHASE_01_FOUNDATION.md`
2. `PHASE_02_AUTH.md`
3. `PHASE_03_RBAC.md`
4. `PHASE_04_TENANTS.md`
5. `PHASE_05_PATIENTS.md`
6. `PHASE_06_APPOINTMENTS.md`
7. `PHASE_07_QUEUE.md`
8. `PHASE_08_CLINICAL.md`
9. `PHASE_09_LABORATORY.md`
10. `PHASE_10_BILLING.md`
11. `PHASE_11_STORAGE.md`
12. `PHASE_12_NOTIFICATIONS.md`
13. `PHASE_13_WHATSAPP.md`
14. `PHASE_14_REPORTS_EXPORTS.md`
15. `PHASE_15_OPERATIONS_DEPLOYMENT.md`
16. `PHASE_16_SUBSCRIPTIONS.md`

## Final Module List

| Module | Priority | Complexity | Dependencies | Tables | APIs | Tests | Risks |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| Foundation | P0 | High | none | 4 | 4 | 25 | Weak standards affect all modules. |
| Audit Logs | P0 | High | Foundation, Users | 2 | 3 | 20 | Missing audit on PHI/security actions. |
| Auth | P0 | High | Foundation, Users, Audit | 5 | 7 | 35 | Token theft, reuse, session drift. |
| RBAC | P0 | High | Auth, Audit | 4 | 12 | 40 | Privilege escalation. |
| Clinics | P0 | High | Auth, RBAC, Settings, Audit | 5 | 5 | 30 | Partial tenant creation. |
| Branches | P0 | Medium | Clinics, RBAC | 1 | 5 | 18 | Branch scope leakage. |
| Users | P0 | High | Clinics, RBAC, Auth | 2 | 8 | 30 | Role/session inconsistency. |
| Settings | P0 | Medium | Clinics, Audit | 2 | 4 | 16 | Sensitive config leakage. |
| Patients | P1 | Medium | Tenants, RBAC, Audit | 1 | 7 | 28 | Duplicate patients, tenant leaks. |
| Patient Records | P1 | High | Patients, Storage, Audit | 1 | 5 | 25 | PHI access not audited. |
| Doctor Schedules | P1 | Medium | Users, Branches | 1 | 5 | 22 | Slot conflicts. |
| Doctor Leaves | P1 | Medium | Users, Schedules | 1 | 5 | 18 | Availability bugs. |
| Appointments | P1 | Very High | Patients, Doctors, Schedules, Leaves | 1 | 9 | 45 | Double booking, invalid transitions. |
| Queue | P1 | High | Appointments, Branches, WebSocket | 2 | 7 | 35 | Duplicate tokens, realtime leakage. |
| Clinical | P1 | Very High | Patients, Appointments, Audit | 1 | 5 | 35 | Immutable clinical record violations. |
| Vitals | P1 | Medium | Patients, Clinical | 1 | 5 | 20 | Unit/measurement inconsistency. |
| Prescriptions | P1 | High | Clinical, Patients, Doctors | 2 | 6 | 35 | Finalized prescription mutation. |
| Prescription Templates | P2 | Medium | Prescriptions, Doctors | 1 | 5 | 18 | Template changes affecting history. |
| Lab Tests | P2 | Medium | Clinics, RBAC | 2 | 5 | 20 | Pricing/catalog drift. |
| Lab Orders | P2 | High | Clinical, Patients, Lab Tests | 2 | 5 | 30 | Partial orders, stale price snapshots. |
| Lab Reports | P2 | High | Lab Orders, Storage, Notifications | 1 | 7 | 30 | Unreviewed report publication. |
| Billing | P2 | Very High | Patients, Appointments, Lab, Audit | 7 | 10 | 50 | Money precision, overpayment. |
| Storage | P1 | High | Tenants, RBAC, Audit | 3 | 5 | 35 | Unsafe upload/download. |
| Notifications | P2 | High | Jobs, Events, Patients, Users | 4 | 5 | 30 | Duplicate delivery. |
| WhatsApp | P2 | High | Notifications, Webhooks, Jobs | 3 | 4 | 28 | Provider spoofing/outage. |
| WhatsApp Accounts | P2 | Medium | WhatsApp, Settings | included | 5 | 18 | Secret exposure. |
| WhatsApp Messages | P2 | Medium | WhatsApp | included | 3 | 18 | Message history leakage. |
| WhatsApp Templates | P2 | Medium | WhatsApp Accounts | included | 4 | 18 | Invalid variables. |
| Reports | P3 | High | Business modules, Jobs, Storage | 4 | 4 | 35 | Heavy queries on OLTP DB. |
| Exports | P3 | Medium | Reports, Storage, Jobs | 2 | 3 | 20 | Cross-tenant export leakage. |
| Jobs | P0 | High | Foundation, DB | 3 | admin | 35 | Duplicate execution. |
| Webhooks | P2 | High | WhatsApp, Jobs, Audit | 2 | provider | 25 | Replay/spoofing. |
| Subscription Plans | P3 | Medium | RBAC, Billing | 3 | 5 | 22 | Plan version drift. |
| Clinic Subscriptions | P3 | High | Clinics, Plans, Billing | 3 | 5 | 30 | Limit bypass. |

## Dependency Map

Core chain:

`Foundation -> Database -> Audit -> Auth -> RBAC -> Tenants -> Users/Branches/Settings`

Business chain:

`Patients -> Appointments/Schedules -> Queue -> Clinical -> Prescriptions/Lab -> Billing`

Platform chain:

`Jobs/Outbox -> Notifications -> WhatsApp/Webhooks -> Reports/Exports -> Operations`

Storage chain:

`Tenants/RBAC/Audit -> Storage -> Patient Records/Lab Reports/Prescription Exports/Report Exports`

Subscription chain:

`Minimal Subscription Records in Phase 04 -> Full Plans/Usage/Enforcement in Phase 16`

## Database Build Order

1. Foundation: schema migrations, audit logs, outbox events, processed events, jobs, dead letters.
2. Identity: users, refresh tokens, reset tokens, invitations.
3. RBAC: permissions, roles, role permissions, user roles.
4. Tenants: clinics, branches, settings, minimal subscriptions.
5. Patients: patients, patient records.
6. Scheduling: doctor schedules, leaves, appointments, queue counters, queue entries.
7. Clinical: consultations, vitals, prescriptions, prescription items, templates.
8. Laboratory: lab categories, lab tests, lab orders, lab order items, lab reports.
9. Billing: invoices, invoice items, payments, allocations, receipts, refunds, credit notes, ledger.
10. Storage: storage files, folders, access logs.
11. Communication: notifications, notification jobs, deliveries, WhatsApp, webhooks.
12. Reports: reports, exports, snapshots, aggregates.
13. Subscriptions: plans, features, limits, usage, subscription events.

## API Build Order

1. Health/readiness, error envelope, request context.
2. Auth APIs.
3. RBAC APIs.
4. Clinic, branch, user, settings APIs.
5. Patient and patient record APIs.
6. Schedule, leave, appointment APIs.
7. Queue APIs.
8. Clinical, vitals, prescription APIs.
9. Lab catalog, order, report APIs.
10. Billing APIs.
11. Storage APIs.
12. Notification APIs.
13. WhatsApp and webhook APIs.
14. Report, export, audit export APIs.
15. Platform operations APIs.
16. Subscription APIs.

## RBAC Build Order

1. Permission catalog and scope enum.
2. System role seed.
3. Role-permission seed.
4. User role assignments.
5. Effective permission resolver.
6. Endpoint guards.
7. Service-level ownership guards.
8. Permission cache invalidation and session revocation.
9. Audit on RBAC changes and denied access.
10. Final endpoint-permission matrix per module.

## Frontend Build Order

1. Auth shell and session handling.
2. Super Admin tenant onboarding.
3. Clinic owner staff, branch, and settings UI.
4. Patient registry and records.
5. Scheduling and appointment calendar.
6. Queue dashboard with realtime.
7. Doctor consultation workspace.
8. Prescriptions and lab orders.
9. Lab reports.
10. Billing and receipts.
11. Storage/file views.
12. Notifications and WhatsApp.
13. Reports and exports.
14. Subscription/admin billing.
15. Operations/admin diagnostics.

## Worker Build Order

1. Job claim/retry/dead-letter foundation.
2. Outbox publisher.
3. Audit and export workers.
4. Appointment reminder scheduler.
5. Notification delivery worker.
6. WhatsApp outbound worker.
7. Webhook processor.
8. Storage orphan/retention workers.
9. Report/export workers.
10. Subscription expiry/usage workers.

## WebSocket Build Order

1. Socket authentication handshake.
2. Tenant room assignment.
3. Session revocation disconnect.
4. Queue events.
5. Appointment events.
6. Clinical and lab notification events.
7. Billing payment events.
8. User, role, and settings admin events.
9. Presence and heartbeat.
10. Redis adapter before multi-node production.

## Infrastructure Build Order

1. Environment validation and secrets.
2. MySQL private network and backups.
3. S3 private bucket, encryption, lifecycle.
4. Nginx/TLS/body limits.
5. Sentry-ready error reporting.
6. Metrics, logs, tracing.
7. Worker process topology.
8. Redis or equivalent for Socket.IO scaling.
9. CI checks: lint, test, Prisma validate, migration test, audit.
10. Backup restore validation.

## Deployment Build Order

1. Development environment.
2. Test database and integration test runner.
3. Staging environment.
4. Migration preflight pipeline.
5. Rolling API deploy.
6. Worker deploy with lock safety.
7. Socket deploy.
8. Production readiness checks.
9. Blue-green or rolling release policy.
10. Rollback and runbook validation.

## Assumptions

- Patient portal authentication is not MVP.
- DB-backed workers are used first; Redis/SQS/BullMQ remains an adapter upgrade.
- Redis Socket.IO adapter is required before multi-node realtime production.
- Online payment gateway is not MVP; billing records manual/internal payments first.
- Lab report publish requires explicit permission; doctor-review requirement must be locked before implementation.
- Clinic Owner clinical visibility defaults to restricted summaries until product approval grants full PHI access.

