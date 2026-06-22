# MVP Scope

## Product Position

MVP means the smallest paid product that can be sold to real outpatient clinics without damaging trust or reputation.

The MVP should not pretend to be a complete hospital platform, patient portal, insurance system, pharmacy system, telemedicine platform, or national EHR integration layer. It should be sold narrowly as a secure clinic operations and clinical workflow platform for small to mid-sized outpatient clinics.

The PDF remains the source of truth, but MVP deliberately narrows the launch surface to the workflows that create immediate value:

- Register patients.
- Manage clinic users, roles, branches, and settings.
- Book appointments.
- Run the reception queue.
- Conduct consultations.
- Record vitals.
- Create prescriptions.
- Collect basic payments.
- Send basic reminders.
- View essential operational and financial reports.
- Maintain auditability, tenant isolation, security, and backup readiness.

## Classification Legend

- **Must Have Before Launch:** Required for a paid MVP without reputational damage.
- **Should Have Before Launch:** Strongly preferred for launch, but can be controlled through customer selection or manual operations.
- **Can Wait Until V1.1:** Useful soon after launch, but not required for the first paid clinics.
- **Can Wait Until V2:** Important for competitiveness, but too broad for MVP.
- **Nice To Have:** Valuable polish or expansion, not required for launch credibility.

## Module Classification

| Module | MVP Classification | MVP Boundary |
| --- | --- | --- |
| Auth | Must Have Before Launch | Secure login, logout, refresh rotation, HTTP-only cookies, session tracking, password reset. |
| RBAC | Must Have Before Launch | Standard roles for Super Admin, Clinic Owner, Doctor, Receptionist, Clinical Staff, Lab Technician, Billing Specialist. |
| Users | Must Have Before Launch | Staff lifecycle, invitations, activation, deactivation, session revocation. |
| Clinics | Must Have Before Launch | Clinic onboarding, activation, suspension, basic tenant lifecycle. |
| Branches | Must Have Before Launch | Primary branch and simple multi-branch support. |
| Settings | Must Have Before Launch | Clinic preferences, numbering, working hours, basic notification settings. |
| Subscription Plans | Should Have Before Launch | Manual plan setup, trial state, basic feature flags. |
| Clinic Subscriptions | Should Have Before Launch | Current subscription, expiry, simple limit enforcement. |
| Patients | Must Have Before Launch | Patient registration, demographics, duplicate checks, search, archive/restore. |
| Patient Records | Must Have Before Launch | Medical history, allergies, clinical notes, document references. |
| Doctor Schedules | Must Have Before Launch | Weekly availability, branch assignment, available slot lookup. |
| Doctor Leaves | Should Have Before Launch | Basic leave blocking to prevent scheduling conflicts. |
| Appointments | Must Have Before Launch | Booking, reschedule, cancel, confirm, no-show, check-in, history. |
| Queue | Must Have Before Launch | Check-in, token generation, call-next, complete, no-show, live queue view. |
| Clinical | Must Have Before Launch | Consultation notes, diagnosis, treatment plan, follow-up recommendation, finalize. |
| Vitals | Must Have Before Launch | Basic vitals capture and history inside consultation workflow. |
| Prescriptions | Must Have Before Launch | Draft, finalize, export/print, prescription history. |
| Prescription Templates | Should Have Before Launch | Common doctor templates to reduce consultation time. |
| Lab Tests | Can Wait Until V1.1 | Basic catalog can launch soon after MVP if early clinics need lab workflow. |
| Lab Orders | Can Wait Until V1.1 | Order tracking can wait if MVP clinics use external/manual labs. |
| Lab Order Items | Can Wait Until V1.1 | Internal to lab orders. |
| Lab Reports | Can Wait Until V1.1 | Report upload/publish can wait unless sold to lab-enabled clinics. |
| Billing | Must Have Before Launch | Basic invoices, payments, receipts, discounts, refunds, outstanding balance. |
| Storage | Should Have Before Launch | Limited secure uploads for patient documents and prescription/report exports. |
| Notifications | Must Have Before Launch | Appointment reminders, operational notifications, delivery status basics. |
| WhatsApp | Should Have Before Launch | Appointment reminders and simple outbound templates where WhatsApp is a market expectation. |
| WhatsApp Accounts | Can Wait Until V1.1 | Manual provider configuration can support the first clinics. |
| WhatsApp Messages | Can Wait Until V1.1 | Full message history/search can follow after launch. |
| WhatsApp Templates | Can Wait Until V1.1 | Template management can start manual/admin-managed. |
| Audit Logs | Must Have Before Launch | Auth, RBAC, tenant, patient, clinical, billing, prescription, and report audit trail. |
| Reports | Must Have Before Launch | Essential dashboard: appointments, revenue, patients, queue, doctor utilization. |
| Jobs | Must Have Before Launch | Reminder delivery, report/export jobs, retries, dead-letter visibility. |
| Exports | Should Have Before Launch | Prescription, invoice/receipt, and basic CSV/PDF exports. |
| Webhooks | Can Wait Until V1.1 | Needed for provider callbacks and payment/WhatsApp automation after MVP. |

