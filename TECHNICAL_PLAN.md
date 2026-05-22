# Clinic Management System Technical Plan

## 0) Product Direction
- Build for **one clinic first** (simple operations, fast adoption).
- Keep data and API design **expansion-ready** for multi-clinic later.
- Avoid early complexity (no tenant resolver, no clinic switching UI in v1).

## 1) Architecture Strategy

### 1.1 V1 (Single Clinic)
- One clinic setup, one operational team.
- All users (doctor, receptionist, staff) belong to the same `clinicId`.
- Backend uses authenticated user's `clinicId` by default.
- Frontend does not ask staff to select clinic on each action.

### 1.2 Future V2 (Multi Clinic Expansion)
- Keep `clinicId` in business collections from day 1.
- Add optional clinic switcher in UI when a user has access to multiple clinics.
- Add tenant middleware only when needed.
- Keep API backward compatible by making clinic override optional.

### 1.3 Core Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Auth: JWT
- Notifications: WhatsApp/SMS integration layer
- Payments: Cash/UPI/Card (Razorpay optional for digital flows)

## 2) Roles (Single Clinic v1)
- Clinic Owner/Admin: full control.
- Doctor: consultation, diagnosis, prescription, tests, follow-up decisions.
- Receptionist/Staff: registration, appointments, payments, vitals, reports upload.
- Accountant (optional): daily/monthly finance reports.

## 3) Real Clinic Working Model

### 3.1 Daily Schedule
- Morning OPD: 9:30 AM to 11:00 AM
- Evening OPD: 6:00 PM to 8:30 PM
- Daytime hospital duty supported via urgent alert workflow.

### 3.2 End-to-End Visit Flow
1. Reception checks in patient and confirms payment status.
2. Registration/update (new or returning patient).
3. Vitals entry by receptionist/staff.
4. Doctor consultation with history + present complaint.
5. Examination notes + diagnosis.
6. Tests/procedures:
   - In-clinic (ECG, endoscopy, BP/sugar, nebulization, dressing).
   - External lab (CBC, LFT, TSH, lipid profile, etc).
7. Prescription generation (print + WhatsApp/PDF).
8. Billing finalization and payment collection.
9. Follow-up date and reminders.
10. Dashboard and daily analytics.

## 4) Module Design

### 4.1 Appointment and Queue
- Walk-in + scheduled booking.
- Token/queue visibility for receptionist and doctor.
- Urgent patient notification to doctor when outside OPD slot.

### 4.2 Patient and Visit Records
- Demographics + history + allergies + chronic conditions.
- Visit-wise notes and vitals snapshot.
- Report/document upload support.

### 4.3 Diagnostics (Dual Flow)
- **In-clinic diagnostics/procedures**
  - Order created by doctor.
  - Status lifecycle: ordered -> in_progress -> done.
  - Procedure fee directly billable.
- **External pathology tests**
  - Lab request slip generation.
  - Status lifecycle: ordered -> sent_to_lab -> report_received.
  - Report upload (PDF/image), doctor review, patient timeline update.

### 4.4 Prescription Module
- Medicine, dosage, frequency, duration, meal instructions.
- Advice and follow-up.
- PDF export with clinic branding.

### 4.5 Billing and Payments
- Consultation + procedure/test charges in one invoice.
- Partial and full payment support.
- Payment modes: cash, upi, card.
- Receipt and audit trail.

### 4.6 Notifications
- Follow-up reminders.
- Pending payment reminders.
- Doctor alert for urgent booking.

### 4.7 Reporting
- Daily patients, revenue, dues.
- In-clinic tests count vs external test count.
- Doctor utilization and common diagnosis patterns.

## 5) Data Model Rules (v1 with v2 readiness)
- Keep `clinicId` in all core collections.
- Enforce indexes with `clinicId` as leading field.
- Keep status enums explicit for billing, appointment, diagnostics.
- Preserve immutable event timestamps (`createdAt`, `updatedAt`, `paidAt`, `reportedAt`).

## 6) API Rules
- In v1, if `clinicId` is not sent by client, backend auto-fills from authenticated user context.
- In v2, allow optional clinic override for authorized multi-clinic users.
- Keep all write APIs role-protected.
- Use consistent error format: `{ message }` with HTTP status codes.

## 7) Security and Ops
- JWT short-lived access token.
- Password hashing with bcrypt.
- Centralized error handler.
- Input validation middleware for every write route.
- PII-safe logs and secure report storage.

## 8) Implementation Phases

### Phase A (Now): Single Clinic MVP Foundation
- Auth, user roles, patient registry, appointments, basic billing.
- Reception-first workflow with quick data entry.

### Phase B: Clinical Workflow Completion
- Visit notes, vitals, prescription PDF.
- Diagnostics dual flow (in-clinic + external).
- Report upload and follow-up reminders.

### Phase C: Operational Intelligence
- Daily/monthly finance dashboard.
- Procedure and external lab analytics.
- WhatsApp reminders and document links.

### Phase D: Multi Clinic Expansion (Later)
- Clinic switcher in frontend.
- Tenant middleware and scoped permissions.
- Cross-clinic reporting for owner group.

## 9) Multi Clinic Migration Checklist (Future)
1. Keep all v1 records clinic-scoped and index-ready.
2. Introduce user-clinic mapping table/collection.
3. Add active clinic context in JWT.
4. Enable UI clinic selector only for multi-clinic users.
5. Expand RBAC to clinic-specific permissions.
6. Roll out tenant middleware behind feature flag.
