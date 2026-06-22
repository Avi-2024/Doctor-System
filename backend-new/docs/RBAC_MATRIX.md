# RBAC Matrix

## Authorization Model

The platform uses role-based access control with scoped permissions.

Access decision inputs:

- User.
- Tenant.
- Role assignment.
- Role permissions.
- Permission scope.
- Target resource.

Authorization occurs after authentication and tenant resolution, before controller execution, and again inside critical services for defense in depth.

## Scopes

| Scope | Meaning | Typical Use |
| --- | --- | --- |
| OWN | Records created by or owned by actor. | Own notifications, own profile. |
| ASSIGNED | Records assigned to actor. | Doctor appointments, consultations, prescriptions. |
| BRANCH | Records in actor branch. | Reception queue, branch revenue, branch appointments. |
| CLINIC | All records in tenant. | Clinic Owner, clinic admin, full-clinic reports. |
| ALL | Platform-wide. | Super Admin only. |

Scope hierarchy:

`ALL > CLINIC > BRANCH > ASSIGNED > OWN`

Strongest scope wins when a user has multiple roles.

## System Roles

| Role | Scope | Description |
| --- | --- | --- |
| Super Admin | ALL | Platform operations, subscription plans, all tenants, platform audits, recovery, incidents. |
| Clinic Owner | CLINIC | Tenant administration, staff, branches, settings, subscriptions, reports. |
| Doctor | ASSIGNED/CLINIC mixed | Clinical practitioner with assigned appointments and clinical records. |
| Receptionist | BRANCH | Front desk operations, patients, appointments, queue, payment collection. |
| Clinical Staff/Nurse | BRANCH/ASSIGNED | Vitals, patient records, consultation assistance. |
| Lab Technician | BRANCH/CLINIC | Lab order processing and lab reports. |
| Billing Specialist | BRANCH/CLINIC | Invoices, payments, receipts, refunds when granted. |
| Custom Role | Configured | Tenant-owned role that cannot exceed actor privileges. |

System roles cannot be deleted. Updates require controlled platform migration.

## Permission Catalog

Permission naming standard:

`module.action`

Core actions:

- `read`
- `create`
- `update`
- `delete`
- `manage`
- `export`
- `finalize`
- `approve`
- `cancel`
- `restore`

Reserved platform permissions:

- `platform.manage`
- `tenant.recovery`
- `system.audit`
- `subscriptions.manage`
- `subscription_plans.manage`
- `security.manage`
- `jobs.manage`
- `webhooks.manage`

Reserved permissions can only be granted to Super Admin roles.

## Module Permissions

| Module | Permissions |
| --- | --- |
| Auth | auth.session.read, auth.session.revoke, auth.logout_all |
| RBAC | rbac.read, rbac.manage, rbac.assign, rbac.revoke |
| Clinics | clinics.read, clinics.create, clinics.update, clinics.suspend, clinics.archive, clinics.restore |
| Branches | branches.read, branches.create, branches.update, branches.deactivate, branches.manage |
| Users | users.read, users.create, users.update, users.deactivate, users.invite, users.manage |
| Patients | patients.read, patients.create, patients.update, patients.delete, patients.restore, patients.export |
| Patient Records | patient_records.read, patient_records.create, patient_records.update, patient_records.delete, patient_records.export |
| Doctor Schedules | doctor_schedules.read, doctor_schedules.create, doctor_schedules.update, doctor_schedules.delete, doctor_schedules.manage |
| Doctor Leaves | doctor_leaves.read, doctor_leaves.create, doctor_leaves.update, doctor_leaves.cancel |
| Appointments | appointments.read, appointments.create, appointments.update, appointments.reschedule, appointments.cancel, appointments.manage |
| Queue | queue.read, queue.check_in, queue.call, queue.update, queue.manage |
| Clinical | clinical.read, clinical.create, clinical.update, clinical.finalize, clinical.export |
| Vitals | vitals.read, vitals.create, vitals.update |
| Prescriptions | prescriptions.read, prescriptions.create, prescriptions.update, prescriptions.finalize, prescriptions.export, prescriptions.manage_templates |
| Lab Tests | lab_tests.read, lab_tests.create, lab_tests.update, lab_tests.deactivate, lab_tests.manage |
| Lab Orders | lab_orders.read, lab_orders.create, lab_orders.update, lab_orders.cancel, lab_orders.complete |
| Lab Reports | lab_reports.read, lab_reports.create, lab_reports.update, lab_reports.publish, lab_reports.download |
| Billing | billing.read, billing.create_invoice, billing.update_invoice, billing.finalize_invoice, billing.record_payment, billing.refund, billing.receipt, billing.manage |
| Storage | storage.read, storage.upload, storage.download, storage.delete, storage.restore |
| Notifications | notifications.read, notifications.create, notifications.schedule, notifications.cancel, notifications.manage |
| WhatsApp | whatsapp.read, whatsapp.send, whatsapp.manage_accounts, whatsapp.manage_templates, whatsapp.view_messages, whatsapp.webhook_admin |
| Subscription Plans | subscription_plans.read, subscription_plans.manage |
| Clinic Subscriptions | subscriptions.read, subscriptions.manage, subscriptions.renew, subscriptions.view_usage |
| Settings | settings.read, settings.update, settings.manage |
| Audit Logs | audit.read, audit.export |
| Reports | reports.view, reports.generate, reports.export |
| Jobs | jobs.read, jobs.manage, jobs.retry |
| Exports | exports.read, exports.create, exports.download |
| Webhooks | webhooks.read, webhooks.replay, webhooks.manage |

