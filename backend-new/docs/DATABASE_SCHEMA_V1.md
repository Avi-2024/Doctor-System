# Database Schema V1

## Scope

This document is the complete V1 Prisma model plan for `backend-new`.

This is not a migration and does not replace `prisma/schema.prisma`. It defines the approved target schema shape, relationships, enums, indexes, composite indexes, and constraints for the future Prisma implementation.

## V1 Design Rules

- Database: MySQL.
- ORM: Prisma.
- Primary keys: application-generated UUID strings, stored as `CHAR(36)`.
- Tenant strategy: shared database, shared schema, strict logical isolation.
- Tenant root: `Clinic`.
- Tenant column: every tenant-owned table has required `clinicId`.
- Indirect child tables still carry `clinicId` for tenant-first queries and defense in depth.
- Money: `Decimal(12,2)` by default; quantity/rate fields use `Decimal(12,4)` where needed.
- JSON: allowed only for metadata, snapshots, provider payloads, report parameters, clinical structured data, and validated templates.
- Deletes: no cascade delete for business records. Use soft delete or append-only history.
- Audit: immutable audit rows, no soft delete.
- Critical medical/financial records use `version` and amendment/status history where relevant.
- All list queries require deterministic pagination and sorting.

## Common Field Groups

Use these field groups consistently in the Prisma implementation.

### Tenant Mutable Fields

Applies to tenant-owned mutable business records.

| Field | Prisma Type | DB Type | Rule |
| --- | --- | --- | --- |
| id | String | CHAR(36) | Primary key. |
| clinicId | String | CHAR(36) | Required tenant owner. |
| createdBy | String? | CHAR(36) | Actor id. |
| updatedBy | String? | CHAR(36) | Actor id. |
| deletedBy | String? | CHAR(36) | Actor id. |
| isDeleted | Boolean | BOOLEAN | Default false. |
| createdAt | DateTime | DATETIME(3) | Default now. |
| updatedAt | DateTime | DATETIME(3) | Updated at. |
| deletedAt | DateTime? | DATETIME(3) | Soft delete timestamp. |

Mandatory indexes:

- `@@index([clinicId])`
- `@@index([clinicId, isDeleted])`
- `@@index([clinicId, createdAt])`
- `@@index([clinicId, updatedAt])`

### Versioned Clinical Fields

Applies to `Consultation`, `Prescription`, `LabReport`.

| Field | Prisma Type | DB Type | Rule |
| --- | --- | --- | --- |
| version | Int | INT | Default 1. |
| previousVersionId | String? | CHAR(36) | Self relation to previous version. |
| finalizedAt | DateTime? | DATETIME(3) | Immutable after finalization. |
| finalizedBy | String? | CHAR(36) | Actor id. |

### Operational Job Fields

Applies to queue/worker tables.

| Field | Prisma Type | DB Type | Rule |
| --- | --- | --- | --- |
| status | String | VARCHAR(40) | Controlled by enum constant. |
| attempts | Int | INT | Default 0. |
| maxAttempts | Int | INT | Default 5. |
| runAt | DateTime | DATETIME(3) | Indexed claim time. |
| lockedBy | String? | VARCHAR(120) | Worker id. |
| lockedAt | DateTime? | DATETIME(3) | Stale lock detection. |
| completedAt | DateTime? | DATETIME(3) | Completion timestamp. |
| lastError | String? | VARCHAR(1000) | Sanitized failure text. |

## Enum Catalog

Use Prisma enums only when migration risk is acceptable; otherwise implement as string constants with validation. V1 schema should still reserve these names.

