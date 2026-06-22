# Branching Strategy

## Purpose

This document defines how engineering branches, reviews, releases, and hotfixes the Doctor System healthcare SaaS product.

`backend-new` is canonical. The legacy `backend` is reference only.

## Protected Branches

- `main`: production-ready branch.
- `develop` or equivalent integration branch if adopted by the team.
- `release/*`: release stabilization branches.
- `hotfix/*`: emergency production fix branches.

Protected branches require:

- Passing CI.
- Required review approval.
- No direct pushes.
- No unresolved conversations.
- No critical/high security findings.

## Branch Naming

Use:

- `feature/<module>-<short-description>`
- `fix/<module>-<short-description>`
- `security/<module>-<short-description>`
- `chore/<area>-<short-description>`
- `docs/<topic>-<short-description>`
- `release/<version>`
- `hotfix/<incident-or-issue>`

Examples:

- `feature/auth-refresh-rotation`
- `fix/audit-chain-concurrency`
- `security/storage-signed-url`
- `docs/api-standards`

## Merge Rules

- Use pull requests for all changes.
- Squash or merge commits based on team policy, but history must remain readable.
- PRs touching Auth, RBAC, tenant isolation, billing, clinical, storage, or migrations require module owner review.
- Security-sensitive PRs require Security/Compliance Owner review.
- Database migrations require backend owner and DevOps/SRE review.

## Release Branches

Create `release/<version>` when:

- Scope is frozen.
- Feature work is complete.
- Only stabilization, bug fixes, docs, and release checks remain.

Release branches require:

- Migration dry-run.
- Regression suite.
- Smoke test plan.
- Rollback plan.
- Release notes.

## Hotfix Branches

Use `hotfix/<issue>` for urgent production fixes.

Hotfix rules:

- Keep scope minimal.
- Include tests for the failure.
- Run reduced but mandatory CI gates.
- Document rollback.
- Open postmortem if customer data, uptime, security, billing, or clinical workflow was affected.

## CI Gates

Required gates:

- Lint.
- Build.
- Tests.
- Prisma validation.
- npm audit.
- Migration dry-run for schema changes.
- Docker build when deployment artifact changes.

## Branch Hygiene

- Keep branches small.
- Rebase or merge main frequently enough to avoid risky drift.
- Do not stack unrelated modules in one PR.
- Do not mix refactor and behavior change unless necessary.
- Delete merged branches.

## Done Checklist

- [ ] Branch name follows convention.
- [ ] PR template completed.
- [ ] CI green.
- [ ] Required reviewers approved.
- [ ] Release/rollback implications documented.
- [ ] Documentation updated.
