# API Roadmap

## API Standards

- Base path: `/api/v1`.
- All protected endpoints require authentication, tenant resolution, RBAC, validation, request ID, logging, and error handling.
- Public endpoints are explicitly declared.
- Validators cover body, params, and query.
- Responses use the standard envelope:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "meta": {}
}
```

- Errors never expose stack traces.
- List APIs support pagination, search, filtering, sorting, and deterministic ordering.
- Write APIs that can be retried by clients support idempotency keys where appropriate.

## Cross-Cutting Query Parameters

List endpoints should support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `fromDate`
- `toDate`
- module-specific filters

Tenant context:

- Clinic users derive clinic from token.
- Super Admin may use explicit clinic context through a validated header/query, depending on approved API standard.

## Auth APIs

| Method | Path | Purpose | Public |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | Login and create session. | Yes |
| POST | `/api/v1/auth/logout` | Revoke current session. | No |
| POST | `/api/v1/auth/logout-all` | Revoke all sessions for current user. | No |
| POST | `/api/v1/auth/refresh` | Rotate refresh token and issue new access token. | Yes, requires refresh cookie |
| GET | `/api/v1/auth/me` | Current user/session context. | No |
| POST | `/api/v1/auth/password-reset/request` | Request reset link with enumeration-safe response. | Yes |
| POST | `/api/v1/auth/password-reset/confirm` | Confirm reset and revoke sessions. | Yes |

## RBAC APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/rbac/roles` | List roles. |
| POST | `/api/v1/rbac/roles` | Create tenant custom role. |
| GET | `/api/v1/rbac/roles/:id` | Read role. |
| PATCH | `/api/v1/rbac/roles/:id` | Update role metadata. |
| DELETE | `/api/v1/rbac/roles/:id` | Archive custom role. |
| GET | `/api/v1/rbac/permissions` | List permission catalog. |
| POST | `/api/v1/rbac/permissions` | Platform-managed permission creation only. |
| POST | `/api/v1/rbac/roles/:id/permissions` | Grant role permissions/scopes. |
| DELETE | `/api/v1/rbac/roles/:id/permissions/:permissionId` | Revoke role permission. |
| GET | `/api/v1/rbac/assignments` | List role assignments. |
| POST | `/api/v1/rbac/assignments` | Assign role to user. |
| DELETE | `/api/v1/rbac/assignments/:id` | Revoke role assignment. |
| GET | `/api/v1/rbac/effective/:userId` | View effective permissions. |

## Clinic and Tenant APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/clinics` | Super Admin clinic list. |
| POST | `/api/v1/clinics` | Transactional clinic onboarding. |
| GET | `/api/v1/clinics/:id` | Clinic details. |
| PATCH | `/api/v1/clinics/:id` | Update clinic. |
| PATCH | `/api/v1/clinics/:id/status` | Activate, suspend, archive, restore. |
| GET | `/api/v1/branches` | List branches for current clinic. |
| POST | `/api/v1/branches` | Create branch. |
| GET | `/api/v1/branches/:id` | Branch details. |
| PATCH | `/api/v1/branches/:id` | Update branch. |
| PATCH | `/api/v1/branches/:id/status` | Activate/deactivate branch. |

## User APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/users` | List clinic staff. |
| POST | `/api/v1/users` | Create staff user. |
| GET | `/api/v1/users/:id` | User details. |
| PATCH | `/api/v1/users/:id` | Update user profile/status fields. |
| POST | `/api/v1/users/invite` | Create invitation. |
| POST | `/api/v1/users/invitations/accept` | Accept invitation. |
| POST | `/api/v1/users/:id/deactivate` | Deactivate user and revoke sessions. |
| POST | `/api/v1/users/:id/reactivate` | Reactivate eligible user. |

## Patient APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/patients` | List patients. |
| POST | `/api/v1/patients` | Register patient. |
| GET | `/api/v1/patients/:id` | Patient profile. |
| PATCH | `/api/v1/patients/:id` | Update patient. |
| DELETE | `/api/v1/patients/:id` | Archive patient. |
| POST | `/api/v1/patients/:id/restore` | Restore archived patient. |
| GET | `/api/v1/patients/search` | Indexed patient search. |
| GET | `/api/v1/patient-records` | List records. |
| POST | `/api/v1/patient-records` | Create patient record. |
| GET | `/api/v1/patient-records/:id` | View record, audited. |
| PATCH | `/api/v1/patient-records/:id` | Update record. |
| DELETE | `/api/v1/patient-records/:id` | Archive record. |