## Role Permission Matrix

| Permission Area | Super Admin | Clinic Owner | Doctor | Receptionist | Clinical Staff | Lab Technician | Billing Specialist |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Platform management | ALL | None | None | None | None | None | None |
| Clinic lifecycle | ALL | CLINIC read/update own settings only | None | None | None | None | None |
| Branches | ALL | CLINIC manage | Read assigned | BRANCH read | BRANCH read | BRANCH read | BRANCH read |
| Users | ALL | CLINIC manage except Super Admin | Read own/clinic limited | None | None | None | None |
| RBAC | ALL | CLINIC manage within own privileges | None | None | None | None | None |
| Patients | ALL | CLINIC | ASSIGNED or CLINIC read depending clinic policy | BRANCH create/read/update | BRANCH read/update records | BRANCH read for lab context | BRANCH read billing context |
| Patient records | ALL | CLINIC read metadata/export by policy | ASSIGNED read/create/update | Limited create/read demographics | BRANCH create/update vitals/records | Lab-related read | Billing-related read only |
| Schedules/leaves | ALL | CLINIC manage | OWN/ASSIGNED read | BRANCH read | None | None | None |
| Appointments | ALL | CLINIC | ASSIGNED read/update clinical status | BRANCH create/update/reschedule/cancel | BRANCH read | BRANCH read lab context | BRANCH read billing context |
| Queue | ALL | CLINIC | ASSIGNED read/call where configured | BRANCH manage | BRANCH update | None | None |
| Clinical | ALL | CLINIC read reports by policy | ASSIGNED create/update/finalize | None | ASSIGNED or BRANCH create/update support data | Read lab-related context | None |
| Vitals | ALL | CLINIC read by policy | ASSIGNED read/update | Create if configured | BRANCH create/update | None | None |
| Prescriptions | ALL | CLINIC read by policy | ASSIGNED create/update/finalize/export | None | Read/support only | None | None |
| Lab tests | ALL | CLINIC manage | Read | Read | Read | CLINIC manage | None |
| Lab orders | ALL | CLINIC read | ASSIGNED create/read | Read status | Read/create if configured | CLINIC process/update/complete | Billing read |
| Lab reports | ALL | CLINIC read | ASSIGNED read | None | Read if assigned | Create/update/publish | Billing read |
| Billing | ALL | CLINIC read/manage by policy | Read patient billing summary if allowed | BRANCH invoice/payment | None | Lab billing read | BRANCH/CLINIC manage |
| Storage | ALL | CLINIC | ASSIGNED clinical files | BRANCH upload patient docs | BRANCH upload clinical docs | BRANCH upload lab reports | Billing exports |
| Notifications | ALL | CLINIC manage | Own/assigned notifications | BRANCH operational notifications | Own/assigned | Lab notifications | Billing notifications |
| WhatsApp | ALL | CLINIC manage | Send patient clinical messages if allowed | Send appointment/queue templates | Limited | Lab templates/status | Billing templates/status |
| Subscriptions | ALL | CLINIC current/usage/renew request | None | None | None | None | None |
| Settings | ALL | CLINIC manage | Own preferences | Own preferences | Own preferences | Own preferences | Own preferences |
| Audit | ALL | CLINIC read/export | Own actions only if exposed | Own actions only if exposed | Own actions only if exposed | Own actions only if exposed | Own actions only if exposed |
| Reports | ALL | CLINIC | ASSIGNED/clinical reports | BRANCH operations | BRANCH clinical support | Lab reports | Financial reports |
| Jobs/webhooks | ALL | None by default | None | None | None | None | None |

## Endpoint Authorization Rules

Every protected endpoint declares at least one required permission.

Examples:

- `GET /patients` requires `patients.read`.
- `POST /patients` requires `patients.create`.
- `PATCH /patients/:id` requires `patients.update`.
- `POST /clinical/finalize` requires `clinical.finalize`.
- `POST /billing/refunds` requires `billing.refund`.
- `POST /audit-logs/export` requires `audit.export`.

Service-level authorization is mandatory for:

- Appointment reschedule/cancel.
- Consultation finalize.
- Prescription finalize/export.
- Lab report publish/download.
- Invoice finalization.
- Payment and refund processing.
- Role assignment/revocation.
- Tenant lifecycle changes.
- Storage signed URL generation.
- Audit export.

## RBAC Transactions

RBAC changes are transactional:

1. Validate actor authority.
2. Validate target user, role, permissions, and scope.
3. Create/update/revoke role or assignment.
4. Create audit log.
5. Invalidate permission cache.
6. Increment token version or revoke sessions for high-risk changes.
7. Commit.

## Audit Requirements

Always audit:

- Role creation, update, deletion.
- Permission grant/removal.
- Role assignment/revocation.
- Authorization failures for protected or sensitive resources.
- Privilege escalation attempts.
- Reserved permission access attempts.

Audit fields:

- actor.
- target user.
- role.
- permission.
- scope.
- request id.
- clinic id.
- timestamp.
- before/after values where safe.

## Open RBAC Decisions

- Whether Clinic Owner can view all clinical records by default or only operational summaries.
- Whether Receptionist can create vitals in this product variant.
- Whether Lab Technician can publish reports directly or needs doctor review.
- Whether Billing Specialist scope is branch-only or clinic-wide by default.
- Whether emergency/break-glass clinical access is required in MVP.

