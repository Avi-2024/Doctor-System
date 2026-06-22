# API Standards

## Purpose

These standards define how `backend-new` exposes APIs for the Doctor System healthcare SaaS platform.

The launch target is a controlled outpatient MVP. The legacy `backend` is reference only.

## Non-Negotiables

- Use `/api/v1` for all product APIs.
- Follow Route -> Validator -> Controller -> Service -> Repository -> Prisma.
- Do not put business logic in routes or controllers.
- Do not call Prisma outside repositories or approved infrastructure modules.
- No protected route ships without auth, tenant resolution, RBAC, validation, logging, and audit where required.
- No tenant-owned query ships without trusted tenant context.
- No critical write ships without transaction safety and idempotency where retries are possible.

## Response Envelope

Successful responses must use:

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {},
  "meta": {}
}
```

Error responses must use:

```json
{
  "success": false,
  "message": "Safe public error",
  "errors": [],
  "requestId": "request-id"
}
```

Rules:

- Do not expose stack traces, SQL errors, provider internals, secrets, PHI, or rejected secret values.
- Include `requestId` on errors.
- Use stable messages for client handling.
- Use `errors` only for sanitized field-level validation details.
- Public API contract changes are production-gated and require docs, tests, rollback notes, and release approval.

## HTTP Status Codes

| Status | Use |
| --- | --- |
| 200 | Successful read/update/action. |
| 201 | Successful create. |
| 204 | Successful delete with no body, only when client contract expects it. |
| 400 | Validation or malformed request. |
| 401 | Missing, invalid, expired, or revoked authentication. |
| 403 | Authenticated but forbidden by RBAC, tenant scope, or platform policy. |
| 404 | Resource not found or intentionally hidden. |
| 409 | Business conflict such as duplicate appointment slot or duplicate code. |
| 422 | Valid syntax but invalid business transition, if 400 would be ambiguous. |
| 429 | Rate limit or lockout. |
| 500 | Unexpected internal failure. |
| 503 | Dependency unavailable or service not ready. |

## Validation

- Validate body, params, and query before controller execution.
- Validate UUIDs, enums, dates, emails, phone numbers, file metadata, pagination, sorting, and filters.
- Business rules belong in services, not validators.
- Validation responses must omit submitted values for password, token, secret, file, PHI, billing, and provider fields.

## Pagination, Search, Filter, Sort

List APIs must support bounded pagination:

- `page`: default `1`, minimum `1`.
- `limit`: default `20`, maximum `100` unless an approved export endpoint.
- `sortBy`: allowlist only.
- `sortOrder`: `asc` or `desc`.
- `search`: sanitized, bounded, and applied only to indexed/searchable fields.
- `filters`: allowlist only.

List responses must include:

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Tenant And RBAC Requirements

- Tenant context must come from authenticated context, not client-provided tenant IDs.
- Client-provided `clinicId` may be accepted only as a filter when explicitly authorized and cross-checked.
- Every protected endpoint declares required permission and scope.
- Platform bypass must be explicit, reviewed, and audited.
- Sensitive service methods must re-check ownership and permission where route-level checks are insufficient.

## Idempotency

Idempotency is required for retryable writes:

- Appointment booking.
- Queue check-in.
- Prescription finalization.
- Lab orders.
- Invoice payments.
- Subscription updates.
- External side effects such as notifications, WhatsApp, webhooks, and exports.

Use an `Idempotency-Key` header or module-specific idempotency key. Keys must be tenant-scoped.

## Audit Requirements

Audit:

- Auth events.
- RBAC changes and denials.
- Tenant administration.
- PHI reads/writes where required.
- Appointment, queue, clinical, prescription, lab, billing, storage, export, and subscription state changes.

Audit payloads must be redacted and include request ID, tenant ID, user ID, action, resource, IP, user agent, and timestamp when available.

## Versioning

- `/api/v1` is stable once public beta begins.
- Breaking changes require a compatibility plan, migration notes, and client signoff.
- Deprecated fields must remain through the announced support window.
- Public API changes require docs and Postman/OpenAPI updates.

## Done Checklist

- [ ] Route follows required layering.
- [ ] Validators cover body, params, and query.
- [ ] Protected route has auth, tenant, RBAC, logging, and audit where required.
- [ ] Tenant-owned queries use trusted tenant context.
- [ ] Response envelope matches this standard.
- [ ] List APIs are paginated and indexed.
- [ ] Retryable writes are idempotent.
- [ ] Tests cover success, validation, RBAC denial, tenant isolation, and error behavior.
- [ ] API docs and Postman/OpenAPI contract are updated.
