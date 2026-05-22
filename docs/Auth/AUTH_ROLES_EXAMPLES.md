# Auth — Roles, Access Matrix & Examples

How each role signs in, what they can call, and copy-paste `curl` examples.

**Prerequisites:** Backend running (`npm run dev` in `backend/`), MongoDB up, env vars set (see [AUTH_DEVELOPER.md](./AUTH_DEVELOPER.md)).

**Diagrams:** [AUTH_SEQUENCE_DIAGRAMS.md](./AUTH_SEQUENCE_DIAGRAMS.md) — all flows as sequence diagrams.

**Base:** `http://localhost:8080/api/v1`

Use a cookie jar for browser-style auth:

```bash
# Windows PowerShell — use curl.exe and a jar file
curl.exe -c cookies.txt -b cookies.txt ...
```

---

## Role summary

| Role | Typical user | Gets clinic from | Main duties |
|------|----------------|------------------|-------------|
| `SUPER_ADMIN` | Platform operator | Their user record (may use a platform clinic id) | All clinics, subscriptions, revenue |
| `CLINIC_OWNER` | Clinic admin | Onboarding or signup | Full clinic ops, billing, schedules |
| `DOCTOR` | Physician | Onboarding default doctor or signup | Appointments, status updates |
| `STAFF` | Reception / billing | Signup | Schedules, book appointments, billing |

Legend: **✓** allowed · **✗** forbidden (403) · **—** public (no login)

---

## Access matrix (current routes)

### Auth

| Endpoint | SUPER_ADMIN | CLINIC_OWNER | DOCTOR | STAFF | Public |
|----------|:-----------:|:------------:|:------:|:-----:|:------:|
| `POST /auth/signup` | ✗ (blocked) | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/login` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/refresh` | ✓ | ✓ | ✓ | ✓ | cookie |
| `POST /auth/logout` | ✓ | ✓ | ✓ | ✓ | JWT |
| `GET /auth/me` | ✓ | ✓ | ✓ | ✓ | JWT |
| `GET /auth/admin-only` | ✓ | ✓ | ✗ | ✗ | JWT |

### Clinics

| Endpoint | SUPER_ADMIN | CLINIC_OWNER | DOCTOR | STAFF | Public |
|----------|:-----------:|:------------:|:------:|:-----:|:------:|
| `POST /clinics/onboard` | — | — | — | — | ✓ |
| `GET /clinics/:id/onboarding-status` | ✓ | ✓ | ✗ | ✓ | JWT |

### Appointments

| Endpoint | SUPER_ADMIN | CLINIC_OWNER | DOCTOR | STAFF |
|----------|:-----------:|:------------:|:------:|:-----:|
| `POST /appointments/schedules` | ✓ | ✓ | ✗ | ✓ |
| `POST /appointments/book` | ✓ | ✓ | ✓ | ✓ |
| `PATCH /appointments/:id/status` | ✓ | ✓ | ✓ | ✓ |

### Billing

| Endpoint | SUPER_ADMIN | CLINIC_OWNER | DOCTOR | STAFF |
|----------|:-----------:|:------------:|:------:|:-----:|
| `POST /billing` | ✓ | ✓ | ✗ | ✓ |
| `POST /billing/:id/payments` | ✓ | ✓ | ✗ | ✓ |
| `GET /billing/reports/daily` | ✓ | ✓ | ✗ | ✓ |
| `GET /billing/reports/monthly` | ✓ | ✓ | ✗ | ✓ |

### Admin (platform)

| Endpoint | SUPER_ADMIN | Others |
|----------|:-----------:|:------:|
| `GET /admin/clinics` | ✓ | ✗ |
| `GET /admin/clinics/:clinicId` | ✓ | ✗ |
| `PATCH /admin/clinics/:clinicId/status` | ✓ | ✗ |
| `GET /admin/revenue-overview` | ✓ | ✗ |

### Subscriptions

| Endpoint | SUPER_ADMIN | Others (JWT) |
|----------|:-----------:|:--------------:|
| `POST /subscriptions/admin/assign` | ✓ | ✗ |
| `POST /subscriptions/admin/razorpay/create` | ✓ | ✗ |
| `GET /subscriptions/clinic/:clinicId` | ✓* | ✓* |

\*Any authenticated user with a valid token can hit `getClinicSubscription`; enforce clinic ownership in UI until tightened server-side.

---

## End-to-end flow

See full diagrams in [AUTH_SEQUENCE_DIAGRAMS.md](./AUTH_SEQUENCE_DIAGRAMS.md) (sections 1–12). Quick summary:

