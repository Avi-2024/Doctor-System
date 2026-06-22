# Database Design

## Database Strategy

- Engine: MySQL.
- ORM: Prisma.
- Topology: shared database, shared schema, logical tenant isolation.
- Tenant root: `clinics`.
- Primary key standard: UUID stored as `CHAR(36)` or Prisma `String`.
- Auto-increment is prohibited for business entities, except internal counters/statistics where justified.
- Business records use soft delete.
- Foreign keys are mandatory.
- `CASCADE UPDATE` is allowed; `CASCADE DELETE` is restricted for business records.
- Heavy reporting may use read replicas, aggregate tables, or snapshots.

## Common Fields

Every tenant-owned mutable business table must include:

| Field | Type | Notes |
| --- | --- | --- |
| id | CHAR(36) | Primary key UUID. |
| clinic_id | CHAR(36) | Required tenant owner unless platform-owned. |
| created_by | CHAR(36), nullable | Actor user id. |
| updated_by | CHAR(36), nullable | Actor user id. |
| created_at | DATETIME(3) | Default current timestamp. |
| updated_at | DATETIME(3) | Updated on mutation. |
| deleted_at | DATETIME(3), nullable | Required for soft delete capable business records. |
| deleted_by | CHAR(36), nullable | Actor who soft deleted. |
| is_deleted | BOOLEAN | Default false. |
| version | INT | Required for critical medical/financial records. |

Tenant-first indexes are mandatory:

- `(clinic_id)`
- `(clinic_id, is_deleted)`
- `(clinic_id, created_at)`
- `(clinic_id, updated_at)`
- Additional indexes based on query pattern.

## Table Catalog

The following plan uses concise column groups. All tenant-owned tables also include the common fields above unless explicitly marked platform-owned.

