# Commit Message Guidelines

## Purpose

Commit messages must make product, security, and operational history easy to understand.

Use these guidelines for all canonical `backend-new` work and any frontend, documentation, or infrastructure change that supports the controlled outpatient MVP launch.

Use conventional commits.

## Format

```text
type(scope): short summary
```

Optional body:

```text
Why this change was needed.
What changed.
Risks or follow-up.
```

## Types

| Type | Use |
| --- | --- |
| `feat` | New product or platform capability. |
| `fix` | Bug fix. |
| `security` | Security hardening or vulnerability fix. |
| `perf` | Performance improvement. |
| `refactor` | Internal restructuring without behavior change. |
| `test` | Tests only. |
| `docs` | Documentation only. |
| `chore` | Tooling, dependencies, maintenance. |
| `db` | Schema, migration, indexes, database behavior. |
| `ops` | Deployment, monitoring, runbook, infrastructure. |

## Scopes

Use module or area names:

- `foundation`
- `auth`
- `rbac`
- `tenants`
- `patients`
- `appointments`
- `queue`
- `clinical`
- `billing`
- `storage`
- `notifications`
- `whatsapp`
- `reports`
- `jobs`
- `prisma`
- `docs`
- `ci`

## Examples

```text
feat(auth): add refresh token rotation
fix(queue): prevent duplicate token assignment
security(audit): redact authorization headers
db(appointments): add tenant slot uniqueness constraint
test(rbac): cover missing permission denial
docs(api): add v1 pagination standard
ops(deploy): add migration dry-run gate
```

## Breaking Changes

Use a footer:

```text
BREAKING CHANGE: describes the client or migration impact
```

Breaking changes require:

- API compatibility review.
- Migration notes.
- Rollback plan.
- Product approval.

## Reverts

Use:

```text
revert(scope): revert original summary
```

Body must include:

- Original commit hash.
- Reason for revert.
- Follow-up issue if needed.

## Prohibited Practices

- Vague summaries like `fix bug`, `changes`, `updates`.
- Mixing unrelated modules in one commit.
- Mentioning secrets or customer data.
- Committing generated files without reason.
- Hiding migrations inside generic commits.

## Done Checklist

- [ ] Type is correct.
- [ ] Scope is specific.
- [ ] Summary is imperative and under 72 characters where practical.
- [ ] Body explains risk for non-trivial changes.
- [ ] Breaking change footer is present when needed.
