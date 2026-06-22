# Version 2 Scope

## Product Position

Version 2 is the competitive expansion layer beyond the PDF's current Version 1 platform boundary.

The PDF explicitly excludes inpatient management, pharmacy inventory, insurance claims, medical device integration, telemedicine, and government health record integrations. Those exclusions are sensible for MVP and V1.0, but they become the strategic candidates for V2 once the outpatient SaaS core is stable.

V2 should not be a random feature expansion. It should focus on features that increase enterprise value, reduce clinic workload, improve patient engagement, and make the product competitive against established healthcare platforms.

## Classification Legend

- **Must Have Before Launch:** Required before marketing Version 2 as an enterprise-grade competitive platform.
- **Should Have Before Launch:** Strongly preferred for Version 2, but can ship in controlled markets or tiers.
- **Can Wait Until V1.1:** Near-term improvement that should happen before or alongside early V2 preparation.
- **Can Wait Until V2:** Explicit V2 candidate, not required for MVP or V1.0.
- **Nice To Have:** Differentiator or optional expansion after Version 2 fundamentals.

## Existing Module Classification For V2 Readiness

| Module | V2 Classification | V2 Boundary |
| --- | --- | --- |
| Auth | Must Have Before Launch | Add enterprise controls such as stronger session governance and optional SSO readiness. |
| RBAC | Must Have Before Launch | Add access reviews, break-glass policy, delegated access, and advanced scopes. |
| Users | Must Have Before Launch | Add staff productivity, profile completeness, access certification, and support ownership. |
| Clinics | Must Have Before Launch | Add enterprise tenant lifecycle, data export/offboarding, and account health. |
| Branches | Must Have Before Launch | Mature multi-location command center and cross-branch controls. |
| Settings | Must Have Before Launch | Feature gates, localization, policy configuration, and enterprise defaults. |
| Subscription Plans | Must Have Before Launch | Add tiered pricing, add-ons, usage meters, coupons, and annual contracts. |
| Clinic Subscriptions | Must Have Before Launch | Add dunning, upgrade/downgrade, self-service billing, and expansion signals. |
| Patients | Must Have Before Launch | Add portal identity, duplicate merge, family relationships, consent, and engagement state. |
| Patient Records | Must Have Before Launch | Add patient-facing summaries, data export, consent-aware sharing, and retention controls. |
| Doctor Schedules | Should Have Before Launch | Add smart availability, waitlist fill, recurring exceptions, and provider utilization insights. |
| Doctor Leaves | Should Have Before Launch | Add coverage suggestions and productivity analytics. |
| Appointments | Must Have Before Launch | Add self-scheduling, waitlist automation, no-show prediction, and recall campaigns. |
| Queue | Should Have Before Launch | Add patient ETA, remote check-in, queue optimization, and branch benchmarking. |
| Clinical | Must Have Before Launch | Add smart templates, care plans, clinical summaries, and task inbox. |
| Vitals | Should Have Before Launch | Add trend alerts, abnormal value flags, and patient-facing vitals history. |
| Prescriptions | Must Have Before Launch | Add e-prescribing path, refill requests, medication history, and safety checks. |
| Prescription Templates | Should Have Before Launch | Add specialty template marketplace and AI-assisted template suggestions. |
| Lab Tests | Should Have Before Launch | Add external lab catalog mapping and partner pricing. |
| Lab Orders | Should Have Before Launch | Add external lab routing, status sync, and patient notification. |
| Lab Order Items | Should Have Before Launch | Add item-level external provider tracking. |
| Lab Reports | Should Have Before Launch | Add abnormal result alerts, doctor review workflows, and patient portal publishing. |
| Billing | Must Have Before Launch | Add payment gateway, insurance pathway, dunning, revenue analytics, and reconciliation. |
| Storage | Must Have Before Launch | Add retention automation, malware scanning, legal hold, and patient-visible documents. |
| Notifications | Must Have Before Launch | Add campaigns, recalls, follow-ups, consent-aware messaging, and multichannel orchestration. |
| WhatsApp | Should Have Before Launch | Add inbox, campaigns, two-way workflows, and provider analytics. |
| WhatsApp Accounts | Should Have Before Launch | Add self-service onboarding and multi-number/multi-branch controls. |
| WhatsApp Messages | Should Have Before Launch | Add conversation view, analytics, and support workflows. |
| WhatsApp Templates | Should Have Before Launch | Add approval workflow, localization, A/B testing, and compliance review. |
| Audit Logs | Must Have Before Launch | Add access reviews, audit packages, retention, legal hold, and compliance exports. |
| Reports | Must Have Before Launch | Add advanced analytics, benchmarks, forecasting, cohort reports, and executive dashboards. |
| Jobs | Must Have Before Launch | Add scalable queue backend, priority queues, scheduler visibility, and replay tools. |
| Exports | Must Have Before Launch | Add large tenant exports, patient data packages, and compliance export sets. |
| Webhooks | Must Have Before Launch | Add public webhooks, replay, signing, developer docs, and marketplace support. |

## New V2 Module Candidates

