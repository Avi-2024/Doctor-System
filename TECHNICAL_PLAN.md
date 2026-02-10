# Multi-Doctor, Multi-Clinic SaaS Clinic Management System — Technical Plan

## 1) Complete System Architecture

### 1.1 Architectural Style
- **Model**: Multi-tenant SaaS with strict tenant isolation at application and database query layers.
- **Pattern**: Modular monolith (Phase 1–2) with clean domain boundaries, evolving to selective microservices (Phase 3+) for high-throughput modules (notifications, analytics, integrations).
- **Tenancy model**:
  - Primary: **Shared database, shared collections, tenant-scoped documents** using `tenantId` in every business collection.
  - Optional enterprise mode: **Dedicated database per tenant** for high-value clinics (same codebase, database resolver by tenant).
- **Isolation controls**:
  - Mandatory `tenantId` + index enforcement on all tenant-owned entities.
  - Backend middleware injects tenant context from JWT and request domain.
  - Repository layer denies unscoped queries (guardrail).

### 1.2 High-Level Components
- **Frontend (React.js SPA)**
  - Role-aware dashboard and workflows.
  - Token-based auth, refresh flow, clinic switcher (for users mapped to multiple clinics).
  - Appointment booking UX and WhatsApp-triggered workflows.
- **Backend API (Node.js + Express)**
  - REST APIs grouped by domain modules.
  - JWT authentication + RBAC + optional ABAC rules.
  - Tenant middleware and audit middleware.
- **MongoDB**
  - Core transactional collections (patients, appointments, bills, prescriptions).
  - Time-series / summary collections for analytics and reports.
- **Async Processing Layer**
  - Job queue (e.g., BullMQ + Redis) for WhatsApp sends, reminders, report generation, and webhooks.
- **Integrations Layer**
  - WhatsApp Business API adapter service.
  - Razorpay adapter for subscription lifecycle (future phase).
- **Observability & Platform**
  - Central logs, metrics, trace IDs per request.
  - Backup, retention, and disaster recovery procedures.

### 1.3 Request & Data Flow
1. User logs in → JWT includes `userId`, `tenantId`, `roles`, `clinicIds`.
2. React app calls Express API with bearer token.
3. Auth middleware verifies token; tenant middleware resolves active clinic/tenant.
4. RBAC middleware checks permission matrix.
5. Domain service processes request; repository ensures tenant-scoped query.
6. For async events (reminders/notifications), service enqueues job.
7. Worker sends WhatsApp via API provider and stores delivery status.
8. Audit trail captures actor, action, entity, and diff metadata.

### 1.4 Core Data Domains (MongoDB)
- **Tenant & Org**: Tenant, Clinic, SubscriptionPlan, FeatureFlags.
- **Identity**: User, Role, UserClinicMapping, Session/RefreshToken.
- **Clinical**: Patient, Encounter, Prescription, ClinicalNotes, Attachments.
- **Scheduling**: DoctorProfile, AvailabilitySlot, Appointment, Waitlist, BlockedSlots.
- **Billing**: Invoice, Payment, Receipt, TaxProfile, Refund.
- **Communication**: MessageTemplate, NotificationLog, ReminderSchedule, WhatsAppConversationRef.
- **Reporting**: DailyClinicStats, RevenueSummary, NoShowMetrics.
- **Audit & Compliance**: AuditLog, ConsentRecord, DataAccessLog.

### 1.5 Multi-Doctor Time Model
- Doctor calendar supports **multiple practice contexts**:
  - Clinic OPD schedules (recurring + overrides).
  - Hospital rounds/visits (separate schedule type).
  - Leave, blocks, and emergency unavailability.
- Appointment engine checks:
  - Conflict detection across clinic and hospital slots.
  - Buffer times, capacity rules, and overbooking policy per clinic.

### 1.6 WhatsApp Booking Architecture
- Patient initiates on WhatsApp number.
- Webhook receiver validates signature and normalizes messages.
- Conversation state machine handles:
  - language selection,
  - patient identification (mobile + OTP if required),
  - clinic and doctor selection,
  - slot selection,
  - booking confirmation.
- Booking confirmation writes Appointment + sends template message.
- Failed flows route to staff-assisted callback queue.

### 1.7 Security, Compliance, and Governance
- JWT access token (short TTL) + refresh token rotation.
- Password hashing (Argon2/bcrypt), optional 2FA for admins.
- RBAC for module/action control; sensitive actions need elevated scopes.
- Data encryption in transit (TLS) and at rest.
- PII masking in logs; secure file upload scanning.
- Audit logs immutable by business users.
- Backups with tenant-aware restore strategy.

### 1.8 Performance & Scalability
- Mongo indexes: compound indexes with `tenantId` first.
- Caching: doctor availability snapshots, config, templates.
- Queue-based retries and dead-letter handling for external APIs.
- Horizontal scaling of API and workers.
- Read-heavy reporting via pre-aggregated collections.

