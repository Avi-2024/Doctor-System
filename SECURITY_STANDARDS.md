# Security Standards

## Purpose

These standards define the minimum security bar for the Doctor System healthcare SaaS platform.

Security protects PHI, tenant data, credentials, billing records, clinical workflows, and customer trust.

## Baseline Rules

- `backend-new` is canonical.
- Secrets are never hardcoded.
- Stack traces and internal errors are never public.
- Logs, audit payloads, validation errors, and provider errors must be redacted.
- Critical/high dependency vulnerabilities block release.
- Security-sensitive changes require security owner review.

## Authentication

Required model:

- JWT access token.
- Refresh token rotation.
- HTTP-only cookies.
- Secure cookies in production.
- SameSite Strict unless a documented deployment constraint requires otherwise.
- Session tracking.
- Token versioning.
- Refresh token reuse detection.
- Global logout/session revocation.

Rules:

- Access token lifetime defaults to 15 minutes.
- Refresh token lifetime defaults to 30 days.
- Store only hashed refresh tokens.
- Never store raw refresh tokens.
- Never include permissions, PHI, or secrets in JWT claims.

## Authorization And Tenant Isolation

- RBAC runs after authentication and tenant resolution.
- Permission format is `module.action`.
- Scope hierarchy is `ALL > CLINIC > BRANCH > ASSIGNED > OWN`.
- Every protected route declares required permission.
- Every tenant-owned query uses trusted tenant context.
- Platform bypass must be explicit, audited, and reviewed.
- Tenant mismatch attempts are security events.

## Validation And Input Safety

Validate:

- Body.
- Params.
- Query.
- UUIDs.
- Dates.
- Enums.
- Email and phone.
- File metadata.
- Webhook signatures.

Do not echo rejected values for passwords, tokens, secrets, PHI, billing, files, or provider payloads.

## Logging And Redaction

Required log fields:

- request ID.
- tenant ID when available.
- user ID when available.
- route.
- method.
- status.
- duration.

Never log:

- Passwords.
- Raw tokens.
- Cookies.
- Authorization headers.
- API keys.
- Private keys.
- Full PHI payloads.
- Payment secrets.

## Audit Security

Audit:

- Login, logout, refresh, failed login, token reuse.
- User and role changes.
- Tenant administration.
- PHI reads and writes where required.
- Clinical finalization and amendments.
- Billing state changes.
- File downloads and exports.
- Support/platform access.

Audit logs must be append-only, redacted, tenant-aware, request-correlated, and integrity-aware where guarantees are claimed.

## File Uploads And Storage

- All uploads go through the Storage module.
- Buckets are private.
- Use tenant-scoped object keys: `tenant/{clinicId}/...`.
- Use signed URLs with short expiration.
- Validate file size, type, checksum, and tenant ownership.
- Add malware scanning before production uploads.
- Direct bucket exposure is forbidden.

## Webhooks And Providers

- Verify signatures.
- Protect against replay.
- Store provider event IDs for idempotency.
- Never trust provider tenant/account mapping without internal lookup.
- Provider secrets live in approved secret storage.

## Security Gates

Release is blocked if:

- Critical/high npm audit finding is unresolved.
- Auth/session behavior is untested.
- Tenant isolation regression exists.
- RBAC bypass exists.
- Secrets can leak through logs/audit/errors.
- Upload/download path bypasses authorization.
- Migration can expose or corrupt tenant data.

## Incident Escalation

Page Security/Compliance immediately for:

- PHI leak.
- Cross-tenant access.
- Auth bypass.
- Token theft/reuse.
- Privilege escalation.
- Suspicious export or bulk access.
- Payment data exposure.

## Done Checklist

- [ ] Threat surface reviewed.
- [ ] Secrets are not hardcoded.
- [ ] Logs and errors are redacted.
- [ ] Auth, tenant, RBAC, and audit paths tested.
- [ ] Dependency scan reviewed.
- [ ] Security-sensitive events are observable.
- [ ] Security owner reviewed high-risk changes.
