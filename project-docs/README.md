# Project Documentation Index

This folder contains the root-level planning, delivery, review, and operating documents for the Doctor System healthcare SaaS product.

Code-adjacent documentation intentionally remains in place:

- `backend-new/docs/*` stays with the backend implementation because tests and backend phase references use those paths.
- `frontend/src/pages/Prescriptions/*` stays with the frontend feature it documents.
- `infrastructure/nginx/certs/README.md` stays with infrastructure configuration.
- `.codex/CODEX_RULES.md` stays with Codex operating rules.

## Folder Map

| Folder | Purpose | When to use |
| --- | --- | --- |
| `00-executive-reviews` | CTO, investor, acquisition, enterprise, roadmap, and debt-level documents. | Use for leadership review, valuation risk, long-term technical direction, and strategic readiness. |
| `01-product-launch` | Product scope, launch readiness, delivery planning, and execution board documents. | Use for MVP/V1/V2 scope, release gates, launch planning, and delivery coordination. |
| `02-engineering-standards` | Engineering standards, review checklists, test expectations, branching, commits, PRs, and definition of done. | Use before writing or reviewing code. |
| `03-operations-runbooks` | Engineering handbook, team model, deployment, release, monitoring, on-call, incident, and recovery runbooks. | Use for production operations and team onboarding. |
| `04-sprint-delivery` | Sprint execution plans, reviews, fix plans, and acceptance reports. | Use for sprint-by-sprint implementation and acceptance gates. |

## Key Entry Points

| Need | Start here |
| --- | --- |
| New engineer onboarding | `03-operations-runbooks/ENGINEERING_HANDBOOK.md` |
| Current delivery control | `01-product-launch/DELIVERY_MASTER_PLAN.md` |
| Current sprint planning | `04-sprint-delivery/SPRINT_03_EXECUTION_PLAN.md` |
| Launch readiness | `01-product-launch/LAUNCH_READINESS_PLAN.md` |
| Product scope | `01-product-launch/MVP_SCOPE.md`, `01-product-launch/V1_SCOPE.md`, `01-product-launch/V2_SCOPE.md` |
| Engineering rules | `02-engineering-standards/DEVELOPMENT_GUIDELINES.md` |
| API/database/security standards | `02-engineering-standards/API_STANDARDS.md`, `02-engineering-standards/DATABASE_STANDARDS.md`, `02-engineering-standards/SECURITY_STANDARDS.md` |
| Code review | `02-engineering-standards/CODE_REVIEW_GUIDELINES.md`, `02-engineering-standards/CODE_REVIEW_CHECKLIST.md` |
| Production operations | `03-operations-runbooks/ON_CALL_RUNBOOK.md`, `03-operations-runbooks/MONITORING_RUNBOOK.md`, `03-operations-runbooks/INCIDENT_RESPONSE_PLAN.md` |
| Backup and recovery | `03-operations-runbooks/BACKUP_RECOVERY_RUNBOOK.md` |
| Technical debt | `00-executive-reviews/TECHNICAL_DEBT_REGISTER.md` |

## Document Ownership

| Document type | Owner |
| --- | --- |
| Executive review and roadmap documents | CTO / VP Engineering |
| Product scope and launch documents | Product Lead / CTO |
| Engineering standards | Tech Lead / Engineering Manager |
| Security standards | Security Owner |
| Operational runbooks | DevOps/SRE / Incident Commander |
| Sprint execution artifacts | Engineering Manager / Tech Lead |

## Maintenance Rules

- Keep sprint artifacts in `04-sprint-delivery`.
- Keep production runbooks in `03-operations-runbooks`.
- Keep standards in `02-engineering-standards`.
- Keep product launch and scope documents in `01-product-launch`.
- Keep strategic reviews and long-term risk documents in `00-executive-reviews`.
- Do not move `backend-new/docs` unless tests and backend references are updated at the same time.