| Enum | Values |
| --- | --- |
| ClinicStatus | ACTIVE, SUSPENDED, ARCHIVED, PURGED |
| BranchStatus | ACTIVE, INACTIVE, ARCHIVED |
| UserType | SUPER_ADMIN, CLINIC_USER |
| UserStatus | PENDING, ACTIVE, SUSPENDED, DEACTIVATED |
| RoleType | SYSTEM, CUSTOM |
| PermissionScope | OWN, ASSIGNED, BRANCH, CLINIC, ALL |
| InvitationStatus | PENDING, ACCEPTED, REVOKED, EXPIRED |
| SessionStatus | ACTIVE, REVOKED, EXPIRED |
| SettingScope | PLATFORM, CLINIC, BRANCH, USER |
| AppointmentStatus | SCHEDULED, CONFIRMED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW |
| AppointmentSource | WALK_IN, PHONE, WHATSAPP, ONLINE, INTERNAL |
| QueueStatus | WAITING, CALLED, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED |
| ConsultationStatus | DRAFT, IN_PROGRESS, FINALIZED, ARCHIVED, AMENDED |
| VitalsStatus | RECORDED, VERIFIED, ARCHIVED |
| PrescriptionStatus | DRAFT, REVIEWED, FINALIZED, ARCHIVED, AMENDED |
| TemplateVisibility | DOCTOR, CLINIC |
| LabTestStatus | ACTIVE, INACTIVE, ARCHIVED |
| LabOrderStatus | DRAFT, ORDERED, SAMPLE_COLLECTED, PROCESSING, COMPLETED, CANCELLED |
| LabOrderItemStatus | CREATED, ASSIGNED, COMPLETED, CANCELLED |
| LabReportStatus | DRAFT, UPLOADED, REVIEWED, PUBLISHED, ARCHIVED, AMENDED |
| InvoiceStatus | DRAFT, GENERATED, ISSUED, PARTIALLY_PAID, PAID, CANCELLED, REFUNDED |
| PaymentStatus | PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED |
| RefundStatus | REQUESTED, APPROVED, PROCESSING, COMPLETED, REJECTED, FAILED |
| CreditNoteStatus | DRAFT, ISSUED, VOID |
| PaymentMethod | CASH, CARD, UPI, BANK_TRANSFER, CHEQUE, ONLINE, OTHER |
| StorageFileStatus | VALIDATING, SCANNING, AVAILABLE, QUARANTINED, ARCHIVED, DELETED, PURGED |
| NotificationStatus | CREATED, SCHEDULED, QUEUED, PROCESSING, SENT, DELIVERED, FAILED, CANCELLED, DEAD_LETTERED |
| NotificationChannel | WHATSAPP, EMAIL, SMS, PUSH, IN_APP |
| NotificationPriority | LOW, NORMAL, HIGH, CRITICAL |
| WhatsAppAccountStatus | CREATED, PENDING_VERIFICATION, VERIFIED, ACTIVE, DISABLED |
| WhatsAppTemplateStatus | DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, ARCHIVED |
| WhatsAppMessageStatus | CREATED, QUEUED, PROCESSING, SENT, DELIVERED, READ, FAILED, EXPIRED |
| WebhookStatus | RECEIVED, PROCESSING, PROCESSED, FAILED, IGNORED |
| JobStatus | QUEUED, PROCESSING, COMPLETED, FAILED, DEAD_LETTERED, CANCELLED |
| ExportStatus | REQUESTED, GENERATING, COMPLETED, FAILED, EXPIRED |
| ReportStatus | REQUESTED, GENERATING, COMPLETED, FAILED, ARCHIVED |
| SubscriptionPlanStatus | DRAFT, ACTIVE, DEPRECATED, ARCHIVED |
| ClinicSubscriptionStatus | TRIAL, ACTIVE, GRACE_PERIOD, EXPIRED, SUSPENDED, RENEWED |
| AuditSeverity | INFO, WARNING, CRITICAL |
| StatusEntityType | APPOINTMENT, QUEUE_ENTRY, CONSULTATION, PRESCRIPTION, LAB_ORDER, LAB_REPORT, INVOICE, PAYMENT, REFUND, NOTIFICATION, WHATSAPP_MESSAGE, SUBSCRIPTION |

## Complete Prisma Model Plan

Each row defines the model, table, specific fields beyond common groups, relationships, constraints, and indexes. Tenant-owned models include Tenant Mutable Fields unless marked platform or append-only.

### Foundation and Tenant

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| SchemaMigration | schema_migrations | name String @id, executedAt DateTime | none | unique name | executedAt |
| Clinic | clinics | code, name, status, timezone, contact Json?, address Json?, branding Json?, ownerUserId?, isDeleted, createdAt, updatedAt, archivedAt, purgedAt | ownerUser -> User?; has branches, users, settings, patients, subscriptions | `code` unique; status in ClinicStatus | status, createdAt, isDeleted |
| ClinicBranch | clinic_branches | Tenant fields, branchCode, name, contact Json?, address Json?, timezone, isPrimary, status | clinic; schedules, appointments, queue entries, role assignments, branch assignments | unique `[clinicId, branchCode]`; only one active primary branch enforced by service/generated key | `[clinicId, isPrimary, status]`, `[clinicId, status, isDeleted]` |
| Setting | settings | id, clinicId?, branchId?, userId?, settingKey, settingValue Json?, scope, isEncrypted, status, common timestamps | clinic?, branch?, user?, history | unique `[clinicId, branchId, userId, settingKey, scope]` | `[clinicId, scope]`, `[clinicId, settingKey]`, `[branchId]`, `[userId]` |
| SettingHistory | setting_history | Tenant fields, settingId, oldValue Json?, newValue Json?, changedBy, changedAt | setting, clinic | append-only | `[clinicId, settingId, changedAt]`, `[clinicId, changedBy, changedAt]` |
| IdempotencyRequest | idempotency_requests | id, clinicId?, idempotencyKey, actorUserId?, route, method, requestHash, responseHash?, statusCode?, status, expiresAt, createdAt, updatedAt | clinic?, actor? | unique `[clinicId, idempotencyKey]`; route/method required | `[clinicId, actorUserId, createdAt]`, `[expiresAt]`, `[status, expiresAt]` |