| Table | Purpose | Core Columns | FKs and Relationships | Unique Constraints | Required Indexes | Tenant and Delete Rules |
| --- | --- | --- | --- | --- | --- | --- |
| clinics | Tenant root and lifecycle. | code, name, status, timezone, contact_json, address_json, branding_json, owner_user_id | owner_user_id -> users.id nullable during onboarding | code | status, created_at | Platform-owned root; soft delete/archive only. |
| clinic_branches | Clinic locations and branch segmentation. | branch_code, name, contact_json, address_json, timezone, is_primary, status | clinic_id -> clinics.id | (clinic_id, branch_code), conditional primary branch per clinic | (clinic_id, is_primary), (clinic_id, status) | Tenant-owned by clinic; inactive branches cannot receive new appointments. |
| users | Platform and clinic users. | full_name, email, phone, password_hash, user_type, status, token_version, last_login_at, profile_json | clinic_id -> clinics.id nullable for Super Admin | (clinic_id, email) for clinic users; platform email uniqueness as policy | (clinic_id, email), (clinic_id, status), token_version | Tenant-owned except Super Admin; soft delete and session revocation. |
| refresh_tokens | Session/refresh token tracking. | user_id, token_hash, session_id, device_info_json, ip_address, user_agent, expires_at, last_used_at, revoked_at, replaced_by_token_id | user_id -> users.id, clinic_id -> clinics.id | token_hash, session_id | (clinic_id, user_id, expires_at), (user_id, revoked_at) | Tenant follows user; hard purge allowed after security retention. |
| password_reset_tokens | Account recovery tokens. | user_id, token_hash, expires_at, used_at | user_id -> users.id | token_hash | (clinic_id, user_id, expires_at) | Tenant follows user; raw token never stored. |
| user_invitations | Staff onboarding invitations. | user_id, email, full_name, phone, token_hash, expires_at, accepted_at, revoked_at, invited_by | user_id -> users.id, invited_by -> users.id | token_hash, (clinic_id, email, accepted_at nullable policy) | (clinic_id, email), (clinic_id, expires_at) | Tenant-owned; single-use token. |
| rbac_permissions | Atomic permissions. | key_name, module_name, action, label, description, is_reserved, is_system, status | clinic_id nullable for platform/system permissions | (clinic_id, key_name) | (clinic_id, module_name, action), (key_name) | Platform or tenant-owned; system permissions immutable by tenants. |
| rbac_roles | System and custom roles. | key_name, name, description, role_type, is_system, status | clinic_id nullable for platform roles | (clinic_id, key_name) | (clinic_id, status), (clinic_id, is_system) | System roles cannot be deleted; custom roles tenant-owned. |
| rbac_role_permissions | Role permission scope links. | role_id, permission_id, scope | role_id -> rbac_roles.id, permission_id -> rbac_permissions.id | (clinic_id, role_id, permission_id) | (clinic_id, role_id), (clinic_id, permission_id) | Tenant follows role; soft delete revocation. |
| rbac_user_roles | User role assignments. | user_id, role_id, branch_id, is_primary, assigned_at, revoked_at | user_id -> users.id, role_id -> rbac_roles.id, branch_id -> clinic_branches.id | active assignment uniqueness by user, role, branch | (clinic_id, user_id, revoked_at), (clinic_id, role_id) | Tenant-owned; assignment changes audited. |
| subscription_plans | Platform commercial plans. | code, name, plan_type, status, monthly_price, yearly_price, currency, version | none tenant-owned | code, (code, version) | status, plan_type | Platform-owned; no clinic_id required. |
| subscription_plan_features | Feature flags per plan. | plan_id, feature_key, feature_value_json, status | plan_id -> subscription_plans.id | (plan_id, feature_key) | plan_id, feature_key | Platform-owned. |
| subscription_plan_limits | Usage limits per plan. | plan_id, limit_key, limit_value, unit | plan_id -> subscription_plans.id | (plan_id, limit_key) | plan_id, limit_key | Platform-owned. |
| clinic_subscriptions | Tenant subscription lifecycle. | plan_id, status, starts_at, ends_at, trial_ends_at, grace_ends_at, billing_period, usage_snapshot_json | clinic_id -> clinics.id, plan_id -> subscription_plans.id | one active subscription per clinic | (clinic_id, status), (plan_id), (expires_at) | Tenant-owned; updates transactional. |
| subscription_usage | Usage counters. | subscription_id, usage_key, used_value, limit_value, period_start, period_end | subscription_id -> clinic_subscriptions.id | (clinic_id, subscription_id, usage_key, period_start) | (clinic_id, usage_key), (clinic_id, period_end) | Tenant-owned; server-side enforcement only. |
| subscription_events | Subscription lifecycle history. | subscription_id, event_type, payload_json, occurred_at | subscription_id -> clinic_subscriptions.id | none | (clinic_id, subscription_id, occurred_at) | Tenant-owned append-only. |
| settings | Platform and clinic configuration. | setting_key, setting_value_json, scope, is_encrypted, status | clinic_id nullable for platform settings | (clinic_id, setting_key, scope) | (clinic_id, scope), setting_key | Tenant or platform-owned; sensitive values encrypted. |
| setting_history | Historical setting values. | setting_id, old_value_json, new_value_json, changed_by, changed_at | setting_id -> settings.id | none | (clinic_id, setting_id, changed_at) | Tenant follows setting; append-only. |
| patients | Patient registry. | patient_code, full_name, phone, email, gender, date_of_birth, blood_group, demographics_json, medical_summary_json, status | clinic_id -> clinics.id | (clinic_id, patient_code) | (clinic_id, full_name), (clinic_id, phone), (clinic_id, created_at) | Tenant-owned; code immutable; soft delete/archive. |
| patient_records | Medical history and supporting data. | patient_id, record_type, record_data_json, recorded_at, attachment_count | patient_id -> patients.id | none | (clinic_id, patient_id), (clinic_id, record_type), (clinic_id, created_at) | Tenant-owned; medical access audited; soft delete with retention. |
| doctor_schedules | Doctor weekly availability. | doctor_id, branch_id, weekday, start_time, end_time, slot_duration_minutes, timezone, status | doctor_id -> users.id, branch_id -> clinic_branches.id | (clinic_id, doctor_id, branch_id, weekday, start_time) | (clinic_id, doctor_id), (clinic_id, branch_id), (clinic_id, weekday), (clinic_id, status) | Tenant-owned; overlapping schedules rejected. |
| doctor_leaves | Doctor unavailability. | doctor_id, branch_id, starts_at, ends_at, reason, status | doctor_id -> users.id, branch_id -> clinic_branches.id | none | (clinic_id, doctor_id, starts_at, ends_at), (clinic_id, status) | Tenant-owned; overlaps rejected. |
| appointments | Scheduling and visit lifecycle. | patient_id, doctor_id, branch_id, appointment_date, starts_at, ends_at, status, source, reason, cancellation_reason, idempotency_key | patient_id -> patients.id, doctor_id -> users.id, branch_id -> clinic_branches.id | (clinic_id, doctor_id, starts_at, active status policy), idempotency_key | (clinic_id, patient_id), (clinic_id, doctor_id), (clinic_id, appointment_date), (clinic_id, status), (clinic_id, branch_id) | Tenant-owned; soft delete; state transitions enforced. |
| queue_counters | Atomic queue token counters. | branch_id, queue_date, next_token | branch_id -> clinic_branches.id | (clinic_id, branch_id, queue_date) | (clinic_id, queue_date) | Tenant-owned; row locked during check-in. |
| queue_entries | Live patient queue. | patient_id, doctor_id, appointment_id, branch_id, queue_date, token_number, priority, status, called_at, started_at, completed_at | patient_id -> patients.id, doctor_id -> users.id, appointment_id -> appointments.id, branch_id -> clinic_branches.id | (clinic_id, branch_id, queue_date, token_number) | (clinic_id, queue_date), (clinic_id, status), (clinic_id, branch_id), (clinic_id, doctor_id) | Tenant-owned; no skipped token without audit. |
| consultations | Clinical consultation records. | patient_id, doctor_id, appointment_id, status, chief_complaint, notes_json, diagnosis_json, treatment_plan_json, follow_up_json, finalized_at, previous_version_id | patient_id -> patients.id, doctor_id -> users.id, appointment_id -> appointments.id, previous_version_id -> consultations.id | none | (clinic_id, patient_id), (clinic_id, doctor_id), (clinic_id, appointment_id), (clinic_id, created_at) | Tenant-owned; finalized records immutable and versioned. |
| vitals | Patient measurements. | patient_id, consultation_id, measured_at, vital_data_json, status | patient_id -> patients.id, consultation_id -> consultations.id | none | (clinic_id, patient_id), (clinic_id, consultation_id), (clinic_id, measured_at) | Tenant-owned; historical records preserved. |
| prescriptions | Prescription header and finalization state. | patient_id, doctor_id, consultation_id, status, diagnosis, advice, finalized_at, export_file_id, previous_version_id | patient_id -> patients.id, doctor_id -> users.id, consultation_id -> consultations.id, export_file_id -> storage_files.id | none | (clinic_id, patient_id), (clinic_id, doctor_id), (clinic_id, consultation_id), (clinic_id, created_at) | Tenant-owned; finalized immutable and versioned. |
| prescription_items | Medication snapshot lines. | prescription_id, medicine_name, dosage, frequency, duration, instructions, sort_order | prescription_id -> prescriptions.id | none | (clinic_id, prescription_id), (clinic_id, medicine_name) | Tenant-owned through prescription; snapshots never mutate from templates. |
| prescription_templates | Reusable prescription templates. | doctor_id, name, visibility, template_data_json, status | doctor_id -> users.id | (clinic_id, doctor_id, name) | (clinic_id, doctor_id), (clinic_id, status) | Tenant-owned; template changes do not affect finalized prescriptions. |
| lab_test_categories | Lab catalog categories. | code, name, description, status | clinic_id -> clinics.id | (clinic_id, code) | (clinic_id, status) | Tenant-owned. |
| lab_tests | Lab investigation catalog. | category_id, code, name, description, price, currency, status | category_id -> lab_test_categories.id | (clinic_id, code) | (clinic_id, category_id), (clinic_id, status) | Tenant-owned; inactive tests cannot be ordered. |
| lab_orders | Lab order header. | order_number, patient_id, consultation_id, appointment_id, doctor_id, status, total_amount, ordered_at, completed_at | patient_id -> patients.id, consultation_id -> consultations.id, appointment_id -> appointments.id, doctor_id -> users.id | (clinic_id, order_number) | (clinic_id, patient_id), (clinic_id, consultation_id), (clinic_id, status), (clinic_id, created_at) | Tenant-owned; at least one item required. |
| lab_order_items | Individual ordered tests. | lab_order_id, lab_test_id, test_code_snapshot, test_name_snapshot, price_snapshot, status, result_data_json | lab_order_id -> lab_orders.id, lab_test_id -> lab_tests.id | (clinic_id, lab_order_id, lab_test_id) policy | (clinic_id, lab_order_id), (clinic_id, lab_test_id), (clinic_id, status) | Tenant-owned through order; price snapshot preserved. |
| lab_reports | Lab result records and file links. | lab_order_id, patient_id, status, result_data_json, file_id, reviewed_by, reviewed_at, published_at, previous_version_id | lab_order_id -> lab_orders.id, patient_id -> patients.id, file_id -> storage_files.id, previous_version_id -> lab_reports.id | none | (clinic_id, patient_id), (clinic_id, lab_order_id), (clinic_id, status), (clinic_id, created_at) | Tenant-owned; published immutable and versioned. |
| invoices | Financial invoice header. | invoice_number, patient_id, source_type, source_id, invoice_date, status, subtotal, discount_total, tax_total, total_amount, paid_amount, due_amount, currency, finalized_at | patient_id -> patients.id nullable | (clinic_id, invoice_number) | (clinic_id, patient_id), (clinic_id, status), (clinic_id, invoice_date) | Tenant-owned; immutable after finalization except adjustments. |
| invoice_items | Invoice line items. | invoice_id, item_type, description, quantity, unit_price, discount_amount, tax_amount, total_amount, source_type, source_id | invoice_id -> invoices.id | none | (clinic_id, invoice_id), (clinic_id, item_type) | Tenant-owned through invoice; soft delete only before finalization. |
| payments | Payment records. | invoice_id, receipt_id, amount, method, status, reference_number, paid_at, idempotency_key | invoice_id -> invoices.id, receipt_id -> receipts.id nullable | (clinic_id, idempotency_key), receipt number through receipts | (clinic_id, invoice_id), (clinic_id, status), (clinic_id, paid_at) | Tenant-owned; transactional and immutable after completion. |
| payment_allocations | Payment-to-invoice allocation. | payment_id, invoice_id, amount | payment_id -> payments.id, invoice_id -> invoices.id | (clinic_id, payment_id, invoice_id) | (clinic_id, payment_id), (clinic_id, invoice_id) | Tenant-owned; financial consistency required. |
| receipts | Payment receipt documents. | receipt_number, payment_id, invoice_id, amount, issued_at, file_id | payment_id -> payments.id, invoice_id -> invoices.id, file_id -> storage_files.id nullable | (clinic_id, receipt_number) | (clinic_id, invoice_id), (clinic_id, issued_at) | Tenant-owned; immutable after issue. |
| refunds | Refund workflow. | payment_id, amount, reason, status, processed_at, reference_number | payment_id -> payments.id | none | (clinic_id, payment_id), (clinic_id, status), (clinic_id, processed_at) | Tenant-owned; requires original payment. |
| credit_notes | Credit adjustments. | invoice_id, credit_number, amount, reason, status, issued_at | invoice_id -> invoices.id | (clinic_id, credit_number) | (clinic_id, invoice_id), (clinic_id, status) | Tenant-owned; immutable after issue. |
| financial_transactions | Ledger-style financial history. | source_type, source_id, debit_amount, credit_amount, balance_after, occurred_at, metadata_json | source ids are polymorphic by source_type | none | (clinic_id, source_type, source_id), (clinic_id, occurred_at) | Tenant-owned append-only. |
| storage_files | Authoritative file metadata. | module_name, entity_type, entity_id, storage_key, file_name, file_size, mime_type, checksum, uploaded_by, retention_until, status | uploaded_by -> users.id | storage_key, checksum policy by entity | (clinic_id, module_name), (clinic_id, entity_type, entity_id), (clinic_id, uploaded_by), (clinic_id, created_at) | Tenant-owned; object access only through signed URLs. |
| storage_folders | Optional logical storage grouping. | module_name, entity_type, entity_id, name, parent_folder_id | parent_folder_id -> storage_folders.id | (clinic_id, parent_folder_id, name) | (clinic_id, module_name), (clinic_id, parent_folder_id) | Tenant-owned. |
| storage_access_logs | File access history. | file_id, actor_user_id, operation, ip_address, user_agent, signed_url_expires_at | file_id -> storage_files.id, actor_user_id -> users.id | none | (clinic_id, file_id, created_at), (clinic_id, actor_user_id, created_at) | Tenant-owned append-only. |
| notifications | Notification records. | recipient_id, recipient_type, notification_type, channel, status, priority, payload_json, scheduled_at, sent_at, delivered_at, cancelled_at | recipient references polymorphic; clinic_id required | idempotency key policy | (clinic_id, recipient_id), (clinic_id, status), (clinic_id, scheduled_at), (clinic_id, channel) | Tenant-owned; immutable after dispatch except status transitions. |
| notification_jobs | Delivery job queue. | notification_id, status, attempts, next_run_at, locked_by, locked_at, last_error | notification_id -> notifications.id | none | (clinic_id, status, next_run_at), (locked_at) | Tenant-owned operational table. |
| notification_deliveries | Provider-level delivery attempts. | notification_id, provider, provider_message_id, status, attempt_number, response_json, delivered_at | notification_id -> notifications.id | provider_message_id where present | (clinic_id, notification_id), (clinic_id, status) | Tenant-owned append-only/status history. |
| dead_letter_notifications | Failed notifications requiring investigation. | notification_id, failure_reason, payload_json, failed_at, resolved_at | notification_id -> notifications.id | none | (clinic_id, failed_at), (clinic_id, resolved_at) | Tenant-owned recoverable dead letter. |
| whatsapp_accounts | Clinic WhatsApp Business configuration. | phone_number_id, business_account_id, display_phone_number, status, access_token_ref, webhook_secret_ref, verified_at | clinic_id -> clinics.id | (clinic_id, phone_number_id), business_account_id policy | (clinic_id, status), phone_number_id | Tenant-owned; credentials encrypted or referenced through secrets manager. |
| whatsapp_templates | WhatsApp template registry. | account_id, name, provider_template_name, language_code, category, status, version, components_json, approved_at | account_id -> whatsapp_accounts.id | (clinic_id, name, language_code, version) | (clinic_id, status), (clinic_id, category) | Tenant-owned; approved snapshots immutable. |
| whatsapp_messages | Message history and delivery state. | account_id, notification_id, patient_id, direction, sender, recipient, message_type, body, template_id, provider_message_id, status, payload_json, sent_at, delivered_at, read_at | account_id -> whatsapp_accounts.id, notification_id -> notifications.id, patient_id -> patients.id, template_id -> whatsapp_templates.id | provider_message_id where present | (clinic_id, patient_id), (clinic_id, status), (clinic_id, created_at), provider_message_id | Tenant-owned; history immutable. |
| webhook_events | Inbound provider events. | provider, provider_event_id, event_type, payload_json, signature_valid, processed_at, status | clinic_id nullable until resolved; account references in payload | (provider, provider_event_id) | (clinic_id, provider, status), (created_at) | Tenant-resolved before business mutation; append-only. |
| webhook_failures | Failed webhook processing. | webhook_event_id, reason, error_message, retry_count, next_retry_at, resolved_at | webhook_event_id -> webhook_events.id | none | (clinic_id, next_retry_at), (resolved_at) | Tenant follows webhook event. |
| audit_logs | Immutable audit records. | actor_user_id, action, module_name, resource_type, resource_id, severity, request_id, ip_address, user_agent, before_data_json, after_data_json, metadata_json, hash, previous_hash | actor_user_id -> users.id nullable | none | (clinic_id, module_name, action, created_at), (clinic_id, resource_type, resource_id), (actor_user_id), request_id | Tenant-aware; no soft delete; append-only. |
| audit_exports | Audit export jobs and files. | requested_by, status, filters_json, file_id, expires_at, completed_at | requested_by -> users.id, file_id -> storage_files.id | none | (clinic_id, status), (clinic_id, requested_by), (expires_at) | Tenant-owned unless platform export. |
| reports | Report request records. | report_type, status, parameters_json, requested_by, started_at, completed_at, result_json | requested_by -> users.id | none | (clinic_id, report_type), (clinic_id, status), (clinic_id, created_at) | Tenant-owned; heavy reports async. |
| report_exports | Report export jobs. | report_id, export_type, status, file_id, expires_at | report_id -> reports.id, file_id -> storage_files.id | none | (clinic_id, report_id), (clinic_id, status), (expires_at) | Tenant-owned; signed URLs only. |
| report_snapshots | Point-in-time report snapshots. | report_type, period_start, period_end, snapshot_data_json, generated_at | clinic_id -> clinics.id | (clinic_id, report_type, period_start, period_end) | (clinic_id, generated_at), (clinic_id, report_type) | Tenant-owned immutable snapshot. |
| report_aggregates | Dashboard/report aggregate facts. | aggregate_key, period_start, period_end, dimensions_json, metrics_json | clinic_id -> clinics.id | (clinic_id, aggregate_key, period_start, period_end) | (clinic_id, aggregate_key), (clinic_id, period_start) | Tenant-owned; rebuildable from source data. |
| jobs | Generic background jobs. | job_type, status, payload_json, priority, attempts, max_attempts, run_at, locked_by, locked_at, completed_at | clinic_id nullable for platform jobs | idempotency key policy | (status, run_at), (clinic_id, status), (locked_at) | Tenant-aware operational table. |
| job_attempts | Job attempt history. | job_id, attempt_number, status, started_at, finished_at, error_message | job_id -> jobs.id | (job_id, attempt_number) | job_id, status | Tenant follows job; append-only. |
| dead_letter_jobs | Failed jobs after retry exhaustion. | job_id, failure_reason, payload_json, failed_at, resolved_at | job_id -> jobs.id | none | (clinic_id, failed_at), resolved_at | Tenant-aware recoverable dead letter. |
| export_jobs | Generic export jobs. | export_type, status, requested_by, filters_json, file_id, expires_at | requested_by -> users.id, file_id -> storage_files.id | none | (clinic_id, export_type), (clinic_id, status), expires_at | Tenant-owned unless platform export. |
| export_files | Export file metadata extension. | export_job_id, file_id, format, row_count, size_bytes | export_job_id -> export_jobs.id, file_id -> storage_files.id | none | (clinic_id, export_job_id), (clinic_id, file_id) | Tenant-owned; purge by retention. |
| outbox_events | Transactional event outbox. | event_name, event_version, aggregate_type, aggregate_id, tenant_id, correlation_id, causation_id, producer, payload_json, status, attempts, next_retry_at, published_at | tenant_id -> clinics.id nullable for platform events | event_id | (tenant_id, status, next_retry_at), (aggregate_type, aggregate_id), correlation_id | Append-only operational; tenant required for tenant events. |
| dead_letter_events | Failed event publications/consumptions. | outbox_event_id, event_name, payload_json, failure_reason, failed_at, resolved_at | outbox_event_id -> outbox_events.id | none | (tenant_id, failed_at), event_name | Recoverable dead letter. |
| processed_events | Idempotency tracker for consumers. | event_id, consumer_name, processed_at, status | event_id logical FK to outbox_events.event_id | (event_id, consumer_name) | consumer_name, processed_at | Prevents duplicate side effects. |