## Smallest Reputable Paid Product

The smallest product that can be launched to paying customers without damaging reputation is:

**A secure outpatient clinic operations platform for staff users, with patient registry, appointment scheduling, live queue, consultation notes, vitals, prescriptions, basic billing, appointment reminders, essential dashboards, audit logs, and production-grade tenant isolation.**

This product is sellable if expectations are managed clearly:

- It is not a hospital system.
- It is not a patient portal yet.
- It is not an insurance claims system.
- It is not a pharmacy inventory system.
- It is not telemedicine.
- It is not a lab automation platform.

## Features Causing Unnecessary MVP Complexity

- Full patient portal.
- Telemedicine.
- Insurance claims and eligibility.
- Pharmacy inventory.
- Advanced WhatsApp inbox and campaign tooling.
- Complex subscription metering and overage billing.
- Advanced analytics and forecasting.
- AI scribe or clinical AI.
- FHIR/HL7 integrations.
- Multi-region deployment.
- Full marketplace integration layer.

## Features To Postpone

- Patient login and patient mobile app.
- Insurance workflows.
- Pharmacy workflows.
- Government EHR integrations.
- Device/lab machine integrations.
- Doctor review workflow for every lab scenario.
- Scheduled reporting and advanced aggregates.
- Public API/SDK.
- Advanced tenant export/import.
- Enterprise SSO.

## Features Likely To Create Support Burden

- Custom RBAC roles before role templates are stable.
- Advanced WhatsApp templates and provider onboarding.
- Subscription limit enforcement if billing rules are unclear.
- Lab report publishing if clinic review policies vary.
- Refunds and credit notes if financial rules are not strict.
- File uploads without clear size/type/retention policies.
- Patient duplicate merging.
- Multi-branch permission edge cases.

## Features Likely To Create Scalability Issues

- Real-time queue broadcasting without connection limits.
- Heavy reports on the transactional database.
- Full text patient search without an indexing strategy.
- WhatsApp delivery inside request/response flows.
- File uploads without async scanning and orphan cleanup.
- Audit log growth without retention and indexes.
- Queue counters and appointment booking without transaction-safe patterns.

## Features Likely To Create Security Risks

- Browser-stored access/refresh tokens.
- Any API accepting client-provided tenant IDs as authority.
- File uploads without malware scanning and strict validation.
- Audit logs storing secrets or excessive PHI.
- Super Admin tenant override without reason codes and audit.
- WhatsApp webhooks without signature and replay validation.
- Report exports without signed URLs and expiry.
- Over-broad Clinic Owner access to clinical records.

## Launch Recommendation

Launch MVP only as a controlled paid beta with carefully selected outpatient clinics.

Launch conditions:

- One canonical backend runtime.
- No critical/high dependency vulnerabilities.
- Secure auth and session model.
- Tenant isolation and RBAC tests.
- Core workflows tested end to end.
- Backup and restore proven.
- Operational dashboards active.
- Clear sales messaging about what is included and excluded.

Do not market MVP as a complete healthcare platform. Market it as a secure clinic operating system for appointments, queue, clinical notes, prescriptions, billing, reminders, and basic reporting.

## 90 Days And 5 Engineers

If limited to 90 days and 5 engineers, build this first:

### Engineer 1: Foundation, Auth, RBAC, Tenant

- Canonical backend.
- Auth/session security.
- Tenant context.
- RBAC roles and permissions.
- Users, invitations, clinic onboarding.
- Audit foundation.

### Engineer 2: Patient And Clinic Operations

- Patients.
- Patient records.
- Branches.
- Settings.
- Doctor schedules and leaves.
- Patient search and duplicate controls.

### Engineer 3: Appointments And Queue

- Appointment booking/reschedule/cancel.
- Availability lookup.
- Queue check-in.
- Token generation.
- Live queue dashboard.
- No-show and completion states.

### Engineer 4: Clinical, Prescriptions, Billing

- Consultations.
- Vitals.
- Prescription finalization and exports.
- Basic invoices.
- Payments.
- Receipts.
- Refund basics.

### Engineer 5: Notifications, Reports, QA, Launch Ops

- Appointment reminders.
- Basic WhatsApp or SMS/email delivery.
- Essential reports.
- Jobs/retries.
- Operational dashboards.
- Integration tests.
- Backup/restore validation.
- Launch checklist execution.

## 90-Day Cut Line

If a feature does not directly support patient registration, appointment flow, queue flow, consultation, prescription, billing, reminder delivery, audit, or safe production operation, it waits.