### Identity and RBAC

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| User | users | id, clinicId?, fullName, email, phone?, passwordHash, userType, status, tokenVersion, lastLoginAt?, profile Json?, common soft-delete fields | clinic?, refresh tokens, resets, invitations, role assignments, branch assignments | unique `[clinicId, email]`; platform Super Admin email uniqueness enforced with platformEmailKey | `[clinicId, status, isDeleted]`, `[clinicId, email]`, `[email]`, `[tokenVersion]` |
| RefreshToken | refresh_tokens | id, clinicId?, userId, sessionId, tokenHash, deviceInfo Json?, ipAddress?, userAgent?, status, expiresAt, lastUsedAt?, revokedAt?, replacedByTokenId?, createdAt, updatedAt | user, clinic? | unique tokenHash; unique sessionId | `[clinicId, userId, expiresAt]`, `[userId, status, revokedAt]`, `[sessionId]` |
| PasswordResetToken | password_reset_tokens | id, clinicId?, userId, tokenHash, expiresAt, usedAt?, createdAt | user, clinic? | unique tokenHash | `[clinicId, userId, expiresAt]`, `[expiresAt]` |
| LoginAttempt | login_attempts | id, clinicId?, email, userId?, ipAddress, userAgent?, success, failureReason?, attemptedAt | user?, clinic? | append-only | `[clinicId, email, attemptedAt]`, `[ipAddress, attemptedAt]`, `[userId, attemptedAt]` |
| AccountLockout | account_lockouts | id, clinicId?, userId?, email, ipAddress?, reason, lockedUntil, unlockedAt?, createdAt | user?, clinic? | only active lock enforced by service | `[clinicId, email, lockedUntil]`, `[userId, lockedUntil]`, `[ipAddress, lockedUntil]` |
| UserInvitation | user_invitations | Tenant fields, userId?, email, fullName, phone?, tokenHash, status, expiresAt, acceptedAt?, revokedAt?, invitedBy | clinic, user?, inviter User | unique tokenHash; unique active invitation by `[clinicId, email, status]` enforced by service | `[clinicId, email, status]`, `[clinicId, expiresAt]`, `[invitedBy]` |
| RbacPermission | rbac_permissions | id, clinicId?, keyName, moduleName, action, label, description?, isReserved, isSystem, status, timestamps | clinic?, role permissions | unique `[clinicId, keyName]` | `[clinicId, moduleName, action]`, `[keyName]`, `[isReserved, status]` |
| RbacRole | rbac_roles | id, clinicId?, keyName, name, description?, roleType, isSystem, status, timestamps | clinic?, role permissions, user roles | unique `[clinicId, keyName]` | `[clinicId, status]`, `[clinicId, isSystem]` |
| RbacRolePermission | rbac_role_permissions | Tenant fields, roleId, permissionId, scope | role, permission, clinic | unique `[clinicId, roleId, permissionId, scope]` | `[clinicId, roleId, isDeleted]`, `[clinicId, permissionId, isDeleted]` |
| RbacUserRole | rbac_user_roles | Tenant fields, userId, roleId, branchId?, isPrimary, assignedAt, revokedAt? | user, role, branch?, clinic | active duplicate assignment blocked by service/generated key | `[clinicId, userId, revokedAt, isDeleted]`, `[clinicId, roleId, revokedAt, isDeleted]`, `[clinicId, branchId]` |
| UserBranchAssignment | user_branch_assignments | Tenant fields, userId, branchId, isPrimary, assignedAt, revokedAt? | user, branch, clinic | unique active `[clinicId, userId, branchId]` enforced by service/generated key | `[clinicId, userId, revokedAt]`, `[clinicId, branchId, revokedAt]` |

### Subscription

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| SubscriptionPlan | subscription_plans | id, code, name, planType, status, monthlyPrice Decimal, yearlyPrice Decimal, currency, version, limits Json?, features Json?, createdAt, updatedAt, isDeleted | features, limits, subscriptions | unique `[code, version]`; current code uniqueness enforced by active version service | `[status, planType]`, `[code]` |
| SubscriptionPlanFeature | subscription_plan_features | id, planId, featureKey, featureValue Json?, status, createdAt, updatedAt | plan | unique `[planId, featureKey]` | `[featureKey]`, `[planId, status]` |
| SubscriptionPlanLimit | subscription_plan_limits | id, planId, limitKey, limitValue Int, unit, createdAt, updatedAt | plan | unique `[planId, limitKey]`; limitValue >= -1 by service | `[limitKey]`, `[planId]` |
| ClinicSubscription | clinic_subscriptions | Tenant fields, planId, status, startsAt, endsAt?, trialEndsAt?, graceEndsAt?, billingPeriod, usageSnapshot Json?, activeKey? | clinic, plan, usage, events | one active subscription per clinic via `[clinicId, activeKey]` where activeKey populated only for active states | `[clinicId, status, startsAt, endsAt]`, `[planId]`, `[endsAt]` |
| SubscriptionUsage | subscription_usage | Tenant fields, subscriptionId, usageKey, usedValue, limitValue?, periodStart, periodEnd | subscription, clinic | unique `[clinicId, subscriptionId, usageKey, periodStart]` | `[clinicId, usageKey, periodEnd]`, `[clinicId, periodEnd]` |
| SubscriptionEvent | subscription_events | id, clinicId, subscriptionId, eventType, payload Json, occurredAt, actorUserId? | clinic, subscription, actor? | append-only | `[clinicId, subscriptionId, occurredAt]`, `[clinicId, eventType, occurredAt]` |