1. `POST /clinics/onboard` → clinic + owner + doctor  
2. `POST /auth/login` → HttpOnly cookies  
3. `GET /auth/me` / protected APIs → `jwtAuth` + optional RBAC  
4. `POST /auth/refresh` when access expires  
5. `POST /auth/logout` → clear cookies + refresh hash  

---

## 1. Onboard a clinic (creates OWNER + DOCTOR)

Public — no auth.

```bash
curl.exe -X POST http://localhost:8080/api/v1/clinics/onboard ^
  -H "Content-Type: application/json" ^
  -d "{\"owner\":{\"fullName\":\"Dr Owner\",\"email\":\"owner@demo.clinic\",\"phone\":\"9000000001\",\"password\":\"OwnerPass123\"},\"clinic\":{\"name\":\"Demo Clinic\",\"code\":\"DEMO01\",\"contactPhone\":\"9000000000\",\"contactEmail\":\"contact@demo.clinic\",\"whatsappNumber\":\"9000000000\",\"address\":{\"line1\":\"Main St\",\"city\":\"Mumbai\",\"state\":\"MH\",\"pincode\":\"400001\"},\"timezone\":\"Asia/Kolkata\",\"specialties\":[\"General\"]},\"defaultDoctor\":{\"fullName\":\"Dr Default\",\"email\":\"doctor@demo.clinic\",\"phone\":\"9000000002\",\"registrationNumber\":\"REG123\",\"specialization\":\"General\",\"qualification\":\"MBBS\",\"consultationFee\":500},\"timings\":{\"timezone\":\"Asia/Kolkata\",\"weeklySchedule\":[{\"dayOfWeek\":1,\"isOpen\":true,\"slots\":[{\"start\":\"09:00\",\"end\":\"13:00\"}]}]}}"
```

Save from response:

- `clinic.id` → use as **`clinicId`** for login/signup
- `owner.email` / password you sent
- `defaultDoctor.email` → password is **auto-generated** (not returned); reset via DB or signup a new doctor

---

## 2. CLINIC_OWNER — login and admin smoke test

```bash
set CLINIC_ID=<paste clinic.id>

curl.exe -c cookies.txt -b cookies.txt -X POST http://localhost:8080/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"clinicId\":\"%CLINIC_ID%\",\"email\":\"owner@demo.clinic\",\"password\":\"OwnerPass123\"}"

curl.exe -b cookies.txt http://localhost:8080/api/v1/auth/me

curl.exe -b cookies.txt http://localhost:8080/api/v1/auth/admin-only
```

Expected: `admin-only` returns `200` with `"role":"CLINIC_OWNER"`.

Create billing (owner allowed):

```bash
curl.exe -b cookies.txt -X POST http://localhost:8080/api/v1/billing ^
  -H "Content-Type: application/json" ^
  -d "{\"patientId\":\"<patientObjectId>\",\"items\":[{\"description\":\"Consult\",\"amount\":500}],\"totalAmount\":500}"
```

(`patientId` must exist in DB for your environment.)

---

## 3. STAFF — signup and reception tasks

Signup (public):

```bash
curl.exe -c cookies-staff.txt -X POST http://localhost:8080/api/v1/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"clinicId\":\"%CLINIC_ID%\",\"fullName\":\"Reception Staff\",\"email\":\"staff@demo.clinic\",\"phone\":\"9000000003\",\"password\":\"StaffPass123\",\"role\":\"STAFF\",\"permissions\":[\"APPOINTMENT_MANAGE\",\"BILLING_MANAGE\"]}"

curl.exe -b cookies-staff.txt http://localhost:8080/api/v1/auth/me
```

Staff can book appointments; cannot access `/auth/admin-only`:

```bash
curl.exe -b cookies-staff.txt -X POST http://localhost:8080/api/v1/appointments/book ^
  -H "Content-Type: application/json" ^
  -d "{\"doctorId\":\"<doctorUserId>\",\"patientId\":\"<patientId>\",\"scheduledAt\":\"2026-05-22T10:00:00.000Z\"}"

curl.exe -b cookies-staff.txt http://localhost:8080/api/v1/auth/admin-only
```

Expected: `403 Forbidden`.

---

## 4. DOCTOR — signup or onboard user

If using onboarded doctor, set password in DB first, or signup:

