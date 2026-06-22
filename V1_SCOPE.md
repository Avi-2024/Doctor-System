# Version 1.0 Scope

## Product Position

Version 1.0 is the complete outpatient clinic SaaS platform promised by the PDF. It should be ready for broader paid rollout after the MVP proves the core workflows.

V1.0 must cover the complete outpatient lifecycle:

- Clinic and branch administration.
- User and RBAC management.
- Patient registry and records.
- Scheduling, appointments, and queue.
- Clinical consultations, vitals, prescriptions.
- Laboratory workflows.
- Billing and payments.
- Notifications and WhatsApp.
- Storage, reports, exports, audit, jobs, and subscriptions.

V1.0 still does not include the PDF's explicitly out-of-scope areas: inpatient, pharmacy inventory, insurance claims, medical device integration, telemedicine, and government EHR integration.

## Classification Legend

- **Must Have Before Launch:** Required before marketing Version 1.0 broadly.
- **Should Have Before Launch:** Strongly preferred for Version 1.0, but can be constrained by customer type.
- **Can Wait Until V1.1:** Valuable near-term enhancement after Version 1.0 launch.
- **Can Wait Until V2:** Strategic expansion beyond Version 1.0.
- **Nice To Have:** Differentiation or polish, not required for Version 1.0.

## Module Classification

| Module | V1.0 Classification | V1.0 Boundary |
| --- | --- | --- |
| Auth | Must Have Before Launch | Mature secure auth, session management, refresh rotation, logout-all, reset flows. |
| RBAC | Must Have Before Launch | Role templates, custom tenant roles, permission coverage, scope enforcement. |
| Users | Must Have Before Launch | Staff lifecycle, invitations, deactivation, session impact. |
| Clinics | Must Have Before Launch | Onboarding, active/suspended/archived lifecycle, recovery. |
| Branches | Must Have Before Launch | Multi-branch operations, branch status, branch assignment. |
| Settings | Must Have Before Launch | Clinic preferences, feature flags, branding, numbering, notification settings. |
| Subscription Plans | Must Have Before Launch | Plan features, limits, pricing, versioning. |
| Clinic Subscriptions | Must Have Before Launch | Trial, current plan, renewal, expiry, grace, limit enforcement. |
| Patients | Must Have Before Launch | Registry, search, duplicate prevention, archive/restore, patient history. |
| Patient Records | Must Have Before Launch | Medical history, family history, allergies, clinical notes, documents. |
| Doctor Schedules | Must Have Before Launch | Schedule rules, availability lookup, branch assignment. |
| Doctor Leaves | Must Have Before Launch | Leave conflicts, cancellation, availability protection. |
| Appointments | Must Have Before Launch | Full lifecycle, reminders, history, no-show, check-in, completion. |
| Queue | Must Have Before Launch | Live queue, token counters, progression, doctor visibility, realtime updates. |
| Clinical | Must Have Before Launch | Consultations, diagnosis, plan, follow-up, finalization, timeline. |
| Vitals | Must Have Before Launch | Structured measurements, historical trends, consultation linkage. |
| Prescriptions | Must Have Before Launch | Draft/finalize, immutable final prescriptions, exports, history. |
| Prescription Templates | Must Have Before Launch | Doctor templates, reusable medication instructions, archive. |
| Lab Tests | Must Have Before Launch | Catalog, categories, pricing, activation/deactivation. |
| Lab Orders | Must Have Before Launch | Orders from consultation, lifecycle, cancellation, completion. |
| Lab Order Items | Must Have Before Launch | Test snapshots, pricing snapshots, item status. |
| Lab Reports | Must Have Before Launch | Draft, upload, publish, download, audit, notification. |
| Billing | Must Have Before Launch | Invoices, payments, receipts, discounts, tax, refunds, credit notes. |
| Storage | Must Have Before Launch | S3-backed secure files, signed URLs, metadata, access logs, retention baseline. |
| Notifications | Must Have Before Launch | Channel-neutral notifications, scheduling, retries, delivery status. |
| WhatsApp | Must Have Before Launch | Outbound/inbound basics, delivery tracking, provider health. |
| WhatsApp Accounts | Should Have Before Launch | Account setup, verification, active account control. |
| WhatsApp Messages | Should Have Before Launch | Message history, status, search, reconciliation basics. |
| WhatsApp Templates | Should Have Before Launch | Approved templates, variables, status tracking. |
| Audit Logs | Must Have Before Launch | Immutable audit, search, export, sensitive read/write coverage. |
| Reports | Must Have Before Launch | Operational, financial, clinical, administrative dashboards and reports. |
| Jobs | Must Have Before Launch | Durable jobs, retries, dead letters, worker monitoring. |
| Exports | Must Have Before Launch | Report, prescription, receipt, lab, audit exports with signed URLs. |
| Webhooks | Should Have Before Launch | WhatsApp and provider callbacks, idempotency, replay controls. |