## Relationship Plan

One-to-one relationships:

- Clinic -> active Clinic Subscription.
- Payment -> Receipt.
- Lab Order -> published Lab Report, when one final report is used.
- User -> current profile/settings, if profile is split later.

One-to-many relationships:

- Clinic -> Users, Branches, Patients, Appointments, Settings, Reports, Audit Logs.
- Branch -> Appointments, Queue Entries, Doctor Schedules.
- Patient -> Patient Records, Appointments, Consultations, Vitals, Prescriptions, Lab Orders, Lab Reports, Invoices.
- Doctor/User -> Schedules, Leaves, Appointments, Consultations, Prescriptions.
- Appointment -> Queue Entries, Consultations, Billing source records.
- Consultation -> Vitals, Prescriptions, Lab Orders.
- Lab Order -> Lab Order Items, Lab Reports.
- Invoice -> Invoice Items, Payments, Credit Notes, Refunds through payments.
- Notification -> Notification Jobs, Deliveries, WhatsApp Messages.
- Storage File -> Access Logs.
- Report -> Report Exports.
- Job -> Job Attempts.

Many-to-many relationships:

- Users <-> Roles through `rbac_user_roles`.
- Roles <-> Permissions through `rbac_role_permissions`.
- Payments <-> Invoices through `payment_allocations`, supporting future multi-invoice payment allocation.
- Subscription Plans <-> Features/Limits through plan feature/limit tables.