### 1.9 Deployment Topology
- Environments: Dev, Staging, Production.
- Containerized services behind API gateway/load balancer.
- CI/CD pipeline with lint, test, security scan, migration checks.
- Secret management for JWT keys, DB creds, WhatsApp/Razorpay keys.

---

## 2) User Roles (RBAC Model)

### 2.1 Platform-Level Roles (SaaS Operator)
- **Super Admin (Platform)**
  - Manages all tenants, plans, feature flags, support impersonation, and platform analytics.
- **Support/Ops**
  - Limited troubleshooting access with audit-tracked, time-bound elevation.

### 2.2 Tenant/Clinic Roles
- **Clinic Owner / Tenant Admin**
  - Full control of clinic settings, users, permissions, billing config, reports.
- **Clinic Manager**
  - Operational management: doctor schedules, appointment policies, staff oversight.
- **Doctor**
  - Sees assigned patients/appointments, creates prescriptions, clinical notes.
- **Receptionist / Front Desk**
  - Registers patients, books/reschedules appointments, billing initiation.
- **Billing Staff**
  - Invoices, payments, refunds, reconciliation, financial reports.
- **Nurse / Assistant**
  - Vitals capture, visit prep, follow-up workflow updates.
- **Pharmacist (Optional)**
  - Prescription dispense status and medication inventory linkage (if enabled).
- **Patient (Portal/WhatsApp Context)**
  - Self-booking, appointment status, prescription and bill access (permissioned).

### 2.3 Authorization Principles
- Role + clinic mapping (a user can belong to multiple clinics with different roles).
- Fine-grained permissions by module/action (create/read/update/delete/approve/export).
- Doctor-level patient visibility constraints where required.

---

## 3) Main Modules

### 3.1 Tenant & Clinic Management
- Tenant onboarding, clinic profile, branding, settings, holidays, feature flags.

### 3.2 Identity, Auth, and Access Control
- Login, JWT/refresh, password reset, MFA (future), user-role-clinic mapping.

### 3.3 Patient Management (EMR-lite)
- Patient demographics, history, documents, consent, tags.
- Unified patient profile per clinic; duplicate detection.

### 3.4 Doctor & Schedule Management
- Doctor profiles, specialties, clinic/hospital schedules.
- Slot generation, block management, leave handling.

### 3.5 Appointment Management
- Create/reschedule/cancel/no-show flows.
- Queue management, token system, reminder automation.

### 3.6 Clinical Documentation & Prescription
- Encounter notes, diagnosis, prescribed medicines, follow-up advice.
- Printable/shareable prescription formats.

### 3.7 Billing & Payments
- Service catalog, invoices, discounts, taxes, receipts.
- Payment mode capture; Razorpay subscription integration in later phase.

### 3.8 WhatsApp Communication Module
- Template management, reminders, confirmations, conversational booking.
- Delivery/read tracking and fallback escalation.

### 3.9 Reporting & Analytics
- Appointment funnel, doctor utilization, revenue, outstanding dues, no-show rates.
- Export (CSV/PDF) and scheduled report delivery.

### 3.10 Notifications & Workflow Automation
- Rules engine for reminders, follow-ups, birthday/recall campaigns.
- Multi-channel extensibility (SMS/email future).

### 3.11 Audit, Compliance, and Admin Tools
- Audit trail explorer, access logs, soft-delete policy, data retention controls.

---

## 4) Development Phases

### Phase 0 — Discovery & Foundation (2–3 weeks)
- Finalize domain model, RBAC matrix, tenancy strategy, compliance checklist.
- Define API standards, error model, coding conventions.
- Set up repositories, CI/CD, environment configs, observability baseline.

### Phase 1 — Core MVP (8–10 weeks)
- Multi-tenant auth + clinic/user management.
- Patient registry, doctor schedules (clinic + hospital), appointment module.
- Basic prescription and billing.
- WhatsApp notifications (reminder/confirmation templates, non-conversational).
- Essential dashboards and audit logs.

### Phase 2 — Smart Operations (6–8 weeks)
- WhatsApp conversational booking with webhook orchestration.
- Advanced slot engine (conflict resolution, buffer, overbooking policy).
- Reporting suite (revenue, utilization, no-show, conversion).
- Operational automation (follow-up reminders, pending payment nudges).

### Phase 3 — SaaS Maturity (6–8 weeks)
- Subscription lifecycle with Razorpay (tenant billing, plan limits, grace periods).
- Feature flags per plan, usage metering, tenant self-serve upgrades.
- Enhanced security (2FA, session controls, anomaly alerts).

### Phase 4 — Scale & Ecosystem (ongoing)
- Performance optimization, sharding/read replicas as required.
- Optional microservice extraction (notifications, analytics, integration adapters).
- Marketplace integrations (labs, pharmacies, insurers) and public APIs.

### Cross-Phase Non-Functional Deliverables
- Automated tests: unit, integration, API contract, and critical E2E flows.
- Security testing: dependency scan, SAST, penetration testing before major releases.
- Release governance: staging sign-off, rollback playbooks, incident SOP.