### Patient and Scheduling

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| Patient | patients | Tenant fields, patientCode, fullName, phone, email?, gender, dateOfBirth?, bloodGroup?, demographics Json?, medicalSummary Json?, status | clinic, records, appointments, consultations, vitals, prescriptions, lab orders, invoices | unique `[clinicId, patientCode]` | `[clinicId, fullName, isDeleted]`, `[clinicId, phone, isDeleted]`, `[clinicId, createdAt]` |
| PatientRecord | patient_records | Tenant fields, patientId, recordType, recordData Json, recordedAt, attachmentCount | clinic, patient | patient must same clinic | `[clinicId, patientId, recordType, isDeleted]`, `[clinicId, createdAt]` |
| DoctorSchedule | doctor_schedules | Tenant fields, doctorId, branchId, weekday, startTime, endTime, slotDurationMinutes, timezone, status | clinic, doctor User, branch | unique `[clinicId, doctorId, branchId, weekday, startTime]`; overlaps blocked by service | `[clinicId, doctorId, status]`, `[clinicId, branchId, status]`, `[clinicId, weekday]` |
| DoctorLeave | doctor_leaves | Tenant fields, doctorId, branchId?, startsAt, endsAt, reason?, status | clinic, doctor User, branch? | overlapping approved leaves blocked by service | `[clinicId, doctorId, startsAt, endsAt]`, `[clinicId, branchId, startsAt]`, `[clinicId, status]` |
| Appointment | appointments | Tenant fields, patientId, doctorId, branchId, appointmentDate, startsAt, endsAt, status, source, reason?, cancellationReason?, idempotencyKey?, activeConflictKey? | clinic, patient, doctor User, branch, queue entries, consultations | unique `[clinicId, idempotencyKey]`; conflict key generated/service-backed for active states | `[clinicId, doctorId, startsAt, status]`, `[clinicId, patientId, appointmentDate]`, `[clinicId, branchId, appointmentDate, status]`, `[clinicId, status, appointmentDate]` |
| QueueCounter | queue_counters | id, clinicId, branchId, queueDate, nextToken, createdAt, updatedAt | clinic, branch | unique `[clinicId, branchId, queueDate]` | `[clinicId, queueDate]`, `[clinicId, branchId, queueDate]` |
| QueueEntry | queue_entries | Tenant fields, patientId, doctorId, appointmentId?, branchId, queueDate, tokenNumber, priority, status, calledAt?, startedAt?, completedAt? | clinic, patient, doctor User, appointment?, branch | unique `[clinicId, branchId, queueDate, tokenNumber]` | `[clinicId, branchId, queueDate, status]`, `[clinicId, doctorId, queueDate, status]`, `[clinicId, appointmentId]` |

### Clinical

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| Consultation | consultations | Tenant + versioned fields, patientId, doctorId, appointmentId?, status, chiefComplaint?, notes Json?, diagnosis Json?, treatmentPlan Json?, followUp Json? | clinic, patient, doctor User, appointment?, vitals, prescriptions, lab orders, previous version | previousVersionId self relation; finalized rows immutable by service | `[clinicId, patientId, createdAt]`, `[clinicId, doctorId, createdAt]`, `[clinicId, appointmentId]`, `[clinicId, status, createdAt]` |
| ConsultationAmendment | consultation_amendments | id, clinicId, consultationId, amendedBy, reason, beforeData Json, afterData Json, createdAt | consultation, clinic, actor User | append-only | `[clinicId, consultationId, createdAt]`, `[clinicId, amendedBy, createdAt]` |
| Vital | vitals | Tenant fields, patientId, consultationId?, measuredAt, vitalData Json, status | clinic, patient, consultation? | patient and consultation same clinic | `[clinicId, patientId, measuredAt]`, `[clinicId, consultationId]`, `[clinicId, status]` |
| Prescription | prescriptions | Tenant + versioned fields, patientId, doctorId, consultationId?, status, diagnosis?, advice?, exportFileId? | clinic, patient, doctor User, consultation?, items, export file?, previous version | finalized rows immutable by service | `[clinicId, patientId, createdAt]`, `[clinicId, doctorId, createdAt]`, `[clinicId, consultationId]`, `[clinicId, status, createdAt]` |
| PrescriptionItem | prescription_items | Tenant fields, prescriptionId, medicineName, dosage?, frequency?, duration?, instructions?, sortOrder | prescription, clinic | sortOrder unique per prescription enforced by service | `[clinicId, prescriptionId, sortOrder]`, `[clinicId, medicineName]` |
| PrescriptionTemplate | prescription_templates | Tenant fields, doctorId?, name, visibility, templateData Json, status | clinic, doctor User? | unique `[clinicId, doctorId, name]` for doctor templates; clinic-wide duplicate blocked by service | `[clinicId, doctorId, status]`, `[clinicId, visibility, status]` |

### Laboratory

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| LabTestCategory | lab_test_categories | Tenant fields, code, name, description?, status | clinic, lab tests | unique `[clinicId, code]` | `[clinicId, status]`, `[clinicId, name]` |
| LabTest | lab_tests | Tenant fields, categoryId?, code, name, description?, price Decimal, currency, status | clinic, category?, order items | unique `[clinicId, code]` | `[clinicId, categoryId, status]`, `[clinicId, status]`, `[clinicId, name]` |
| LabOrder | lab_orders | Tenant fields, orderNumber, patientId, consultationId?, appointmentId?, doctorId, status, totalAmount Decimal, orderedAt, completedAt? | clinic, patient, consultation?, appointment?, doctor User, items, reports | unique `[clinicId, orderNumber]`; at least one item enforced by service | `[clinicId, patientId, createdAt]`, `[clinicId, consultationId]`, `[clinicId, status, createdAt]`, `[clinicId, doctorId, createdAt]` |
| LabOrderItem | lab_order_items | Tenant fields, labOrderId, labTestId?, testCodeSnapshot, testNameSnapshot, priceSnapshot Decimal, status, resultData Json? | clinic, lab order, lab test? | duplicate active test in order blocked by service | `[clinicId, labOrderId, status]`, `[clinicId, labTestId]`, `[clinicId, status]` |
| LabReport | lab_reports | Tenant + versioned fields, labOrderId, patientId, status, resultData Json?, fileId?, reviewedBy?, reviewedAt?, publishedAt? | clinic, order, patient, storage file?, reviewer User?, previous version | published immutable; report requires completed order by service | `[clinicId, patientId, createdAt]`, `[clinicId, labOrderId]`, `[clinicId, status, createdAt]`, `[clinicId, fileId]` |

