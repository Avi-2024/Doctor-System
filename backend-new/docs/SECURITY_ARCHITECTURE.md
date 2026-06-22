# Security Architecture

## Security Objectives

The platform handles healthcare, identity, financial, and communication data. Security objectives are:

- Confidentiality.
- Integrity.
- Availability.
- Traceability.
- Tenant isolation.
- Least privilege.
- Auditability.
- Compliance readiness.

## Threat Model

Primary threats:

- Cross-tenant data access.
- Broken object-level authorization.
- Token theft.
- Refresh token replay.
- Privilege escalation.
- SQL injection.
- XSS and CSRF in browser flows.
- Malicious file upload.
- Webhook spoofing/replay.
- Provider credential exposure.
- Audit tampering.
- Report/export data leakage.
- Insider misuse.
- Worker replay causing duplicate side effects.
- Denial of service through APIs, sockets, uploads, or webhooks.

## Trust Boundaries

Trust boundaries:

- Browser/client to Nginx/API.
- API to MySQL.
- API/workers to S3.
- API/workers to WhatsApp provider.
- Webhook provider to API.
- Socket clients to Socket.IO server.
- Worker processes to queue tables/outbox.
- Platform admin operations to tenant data.

Every boundary requires explicit validation, authentication, authorization, and logging appropriate to the risk.

## OWASP Controls

| OWASP Risk | Control |
| --- | --- |
| Broken access control | Mandatory auth, tenant resolution, RBAC, service ownership checks, repository clinic filters. |
| Cryptographic failures | TLS, secure cookies, bcrypt, token hashing, encrypted secrets, S3 encryption. |
| Injection | Prisma parameterized queries, input validation, no raw SQL unless reviewed. |
| Insecure design | Modular monolith boundaries, transaction standards, outbox, audit, threat modeling. |
| Security misconfiguration | Environment validation, helmet, CORS allowlist, no stack traces, least-privilege infra. |
| Vulnerable components | Dependency audit, patch policy, CI gates. |
| Identification/auth failures | JWT expiration, refresh rotation, lockout, token versioning, session revocation. |
| Software/data integrity failures | Immutable migrations, CI checks, audit hash chain, signed artifacts where needed. |
| Logging/monitoring failures | Structured logs, request IDs, Sentry-ready errors, audit events, alerts. |
| SSRF | Restrict outbound calls, validate URLs, do not fetch arbitrary user URLs. |

## Authentication Security

Required:

- Bcrypt password hashing.
- Minimum password policy.
- Short-lived access tokens.
- Refresh token rotation.
- Refresh token hashing.
- Token versioning.
- HTTP-only secure cookies.
- SameSite cookie protection.
- Session tracking by device.
- Reuse detection.
- Rate limiting.
- Account lockout.
- Enumeration-safe password reset.

Access tokens must not contain permissions, PHI, secrets, or provider credentials.

## Authorization Security

Required:

- Every protected endpoint declares permissions.
- Every critical service revalidates authorization.
- Resource-level ownership validation.
- Scope validation.
- Default deny.
- Reserved platform permissions restricted to Super Admin.
- Role assignment cannot exceed actor privileges.
- High-risk RBAC changes invalidate permission cache and sessions.

Repositories must not make authorization decisions, but they must enforce tenant-scoped persistence.

## Tenant Security

Required:

- Tenant context from token for clinic users.
- No tenant override for clinic users.
- Explicit, validated tenant context for Super Admin support operations.
- `clinic_id` in all tenant-owned tables.
- Tenant-first indexes.
- Tenant-scoped cache keys.
- Tenant-scoped S3 keys.
- Tenant-scoped Socket.IO rooms.
- Tenant-scoped events.
- Tenant-scoped reports and exports.

Cross-tenant access attempts are `CRITICAL` audit events.

## API Security

Required middleware:

- Request ID.
- Request logging.
- Security headers.
- CORS allowlist.
- Compression.
- Cookie parsing.
- Global rate limiting.
- Raw body parsing for webhooks before JSON parser.
- Body size limits.
- Validation.
- Centralized error handling.

API rules:

- No public stack traces.
- No secrets in responses.
- Consistent error envelope.
- Validation for body, params, and query.
- Pagination limits to prevent unbounded reads.
- Idempotency keys for critical retriable writes.

