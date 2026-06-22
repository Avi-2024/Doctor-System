# Audit Logging Strategy

## Objectives

Audit logging provides immutable accountability for clinical, financial, administrative, security, and tenant operations.

Audit records support:

- Compliance readiness.
- Forensic investigation.
- Operational accountability.
- Security monitoring.
- Tenant recovery.
- Historical reconstruction.

## Audit Principles

- Critical actions are auditable.
- Audit entries are immutable.
- Audit deletion is prohibited.
- Audit records are tenant-aware.
- Audit records include request correlation.
- Audit writes occur in the same transaction whenever possible.
- Audit payloads must not expose secrets.
- Sensitive fields are redacted.
- Audit search is permission-restricted.

## Audit Table Plan

Primary table:

- `audit_logs`

Core fields:

- id.
- clinic_id nullable for platform events.
- actor_user_id.
- action.
- module_name.
- resource_type.
- resource_id.
- severity.
- request_id.
- correlation_id.
- ip_address.
- user_agent.
- before_data_json.
- after_data_json.
- metadata_json.
- hash.
- previous_hash.
- created_at.

Export table:

- `audit_exports`

Fields:

- id.
- clinic_id.
- requested_by.
- status.
- filters_json.
- file_id.
- expires_at.
- completed_at.
- created_at.

## Audit Generation Flow

Critical service workflow:

1. Validate request.
2. Validate authorization and ownership.
3. Start transaction.
4. Mutate business data.
5. Create audit record.
6. Create outbox event where needed.
7. Commit.

When same-transaction audit is impossible:

- Create reliable outbox event.
- Audit worker persists audit record.
- Missing audit records become high-priority operational alerts.

## Audit Categories

| Category | Examples |
| --- | --- |
| Authentication | login success, login failure, logout, refresh, reset request, reset success, token reuse |
| Authorization | role assignment, role revocation, permission changes, forbidden access, tenant violation |
| Tenant | clinic created, updated, suspended, archived, restored, purged |
| User | user created, updated, deactivated, invited, activated |
| Patient | patient created, updated, archived, restored, exported |
| Clinical | consultation created, updated, viewed, finalized, exported |
| Vitals | vitals created, updated, viewed |
| Prescription | prescription created, updated, finalized, exported |
| Lab | lab order created, completed, cancelled; lab report created, viewed, downloaded, published |
| Billing | invoice created, finalized, cancelled; payment recorded; refund processed; receipt generated |
| Storage | upload, download, signed URL generated, delete, restore, archive, recovery |
| Notification | created, scheduled, sent, failed, cancelled, template used |
| WhatsApp | account linked, template submitted/approved/rejected, message sent/delivered/failed, webhook received |
| Reports | report generated, viewed, exported, dashboard accessed |
| Subscription | subscription created, renewed, expired, plan changed, limit reached |
| Settings | setting created, updated, deleted, restored |
| Jobs | job failed, dead-lettered, replayed |
| Webhooks | received, rejected, processed, failed, replayed |

## Module Audit Requirements

| Module | Required Audit Events |
| --- | --- |
| Auth | Login Success, Login Failure, Logout, Password Reset, Session Revocation, Token Reuse Detection |
| RBAC | Role Creation, Role Update, Role Deletion, Permission Changes, Role Assignment, Role Revocation |
| Clinics | Clinic Created, Updated, Suspended, Archived, Recovered |
| Users | User Created, Updated, Deactivated, Invitation Sent, Invitation Accepted |
| Patients | Patient Created, Updated, Archived, Restored |
| Patient Records | Record Created, Updated, Viewed, Exported |
| Branches | Branch Created, Updated, Activated, Deactivated |
| Doctor Schedules | Schedule Created, Updated, Deleted, Activated |
| Doctor Leaves | Leave Created, Updated, Cancelled |
| Appointments | Created, Updated, Rescheduled, Cancelled, Completed |
| Queue | Entry Created, Called, Completed, No Show |
| Clinical | Consultation Created, Updated, Finalized, Viewed, Exported |
| Vitals | Created, Updated, Viewed |
| Prescriptions | Created, Updated, Finalized, Exported |
| Lab Tests | Test Created, Updated, Activated, Deactivated, Price Updated |
| Lab Orders | Order Created, Updated, Cancelled, Completed |
| Lab Order Items | Item Added, Updated, Cancelled |
| Lab Reports | Created, Updated, Viewed, Downloaded, Published |
| Billing | Invoice Created, Updated, Payment Recorded, Refund Processed, Credit Issued, Receipt Generated |
| Storage | File Uploaded, Downloaded, Deleted, Restored, Signed URL Generated |
| WhatsApp | Message Sent, Failed, Webhook Received, Template Approved, Template Rejected |
| Notifications | Created, Scheduled, Sent, Failed, Cancelled |
| Subscriptions | Created, Renewed, Expired, Plan Changed, Trial Started, Trial Ended |
| Settings | Created, Updated, Deleted, Restored |
| Reports | Generated, Viewed, Exported, Dashboard Accessed |

## Severity Levels

| Severity | Usage |
| --- | --- |
| INFO | Normal business and administrative actions. |
| WARNING | Failed authorization, invalid ownership attempt, repeated validation failure, suspicious but non-critical behavior. |
| CRITICAL | Tenant violation, token reuse, privilege escalation attempt, audit integrity issue, security incident, purge/recovery action. |

## Redaction Rules

Never store in audit logs:

- Passwords.
- Raw access tokens.
- Raw refresh tokens.
- Raw reset or invitation tokens.
- Provider access tokens.
- Secret keys.
- Full payment card data.

Sensitive clinical and patient fields:

- Store minimal before/after data.
- Prefer field names and high-level change markers.
- Redact values where full content is not necessary for accountability.

## Search and Export

Audit search supports:

- clinic.
- actor.
- module.
- action.
- resource type.
- resource id.
- request id.
- correlation id.
- severity.
- date range.

Export rules:

- Audit export is asynchronous.
- Export access requires `audit.export`.
- Clinic owners can export only their clinic audits.
- Super Admin can export platform or tenant audits.
- Audit exports use Storage module and signed URLs.
- Export creation is audited.

## Tamper Detection

Recommended:

- Add `hash` and `previous_hash` to audit records.
- Hash canonical audit fields.
- Periodically verify hash chain integrity.
- Alert on mismatch.

This can be phased after the base audit table but should be included before production compliance review.

## Retention

- Audit logs: permanent.
- Audit exports: permanent or governed by approved retention policy.
- Security audit records: permanent.

Archived audit records remain searchable or restorable.

## Monitoring

Metrics:

- audit records created.
- audit write failures.
- audit latency.
- audit export jobs.
- audit export failures.
- tamper check failures.
- authorization failure rate.
- tenant violation attempts.

Critical alerts:

- audit write failure for critical workflow.
- audit table unavailable.
- audit tamper mismatch.
- sudden spike in authorization failures.
- token reuse detection.

## Invariants

- Critical actions must be auditable.
- Audit records are immutable.
- Audit deletion is prohibited.
- Audit reads and exports are permission-restricted.
- Tenant audit queries include `clinic_id`.
- Audit records include request/correlation context.
- Secrets are never written to audit logs.
- Audit module audits itself.