```bash
curl.exe -c cookies-doctor.txt -X POST http://localhost:8080/api/v1/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"clinicId\":\"%CLINIC_ID%\",\"fullName\":\"Dr New\",\"email\":\"doctor2@demo.clinic\",\"phone\":\"9000000004\",\"password\":\"DoctorPass123\",\"role\":\"DOCTOR\",\"doctorProfile\":{\"registrationNumber\":\"REG456\",\"specialization\":\"Cardio\",\"qualification\":\"MD\",\"consultationFee\":800}}"

curl.exe -b cookies-doctor.txt -X POST http://localhost:8080/api/v1/appointments/book ^
  -H "Content-Type: application/json" ^
  -d "{\"doctorId\":\"<selfOrOtherDoctorId>\",\"patientId\":\"<patientId>\",\"scheduledAt\":\"2026-05-22T11:00:00.000Z\"}"
```

Doctor **cannot** create doctor schedules (staff/owner only):

```bash
curl.exe -b cookies-doctor.txt -X POST http://localhost:8080/api/v1/appointments/schedules ^
  -H "Content-Type: application/json" ^
  -d "{\"doctorId\":\"<doctorId>\",\"weeklySchedule\":[]}"
```

Expected: `403`.

Doctor **cannot** create billing:

```bash
curl.exe -b cookies-doctor.txt -X POST http://localhost:8080/api/v1/billing ^
  -H "Content-Type: application/json" ^
  -d "{\"patientId\":\"<patientId>\",\"items\":[],\"totalAmount\":0}"
```

Expected: `403`.

---

## 5. SUPER_ADMIN — seed and platform APIs

Cannot self-register via `/auth/signup`. Create once in MongoDB (replace clinic id with a real ObjectId, e.g. from onboard):

```javascript
// mongosh
use doctor_system_prod

db.users.insertOne({
  clinicId: ObjectId("YOUR_CLINIC_OR_PLATFORM_CLINIC_ID"),
  fullName: "Platform Admin",
  email: "superadmin@platform.local",
  phone: "9000000099",
  passwordHash: "<bcrypt hash of your password>",
  role: "SUPER_ADMIN",
  permissions: ["PLATFORM_MANAGE"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Generate bcrypt hash:

```bash
node -e "const b=require('bcryptjs');b.hash('SuperAdmin123',12).then(console.log)"
```

Login:

```bash
curl.exe -c cookies-sa.txt -X POST http://localhost:8080/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"clinicId\":\"%CLINIC_ID%\",\"email\":\"superadmin@platform.local\",\"password\":\"SuperAdmin123\"}"

curl.exe -b cookies-sa.txt http://localhost:8080/api/v1/admin/clinics

curl.exe -b cookies-sa.txt -X POST http://localhost:8080/api/v1/subscriptions/admin/assign ^
  -H "Content-Type: application/json" ^
  -d "{\"clinicId\":\"%CLINIC_ID%\",\"planCode\":\"BASIC\",\"status\":\"active\"}"
```

Signup as super admin (should fail):

```bash
curl.exe -X POST http://localhost:8080/api/v1/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"clinicId\":\"%CLINIC_ID%\",\"fullName\":\"Bad\",\"email\":\"bad@x.com\",\"phone\":\"9000000005\",\"password\":\"BadPass123\",\"role\":\"SUPER_ADMIN\"}"
```

Expected: `403` — `Cannot register with this role`.

---

## 6. Bearer token (mobile / Postman)

After login, copy `access_token` from Set-Cookie or issue via service in dev.

```bash
curl.exe -H "Authorization: Bearer <access_token>" http://localhost:8080/api/v1/auth/me
```

No cookie jar needed when using Bearer.

---

## 7. Refresh and logout

```bash
curl.exe -c cookies.txt -b cookies.txt -X POST http://localhost:8080/api/v1/auth/refresh

curl.exe -b cookies.txt -X POST http://localhost:8080/api/v1/auth/logout
```

After logout, `GET /auth/me` → `401`.

---

## Default permissions (onboarding)

| User | role | permissions (examples) |
|------|------|---------------------------|
| Owner | `CLINIC_OWNER` | `CLINIC_MANAGE`, `USER_MANAGE`, `APPOINTMENT_MANAGE`, `BILLING_MANAGE` |
| Default doctor | `DOCTOR` | `APPOINTMENT_READ`, `PATIENT_READ`, `PRESCRIPTION_MANAGE`, `VISIT_MANAGE` |

Custom permissions on signup are stored but **not** enforced on routes yet — use roles for access control today.

---

## Quick troubleshooting

| Symptom | Check |
|---------|--------|
| Cookies not sent | `credentials: 'include'`, same-site, CORS origin |
| 401 on protected route | Login again; call `/auth/refresh` |
| 403 on route | Role matrix above; wrong `clinicId` on login |
| 409 on signup | Email already exists for that clinic |
| SUPER_ADMIN signup fails | By design — use DB seed |

See [AUTH_DEVELOPER.md](./AUTH_DEVELOPER.md) for architecture and extending guards.