### Billing

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| Invoice | invoices | Tenant fields, invoiceNumber, patientId?, sourceType?, sourceId?, invoiceDate, status, subtotal Decimal, discountTotal Decimal, taxTotal Decimal, totalAmount Decimal, paidAmount Decimal, dueAmount Decimal, currency, finalizedAt? | clinic, patient?, items, payments, credits | unique `[clinicId, invoiceNumber]`; totals server-calculated | `[clinicId, patientId, invoiceDate]`, `[clinicId, status, invoiceDate]`, `[clinicId, sourceType, sourceId]` |
| InvoiceItem | invoice_items | Tenant fields, invoiceId, itemType, description, quantity Decimal(12,4), unitPrice Decimal, discountAmount Decimal, taxAmount Decimal, totalAmount Decimal, sourceType?, sourceId?, sortOrder | invoice, clinic | parent invoice same clinic | `[clinicId, invoiceId, sortOrder]`, `[clinicId, itemType]`, `[clinicId, sourceType, sourceId]` |
| Payment | payments | Tenant fields, invoiceId, amount Decimal, method, status, referenceNumber?, paidAt, idempotencyKey? | invoice, clinic, allocations, receipt?, refunds | unique `[clinicId, idempotencyKey]`; amount positive by service | `[clinicId, invoiceId, paidAt]`, `[clinicId, status, paidAt]`, `[clinicId, referenceNumber]` |
| PaymentAllocation | payment_allocations | Tenant fields, paymentId, invoiceId, amount Decimal | payment, invoice, clinic | unique `[clinicId, paymentId, invoiceId]` | `[clinicId, paymentId]`, `[clinicId, invoiceId]` |
| Receipt | receipts | Tenant fields, receiptNumber, paymentId, invoiceId, amount Decimal, issuedAt, fileId? | payment, invoice, storage file? | unique `[clinicId, receiptNumber]`; one receipt per payment by unique `[clinicId, paymentId]` | `[clinicId, invoiceId, issuedAt]`, `[clinicId, fileId]` |
| Refund | refunds | Tenant fields, paymentId, amount Decimal, reason, status, processedAt?, referenceNumber? | payment, clinic | amount <= payment refundable balance by service | `[clinicId, paymentId, status]`, `[clinicId, status, processedAt]` |
| CreditNote | credit_notes | Tenant fields, invoiceId, creditNumber, amount Decimal, reason, status, issuedAt? | invoice, clinic | unique `[clinicId, creditNumber]` | `[clinicId, invoiceId, status]`, `[clinicId, status]` |
| FinancialTransaction | financial_transactions | id, clinicId, sourceType, sourceId, debitAmount Decimal, creditAmount Decimal, balanceAfter Decimal, occurredAt, metadata Json?, createdAt | clinic | append-only; debit/credit non-negative by service | `[clinicId, sourceType, sourceId]`, `[clinicId, occurredAt]` |

### Storage

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| StorageFile | storage_files | Tenant fields, moduleName, entityType, entityId?, storageKey, fileName, fileSize, mimeType, checksum, uploadedBy, status, retentionUntil?, archivedAt?, purgedAt? | clinic, uploader User, access logs | unique storageKey; fileSize > 0 by service | `[clinicId, moduleName, createdAt]`, `[clinicId, entityType, entityId]`, `[clinicId, uploadedBy, createdAt]`, `[clinicId, checksum]`, `[clinicId, status]` |
| StorageFolder | storage_folders | Tenant fields, moduleName, entityType?, entityId?, name, parentFolderId? | clinic, parent folder? | unique `[clinicId, parentFolderId, name]` | `[clinicId, moduleName]`, `[clinicId, parentFolderId]` |
| StorageAccessLog | storage_access_logs | id, clinicId, fileId, actorUserId?, operation, ipAddress?, userAgent?, signedUrlExpiresAt?, createdAt | file, actor?, clinic | append-only | `[clinicId, fileId, createdAt]`, `[clinicId, actorUserId, createdAt]`, `[clinicId, operation, createdAt]` |

