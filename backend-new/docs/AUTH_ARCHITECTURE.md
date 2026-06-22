# Authentication Architecture

## Objectives

Authentication verifies identity, establishes sessions, protects credentials, and resolves tenant association. It does not make authorization decisions.

Mandatory outcomes:

- Secure login.
- Short-lived access tokens.
- Refresh token rotation.
- HTTP-only cookies.
- Session tracking.
- Token versioning.
- Password reset.
- Staff invitation acceptance.
- Auditability.
- Tenant-aware authentication.

## Identity Types

| Identity | Source | Tenant Context |
| --- | --- | --- |
| Super Admin | users table | Platform user, may explicitly select tenant for tenant support operations. |
| Clinic Owner | users table | Own clinic. |
| Doctor | users table | Own clinic and assigned branches/resources. |
| Receptionist | users table | Own clinic and branch scope. |
| Clinical Staff | users table | Own clinic and assigned branch/resources. |
| Patient | Future | Not required in current backend architecture. |

Authentication resolves:

- userId.
- clinicId.
- sessionId.
- tokenVersion.
- role assignments.

Permissions may be loaded during login for response/context, but authorization remains a separate layer.

## Credential Rules

Primary credential:

- Email.
- Password.

Password requirements:

- Minimum 12 characters.
- Maximum 128 characters.
- Uppercase.
- Lowercase.
- Number.
- Special character.
- Must not contain user email.
- Must not be a known compromised/common password where a checker is available.

Storage:

- Store only `password_hash`.
- Use bcrypt.
- Never log or audit raw password.

## Token Model

Access token:

- JWT.
- Short-lived.
- Recommended lifetime: 15 minutes.
- Allowed range: 10 to 30 minutes.
- Stored in HTTP-only secure cookie.
- Contains identity only.

Access token claims:

- `sub`
- `userId`
- `clinicId`
- `sessionId`
- `tokenVersion`
- `iat`
- `exp`

Do not include:

- permissions.
- patient data.
- PHI.
- secrets.
- refresh token id.

Refresh token:

- Long-lived.
- Recommended lifetime: 30 days.
- Rotated on every use.
- Stored in HTTP-only secure cookie.
- Raw token never stored.
- Database stores only hash.

Refresh token claims:

- `sub`
- `sessionId`
- `tokenId`
- `iat`
- `exp`

## Cookie Architecture

Cookies:

- `access_token`
- `refresh_token`

Properties:

- `HttpOnly = true`
- `Secure = true`
- `SameSite = Strict`
- Path restricted.
- Environment-specific domain.

CSRF risk is reduced by SameSite and path restrictions, but state-changing APIs should still enforce origin checks and CSRF strategy where browser cookie auth is used.

## Session Model

Table:

- `refresh_tokens`

Session fields:

- id.
- user_id.
- clinic_id.
- token_hash.
- session_id.
- device_info.
- ip_address.
- user_agent.
- created_at.
- last_used_at.
- expires_at.
- revoked_at.
- replaced_by_token_id.

One refresh token equals one session state at a time. A user may have multiple concurrent device sessions.

## Login Flow

1. Receive credentials.
2. Validate input.
3. Resolve user by clinic/email rules.
4. Verify bcrypt password.
5. Verify user active.
6. Verify clinic active unless Super Admin.
7. Resolve roles.
8. Resolve effective permissions.
9. Create session.
10. Generate access token.
11. Generate refresh token.
12. Store refresh token hash.
13. Set cookies.
14. Audit success.
15. Return current user context.

Failure flow:

- Invalid credentials return `401`.
- Disabled user returns `403`.
- Suspended clinic returns `403`.
- Failed attempts are audited.
- Responses do not disclose whether the user exists.

## Refresh Flow

