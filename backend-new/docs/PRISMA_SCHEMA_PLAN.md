# Prisma Schema Plan

## Purpose

This is a Prisma planning document only. It intentionally does not include generated Prisma schema code or migrations.

The actual schema should be created only after approval of the Phase 0 database plan, module boundaries, and implementation phases.

## Prisma Baseline

Recommended Prisma setup:

- Generator: `prisma-client-js`.
- Datasource: MySQL.
- Migration tool: Prisma Migrate.
- Migration style: forward-only, reviewed, tested, immutable after merge.
- UUID strategy: application-generated UUID strings for business entities.
- Timestamps: `DateTime` with millisecond precision where supported.
- Monetary fields: `Decimal`, never `Float`.
- JSON fields: only for flexible metadata, snapshots, payloads, templates, and external provider payloads.
- Foreign keys: explicit relations for core ownership and integrity.
- Soft deletes: included on business entities.
- Version fields: included on critical clinical, lab, and billing records.

## Naming Standards

Prisma models may use PascalCase while database tables remain snake_case through mapping.

Recommended mapping:

| Prisma Model | Database Table |
| --- | --- |
| Clinic | clinics |
| ClinicBranch | clinic_branches |
| User | users |
| RefreshToken | refresh_tokens |
| PasswordResetToken | password_reset_tokens |
| RbacRole | rbac_roles |
| RbacPermission | rbac_permissions |
| RbacRolePermission | rbac_role_permissions |
| RbacUserRole | rbac_user_roles |
| Patient | patients |
| PatientRecord | patient_records |
| Appointment | appointments |
| QueueEntry | queue_entries |
| Consultation | consultations |
| Prescription | prescriptions |
| LabOrder | lab_orders |
| Invoice | invoices |
| StorageFile | storage_files |
| AuditLog | audit_logs |
| OutboxEvent | outbox_events |

Column names should remain snake_case in MySQL and be mapped where needed.

## Model Groups

### Foundation

- Clinic
- ClinicBranch
- Setting
- SettingHistory
- AuditLog
- OutboxEvent
- DeadLetterEvent
- ProcessedEvent

### Identity and Authorization

- User
- RefreshToken
- PasswordResetToken
- UserInvitation
- RbacPermission
- RbacRole
- RbacRolePermission
- RbacUserRole

### Subscription

- SubscriptionPlan
- SubscriptionPlanFeature
- SubscriptionPlanLimit
- ClinicSubscription
- SubscriptionUsage
- SubscriptionEvent

### Patient and Scheduling

- Patient
- PatientRecord
- DoctorSchedule
- DoctorLeave
- Appointment
- QueueCounter
- QueueEntry

### Clinical

- Consultation
- Vital
- Prescription
- PrescriptionItem
- PrescriptionTemplate

### Laboratory

- LabTestCategory
- LabTest
- LabOrder
- LabOrderItem
- LabReport

### Billing

- Invoice
- InvoiceItem
- Payment
- PaymentAllocation
- Receipt
- Refund
- CreditNote
- FinancialTransaction

### Communication

- Notification
- NotificationJob
- NotificationDelivery
- DeadLetterNotification
- WhatsAppAccount
- WhatsAppTemplate
- WhatsAppMessage
- WebhookEvent
- WebhookFailure

### Platform Operations

- StorageFile
- StorageFolder
- StorageAccessLog
- Report
- ReportExport
- ReportSnapshot
- ReportAggregate
- Job
- JobAttempt
- DeadLetterJob
- ExportJob
- ExportFile
- AuditExport

## Enum Plan

Prisma enums or controlled string constants should cover:

- ClinicStatus: ACTIVE, SUSPENDED, ARCHIVED, PURGED.
- BranchStatus: ACTIVE, INACTIVE, ARCHIVED.
- UserStatus: PENDING, ACTIVE, SUSPENDED, DEACTIVATED.
- RoleType: SYSTEM, CUSTOM.
- Scope: OWN, ASSIGNED, BRANCH, CLINIC, ALL.
- AppointmentStatus: SCHEDULED, CONFIRMED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW.
- QueueStatus: WAITING, CALLED, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED.
- ConsultationStatus: DRAFT, IN_PROGRESS, FINALIZED, ARCHIVED.
- PrescriptionStatus: DRAFT, REVIEWED, FINALIZED, ARCHIVED.
- LabOrderStatus: DRAFT, ORDERED, SAMPLE_COLLECTED, PROCESSING, COMPLETED, CANCELLED.
- LabReportStatus: DRAFT, UPLOADED, REVIEWED, PUBLISHED, ARCHIVED.
- InvoiceStatus: DRAFT, GENERATED, ISSUED, PARTIALLY_PAID, PAID, CANCELLED, REFUNDED.
- PaymentStatus: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED.
- NotificationStatus: CREATED, SCHEDULED, QUEUED, PROCESSING, SENT, DELIVERED, FAILED, CANCELLED, DEAD_LETTERED.
- Priority: LOW, NORMAL, HIGH, CRITICAL.
- WhatsAppMessageStatus: CREATED, QUEUED, PROCESSING, SENT, DELIVERED, READ, FAILED, EXPIRED.
- JobStatus: QUEUED, PROCESSING, COMPLETED, FAILED, DEAD_LETTERED, CANCELLED.
- ExportStatus: REQUESTED, GENERATING, COMPLETED, FAILED, EXPIRED.
- AuditSeverity: INFO, WARNING, CRITICAL.