## Scheduling APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/doctor-schedules` | List schedules. |
| POST | `/api/v1/doctor-schedules` | Create schedule. |
| GET | `/api/v1/doctor-schedules/:id` | Schedule detail. |
| PATCH | `/api/v1/doctor-schedules/:id` | Update schedule. |
| DELETE | `/api/v1/doctor-schedules/:id` | Archive schedule. |
| GET | `/api/v1/doctor-schedules/availability` | Resolve available slots. |
| GET | `/api/v1/doctor-leaves` | List leaves. |
| POST | `/api/v1/doctor-leaves` | Create leave. |
| GET | `/api/v1/doctor-leaves/:id` | Leave detail. |
| PATCH | `/api/v1/doctor-leaves/:id` | Update leave. |
| POST | `/api/v1/doctor-leaves/:id/cancel` | Cancel leave. |

## Appointment APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/appointments` | List appointments. |
| POST | `/api/v1/appointments` | Book appointment transactionally. |
| GET | `/api/v1/appointments/:id` | Appointment detail. |
| PATCH | `/api/v1/appointments/:id` | Update allowed fields. |
| POST | `/api/v1/appointments/reschedule` | Reschedule appointment. |
| POST | `/api/v1/appointments/cancel` | Cancel appointment. |
| POST | `/api/v1/appointments/:id/confirm` | Confirm appointment. |
| POST | `/api/v1/appointments/:id/no-show` | Mark no-show. |
| POST | `/api/v1/appointments/:id/complete` | Complete appointment. |

## Queue APIs

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/queue/check-in` | Create queue token transactionally. |
| POST | `/api/v1/queue/call-next` | Call next patient. |
| GET | `/api/v1/queue/dashboard` | Live queue dashboard data. |
| GET | `/api/v1/queue/:id` | Queue entry detail. |
| PATCH | `/api/v1/queue/:id` | Update queue state. |
| POST | `/api/v1/queue/:id/no-show` | Mark queue no-show. |
| POST | `/api/v1/queue/:id/complete` | Complete queue entry. |

## Clinical APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/clinical` | List consultations. |
| POST | `/api/v1/clinical` | Create consultation. |
| GET | `/api/v1/clinical/:id` | Consultation detail, audited. |
| PATCH | `/api/v1/clinical/:id` | Update draft/in-progress consultation. |
| POST | `/api/v1/clinical/finalize` | Finalize consultation. |
| GET | `/api/v1/clinical/timeline/:patientId` | Patient clinical timeline. |
| GET | `/api/v1/vitals` | List vitals. |
| POST | `/api/v1/vitals` | Record vitals. |
| GET | `/api/v1/vitals/:id` | Vital detail. |
| PATCH | `/api/v1/vitals/:id` | Update allowed vitals record. |
| GET | `/api/v1/vitals/patient/:patientId` | Patient vitals history. |

## Prescription APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/prescriptions` | List prescriptions. |
| POST | `/api/v1/prescriptions` | Create prescription draft. |
| GET | `/api/v1/prescriptions/:id` | Prescription detail. |
| PATCH | `/api/v1/prescriptions/:id` | Update draft. |
| POST | `/api/v1/prescriptions/:id/finalize` | Finalize prescription. |
| GET | `/api/v1/prescriptions/export/:id` | Generate/download prescription export. |
| GET | `/api/v1/prescription-templates` | List templates. |
| POST | `/api/v1/prescription-templates` | Create template. |
| GET | `/api/v1/prescription-templates/:id` | Template detail. |
| PATCH | `/api/v1/prescription-templates/:id` | Update template. |
| DELETE | `/api/v1/prescription-templates/:id` | Archive template. |

## Laboratory APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/lab-tests` | List lab tests. |
| POST | `/api/v1/lab-tests` | Create lab test. |
| GET | `/api/v1/lab-tests/:id` | Lab test detail. |
| PATCH | `/api/v1/lab-tests/:id` | Update lab test. |
| GET | `/api/v1/lab-tests/categories` | List categories. |
| GET | `/api/v1/lab-orders` | List lab orders. |
| POST | `/api/v1/lab-orders` | Create lab order. |
| GET | `/api/v1/lab-orders/:id` | Lab order detail. |
| PATCH | `/api/v1/lab-orders/:id` | Update allowed order fields. |
| POST | `/api/v1/lab-orders/:id/cancel` | Cancel lab order. |
| GET | `/api/v1/lab-reports` | List lab reports. |
| POST | `/api/v1/lab-reports` | Create report draft. |
| GET | `/api/v1/lab-reports/:id` | Lab report detail. |
| PATCH | `/api/v1/lab-reports/:id` | Update draft/review report. |
| POST | `/api/v1/lab-reports/upload` | Upload report file. |
| GET | `/api/v1/lab-reports/download/:id` | Download through signed URL. |
| POST | `/api/v1/lab-reports/:id/publish` | Publish report. |