1. Read refresh cookie.
2. Verify refresh JWT.
3. Hash presented token.
4. Load matching active refresh token record.
5. Validate session, user, clinic, expiry, and token version.
6. Generate new access token.
7. Generate new refresh token.
8. Store new refresh token hash.
9. Revoke old refresh token and link replacement.
10. Update last used metadata.
11. Set new cookies.
12. Audit refresh.

## Refresh Token Reuse Detection

If a refresh token is valid as a JWT but does not match the active token state:

1. Treat as possible theft.
2. Revoke all active sessions for the user.
3. Increment token version where appropriate.
4. Audit `Token Reuse Detection`.
5. Force reauthentication.
6. Return `401`.

## Logout

Current session logout:

1. Identify session.
2. Revoke refresh token.
3. Clear cookies.
4. Audit logout.
5. Return success.

Logout is idempotent.

Global logout:

1. Load all active sessions for current user.
2. Revoke all sessions.
3. Increment token version.
4. Clear cookies for current device.
5. Disconnect active sockets.
6. Audit global logout.

## Token Versioning

Every user has `token_version`.

Increment when:

- Password reset succeeds.
- Password changes.
- High-risk role change occurs.
- User deactivated.
- Security incident detected.
- Super Admin forces global session invalidation.

Access token validation compares token claim version with current user version. Mismatch returns `401`.

## Password Reset

Request endpoint:

- `POST /api/v1/auth/password-reset/request`

Request behavior:

- Accept email and tenant context.
- Return generic success regardless of account existence.
- If eligible user exists, generate raw token.
- Store hash only.
- Set expiry.
- Queue notification.
- Audit request.

Confirm endpoint:

- `POST /api/v1/auth/password-reset/confirm`

Confirm behavior:

- Hash submitted token.
- Validate token exists, not expired, not used.
- Update password hash.
- Mark token used.
- Increment token version.
- Revoke all sessions.
- Audit success.

## Invitation Acceptance

Invitation rules:

- Raw invitation token is never stored.
- Token is single-use.
- Token has expiry.
- Acceptance sets password and activates user.
- Acceptance creates a new session.
- Invitation acceptance is audited.

Flow:

1. Clinic Owner creates invitation.
2. Pending user and role assignment are created transactionally.
3. Invitation token hash is stored.
4. Delivery notification is queued.
5. User accepts.
6. Token is consumed.
7. Password is set.
8. User is activated.
9. Session is created.

## Rate Limiting and Lockout

Protected endpoints:

- Login.
- Refresh.
- Password reset request.
- Password reset confirm.
- Invitation acceptance.

Limit dimensions:

- IP.
- User/email.
- Endpoint.
- Tenant.

Repeated failed login attempts trigger:

- Temporary lockout.
- Audit event.
- Security notification where configured.

Lockout duration and threshold must be configurable.

## Audit Requirements

Audit these events:

- Login success.
- Login failure.
- Refresh.
- Logout.
- Global logout.
- Password reset request.
- Password reset success.
- Invitation acceptance.
- Session revocation.
- Token reuse detection.
- Security lockout.
- Suspended clinic login attempt.
- Disabled user login attempt.

Audit metadata:

- userId where known.
- clinicId where known.
- requestId.
- ipAddress.
- userAgent.
- timestamp.
- outcome.

## WebSocket Session Synchronization

When sessions are revoked because of logout, password reset, role change, user deactivation, or tenant suspension:

1. Auth service emits session revocation event.
2. Socket session registry finds matching connections.
3. Socket server disconnects clients.
4. Clients must reauthenticate.

## Security Invariants

- Passwords are never stored in plaintext.
- Refresh tokens are never stored in plaintext.
- Access tokens remain short-lived.
- Refresh tokens rotate on every use.
- Reuse detection revokes sessions.
- Authentication responses do not expose user existence.
- Password reset revokes sessions.
- Invitation tokens are single-use.
- All sessions are auditable.
- Authentication resolves tenant ownership.
- Authentication never makes final authorization decisions.
- Session revocation takes effect immediately for refresh operations.