| Module | Classification | Product Boundary |
| --- | --- | --- |
| Patient Portal | Must Have Before Launch | Patient login, profile, appointments, prescriptions, lab reports, payments, secure messages. |
| Patient Mobile App | Should Have Before Launch | Push notifications, self-scheduling, intake, lab/prescription access, payments. |
| Doctor Mobile App | Should Have Before Launch | Schedule, queue, chart review, notes, prescriptions, lab alerts. |
| Digital Intake And Consent | Must Have Before Launch | Forms, consent capture, pre-visit history, signature, storage. |
| Telemedicine | Can Wait Until V2 | Video/audio consultation, visit link, telehealth billing, consent. |
| Insurance Eligibility | Can Wait Until V2 | Coverage checks, payer data, patient responsibility estimation. |
| Insurance Claims | Can Wait Until V2 | Claims, remittance, denial tracking, prior authorization. |
| Pharmacy And eRx | Can Wait Until V2 | E-prescribing, medication history, refill requests, pharmacy routing. |
| Pharmacy Inventory | Nice To Have | Stock, procurement, reconciliation; only if target market demands it. |
| FHIR/HL7 Interoperability | Can Wait Until V2 | Patient/encounter/observation/document exchange. |
| Government EHR Integration | Nice To Have | Country-specific health exchanges and public registries. |
| Lab Network Integration | Can Wait Until V2 | External lab orders, result sync, catalog mapping. |
| Imaging/PACS Integration | Nice To Have | Imaging orders, report links, DICOM/PACS references. |
| AI Clinical Assistant | Should Have Before Launch | Scribe, note summary, template suggestions, safety reminders with clear guardrails. |
| AI Operations Assistant | Should Have Before Launch | No-show prediction, demand forecast, queue optimization, revenue leakage alerts. |
| Customer Success | Must Have Before Launch | Onboarding, health scores, training progress, NPS, renewal risk, CSM dashboard. |
| Integration Marketplace | Can Wait Until V2 | Provider directory, API keys, webhooks, partner onboarding. |
| Enterprise Compliance | Must Have Before Launch | Policy evidence, access reviews, retention, audit packages, breach workflow. |

## V2 Product Promise

Version 2 should be safe to sell as:

**An enterprise-ready healthcare SaaS platform with patient engagement, mobile workflows, advanced analytics, integrations, stronger compliance operations, and automation beyond the staff-only outpatient platform.**

## Features Causing Unnecessary V2 Complexity

- Inpatient management unless the company intentionally moves into hospitals.
- Pharmacy inventory unless customer demand is validated.
- Government integrations before target countries are selected.
- Medical device integration before hardware support capability exists.
- Open-ended workflow builders.
- Unreviewed clinical AI recommendations.
- Marketplace integrations without partner support capacity.

## Features To Postpone

- Inpatient bed/ward/admission/discharge.
- Full pharmacy procurement.
- Device/lab machine automation.
- Multi-country government integration.
- Advanced AI diagnosis support.
- Complex custom workflow designer.
- Multi-region active-active deployment unless enterprise deals require it.

## Features Likely To Create Support Burden

- Patient portal account recovery.
- Patient identity matching and duplicate merge.
- Insurance claims and denials.
- eRx/pharmacy provider onboarding.
- Telemedicine audio/video quality issues.
- WhatsApp campaign compliance.
- AI output complaints or disputes.
- Integration marketplace partner failures.
- Multi-location enterprise permissions.

## Features Likely To Create Scalability Issues

- Patient portal traffic spikes.
- Large exports and data portability requests.
- Realtime telemedicine.
- Campaign messaging.
- AI transcription and summarization workloads.
- Advanced analytics over large tenant data.
- Interoperability event volume.
- Public webhooks with retries and replay.

## Features Likely To Create Security Risks

- Patient portal authentication.
- Delegated family/caregiver access.
- Telemedicine sessions and recordings.
- eRx and insurance integrations.
- Public APIs and marketplace apps.
- AI processing of PHI.
- Cross-tenant benchmarking.
- Legal hold and tenant export.
- Mobile offline data.

## Launch Recommendation

Do not start V2 until V1.0 is stable, paid, monitored, and supportable.

V2 should be staged in this order:

1. Patient portal-lite and digital intake.
2. Mobile apps for patients and doctors.
3. Payment gateway and patient self-service billing.
4. Advanced analytics and clinic growth dashboards.
5. AI productivity features with safety guardrails.
6. Lab, pharmacy, insurance, and interoperability integrations.
7. Telemedicine and marketplace expansion.

## 90 Days And 5 Engineers

If 90 days and 5 engineers are available for V2 after V1.0:

1. Build patient portal-lite.
2. Add digital intake and consent.
3. Add payment gateway and patient payments.
4. Add doctor task inbox and productivity dashboard.
5. Add no-show/waitlist automation.
6. Add customer success dashboard and onboarding health.
7. Add advanced reports for revenue, retention, no-shows, and provider utilization.

Do not use the first V2 cycle for insurance claims, telemedicine, pharmacy inventory, or device integration. Those are larger operational bets and should follow only after the engagement and revenue features prove demand.
