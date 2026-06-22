# Development Guidelines

## Purpose

These guidelines define how engineers build the Doctor System healthcare SaaS product.

The architecture is frozen for launch. `backend-new` is the canonical backend. The first launch target is an outpatient MVP, not hospitals or V2 enterprise expansion.

## Architecture Rules

- Build a disciplined modular monolith.
- Use `backend-new` for all launch backend work.
- Treat legacy `backend` as reference only.
- Follow the required flow: Route -> Validator -> Controller -> Service -> Repository -> Prisma.
- Keep business logic out of routes and controllers.
- Keep Prisma access inside repositories or approved infrastructure modules.
- Do not let one business module directly mutate another module's tables.
- Cross-module behavior must use service contracts or domain events.

## Tenant Rules

- Every tenant-owned table must include `clinic_id`.
- Every tenant-owned query must be scoped by trusted tenant context.
- Never trust a client-provided tenant ID as authority.
- Super Admin tenant override must be explicit, audited, and reasoned.
- Tenant isolation must be tested for every module.
- Cross-tenant exports are Super Admin only and must be audited.

## RBAC Rules

- Every protected route must require a permission.
- RBAC must execute after authentication and tenant resolution.
- Critical services must re-check authorization when resource ownership matters.
- Platform bypass must be explicit and reviewed.
- Role changes must invalidate effective permission caches or sessions where required.
- Authorization failures for sensitive resources must be auditable.

## Audit Rules

- Audit every sensitive write.
- Audit sensitive reads where PHI, billing, export, or admin/support access is involved.
- Audit payloads must be redacted.
- Audit records must include request ID, tenant ID, actor ID, action, resource, IP, user agent, and timestamp when available.
- Audit behavior must not silently fail for critical workflows.

## Validation And Error Handling

- Validate body, params, and query inputs.
- Do not return raw rejected values for password, token, secret, file, PHI, or billing fields.
- Never expose stack traces publicly.
- Use the standard response envelope and error contract.
- Do not swallow errors silently.

## Repository Rules

- Tenant-owned repositories must derive tenant scope from trusted context.
- Platform repositories must require explicit platform context.
- Soft delete must be explicit per repository/model.
- Do not reference soft-delete fields unless the model owns those fields.
- Do not add ad hoc string-built query behavior when Prisma or structured helpers can express the query safely.

## Transaction Rules

Use transactions for:

- Clinic onboarding.
- User creation and role assignment.
- Appointment booking and rescheduling.
- Queue check-in and token generation.
- Consultation finalization.
- Prescription finalization.
- Lab order creation and report publication.
- Invoice finalization, payment recording, refunds, and credit notes.
- Subscription updates, renewals, expiry, and limit enforcement.

Retryable writes must support idempotency where duplicate requests are possible.

## Schema Rules

- Tenant-owned tables need `clinic_id`.
- Tenant-first indexes are required for list, search, dashboard, and workflow queries.
- Business records should use soft delete unless legally immutable.
- Money must use decimal-safe storage and calculation.
- Critical unique business identifiers must be enforced in the database.
- Migrations must be forward-only, reviewed, tested, and rollback-aware.

## Testing Rules

Every module must include:

- Unit tests for services and policies.
- Validator tests for invalid input and sensitive rejected values.
- Repository tests for tenant scoping.
- Integration tests for route auth, RBAC, tenant isolation, and error behavior.
- Edge-case tests for concurrency, invalid transitions, missing resources, and permissions.

No MVP launch work is complete until the clinic day flow is tested end to end.

## Observability Rules

- Log request ID, tenant ID, user ID, route, status, and duration.
- Redact secrets in every log path.
- Emit metrics for API latency, errors, DB pressure, queue lag, worker failures, and business workflow failures.
- Critical workflows must have traceable logs and audit records.

## Do Not Build Before MVP/V1 Gates

Do not build these until explicitly approved after MVP/V1 readiness:

- Patient portal.
- Telemedicine.
- Insurance claims.
- Pharmacy inventory.
- AI features.
- Government EHR integrations.
- Device integrations.
- Marketplace integrations.

## Release Safety

- No production release without passing lint, build, tests, Prisma validation, npm audit, migration dry-run, and rollback review.
- No launch expansion while P0 debt remains open.
- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.
