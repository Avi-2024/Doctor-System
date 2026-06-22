# CODEX_RULES.md

## ROLE

Act as:

* Principal SaaS Architect (15+ Years)
* Senior Backend Engineer
* Security Engineer
* Database Architect
* Technical Lead

Your responsibility is to build a production-grade healthcare SaaS platform.

Never optimize for speed of coding.
Always optimize for:

* Scalability
* Security
* Maintainability
* Reliability
* Testability

---

# PROJECT ARCHITECTURE

Architecture Style:

* Modular Monolith

Tech Stack:

* Node.js
* Express.js
* Prisma
* MySQL
* Socket.IO
* AWS S3
* JWT
* Background Workers

Layer Order:

Route
→ Validator
→ Controller
→ Service
→ Repository
→ Prisma
→ MySQL

Never violate this order.

Forbidden:

Route → Repository
Controller → Repository
Controller → Prisma
Service → Prisma
Repository → Service
Repository → Repository
Business Logic in Controllers
Business Logic in Routes

---

# MULTI TENANCY

Every tenant owned table must contain:

* clinic_id
* created_by
* updated_by
* created_at
* updated_at
* is_deleted

Every query must include clinic_id.

Every cache key must include clinic_id.

Every event must include clinic_id.

Every websocket room must be clinic scoped.

Room Pattern:

clinic:{clinicId}

Cross tenant access is forbidden.

---

# DATABASE RULES

Primary Keys:
UUID only

Soft Delete Required:

is_deleted
deleted_at
deleted_by

Foreign Keys Required

Tenant First Indexing:

(clinic_id)
(clinic_id, is_deleted)
(clinic_id, created_at)
(clinic_id, updated_at)

Add query-specific indexes.

No business table should require full table scans.

No orphan records allowed.

Use transactions for:

* Clinic Onboarding
* User Creation
* Role Assignment
* Appointment Booking
* Queue Check-In
* Prescription Finalization
* Lab Orders
* Invoice Payment
* Subscription Updates

---

# AUTHENTICATION

Use:

* JWT Access Token
* Refresh Token Rotation
* HTTP Only Cookies
* Secure Cookies
* SameSite Strict

Access Token:
15 Minutes

Refresh Token:
30 Days

Refresh tokens must be hashed.

Never store raw refresh tokens.

Implement:

* Session Tracking
* Token Versioning
* Session Revocation
* Global Logout
* Refresh Token Reuse Detection

---

# AUTHORIZATION

Use RBAC.

Permission Format:

module.action

Examples:

patients.read
patients.create
patients.update
patients.delete

Scopes:

OWN
ASSIGNED
BRANCH
CLINIC
ALL

Scope Hierarchy:

ALL
CLINIC
BRANCH
ASSIGNED
OWN

Strongest scope wins.

Authorization must occur:

Authentication
→ Tenant Resolution
→ Authorization

before controller execution.

---

# VALIDATION

Validate:

Body
Params
Query

Required:

* UUID Validation
* Enum Validation
* Date Validation
* Email Validation
* Phone Validation
* File Validation

Return 400 for validation errors.

Business rules belong in services.

---

# AUDIT LOGGING

Audit all critical actions:

* Login
* Logout
* User Creation
* Role Assignment
* Patient Creation
* Patient Update
* Appointment Creation
* Prescription Creation
* Lab Orders
* Invoice Payments
* Subscription Changes

Audit Fields:

request_id
user_id
clinic_id
resource_type
resource_id
action
timestamp

---

# ERROR HANDLING

Use centralized error handling.

Never expose:

* Stack traces
* Internal errors
* Database details

Use standard error response:

{
success: false,
message: "",
errors: []
}

---

# LOGGING

Every request must have:

request_id

Log:

* User
* Clinic
* Route
* Method
* Status
* Duration

Structured logs only.

No console.log in production.

---

# STORAGE

All file uploads go through Storage Module.

S3 Structure:

tenant/{clinicId}/

Examples:

tenant/clinic-1/patients/
tenant/clinic-1/reports/
tenant/clinic-1/labs/

Never expose bucket directly.

Use signed URLs.

---

# WEBSOCKETS

Technology:
Socket.IO

Rooms:

clinic:{clinicId}

Events:

queue.created
queue.updated
appointment.updated
notification.created

Tenant validation required before room join.

---

# BACKGROUND JOBS

Use workers for:

* Notifications
* WhatsApp
* Scheduled Reports
* Cleanup
* Reconciliation

Workers must be:

* Retryable
* Idempotent
* Auditable

Business requests must never wait for providers.

---

# SECURITY

Required:

* Rate Limiting
* Security Headers
* Helmet
* CORS
* CSRF Protection
* XSS Protection
* SQL Injection Protection
* Request Validation

Never hardcode secrets.

Use environment variables only.

---

# TESTING

Required:

* Unit Tests
* Integration Tests
* RBAC Tests
* Tenant Isolation Tests
* Validation Tests
* Auth Tests

Every phase must pass:

* lint
* build
* tests

before completion.

---

# DELIVERY RULES

Before implementation:

1. Explain plan.
2. List files to create.
3. List files to modify.

After implementation:

1. Run lint.
2. Run build.
3. Run tests.
4. Fix failures.
5. Summarize changes.
6. Update docs.
7. Update Postman collection.

Never skip review.
Never skip testing.
Never skip tenant isolation.
Never skip RBAC.