### Notifications, WhatsApp, and Webhooks

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| NotificationTemplate | notification_templates | Tenant fields, templateKey, channel, languageCode, version, title?, body, variables Json, status | clinic | unique `[clinicId, templateKey, channel, languageCode, version]` | `[clinicId, channel, status]`, `[clinicId, templateKey]` |
| NotificationPreference | notification_preferences | Tenant fields, recipientType, recipientId, channel, notificationType, isEnabled, quietHours Json?, languageCode? | clinic | unique `[clinicId, recipientType, recipientId, channel, notificationType]` | `[clinicId, recipientType, recipientId]`, `[clinicId, channel, isEnabled]` |
| NotificationBatch | notification_batches | Tenant fields, batchType, status, payload Json, totalRecipients, processedRecipients, failedRecipients, scheduledAt? | clinic, notifications | batch counters updated by workers | `[clinicId, status, scheduledAt]`, `[clinicId, batchType, createdAt]` |
| Notification | notifications | Tenant fields, batchId?, recipientId, recipientType, notificationType, channel, status, priority, templateId?, payload Json?, scheduledAt?, sentAt?, deliveredAt?, cancelledAt?, idempotencyKey? | clinic, batch?, template?, jobs, deliveries, WhatsApp messages | unique `[clinicId, idempotencyKey]` | `[clinicId, recipientType, recipientId, createdAt]`, `[clinicId, status, scheduledAt]`, `[clinicId, channel, status]`, `[clinicId, priority, scheduledAt]` |
| NotificationJob | notification_jobs | Tenant fields, notificationId, status, attempts, nextRunAt, lockedBy?, lockedAt?, lastError? | notification, clinic | one active queued job per notification enforced by service | `[clinicId, status, nextRunAt]`, `[lockedAt]`, `[notificationId]` |
| NotificationDelivery | notification_deliveries | Tenant fields, notificationId, provider, providerMessageId?, status, attemptNumber, response Json?, deliveredAt? | notification, clinic | unique `[clinicId, notificationId, attemptNumber]`; providerMessageId indexed | `[clinicId, notificationId]`, `[clinicId, status]`, `[providerMessageId]` |
| DeadLetterNotification | dead_letter_notifications | id, clinicId, notificationId?, failureReason, payload Json, failedAt, resolvedAt? | notification?, clinic | recoverable dead letter | `[clinicId, failedAt]`, `[clinicId, resolvedAt]` |
| WhatsAppAccount | whatsapp_accounts | Tenant fields, phoneNumberId, businessAccountId, displayPhoneNumber, status, accessTokenRef, webhookSecretRef, verifiedAt? | clinic, templates, messages | unique `[clinicId, phoneNumberId]` | `[clinicId, status]`, `[phoneNumberId]`, `[businessAccountId]` |
| WhatsAppTemplate | whatsapp_templates | Tenant fields, accountId, name, providerTemplateName, languageCode, category, status, version, components Json, approvedAt? | account, clinic, messages | unique `[clinicId, name, languageCode, version]` | `[clinicId, status, category]`, `[clinicId, accountId]`, `[providerTemplateName]` |
| WhatsAppMessage | whatsapp_messages | Tenant fields, accountId, notificationId?, patientId?, direction, sender, recipient, messageType, body?, templateId?, providerMessageId?, status, payload Json?, sentAt?, deliveredAt?, readAt? | account, notification?, patient?, template? | providerMessageId unique where present by service | `[clinicId, patientId, createdAt]`, `[clinicId, status, createdAt]`, `[clinicId, recipient, createdAt]`, `[providerMessageId]` |
| WebhookEvent | webhook_events | id, clinicId?, provider, providerEventId, eventType, payload Json, signatureValid, status, receivedAt, processedAt?, createdAt | clinic? | unique `[provider, providerEventId]` | `[clinicId, provider, status]`, `[provider, eventType, receivedAt]`, `[status, receivedAt]` |
| WebhookFailure | webhook_failures | id, clinicId?, webhookEventId, reason, errorMessage?, retryCount, nextRetryAt?, resolvedAt?, createdAt | webhook event, clinic? | one failure stream per webhook event | `[clinicId, nextRetryAt]`, `[resolvedAt]`, `[webhookEventId]` |

### Platform Operations, Reports, and Events

