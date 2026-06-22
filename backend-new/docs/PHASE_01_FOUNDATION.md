# PHASE 01 - Foundation

## Objective

Create the backend platform skeleton and non-negotiable engineering standards that every later module must use.

## Modules

- Foundation
- Database bootstrap
- Audit table foundation
- Job/outbox table foundation
- Error/logging/request context

## Dependencies

- None.

## Deliverables

- Node.js/Express backend scaffold.
- Environment config and startup validation.
- Request ID middleware.
- Structured logging.
- Standard response envelope.
- Centralized error classes and error handler.
- Validation middleware.
- Health, readiness, and startup checks.
- Prisma bootstrap and migration workflow.
- Base repository pattern.
- Transaction/unit-of-work helper.
- Initial tables: migrations, audit_logs, audit_chain_state, outbox_events, processed_events, jobs, dead-letter tables.
- Layered Foundation module for health, readiness, and API metadata endpoints.
- Phase 01 implementation documentation.
- Phase 01 migration plan.
- Phase 01 test plan.
- Phase 01 Postman collection and local environment.

## Implementation Artifacts

- `src/modules/foundation/foundation.routes.js`
- `src/modules/foundation/foundation.validator.js`
- `src/modules/foundation/foundation.controller.js`
- `src/modules/foundation/foundation.service.js`
- `src/modules/foundation/foundation.repository.js`
- `docs/PHASE_01_FOUNDATION_IMPLEMENTATION.md`
- `docs/PHASE_01_MIGRATION_PLAN.md`
- `docs/PHASE_01_TEST_PLAN.md`
- `postman/Doctor-System-Phase-1.postman_collection.json`
- `postman/Doctor-System-Phase-1.postman_environment.json`

## Tests

- Config validation failure.
- Request ID propagation.
- Error envelope consistency.
- No public stack traces.
- Transaction rollback.
- Base repository tenant-scope enforcement.
- Health/readiness behavior.

## Exit Criteria

- Later modules can plug into routes, validators, controllers, services, repositories, Prisma, logging, audit, and transactions.
- No business workflow is implemented yet.
- `npm run lint`, `npm run build`, and `npm test` pass from `backend-new`.
- Postman collection covers `/health`, `/health/ready`, and `/api/v1/meta`.

## Merge Status

- Critical review issues: none identified.
- High review issues: fixed.
- Medium and Low review issues: tracked in `FIX_PLAN.md` for later hardening.
- Phase 01 remains limited to foundation code and does not include Auth or business workflows.

## Verification Commands

```bash
npm run lint
npm run build
npm test
```

## Risks

- Weak foundation causes inconsistent module implementations.
- Missing transaction patterns will make later workflow fixes expensive.
