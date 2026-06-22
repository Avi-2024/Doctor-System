# Release Process

## Purpose

This document defines how the Doctor System healthcare SaaS product is released.

`backend-new` is the canonical backend. Production releases are gated. The launch target is outpatient MVP first.

## Release Types

| Type | Use Case |
| --- | --- |
| Normal Release | Planned product, bugfix, infrastructure, or documentation release. |
| Hotfix | Urgent production bug with limited scope and mandatory safety gates. |
| Emergency Rollback | Revert or disable a release causing production impact. |

## Required Release Gates

Every production release requires:

- Scope approved.
- CI green.
- Lint passing.
- Build passing.
- Tests passing.
- Prisma validation passing.
- npm audit gate passing.
- Docker build passing where applicable.
- Security scan green or accepted by CTO/Security.
- Migration dry-run completed if schema changes exist.
- Staging UAT completed for workflow changes.
- Rollback plan documented.
- Monitoring ready.
- Release owner assigned.

## Branch And Release Model

- Feature branches merge through pull request review.
- Release branch is cut from the approved mainline.
- Hotfix branches target the release branch or production branch according to the active release model.
- No unreviewed code is deployed to production.
- Release tags must identify deployed version and migration state.

## Production Release Flow

1. Confirm scope and release owner.
2. Cut release branch.
3. Run full CI.
4. Deploy to staging.
5. Run smoke tests and E2E clinic-day flow.
6. Run migration dry-run if applicable.
7. Confirm monitoring, alerts, and rollback plan.
8. Obtain approvals from Product, QA, Security if needed, DevOps/SRE, and CTO.
9. Deploy production.
10. Monitor for at least 60 minutes.
11. Complete release note and update release board.

## Hotfix Flow

Hotfixes may reduce scope but cannot skip:

- Code review.
- Targeted tests.
- Security review if sensitive.
- Migration review if schema/data changes exist.
- Rollback plan.
- Post-deploy monitoring.

Hotfixes must be back-merged into the mainline.

## Rollback Rules

Rollback when:

- Auth, tenant isolation, billing, clinical workflow, or data integrity is broken.
- Error rate or latency breaches SEV1/SEV2 threshold after deployment.
- Migration or deployment causes broad workflow failure.
- Feature flag cannot isolate the problem.

Do not rollback blindly when database migrations are not backward compatible.

## Migration Rules

- Migrations must be forward-only where possible.
- Use expand/backfill/contract for risky schema changes.
- Review production migration time and lock risk.
- Confirm backup health before production migration.
- Migration owner must be present during deployment.

## Release Communications

- Customer Success must know customer-visible changes.
- Support must know known issues and rollback instructions.
- Security must know security-sensitive changes.
- On-call must be notified before deployment.

## Shared Policies

- No production release without passing lint, build, tests, Prisma validation, npm audit, migration dry-run, and rollback review.
- No launch expansion while P0 debt remains open.
- No broad rollout until backup/restore, monitoring, alerts, runbooks, and on-call are proven.
