# Module Breakdown

## Domain Map

| Domain | Modules |
| --- | --- |
| Identity | Auth, RBAC, Users |
| Tenant | Clinics, Branches, Subscription Plans, Clinic Subscriptions, Settings |
| Patient | Patients, Patient Records |
| Scheduling | Doctor Schedules, Doctor Leaves, Appointments |
| Queue | Queue |
| Clinical | Clinical, Vitals, Prescriptions, Prescription Templates |
| Laboratory | Lab Tests, Lab Orders, Lab Order Items, Lab Reports |
| Financial | Billing |
| Communication | Notifications, WhatsApp, WhatsApp Accounts, WhatsApp Messages, WhatsApp Templates |
| Platform | Audit Logs, Reports, Storage, Jobs, Exports, Webhooks |

## Module Inventory

| Module | Purpose | Primary Tables | API Roots | Key Events |
| --- | --- | --- | --- | --- |
| Auth | Login, logout, refresh, session management, password reset, current user context. | users, refresh_tokens, password_reset_tokens, audit_logs | `/api/v1/auth` | auth.login.success, auth.login.failed, auth.logout.completed, auth.password_reset.requested, auth.password_reset.completed, auth.session.revoked |
| RBAC | Roles, permissions, scopes, role assignments, effective permission calculation. | rbac_roles, rbac_permissions, rbac_role_permissions, rbac_user_roles, audit_logs | `/api/v1/rbac` | rbac.role.created, rbac.role.updated, rbac.role.deleted, rbac.assignment.created, rbac.assignment.deleted |
| Clinics | Tenant lifecycle, onboarding, activation, suspension, archive, recovery. | clinics, users, clinic_subscriptions, settings, clinic_branches | `/api/v1/clinics` | clinic.created, clinic.updated, clinic.suspended, clinic.archived, clinic.restored |
| Users | Staff lifecycle, invitations, activation, deactivation, session impact. | users, user_invitations, rbac_user_roles, refresh_tokens | `/api/v1/users` | user.created, user.updated, user.deactivated, user.invited, user.activated |
| Patients | Central patient registry, demographics, search, lifecycle. | patients | `/api/v1/patients` | patient.created, patient.updated, patient.archived, patient.restored |
| Patient Records | Medical history, family history, allergies, clinical notes, document references. | patient_records, storage_files | `/api/v1/patient-records` | patient_record.created, patient_record.updated |
| Branches | Clinic locations, branch status, primary branch, branch assignment. | clinic_branches | `/api/v1/branches` | branch.created, branch.updated, branch.activated, branch.deactivated |
| Doctor Schedules | Weekly schedules, slot rules, branch assignments, availability. | doctor_schedules, users, clinic_branches | `/api/v1/doctor-schedules` | doctor_schedule.created, doctor_schedule.updated, doctor_schedule.deleted |
| Doctor Leaves | Doctor unavailability and leave conflict prevention. | doctor_leaves, users | `/api/v1/doctor-leaves` | doctor_leave.created, doctor_leave.updated, doctor_leave.cancelled |
| Appointments | Booking, rescheduling, cancellation, status tracking, conflict detection. | appointments, patients, users, doctor_schedules, doctor_leaves, audit_logs | `/api/v1/appointments` | appointment.created, appointment.updated, appointment.rescheduled, appointment.cancelled, appointment.checked_in, appointment.completed, appointment.no_show |
| Queue | Check-in, token generation, queue progression, realtime queue state. | queue_entries, queue_counters, appointments, patients, users | `/api/v1/queue` | queue.created, queue.updated, queue.called, queue.completed, queue.no_show |
| Clinical | Consultations, notes, diagnoses, plans, follow-up, timeline. | consultations, patients, appointments, storage_files, audit_logs | `/api/v1/clinical` | consultation.created, consultation.updated, consultation.finalized, consultation.followup_created |
| Vitals | Structured measurements, history, trend support. | vitals, patients, consultations | `/api/v1/vitals` | vitals.created, vitals.updated, vitals.recorded |
| Prescriptions | Medication recommendations, finalization, exports, history. | prescriptions, prescription_items, patients, users, consultations | `/api/v1/prescriptions` | prescription.created, prescription.updated, prescription.finalized |
| Prescription Templates | Reusable prescription structures and doctor productivity templates. | prescription_templates, users | `/api/v1/prescription-templates` | prescription_template.created, prescription_template.updated, prescription_template.deleted |
| Lab Tests | Clinic lab catalog, categories, pricing, activation. | lab_tests, lab_test_categories | `/api/v1/lab-tests` | lab_test.created, lab_test.updated, lab_test.deactivated |
| Lab Orders | Lab requests from consultations, cost calculation, lifecycle. | lab_orders, patients, consultations, appointments | `/api/v1/lab-orders` | lab_order.created, lab_order.updated, lab_order.cancelled, lab_order.completed |
| Lab Order Items | Individual tests inside lab orders. Internal only. | lab_order_items, lab_orders, lab_tests | Managed through Lab Order APIs | lab_order_item.created, lab_order_item.updated |
| Lab Reports | Results, report uploads, publication, downloads, history. | lab_reports, storage_files, lab_orders, lab_order_items | `/api/v1/lab-reports` | lab_report.created, lab_report.published, lab_report.downloaded |
| Billing | Invoices, invoice items, payments, receipts, refunds, credit notes, balances. | invoices, invoice_items, payments, payment_allocations, receipts, refunds, credit_notes | `/api/v1/billing` | invoice.created, invoice.finalized, invoice.paid, payment.recorded, payment.completed, refund.created, refund.completed, credit_note.created |
| Storage | File uploads, downloads, validation, retention, signed URLs, metadata. | storage_files, storage_folders, storage_access_logs | `/api/v1/storage` | storage.upload.started, storage.upload.completed, storage.file.deleted, storage.file.restored |
| WhatsApp | Provider integration, outbound/inbound processing, delivery tracking, webhook handling. | whatsapp_accounts, whatsapp_messages, whatsapp_templates, notification_jobs | `/api/v1/whatsapp` | whatsapp.message.sent, whatsapp.message.delivered, whatsapp.message.failed, whatsapp.webhook.received |
| WhatsApp Accounts | Clinic WhatsApp Business account configuration and verification. | whatsapp_accounts | `/api/v1/whatsapp/accounts` | whatsapp_account.created, whatsapp_account.updated, whatsapp_account.verified |
| WhatsApp Messages | Message history, delivery state, reconciliation, search. | whatsapp_messages | `/api/v1/whatsapp/messages` | whatsapp_message.created, whatsapp_message.delivered, whatsapp_message.read, whatsapp_message.failed |
| WhatsApp Templates | Reusable, localized, provider-approved WhatsApp templates. | whatsapp_templates | `/api/v1/whatsapp/templates` | whatsapp_template.created, whatsapp_template.approved, whatsapp_template.rejected |
| Notifications | Channel-agnostic notification orchestration, scheduling, retries. | notifications, notification_jobs, notification_deliveries | `/api/v1/notifications` | notification.created, notification.scheduled, notification.sent, notification.failed, notification.cancelled |
| Subscription Plans | Platform commercial offerings, features, limits, pricing. | subscription_plans, subscription_plan_features, subscription_plan_limits | `/api/v1/subscription-plans` | subscription_plan.created, subscription_plan.updated, subscription_plan.archived |
| Clinic Subscriptions | Tenant subscription lifecycle, trial, renewal, usage, enforcement. | clinic_subscriptions, subscription_usage, subscription_events, clinics | `/api/v1/subscriptions` | subscription.created, subscription.renewed, subscription.expired, subscription.limit_reached, subscription.plan_changed |
| Settings | Clinic settings, feature flags, preferences, branding, encrypted config. | settings, setting_history | `/api/v1/settings` | setting.created, setting.updated |
| Audit Logs | Immutable accountability, search, export, forensic support. | audit_logs, audit_exports | `/api/v1/audit-logs` | audit.record.created, audit.export.created |
| Reports | Dashboards, operational reports, exports, snapshots, aggregates. | reports, report_exports, report_snapshots | `/api/v1/reports` | report.generated, report.exported, report.failed |
| Jobs | Background task orchestration, retries, dead-lettering, worker coordination. | jobs, job_attempts, dead_letter_jobs | Internal/admin APIs only | job.started, job.completed, job.failed, job.dead_lettered |
| Exports | Large CSV/PDF/archive exports and generated files. | export_jobs, export_files | Internal via Reports/Audit/Storage | export.created, export.completed, export.failed |
| Webhooks | Inbound provider events, signature validation, replay prevention, idempotency. | webhook_events, webhook_failures | Provider-specific webhook endpoints | webhook.received, webhook.processed, webhook.failed |

## Cross-Module Rules

- No module may directly access another module's tables.
- Cross-module interaction must occur through service contracts or domain events.
- Business modules must not call WhatsApp providers, S3, email, SMS, or external systems directly.
- Storage operations must pass through `StorageService`.
- Notification operations must pass through `NotificationService`.
- Financial calculations must pass through `BillingService`.
- RBAC is required for all protected modules.
- Audit Logs receive critical events from every module.
- Reports consume data from all domains but do not mutate source data.
- Settings provide configuration to all modules.
- Subscription enforcement applies across tenant-owned modules.

## Module Structure Standard

Each public module should use this structure:

```text
src/modules/{module}/
  {module}.routes.js
  {module}.validator.js
  {module}.controller.js
  {module}.service.js
  {module}.repository.js
  {module}.events.js
  {module}.policy.js
  {module}.test.js
```

Internal-only modules may omit route/controller files but must still keep service and repository boundaries.