## Indexing Requirements

Mandatory tenant-first indexes:

- All tenant-owned tables: `(clinic_id)`, `(clinic_id, is_deleted)`, `(clinic_id, created_at)`.
- Patients: `(clinic_id, patient_code)`, `(clinic_id, full_name)`, `(clinic_id, phone)`.
- Appointments: `(clinic_id, doctor_id, appointment_date)`, `(clinic_id, patient_id, appointment_date)`, `(clinic_id, branch_id, status)`.
- Queue: `(clinic_id, branch_id, queue_date, token_number)`, `(clinic_id, status)`.
- Clinical: `(clinic_id, patient_id, created_at)`, `(clinic_id, doctor_id, created_at)`.
- Billing: `(clinic_id, invoice_number)`, `(clinic_id, patient_id)`, `(clinic_id, status)`, `(clinic_id, invoice_date)`.
- Notifications/jobs: `(clinic_id, status, scheduled_at/run_at)`.
- Audit: `(clinic_id, module_name, action, created_at)`, `(clinic_id, resource_type, resource_id)`, `request_id`.
- Outbox/jobs: `(status, next_retry_at)`, `(tenant_id, status, next_retry_at)`.

## Retention Requirements

- Clinical data: 10 years minimum.
- Lab reports: 10 years minimum.
- Patient documents: 10 years minimum.
- Billing records: 10 years minimum.
- Operational data: 7 years minimum.
- Billing exports: 7 years.
- Notification history: 2 years.
- Audit logs: permanent.
- Audit exports: permanent or explicitly governed by compliance policy.
- Temporary exports: default 30 days unless overridden.