| Model | Table | Fields | Relationships | Constraints | Indexes |
| --- | --- | --- | --- | --- | --- |
| AuditLog | audit_logs | id, clinicId?, actorUserId?, action, moduleName, resourceType, resourceId?, severity, requestId?, correlationId?, ipAddress?, userAgent?, beforeData Json?, afterData Json?, metadata Json?, hash?, previousHash?, createdAt | clinic?, actor? | append-only; no soft delete | `[clinicId, moduleName, action, createdAt]`, `[clinicId, resourceType, resourceId]`, `[actorUserId]`, `[requestId]`, `[correlationId]` |
| AuditExport | audit_exports | Tenant fields, requestedBy, status, filters Json, fileId?, expiresAt?, completedAt? | requester User, file? | export generated async | `[clinicId, status]`, `[clinicId, requestedBy, createdAt]`, `[expiresAt]` |
| ReportDefinition | report_definitions | id, reportKey, name, category, defaultParameters Json?, requiredPermission, status, createdAt, updatedAt | reports, schedules | unique reportKey | `[category, status]`, `[requiredPermission]` |
| Report | reports | Tenant fields, reportDefinitionId?, reportType, status, parameters Json, requestedBy, startedAt?, completedAt?, result Json? | clinic, requester User, definition?, exports | reportDefinition optional for ad hoc reports | `[clinicId, reportType, createdAt]`, `[clinicId, status, createdAt]`, `[clinicId, requestedBy, createdAt]` |
| ReportSchedule | report_schedules | Tenant fields, reportDefinitionId, cronExpression, timezone, parameters Json, recipients Json, status, nextRunAt, lastRunAt? | definition, clinic | schedule validation by service | `[clinicId, status, nextRunAt]`, `[clinicId, reportDefinitionId]` |
| ReportExport | report_exports | Tenant fields, reportId, exportType, status, fileId?, expiresAt?, completedAt? | report, file? | export generated async | `[clinicId, reportId]`, `[clinicId, status]`, `[expiresAt]` |
| ReportSnapshot | report_snapshots | id, clinicId, reportType, periodStart, periodEnd, snapshotData Json, generatedAt | clinic | unique `[clinicId, reportType, periodStart, periodEnd]` | `[clinicId, generatedAt]`, `[clinicId, reportType]` |
| ReportAggregate | report_aggregates | id, clinicId, aggregateKey, periodStart, periodEnd, dimensions Json, metrics Json, generatedAt | clinic | unique `[clinicId, aggregateKey, periodStart, periodEnd]` | `[clinicId, aggregateKey]`, `[clinicId, periodStart]` |
| ExportJob | export_jobs | Tenant fields, exportType, status, requestedBy, filters Json, fileId?, expiresAt?, completedAt? | requester User, file? | async export | `[clinicId, exportType, createdAt]`, `[clinicId, status]`, `[expiresAt]` |
| ExportFile | export_files | Tenant fields, exportJobId, fileId, format, rowCount, sizeBytes | export job, file | one or more files per export | `[clinicId, exportJobId]`, `[clinicId, fileId]` |
| Job | jobs | id, clinicId?, jobType, status, priority, payload Json, attempts, maxAttempts, runAt, lockedBy?, lockedAt?, completedAt?, lastError?, idempotencyKey?, createdAt, updatedAt | clinic?, attempts, dead letter | unique idempotencyKey where present | `[status, runAt]`, `[clinicId, status]`, `[lockedAt]`, `[jobType, status, runAt]` |
| JobAttempt | job_attempts | id, clinicId?, jobId, attemptNumber, status, startedAt, finishedAt?, errorMessage?, metadata Json? | job, clinic? | unique `[jobId, attemptNumber]` | `[clinicId, jobId]`, `[status]`, `[startedAt]` |
| DeadLetterJob | dead_letter_jobs | id, jobId, clinicId?, failureReason, payload Json, failedAt, resolvedAt?, resolutionNotes? | job, clinic? | recoverable dead letter | `[clinicId, failedAt]`, `[resolvedAt]`, `[jobId]` |
| OutboxEvent | outbox_events | id, eventName, eventVersion, aggregateType, aggregateId, tenantId?, correlationId?, causationId?, producer, payload Json, status, attempts, nextRetryAt?, publishedAt?, lastError?, createdAt, updatedAt | tenant clinic? | event id primary; immutable payload | `[tenantId, status, nextRetryAt]`, `[status, nextRetryAt]`, `[aggregateType, aggregateId]`, `[correlationId]` |
| ProcessedEvent | processed_events | id, eventId, consumerName, status, processedAt, metadata Json? | logical outbox event id | unique `[eventId, consumerName]` | `[consumerName, processedAt]`, `[status, processedAt]` |
| DeadLetterEvent | dead_letter_events | id, outboxEventId?, tenantId?, eventName, payload Json, failureReason, failedAt, resolvedAt? | outbox event? | recoverable dead letter | `[tenantId, failedAt]`, `[eventName]`, `[resolvedAt]` |
| EntityStatusHistory | entity_status_history | id, clinicId, entityType, entityId, fromStatus?, toStatus, reason?, changedBy?, changedAt, metadata Json? | clinic, actor? | append-only | `[clinicId, entityType, entityId, changedAt]`, `[clinicId, entityType, toStatus, changedAt]`, `[changedBy, changedAt]` |

## Relationship Summary

### One-to-One

- `Payment` to `Receipt`, enforced by unique `[clinicId, paymentId]` on `Receipt`.
- `Clinic` to active `ClinicSubscription`, enforced by generated/service active key.
- `LabOrder` to published current `LabReport`, enforced by service while retaining versions/history.
- `Prescription` to generated export `StorageFile`, optional.

### One-to-Many

- `Clinic` has branches, users, patients, appointments, consultations, billing records, notifications, storage files, audit logs, reports, jobs.
- `ClinicBranch` has schedules, appointments, queue entries, and branch assignments.
- `User` has sessions, login attempts, role assignments, branch assignments, authored records, appointments as doctor.
- `Patient` has records, appointments, consultations, vitals, prescriptions, lab orders, lab reports, invoices.
- `Appointment` has queue entries and consultations.
- `Consultation` has vitals, prescriptions, lab orders, amendments.
- `LabOrder` has lab order items and lab reports.
- `Invoice` has invoice items, payments, allocations, receipts, credit notes.
- `Notification` has notification jobs, deliveries, WhatsApp messages.
- `StorageFile` has access logs and is referenced by reports, exports, lab reports, receipts, prescription exports.
- `Job` has attempts and dead-letter records.

### Many-to-Many

- Users to roles through `RbacUserRole`.
- Roles to permissions through `RbacRolePermission`.
- Users to branches through `UserBranchAssignment`.
- Payments to invoices through `PaymentAllocation`, even though V1 may normally allocate one payment to one invoice.
- Subscription plans to features/limits through `SubscriptionPlanFeature` and `SubscriptionPlanLimit`.

## Composite Index and Constraint Checklist

### Tenant Safety

- All tenant-owned tables include `clinicId`.
- All indirect child tables include `clinicId`.
- All tenant-owned list indexes begin with `clinicId`.
- Polymorphic models include `[clinicId, entityType, entityId]` or equivalent.

### Uniqueness

