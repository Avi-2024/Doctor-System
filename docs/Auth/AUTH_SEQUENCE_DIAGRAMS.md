# Auth — Sequence Diagrams (All Modes)

Mermaid diagrams for every auth flow in Doctor-System. Render in GitHub, VS Code (Mermaid preview), or [mermaid.live](https://mermaid.live).

**Related:** [AUTH_DEVELOPER.md](./AUTH_DEVELOPER.md) · [AUTH_ROLES_EXAMPLES.md](./AUTH_ROLES_EXAMPLES.md)

---

## Index

| # | Mode | Endpoint / path |
|---|------|-----------------|
| 1 | [Clinic onboard](#1-clinic-onboard-creates-owner--doctor) | `POST /clinics/onboard` |
| 2 | [Signup](#2-signup-public) | `POST /auth/signup` |
| 3 | [Login](#3-login-public) | `POST /auth/login` |
| 4 | [Refresh tokens](#4-refresh-token-rotation) | `POST /auth/refresh` |
| 5 | [Logout](#5-logout) | `POST /auth/logout` |
| 6 | [Current user](#6-get-me) | `GET /auth/me` |
| 7 | [Bearer token](#7-protected-route--bearer-header) | Any `jwtAuth` route |
| 8 | [Protected + RBAC](#8-protected-route--cookie--rbac--tenant) | e.g. billing, appointments |
| 9 | [Super admin](#9-super-admin-platform-routes) | `/admin/*`, subscription admin |
| 10 | [RBAC deny](#10-rbac-forbidden-wrong-role) | 403 path |
| 11 | [Signup blocked](#11-signup-blocked-super_admin) | `SUPER_ADMIN` on signup |
| 12 | [Overview](#12-all-modes-overview) | All modes on one diagram |

---

## 1. Clinic onboard (creates OWNER + DOCTOR)

Public. No JWT. Creates clinic and two users with hashed passwords.

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant API as Clinic API
  participant S as clinicOnboarding.service
  participant DB as MongoDB

  C->>API: POST /clinics/onboard (owner, clinic, doctor, timings)
  API->>S: createClinicOnboarding()
  S->>DB: Transaction: Clinic, User(OWNER), User(DOCTOR), ClinicTiming
  DB-->>S: clinicId, owner, defaultDoctor
  S-->>API: result
  API-->>C: 201 { clinic, owner, defaultDoctor }

  Note over C: Owner logs in next with clinic.id + owner.email
```

---

## 2. Signup (public)

Allowed roles: `CLINIC_OWNER`, `DOCTOR`, `STAFF`. `SUPER_ADMIN` → 403.

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant API as auth.controller
  participant S as auth.service
  participant DB as MongoDB

  C->>API: POST /auth/signup { clinicId, email, password, role, ... }
  API->>API: validateSignupPayload()
  alt validation fails
    API-->>C: 400 { message }
  end
  API->>S: signup(payload)
  alt role is SUPER_ADMIN
    S-->>API: 403 Cannot register with this role
    API-->>C: 403
  else email exists for clinic
    S-->>API: 409
    API-->>C: 409
  else ok
    S->>DB: bcrypt hash + User.create()
    S->>S: issueTokens() — access + refresh JWT
    S->>DB: save refreshTokenHash, lastLoginAt
    S-->>API: { user, tokens }
    API->>C: Set-Cookie access_token, refresh_token
    API-->>C: 201 { user } (no tokens in body)
  end
```

---

## 3. Login (public)

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant API as auth.controller
  participant S as auth.service
  participant DB as MongoDB

  C->>API: POST /auth/login { clinicId, email, password }
  API->>API: validateLoginPayload()
  alt invalid body
    API-->>C: 400
  end
  API->>S: login({ clinicId, email, password })
  S->>DB: User.findOne(clinicId + email)
  alt user not found or bad password
    S-->>API: 401 Invalid credentials
    API-->>C: 401
  else user inactive
    S-->>API: 403
    API-->>C: 403
  else ok
    S->>S: bcrypt.compare()
    S->>S: issueTokens()
    S->>DB: refreshTokenHash + lastLoginAt
    S-->>API: { user, tokens }
    API->>C: Set-Cookie access_token, refresh_token
    API-->>C: 200 { user }
  end
```

---

## 4. Refresh token (rotation)

Uses `refresh_token` cookie only. No access JWT required.

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant API as auth.controller
  participant S as auth.service
  participant DB as MongoDB

  C->>API: POST /auth/refresh (Cookie: refresh_token)
  alt no cookie
    API-->>C: 401 No refresh token provided
  end
  API->>S: refresh(token)
  S->>S: jwt.verify(REFRESH_SECRET)
  alt invalid/expired JWT
    S-->>API: 401
    API-->>C: 401
  end
  S->>DB: User.findById + refreshTokenHash
  alt user missing or inactive
    S-->>API: 401
    API-->>C: 401
  else hash mismatch (reuse / theft)
    S->>DB: clear refreshTokenHash
    S-->>API: 401 reuse detected
    API-->>C: 401 Please log in again
  else valid
    S->>S: issueTokens() — new pair
    S->>DB: new refreshTokenHash
    S-->>API: { user, tokens }
    API->>C: Set-Cookie access_token, refresh_token
    API-->>C: 200 { user }
  end
```

---

## 5. Logout

Requires valid access token (cookie or Bearer).

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant MW as jwtAuth
  participant API as auth.controller
  participant S as auth.service
  participant DB as MongoDB

  C->>MW: POST /auth/logout (access_token)
  alt no/invalid token
    MW-->>C: 401
  end
  MW->>MW: verify JWT, load user
  MW->>API: req.auth.userId
  API->>S: logout(userId)
  S->>DB: refreshTokenHash = null
  API->>C: Clear-Cookie access_token, refresh_token
  API-->>C: 200 Logged out
```

---

## 6. GET /me

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant MW as jwtAuth
  participant API as auth.controller
  participant DB as MongoDB

  C->>MW: GET /auth/me (access_token)
  alt missing token
    MW-->>C: 401 Authentication required
  else expired/invalid
    MW-->>C: 401 Token expired / Invalid token
  end
  MW->>DB: User.findById(decoded.sub)
  alt inactive user
    MW-->>C: 403 User account is inactive
  end
  MW->>MW: req.auth, req.user
  MW->>API: next()
  API-->>C: 200 { user: req.user }
```

---

## 7. Protected route — Bearer header

Same as cookie path; token from `Authorization: Bearer`.

```mermaid
sequenceDiagram
  autonumber
  participant C as Mobile/API Client
  participant MW as jwtAuth
  participant H as Route Handler
  participant DB as MongoDB

  C->>MW: Request + Authorization: Bearer accessToken
  MW->>MW: extractToken() — no cookie, use header
  MW->>MW: jwt.verify(ACCESS_SECRET)
  MW->>DB: load user, check isActive
  MW->>MW: req.auth = { userId, clinicId, role, email }
  MW->>H: next()
  H-->>C: 200 business response
```

---

## 8. Protected route — cookie + RBAC + tenant

Typical pattern: `jwtAuth` → `injectClinicFromAuth` → `allowRoles` → controller.

Example: `POST /billing` for `CLINIC_OWNER` or `STAFF`.

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant J as jwtAuth
  participant T as injectClinicFromAuth
  participant R as allowRoles
  participant Ctrl as Controller
  participant DB as MongoDB

  C->>J: POST /billing (cookies + body)
  J->>J: verify access_token, set req.auth
  J->>T: next()
  T->>T: req.body.clinicId = req.auth.clinicId (if missing)
  T->>R: next()
  alt role not in allow list
    R-->>C: 403 Forbidden insufficient role
  end
  R->>Ctrl: next()
  Ctrl->>DB: scoped by clinicId
  DB-->>Ctrl: data
  Ctrl-->>C: 200/201 { success, data }
```

---

## 9. Super admin (platform routes)

`/admin/*` and `POST /subscriptions/admin/*` use `jwtAuth` + `requireSuperAdmin`.

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant J as jwtAuth
  participant SA as requireSuperAdmin
  participant Ctrl as admin.controller
  participant DB as MongoDB

  C->>J: GET /admin/clinics (access_token)
  J->>J: req.auth.role from DB user
  J->>SA: next()
  alt role !== SUPER_ADMIN
    SA-->>C: 403 SUPER_ADMIN access required
  end
  SA->>Ctrl: next()
  Ctrl->>DB: platform queries (all clinics)
  DB-->>Ctrl: list
  Ctrl-->>C: 200 { clinics }
```

---

## 10. RBAC forbidden (wrong role)

Example: `STAFF` calls `GET /auth/admin-only` (only `SUPER_ADMIN`, `CLINIC_OWNER`).

```mermaid
sequenceDiagram
  autonumber
  participant C as Staff Client
  participant J as jwtAuth
  participant R as allowRoles
  participant API as auth.routes

  C->>J: GET /auth/admin-only
  J->>J: req.auth.role = STAFF
  J->>R: next()
  R->>R: STAFF not in [SUPER_ADMIN, CLINIC_OWNER]
  R-->>C: 403 Forbidden insufficient role permission
  Note over API: Handler never runs
```

---

## 11. Signup blocked (SUPER_ADMIN)

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant API as auth.controller
  participant S as auth.service

  C->>API: POST /auth/signup { role: SUPER_ADMIN, ... }
  API->>API: validateSignupPayload() — role valid enum
  API->>S: signup()
  S->>S: PUBLIC_SIGNUP_BLOCKED_ROLES.has(SUPER_ADMIN)
  S-->>API: 403 Cannot register with this role
  API-->>C: 403
  Note over C: Create SUPER_ADMIN in MongoDB (seed)
```

---

## 12. All modes overview

High-level map of how clients obtain and use credentials.

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant Auth as /auth
  participant Clinic as /clinics
  participant API as Protected APIs
  participant Admin as /admin

  rect rgb(240, 248, 255)
    Note over C,Clinic: Bootstrap (no JWT)
    C->>Clinic: POST /onboard
    Clinic-->>C: clinicId + users
    C->>Auth: POST /signup (optional extra users)
    Auth-->>C: cookies
  end

  rect rgb(255, 250, 240)
    Note over C,Auth: Session (public + cookies)
    C->>Auth: POST /login
    Auth-->>C: access_token + refresh_token cookies
  end

  rect rgb(240, 255, 240)
    Note over C,API: Authenticated clinic APIs
    C->>API: request + access_token
    API->>API: jwtAuth → tenant → allowRoles
    API-->>C: 200 or 403
    alt access expired
      C->>Auth: POST /refresh
      Auth-->>C: new cookies
      C->>API: retry
    end
  end

  rect rgb(255, 240, 245)
    Note over C,Admin: Platform (SUPER_ADMIN only)
    C->>Admin: request + SUPER_ADMIN JWT
    Admin-->>C: 200 or 403
  end

  C->>Auth: POST /logout
  Auth-->>C: cookies cleared
```

---

## Middleware order (reference)

```mermaid
flowchart LR
  A[Request] --> B[cookieParser + CORS]
  B --> C{Public route?}
  C -->|yes| H[Controller]
  C -->|no| D[jwtAuth]
  D --> E{injectClinicFromAuth?}
  E -->|yes| F[inject clinicId]
  E -->|no| G{Guard}
  F --> G
  G -->|allowRoles| H
  G -->|requireSuperAdmin| H
  H --> I[Response]
```

---

## Token lifecycle

```mermaid
stateDiagram-v2
  [*] --> Anonymous
  Anonymous --> Authenticated: login or signup
  Authenticated --> Authenticated: refresh (rotate refresh hash)
  Authenticated --> Anonymous: logout
  Authenticated --> Anonymous: refresh reuse detected
  Authenticated --> Anonymous: access expired + refresh fails
  note right of Authenticated
    Cookies: access_token (15m default)
    refresh_token (7d default)
    Or Bearer access_token
  end note
```