## Billing APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/billing/invoices` | List invoices. |
| POST | `/api/v1/billing/invoices` | Create invoice. |
| GET | `/api/v1/billing/invoices/:id` | Invoice detail. |
| PATCH | `/api/v1/billing/invoices/:id` | Update draft invoice. |
| POST | `/api/v1/billing/invoices/:id/finalize` | Finalize invoice. |
| POST | `/api/v1/billing/invoices/:id/cancel` | Cancel eligible invoice. |
| GET | `/api/v1/billing/payments` | List payments. |
| POST | `/api/v1/billing/payments` | Record payment. |
| POST | `/api/v1/billing/refunds` | Process refund. |
| GET | `/api/v1/billing/receipts/:id` | Get receipt. |

## Storage APIs

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/storage/upload` | Upload file through validation and S3. |
| GET | `/api/v1/storage/download/:id` | Authorized download redirect/signed URL. |
| DELETE | `/api/v1/storage/delete/:id` | Soft delete file metadata and retention state. |
| POST | `/api/v1/storage/restore/:id` | Restore deleted file where retention allows. |
| GET | `/api/v1/storage/signed-url/:id` | Generate short-lived signed URL. |

## Notification and WhatsApp APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/notifications` | List notifications. |
| POST | `/api/v1/notifications` | Create notification. |
| GET | `/api/v1/notifications/:id` | Notification detail. |
| POST | `/api/v1/notifications/schedule` | Schedule notification. |
| POST | `/api/v1/notifications/:id/cancel` | Cancel scheduled notification. |
| GET | `/api/v1/whatsapp/status` | WhatsApp module status. |
| POST | `/api/v1/whatsapp/send` | Send WhatsApp message through notification/provider path. |
| GET | `/api/v1/whatsapp/health` | Provider health status. |
| POST | `/api/v1/whatsapp/webhook` | Raw provider webhook endpoint. |
| GET | `/api/v1/whatsapp/accounts` | List accounts. |
| POST | `/api/v1/whatsapp/accounts` | Create/link account. |
| GET | `/api/v1/whatsapp/accounts/:id` | Account detail. |
| PATCH | `/api/v1/whatsapp/accounts/:id` | Update account. |
| POST | `/api/v1/whatsapp/accounts/verify` | Verify account. |
| GET | `/api/v1/whatsapp/messages` | List message history. |
| GET | `/api/v1/whatsapp/messages/search` | Search messages. |
| GET | `/api/v1/whatsapp/messages/:id` | Message detail. |
| GET | `/api/v1/whatsapp/templates` | List templates. |
| POST | `/api/v1/whatsapp/templates` | Create template. |
| GET | `/api/v1/whatsapp/templates/:id` | Template detail. |
| PATCH | `/api/v1/whatsapp/templates/:id` | Update draft template. |

## Subscription and Settings APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/subscription-plans` | List platform plans. |
| POST | `/api/v1/subscription-plans` | Create plan, Super Admin only. |
| GET | `/api/v1/subscription-plans/:id` | Plan detail. |
| PATCH | `/api/v1/subscription-plans/:id` | Update plan. |
| GET | `/api/v1/subscription-plans/features` | List feature catalog. |
| GET | `/api/v1/subscriptions` | List subscriptions, Super Admin or tenant admin scope. |
| POST | `/api/v1/subscriptions` | Create/assign subscription. |
| GET | `/api/v1/subscriptions/current` | Current clinic subscription. |
| GET | `/api/v1/subscriptions/usage` | Current usage. |
| POST | `/api/v1/subscriptions/renew` | Renew subscription. |
| GET | `/api/v1/settings` | List settings. |
| GET | `/api/v1/settings/:key` | Get setting. |
| PUT | `/api/v1/settings/:key` | Upsert setting. |
| DELETE | `/api/v1/settings/:key` | Archive setting. |

## Audit and Report APIs

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/audit-logs` | List audit logs. |
| GET | `/api/v1/audit-logs/search` | Search audits. |
| POST | `/api/v1/audit-logs/export` | Start audit export. |
| GET | `/api/v1/reports` | List/report request endpoint. |
| POST | `/api/v1/reports` | Generate report request. |
| GET | `/api/v1/reports/dashboard` | Dashboard metrics. |
| POST | `/api/v1/reports/export` | Create export job. |

## Internal and Admin Operational APIs

These should be hidden behind platform admin permissions or not publicly exposed:

- Job status and retry controls.
- Dead-letter reprocessing.
- Outbox inspection.
- Webhook replay.
- Storage orphan scan results.
- Report aggregate rebuild.
- Health/readiness/startup checks.

Recommended paths if exposed:

- `/api/v1/platform/jobs`
- `/api/v1/platform/outbox`
- `/api/v1/platform/dead-letters`
- `/api/v1/platform/webhooks`

## API Build Order

1. Health, readiness, request context, error envelope.
2. Auth.
3. RBAC.
4. Clinics, branches, users, settings, subscriptions.
5. Patients and patient records.
6. Schedules, leaves, appointments, queue.
7. Clinical, vitals, prescriptions.
8. Lab tests, orders, reports.
9. Billing.
10. Storage.
11. Notifications and WhatsApp.
12. Audit, reports, exports, jobs.

