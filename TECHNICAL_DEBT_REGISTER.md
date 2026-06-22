# Technical Debt Register

## Executive Summary

This register treats the Doctor System as a 10-year healthcare SaaS platform, not a short-lived clinic prototype.

The current debt profile is concentrated in seven areas:

- Current product/runtime debt.
- Future product expansion debt.
- Scaling debt.
- Security debt.
- Infrastructure debt.
- Database debt.
- API debt.

The highest priority is to make `backend-new` the canonical backend, finish the outpatient MVP/V1 workflows, and retire launch-blocking debt around tenant isolation, security, CI/CD, infrastructure, database correctness, observability, backup, and disaster recovery.

Long-term architecture should stay as a disciplined modular monolith until measured scale, compliance isolation, resilience needs, or team ownership justify service extraction.

## Debt Scoring Model

Cost scale:

- **S:** Days to 1 week.
- **M:** 2-4 weeks.
- **L:** 1-2 months.
- **XL:** 3+ months or multi-team initiative.

Priority scale:

- **P0:** Launch/blocker.
- **P1:** Required for V1 stability.
- **P2:** Required before scale/enterprise.
- **P3:** Long-term optimization.

## Current Debt

| Item | Impact | Cost | Priority | When to Address |
| --- | --- | --- | --- | --- |
| Duplicate backend lines: `backend` and `backend-new` | Release ambiguity, duplicated effort, unclear source of truth | XL | P0 | Before MVP beta |
| `backend-new` foundation incomplete for business modules | Cannot launch canonical backend as product runtime | XL | P0 | First 90 days |
| Legacy backend weaker than new standards | Security and tenant-risk drift if reused blindly | L | P0 | During migration |
| Missing enforced OpenAPI contract | Frontend/API drift and enterprise integration risk | M | P1 | Before V1 |
| Incomplete frontend tests | UI regressions in clinic workflows | M | P1 | Before beta |
| Skipped/incomplete integration tests | Tenant/RBAC/billing regressions can ship | L | P0 | Before beta |
| Generic resource patterns hide workflow invariants | Appointment, queue, billing bugs | M | P1 | During module migration |
| Dirty/unsettled repo state | Poor release and diligence confidence | S | P1 | Before production release |

## Future Debt

| Item | Impact | Cost | Priority | When to Address |
| --- | --- | --- | --- | --- |
| Patient portal not designed into identity model | Future patient auth may require refactor | L | P2 | Before V2 patient portal |
| Enterprise SSO/SCIM not modeled | Enterprise sales blocked | L | P2 | Before enterprise rollout |
| AI features not governed | PHI/compliance and safety risk | XL | P3 | Before AI roadmap |
| Marketplace integrations lack platform contract | Partner ecosystem becomes ad hoc | XL | P3 | Year 3+ |
| No customer success data model | Hard to manage renewals and account health | M | P2 | After V1 launch |
| No data residency strategy | Enterprise/regional deals blocked | XL | P3 | Before multi-region |
| No long-term deprecation policy | API and workflow compatibility debt | M | P2 | Before public APIs |

## Scaling Debt

| Item | Impact | Cost | Priority | When to Address |
| --- | --- | --- | --- | --- |
| Process-local rate limiting | Incorrect limits across multiple instances | M | P0 | Before beta scaling |
| Socket.IO lacks multi-node strategy | Realtime queue fails horizontally | M | P1 | Before multi-instance deployment |
| Reports depend on OLTP access | Production latency degradation | L | P1 | Before V1 reporting |
| Patient search lacks dedicated strategy | Poor performance at large patient volume | L | P2 | Before 1M patients |
| Workers need durable leases/dead letters | Lost or duplicated jobs | L | P1 | Before reminders/exports at scale |
| No cache strategy for RBAC/settings/reference data | Avoidable DB load and latency | M | P1 | Before broad rollout |
| No tenant-aware capacity model | No way to detect noisy tenants | M | P2 | Before enterprise rollout |

## Security Debt

| Item | Impact | Cost | Priority | When to Address |
| --- | --- | --- | --- | --- |
| Frontend token storage risk | XSS token theft exposure | M | P0 | Before beta |
| Critical/high dependency advisories | Security and diligence blocker | M | P0 | Before beta |
| Upload malware scanning missing | PHI file storage risk | L | P1 | Before production uploads |
| Field-level PHI encryption scope undefined | Enterprise/compliance blocker | L | P2 | Before enterprise rollout |
| Super Admin override needs reason/audit | Insider and support-access risk | M | P1 | Before production launch |
| SIEM/security event export missing | Enterprise security operations blocked | M | P2 | Before enterprise rollout |
| Compliance evidence package missing | Enterprise acquisition/sales blocker | XL | P1 | Before enterprise sales |

## Infrastructure Debt

| Item | Impact | Cost | Priority | When to Address |
| --- | --- | --- | --- | --- |
| No production IaC baseline | Environments not reproducible | XL | P0 | Before production |
| No CI/CD release gates | Unsafe releases | L | P0 | Before beta |
| No migration preflight/rollback process | Data loss or downtime risk | L | P0 | Before production |
| Backup/restore not proven | Cannot guarantee continuity | M | P0 | Before production |
| No RPO/RTO evidence | Enterprise readiness blocker | M | P1 | Before V1 |
| No production observability stack | Incidents hard to diagnose | L | P0 | Before beta |
| No worker autoscaling/runbook model | Jobs fail silently or backlog | M | P1 | Before V1 |
| No image scanning/SBOM/signing | Supply-chain review gap | M | P2 | Before enterprise rollout |