Implementation note: MySQL enum migrations can be operationally awkward. Prefer string columns plus application constants unless a strong reason exists for native enums.

## Tenant Ownership Modeling

Rules:

- All tenant-owned models include required `clinicId`.
- Platform-owned models omit `clinicId` or keep it nullable only when the record can be both platform and tenant scoped.
- Indirect tenant-owned models still include `clinicId` for query performance and defense in depth.
- Repositories must require `clinicId` explicitly even when a relation could infer it.

Examples of direct tenant ownership:

- Patient
- Appointment
- Consultation
- Prescription
- LabOrder
- Invoice
- Notification
- StorageFile
- AuditLog

Examples of indirect ownership with explicit `clinicId`:

- InvoiceItem
- LabOrderItem
- PaymentAllocation
- NotificationDelivery
- JobAttempt

Platform-owned:

- SubscriptionPlan
- SubscriptionPlanFeature
- SubscriptionPlanLimit
- System permission catalog where `clinicId` is null.

## Relation Rules

- Define relations for tenant root and major business parent-child relationships.
- Do not rely only on relation traversal to enforce tenancy.
- Use `Restrict` or `NoAction` delete behavior for business records.
- Use explicit soft delete fields instead of cascade delete.
- Use self-relations for version chains such as consultations, prescriptions, and lab reports.

Critical relation examples:

- Clinic -> Branches, Users, Patients, Appointments, Settings.
- User -> RefreshTokens, RoleAssignments, Appointments as doctor.
- Patient -> PatientRecords, Appointments, Consultations, Prescriptions, LabOrders, LabReports, Invoices.
- Appointment -> QueueEntries, Consultations.
- Consultation -> Vitals, Prescriptions, LabOrders.
- LabOrder -> LabOrderItems, LabReports.
- Invoice -> InvoiceItems, Payments, CreditNotes.
- Payment -> PaymentAllocations, Receipt, Refunds.
- Notification -> NotificationJobs, NotificationDeliveries, WhatsAppMessages.
- StorageFile -> StorageAccessLogs.

## Decimal and Money Plan

All money fields must use Decimal:

- plan prices.
- lab test prices.
- invoice subtotal, discount, tax, total, paid, due.
- invoice item quantity, unit price, totals.
- payment, allocation, refund, credit note amounts.
- financial transaction debit/credit/balance.

Recommended precision:

- `Decimal(12,2)` for most currency amounts.
- `Decimal(12,4)` only if quantity or tax precision requires it.

## JSON Field Rules

Allowed JSON fields:

- contact and address details.
- branding.
- profile metadata.
- medical summaries.
- vitals payloads.
- consultation structured notes.
- prescription template data.
- lab result payloads.
- notification payloads.
- provider webhook payloads.
- report parameters and snapshots.
- event payloads.

Rules:

- JSON must not replace normalized ownership, status, amount, date, or searchable fields.
- Do not store secrets inside JSON.
- JSON payloads that affect business logic must be validated with DTO/schema validators.

## Index Plan

Every tenant-owned model should define:

- `@@index([clinicId])`
- `@@index([clinicId, isDeleted])`
- `@@index([clinicId, createdAt])`

Business-specific unique constraints:

- Clinic.code
- ClinicBranch: clinicId + branchCode
- Patient: clinicId + patientCode
- Appointment conflict protection by clinicId + doctorId + startsAt for active statuses, backed by service conflict checks.
- QueueCounter: clinicId + branchId + queueDate
- QueueEntry: clinicId + branchId + queueDate + tokenNumber
- LabTest: clinicId + code
- LabOrder: clinicId + orderNumber
- Invoice: clinicId + invoiceNumber
- Receipt: clinicId + receiptNumber
- WhatsAppTemplate: clinicId + name + languageCode + version
- WebhookEvent: provider + providerEventId
- ProcessedEvent: eventId + consumerName

## Migration Phase Plan

1. Foundation models: clinics, users, audit_logs, outbox_events, settings.
2. Auth/RBAC models.
3. Subscription models.
4. Branch and patient models.
5. Scheduling and queue models.
6. Clinical models.
7. Laboratory models.
8. Billing models.
9. Storage models.
10. Notification and WhatsApp models.
11. Reporting/export/job models.
12. Performance indexes and aggregate tables.

Each migration must include:

- Forward-only migration.
- Review of tenant indexes.
- Review of foreign keys.
- Rollout notes.
- Backfill plan if needed.
- Automated migration test.

## Prisma Client Usage Rules

- No raw Prisma access from routes or controllers.
- Services receive repositories, not Prisma directly, except shared transaction/unit-of-work helper.
- Repository methods require `clinicId` for tenant-owned data.
- Transactions are started by services only.
- Transaction client is passed down to repositories.
- Query methods default to `is_deleted = false`.
- All list methods support pagination and deterministic sorting.

## Open Schema Decisions

- Whether to implement field-level encryption for specific PHI columns in v1 or reserve it for v1.1.
- Whether audit hash chaining is required in MVP or only planned.
- Whether to split consultation diagnosis/notes/treatment plan into normalized child tables or keep structured JSON with versioning for MVP.
- Whether prescriptions need normalized medicine catalog integration now or later.
- Whether payment gateway tables are needed now; PDF defines internal payments but not a gateway provider.
- Whether branch scoping must be attached to patient records or only to operational workflows.