## Input Validation

Validators must cover:

- Required fields.
- Types.
- UUIDs.
- Enums.
- Length.
- Email/phone/date formats.
- Monetary precision.
- File size/type/checksum.
- Sort and filter allowlists.

Business rules belong in services, not validators.

## Database Security

Required:

- Private network access.
- Least-privilege database user.
- TLS to database where supported.
- No hardcoded credentials.
- Prisma parameterized queries.
- Foreign keys and constraints.
- Soft delete for business records.
- Backups with encryption.
- Tested restore process.

Raw SQL:

- Avoid by default.
- If required, isolate in repository, parameterize, and security review.

## File Upload Security

Required:

- Authenticated upload.
- Tenant and entity ownership validation.
- Allowed MIME and extension validation.
- Size limit.
- Checksum validation.
- Virus scanning.
- Private bucket.
- S3 server-side encryption.
- Signed URLs.
- Audit every access.

Direct public bucket access is prohibited.

## Webhook Security

Required:

- Raw body capture.
- Signature validation.
- Source validation.
- Timestamp validation.
- Replay protection.
- Idempotency by provider event id.
- Rate limiting.
- Async processing.
- Audit accepted, rejected, failed, and replayed webhooks.

Invalid signatures return `401` and stop processing.

## WhatsApp and Provider Security

Required:

- Provider tokens stored encrypted or in secrets manager.
- Raw secrets never returned by APIs.
- Webhook signature validation.
- Tenant ownership on accounts, templates, and messages.
- Provider state does not become source of truth.
- Delivery state persisted internally.
- Reconciliation job for status drift.

## WebSocket Security

Required:

- JWT auth during handshake.
- Session, user, clinic, and token version validation.
- Tenant context immutable.
- Server-controlled room assignment.
- Permission validation for rooms/subscriptions.
- Connection and message rate limiting.
- Transport encryption.
- Session revocation disconnect.

Sockets do not perform business mutations in MVP.

## Worker Security

Required:

- Workers run with least privilege.
- Job payloads do not contain secrets.
- Jobs are tenant-aware.
- Workers validate tenant ownership before side effects.
- Idempotency prevents duplicate side effects.
- Dead-letter records are access-controlled.

## Secrets Management

Never hardcode:

- JWT secrets.
- Database URLs/passwords.
- S3 keys.
- WhatsApp provider tokens.
- Webhook secrets.
- Encryption keys.
- Sentry DSN where sensitive.

Use environment variables or a secrets manager. Validate required environment variables at startup.

## Encryption

In transit:

- TLS for public traffic.
- TLS for provider calls.
- TLS to database where supported.

At rest:

- S3 server-side encryption.
- Encrypted database storage/backups by infrastructure.
- Encrypted provider credentials.
- Optional field-level encryption for high-risk PHI/PII fields.

Recommended algorithm target:

- AES-256 for at-rest infrastructure encryption.

## Audit and Monitoring

Security audit events:

- Login failure spikes.
- Token reuse.
- Account lockout.
- Role/permission changes.
- Forbidden access.
- Tenant violation.
- Webhook validation failure.
- Suspicious file upload.
- Signed URL generation for sensitive records.
- Export creation/download.
- Super Admin tenant override.

Alerts:

- token reuse detection.
- tenant violation attempts.
- audit write failures.
- dead-letter spikes.
- webhook failure spikes.
- suspicious download/export volume.

## Compliance Readiness

The architecture is designed for HIPAA-style controls but final compliance requires business and legal decisions.

Needed before production:

- Data retention policy by jurisdiction.
- Business associate agreements where applicable.
- Backup and restore procedures.
- Incident response procedure.
- Access review procedure.
- Audit review procedure.
- Breach notification procedure.
- PHI handling policy.
- Data export/deletion policy.

## Security Invariants

- Authentication is required unless endpoint is explicitly public.
- Authorization defaults to deny.
- Tenant isolation is mandatory at every layer.
- Secrets are never hardcoded.
- Stack traces are never public.
- Refresh tokens are hashed and rotated.
- Provider credentials are encrypted.
- Every critical action is audited.
- External systems are not sources of business truth.
- Business data remains recoverable from MySQL.
- Security failures are logged and monitored.