## Database Debt

| Item | Impact | Cost | Priority | When to Address |
| --- | --- | --- | --- | --- |
| Missing tenant-scoped uniqueness constraints | Duplicate patient/invoice/appointment records | M | P0 | Before beta |
| Appointment slot concurrency not DB-enforced | Double booking risk | L | P0 | Before beta |
| Queue token concurrency not fully hardened | Duplicate/skipped tokens | M | P0 | Before beta |
| Money precision legacy risk | Financial correctness issues | L | P0 | Before billing launch |
| Audit log retention/partitioning undefined | Long-term table growth and compliance risk | L | P2 | Before high-volume launch |
| Reporting aggregates missing | OLTP overload | L | P1 | Before V1 reporting |
| Tenant export/restore model missing | Enterprise offboarding/recovery blocker | XL | P2 | Before enterprise rollout |

## API Debt

| Item | Impact | Cost | Priority | When to Address |
| --- | --- | --- | --- | --- |
| `/api/v1` contract not frozen | Frontend and partner drift | M | P1 | Before V1 |
| OpenAPI spec missing | Enterprise integration and QA gap | M | P1 | Before V1 |
| Idempotency not standardized | Duplicate writes from retries | M | P0 | Before beta workflows |
| Pagination/filter/sort standards incomplete | List APIs degrade and drift | M | P1 | During module build |
| Error envelope compatibility not governance-backed | Client handling inconsistency | S | P1 | Before beta |
| Public webhooks/API strategy missing | Integration ecosystem blocked | L | P3 | Before marketplace |
| API deprecation policy missing | Long-term compatibility debt | S | P2 | Before public APIs |

## 10-Year Architecture Evolution Roadmap

### Year 0-1: Production-Grade Modular Monolith

- Make `backend-new` canonical.
- Finish MVP and V1 outpatient workflows.
- Build secure auth, RBAC, tenant isolation, audit, billing correctness, and core reports.
- Add CI/CD, IaC, observability, backup/restore, migration gates, and runbooks.
- Keep all core domain logic in the modular monolith.

### Year 2: Scale And Enterprise Foundations

- Add Redis-backed caching/rate limiting/WebSockets.
- Move reporting to aggregates, snapshots, async exports, and read replicas.
- Add patient portal-lite, digital intake, online payments, and customer success dashboards.
- Add SSO/SAML, SCIM-ready identity, access reviews, SIEM export, and compliance evidence.

### Year 3: Selective Service Extraction Begins

- Extract notifications/WhatsApp delivery only if throughput or provider isolation demands it.
- Extract reporting/export generation if OLTP isolation requires it.
- Add search/indexing service for patients, clinical records, and reports if query volume proves need.
- Keep Auth, RBAC, tenancy, patients, appointments, queue, clinical, prescriptions, lab core, and audit policy in the monolith.

### Years 4-5: Enterprise Platform Maturity

- Add data residency controls, tenant export/offboarding, legal hold, and advanced audit packages.
- Add payment, lab, eRx, and accounting integrations.
- Add advanced analytics, benchmarking, forecasting, and customer health metrics.
- Formalize platform APIs, webhooks, SDKs, versioning, and deprecation policy.

### Years 6-7: Regional And Multi-Product Scale

- Add regional deployment model if customer/regulatory demand exists.
- Move analytics/BI workloads to dedicated data platform.
- Add compliance automation, continuous access review, and policy evidence automation.
- Consider extracting payment/webhook processing if provider reliability and compliance demand separate blast radius.

### Years 8-10: Durable Healthcare Platform

- Add mature integration marketplace.
- Add AI features only with PHI governance, auditability, review workflows, and clear liability boundaries.
- Consider multi-region DR or active-active only when enterprise contracts require it.
- Maintain a strict rule: extract services only when scale, resilience, compliance, or team ownership proves the need.

## Debt Governance Rules

- No P0 debt can remain open for paid beta.
- No P1 debt can remain open for V1 broad rollout unless explicitly accepted by CTO.
- Every new module must include tenant isolation, RBAC, validation, audit, tests, and observability.
- Every external side effect must be idempotent, queued where appropriate, retryable, and observable.
- Every schema migration must be forward-only, reviewed, tested, and rollback-aware.
- Every quarter must retire at least one material debt item before adding major V2 product scope.

## Validation Checklist

- `TECHNICAL_DEBT_REGISTER.md` exists at repo root.
- It includes Current, Future, Scaling, Security, Infrastructure, Database, and API debt sections.
- Every listed debt item has Impact, Cost, Priority, and When to Address.
- It includes a 10-year architecture evolution roadmap.
- It is documentation-only; no code, schema, config, or infrastructure files are modified.

## Assumptions

- The goal is a durable 10-year healthcare SaaS platform, not a short-lived clinic prototype.
- `backend-new` remains the intended canonical backend.
- The product remains a modular monolith until extraction is justified by measured scale, resilience, compliance, or team ownership.
- V2 features such as AI, marketplace, patient portal expansion, and integrations must not preempt MVP/V1 production hardening.
