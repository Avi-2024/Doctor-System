# Auth — Developer Guide

Technical reference for JWT auth, cookies, RBAC, and tenant scoping in Doctor-System backend.

**Base URL:** `http://localhost:8080/api/v1` (see `PORT` in `.env`)

**Related docs:**

- [AUTH_SEQUENCE_DIAGRAMS.md](./AUTH_SEQUENCE_DIAGRAMS.md) — Mermaid sequence diagrams (all auth modes)
- [AUTH_ROLES_EXAMPLES.md](./AUTH_ROLES_EXAMPLES.md) — curl examples per role and access matrix

---

## Overview

| Piece | Location |
|-------|----------|
| Roles constant | `backend/src/utils/constants/roles.js` |
| Auth service | `backend/src/services/auth/auth.service.js` |
| Auth controller + cookies | `backend/src/controllers/auth/auth.controller.js` |
| JWT middleware | `backend/src/middleware/auth/jwtAuth.middleware.js` |
| Role guard | `backend/src/middleware/rbac/roleGuard.middleware.js` |
| Super admin guard | `backend/src/middleware/auth/superAdmin.middleware.js` |
| Clinic tenant injection | `backend/src/middleware/tenant/clinicScope.middleware.js` |
| User model | `backend/src/models/User.model.js` |
| JWT config | `backend/src/config/jwt.config.js` |

---

## Roles

| Role | Scope | Self signup |
|------|--------|-------------|
| `SUPER_ADMIN` | Platform (all clinics via admin APIs) | **No** — DB seed / manual create only |
| `CLINIC_OWNER` | One clinic | Yes (`POST /auth/signup`) or clinic onboard |
| `DOCTOR` | One clinic | Yes (`POST /auth/signup`) or onboard default doctor |
| `STAFF` | One clinic | Yes (`POST /auth/signup`) |

`permissions` on `User` is an optional string array (fine-grained flags). Route protection today uses **role** (`allowRoles` / `requireSuperAdmin`), not per-permission checks yet.

---

## Token model

- **Access token** — short-lived JWT (`JWT_ACCESS_EXPIRES_IN`, default `15m`).
- **Refresh token** — long-lived JWT (`JWT_REFRESH_EXPIRES_IN`, default `7d`).
- **Storage** — HttpOnly cookies `access_token` and `refresh_token` (browser). API/mobile may send `Authorization: Bearer <access_token>` instead.
- **Refresh rotation** — each login/refresh stores `sha256(refreshToken)` on the user. Reuse of an old refresh token clears the hash and forces re-login.

JWT payload (`sub`, `clinicId`, `role`, `email`) is built in `auth.service.js` → `buildTokenPayload`.

---

## Auth endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/auth/signup` | Public | Sets cookies; blocks `SUPER_ADMIN` |
| `POST` | `/auth/login` | Public | Requires `clinicId` + email + password |
| `POST` | `/auth/refresh` | Cookie `refresh_token` | No access JWT required |
| `POST` | `/auth/logout` | Access JWT | Clears refresh hash + cookies |
| `GET` | `/auth/me` | Access JWT | Returns full `req.user` document |
| `GET` | `/auth/admin-only` | JWT + `SUPER_ADMIN` or `CLINIC_OWNER` | Smoke test for RBAC |

### Login / signup body

```json
{
  "clinicId": "<ObjectId>",
  "email": "user@clinic.com",
  "password": "min8chars",
  "fullName": "Name",
  "phone": "9876543210",
  "role": "STAFF"
}
```

Signup also accepts optional `doctorProfile` (for `DOCTOR`) and `permissions` (string array).

### Response shape

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "clinicId": "...",
      "fullName": "...",
      "email": "...",
      "phone": "...",
      "role": "STAFF",
      "isActive": true
    }
  }
}
```

Tokens are **not** in JSON; they are set as HttpOnly cookies.

---

## Request pipeline (protected routes)

```
Request
  → cookieParser / CORS (credentials: true)
  → jwtAuth          → req.auth { userId, clinicId, role, email }, req.user
  → injectClinicFromAuth (optional) → forces req.body/query.clinicId from token
  → allowRoles(...) or requireSuperAdmin
  → controller
```

### `req.auth` (set by `jwtAuth`)

Use this in controllers/services for actor and tenant:

```js
req.auth.userId
req.auth.clinicId
req.auth.role
req.auth.email
```

### `injectClinicFromAuth`

On `POST`/`PUT`/`PATCH`/`DELETE`, sets `req.body.clinicId` if missing. On all methods, sets `req.query.clinicId` if missing. Prevents cross-clinic writes when the client omits `clinicId`.

---

## Guards

### `jwtAuth`

1. Read `access_token` cookie, else `Authorization: Bearer`.
2. Verify JWT with `JWT_ACCESS_SECRET`.
3. Load user from DB; reject if missing or `isActive === false`.

### `allowRoles(...roles)`

Returns 401 if no `req.auth.role`, 403 if role not in list.

```js
allowRoles(ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.STAFF)
```

### `requireSuperAdmin`

Strict check: `req.auth.role === SUPER_ADMIN`. Used for `/admin/*` and subscription admin routes.

---

## Environment variables

```env
JWT_ACCESS_SECRET=<required>
JWT_REFRESH_SECRET=<required>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production   # secure cookies, SameSite=strict
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Frontend integration

1. `fetch` / axios: `credentials: 'include'`.
2. CORS origin must be listed in `CORS_ALLOWED_ORIGINS`.
3. On `401` + expired access: `POST /api/v1/auth/refresh` (sends `refresh_token` cookie), then retry.
4. On refresh failure: redirect to login.

Vite dev default: `http://localhost:5173` — already allowed in `app.js` when env is unset.

---

## Creating users

| Flow | How |
|------|-----|
| New clinic | `POST /clinics/onboard` — creates `CLINIC_OWNER` + `DOCTOR` (no public signup) |
| Staff / extra doctors | `POST /auth/signup` with existing `clinicId` |
| Super admin | Insert in MongoDB (see roles examples doc) |

---

## Adding a protected route

```js
const { jwtAuth } = require('../../middleware/auth/jwtAuth.middleware');
const { injectClinicFromAuth } = require('../../middleware/tenant/clinicScope.middleware');
const { allowRoles } = require('../../middleware/rbac/roleGuard.middleware');
const { ROLES } = require('../../utils/constants/roles');

router.post(
  '/my-action',
  jwtAuth,
  injectClinicFromAuth,
  allowRoles(ROLES.CLINIC_OWNER, ROLES.STAFF),
  myController.action
);
```

Platform-only:

```js
router.use(jwtAuth, requireSuperAdmin);
```

---

## Security notes

- Passwords: bcrypt, 12 rounds.
- `SUPER_ADMIN` cannot use public signup.
- Refresh token reuse invalidates stored refresh hash.
- Production cookies: `httpOnly`, `secure`, `sameSite: 'strict'`.
- Do not commit `.env` secrets.

---

## Errors (auth)

| Status | Typical cause |
|--------|----------------|
| 400 | Validation (missing `clinicId`, weak password, invalid role) |
| 401 | Missing/expired/invalid token, bad login, refresh failure |
| 403 | Inactive user, blocked role signup, wrong role for route |
| 409 | Email already used in clinic |

Global handler: `backend/src/middleware/error/errorHandler.middleware.js`.