- `Clinic.code`
- `ClinicBranch [clinicId, branchCode]`
- `User [clinicId, email]`
- `RefreshToken.tokenHash`
- `PasswordResetToken.tokenHash`
- `UserInvitation.tokenHash`
- `RbacPermission [clinicId, keyName]`
- `RbacRole [clinicId, keyName]`
- `RbacRolePermission [clinicId, roleId, permissionId, scope]`
- `Patient [clinicId, patientCode]`
- `QueueCounter [clinicId, branchId, queueDate]`
- `QueueEntry [clinicId, branchId, queueDate, tokenNumber]`
- `LabTestCategory [clinicId, code]`
- `LabTest [clinicId, code]`
- `LabOrder [clinicId, orderNumber]`
- `Invoice [clinicId, invoiceNumber]`
- `Payment [clinicId, idempotencyKey]`
- `PaymentAllocation [clinicId, paymentId, invoiceId]`
- `Receipt [clinicId, receiptNumber]`
- `Receipt [clinicId, paymentId]`
- `CreditNote [clinicId, creditNumber]`
- `StorageFile.storageKey`
- `Notification [clinicId, idempotencyKey]`
- `NotificationTemplate [clinicId, templateKey, channel, languageCode, version]`
- `NotificationPreference [clinicId, recipientType, recipientId, channel, notificationType]`
- `WhatsAppAccount [clinicId, phoneNumberId]`
- `WhatsAppTemplate [clinicId, name, languageCode, version]`
- `WebhookEvent [provider, providerEventId]`
- `ReportSnapshot [clinicId, reportType, periodStart, periodEnd]`
- `ReportAggregate [clinicId, aggregateKey, periodStart, periodEnd]`
- `ProcessedEvent [eventId, consumerName]`

### Critical Query Indexes

- Appointment conflict: `[clinicId, doctorId, startsAt, status]`
- Appointment daily doctor view: `[clinicId, doctorId, appointmentDate, status]`
- Queue dashboard: `[clinicId, branchId, queueDate, status]`
- Patient search: `[clinicId, phone, isDeleted]`, `[clinicId, fullName, isDeleted]`, `[clinicId, patientCode]`
- Clinical timeline: `[clinicId, patientId, createdAt]` on consultations, vitals, prescriptions, lab orders, lab reports.
- Billing lookup: `[clinicId, patientId, invoiceDate]`, `[clinicId, status, invoiceDate]`
- Worker claim: `[status, runAt]`, `[jobType, status, runAt]`, `[lockedAt]`
- Outbox publish: `[status, nextRetryAt]`, `[tenantId, status, nextRetryAt]`
- Notification delivery: `[clinicId, status, scheduledAt]`, `[clinicId, priority, scheduledAt]`
- Webhook idempotency: `[provider, providerEventId]`
- Audit search: `[clinicId, moduleName, action, createdAt]`, `[clinicId, resourceType, resourceId]`, `[requestId]`
- Export expiry: `[expiresAt]`

## Foreign Key Rules

- Use Prisma relations for all direct parent-child ownership where the parent table exists in the same schema.
- Use `onDelete: Restrict` or default `NoAction` for business records.
- Use no cascade delete on patients, appointments, clinical, lab, billing, storage, notifications, reports, or audit.
- Polymorphic `sourceType/sourceId`, `entityType/entityId`, and `resourceType/resourceId` cannot have database FKs; services must validate ownership and write audit records.
- Every child relation carrying `clinicId` must validate parent belongs to same clinic in service and repository tests.

## Self-Review and Applied Fixes

### Missing Indexes

Issue: Previous planning did not fully cover worker claim, webhook idempotency, clinical timeline, export expiry, and notification priority indexes.

Fix applied:

- Added job claim indexes `[status, runAt]`, `[jobType, status, runAt]`, `[lockedAt]`.
- Added webhook uniqueness `[provider, providerEventId]`.
- Added timeline indexes across consultation/vitals/prescription/lab records.
- Added export/report expiry indexes.
- Added notification priority scheduling index.

### N+1 Risks

Issue: Timeline, reports, queue dashboard, invoice detail, lab order detail, and RBAC effective permission loading can cause N+1 query patterns.

Fix applied:

- Added parent-child indexes for timeline and detail screens.
- Added junction indexes for RBAC and payments.
- Added report aggregate/snapshot tables to avoid repeated transactional scans.
- Required service/repository patterns to fetch details with bounded includes or batched `findMany` by ids.

### Tenant Leakage Risks

Issue: Nullable `clinicId`, polymorphic records, platform-owned records, and indirect child tables can leak data if not scoped.

Fix applied:

- Required `clinicId` on all tenant-owned and indirect child tables.
- Added tenant-first indexes to indirect children.
- Limited nullable tenant fields to platform/system operational models only.
- Added `IdempotencyRequest`, `UserBranchAssignment`, and `EntityStatusHistory` with `clinicId`.
- Added explicit service validation for polymorphic ownership fields.

### Foreign Key Risks

Issue: Some prior relationships were implicit, and cascade delete could destroy auditability.

Fix applied:

- Declared direct relations for core parent-child records.
- Required restrict/no-action delete behavior for business data.
- Added status/amendment history tables instead of destructive updates for critical workflows.
- Called out polymorphic fields as service-validated because database FKs cannot enforce them.

### Scalability Risks

Issue: Large patient, appointment, audit, notification, report, and worker tables can become hotspots.

Fix applied:

- Tenant-first indexes are required.
- Added report definitions, schedules, snapshots, and aggregates.
- Added idempotency and worker indexes for reliable retries.
- Added audit search indexes.
- Added explicit note that partitioning/read replicas are future physical optimizations, not V1 logical schema requirements.

## V1 Approval Notes

- This document intentionally does not generate migrations.
- The current Phase 01 `prisma/schema.prisma` remains a foundation-only schema.
- Future schema implementation should translate this plan into Prisma models phase by phase.
- Every phase must run Prisma validation, migration tests, tenant isolation tests, and query/index review before implementation proceeds.