## V1.0 Product Promise

Version 1.0 should be safe to sell as:

**A production-ready outpatient clinic SaaS platform covering front desk, doctor workflow, prescriptions, laboratory, billing, reminders, reporting, audit, subscriptions, and multi-branch operations.**

## Can Wait Until V1.1

- Advanced WhatsApp inbox.
- Scheduled report subscriptions.
- Custom report builder.
- Patient duplicate merge workflow.
- Advanced subscription metering and overage billing.
- Advanced clinic data import.
- Public API documentation portal.
- Support-access reason code UI.
- Full audit review workflows.
- Provider reconciliation dashboards.
- Branch-level financial drill-down polish.

## Can Wait Until V2

- Patient portal.
- Patient mobile app.
- Doctor mobile app.
- Telemedicine.
- Insurance eligibility and claims.
- Pharmacy inventory.
- E-prescribing integration.
- FHIR/HL7 interoperability.
- Government EHR integrations.
- Medical device/lab machine integration.
- AI scribe and AI analytics.
- Customer success portal.

## Features Causing Unnecessary V1.0 Complexity

- Full patient self-service before staff workflows are stable.
- Complex insurance and claim workflows.
- Lab machine automation.
- Advanced AI.
- Multi-region deployment.
- Marketplace integrations.
- Highly configurable custom workflows per clinic.
- Open-ended custom report designer.

## Features To Postpone

- Anything requiring patient identity management.
- Anything requiring payer connectivity.
- Anything requiring device certification or hardware support.
- Anything requiring medical AI governance.
- Anything requiring national interoperability certification.
- Any feature that makes launch dependent on third-party provider approval.

## Features Likely To Create Support Burden

- Custom RBAC without strong templates.
- Multi-branch permissions.
- WhatsApp provider onboarding.
- Refunds, credit notes, and tax configuration.
- Lab report publication policy differences.
- Subscription limit disputes.
- Report discrepancies between operational and financial views.
- Patient duplicate and merge requests.

## Features Likely To Create Scalability Issues

- Reports querying OLTP tables directly.
- Audit logs without retention and archive strategy.
- Queue WebSockets without Redis adapter and connection limits.
- Jobs using the primary database under high notification load.
- Large exports without async generation.
- Patient search without indexing/search service strategy.
- Storage without lifecycle cleanup.

## Features Likely To Create Security Risks

- Patient document uploads.
- Signed URLs with long expiry.
- Super Admin tenant override.
- Audit export downloads.
- WhatsApp webhooks.
- Custom role assignment.
- Financial refunds.
- Clinical record export.

## Launch Recommendation

Launch V1.0 only after MVP pilot evidence proves the core clinic workflow and after laboratory, billing, reports, storage, WhatsApp, jobs, exports, and subscriptions are production-ready.

V1.0 should not be launched as a general healthcare platform. It should be launched as a complete outpatient clinic SaaS platform. The sales boundary must remain clear.

## 90 Days And 5 Engineers

If 90 days and 5 engineers are available for V1.0 work after MVP:

1. Stabilize pilot feedback and close workflow defects.
2. Add laboratory workflows.
3. Harden billing, refunds, receipts, and tax.
4. Add storage, exports, and report dashboards.
5. Add durable jobs, WhatsApp delivery tracking, and operational monitoring.
6. Add subscription enforcement.
7. Run launch-readiness, security, backup, and load validation.

Do not spend the 90 days on V2 features. Use the team to make the PDF-defined outpatient platform reliable, supportable, and sellable.
