# Launch Checklist

This checklist converts the production readiness audit into launch gates for the Doctor System project.

Status labels:

- **Required Before Launch**
- **Recommended Before Launch**
- **Future Enhancement**

## Database Checklist

- **Required Before Launch:** Create and review production migrations for the selected backend.
- **Required Before Launch:** Validate all Prisma schemas against production MySQL.
- **Required Before Launch:** Add unique constraints for appointment slots, invoice numbers, receipt numbers, patient codes, provider message IDs, and active WhatsApp accounts.
- **Required Before Launch:** Add concurrency-safe booking and queue claim patterns.
- **Recommended Before Launch:** Add query plan review for high-volume reports and list APIs.
- **Future Enhancement:** Add partitioning/sharding strategy for very large tenants.

## Security Checklist

- **Required Before Launch:** Remediate all critical/high npm audit findings.
- **Required Before Launch:** Remove refresh/access tokens from frontend `localStorage`.
- **Required Before Launch:** Enforce secure httpOnly cookie or BFF auth model.
- **Required Before Launch:** Sanitize validation errors and logs across both backends.
- **Recommended Before Launch:** Add SAST/dependency/container scanning to CI.
- **Future Enhancement:** Add formal threat modeling per module.

## RBAC Checklist

- **Required Before Launch:** Standardize one RBAC implementation across the chosen backend.
- **Required Before Launch:** Verify every protected route has role and permission checks.
- **Required Before Launch:** Test platform/admin bypass behavior.
- **Recommended Before Launch:** Generate RBAC coverage report from route definitions.
- **Future Enhancement:** Add UI-driven permission management audit trails.

## Tenant Isolation Checklist

- **Required Before Launch:** Verify every tenant-owned query is scoped by trusted tenant context.
- **Required Before Launch:** Prevent client-provided tenant IDs from overriding authenticated scope.
- **Required Before Launch:** Add cross-tenant integration tests for all critical modules.
- **Recommended Before Launch:** Add tenant-aware repository contract tests.
- **Future Enhancement:** Evaluate DB-level tenant isolation controls.

## API Checklist

- **Required Before Launch:** Pick one backend line for launch.
- **Required Before Launch:** Freeze `/api/v1` response envelope and error contract.
- **Required Before Launch:** Add OpenAPI spec or generated API contract.
- **Recommended Before Launch:** Add backward compatibility/deprecation policy.
- **Future Enhancement:** Add public SDK/client generation.

## Testing Checklist

- **Required Before Launch:** Enable MySQL integration tests in CI.
- **Required Before Launch:** Add frontend test coverage.
- **Required Before Launch:** Add auth, tenant, RBAC, billing, appointment, queue, and worker tests.
- **Recommended Before Launch:** Add E2E tests for clinic workflows.
- **Recommended Before Launch:** Add concurrency tests for appointment booking and queue claims.
- **Future Enhancement:** Add chaos and fault-injection tests.

## Performance Checklist

- **Required Before Launch:** Load test for 10,000 concurrent users and 100,000 appointments/day.
- **Required Before Launch:** Replace memory-heavy report reads with aggregate/async reporting.
- **Required Before Launch:** Validate DB connection pool sizing.
- **Recommended Before Launch:** Add cache strategy for reference data and RBAC grants.
- **Future Enhancement:** Add tenant-aware read replicas and partitioning.

## Monitoring Checklist

- **Required Before Launch:** Add metrics for API latency, errors, DB pool, queue lag, worker failures, and WebSocket connections.
- **Required Before Launch:** Add dashboards and alerts.
- **Required Before Launch:** Define SLOs and alert thresholds.
- **Recommended Before Launch:** Add synthetic health checks.
- **Future Enhancement:** Add business KPI monitoring.

## Logging Checklist

- **Required Before Launch:** Redact secrets in all log paths.
- **Required Before Launch:** Include request ID, tenant ID, user ID, route, status, and duration.
- **Required Before Launch:** Ship structured logs to centralized storage.
- **Recommended Before Launch:** Add log retention and access policies.
- **Future Enhancement:** Add audit-log integrity monitoring.

## Backup Checklist

- **Required Before Launch:** Enable RDS automated backups and PITR.
- **Required Before Launch:** Define RPO/RTO.
- **Required Before Launch:** Test restore from backup before launch.
- **Recommended Before Launch:** Add backup validation job.
- **Future Enhancement:** Add cross-region backup replication.

## AWS Checklist

- **Required Before Launch:** Create IaC for VPC, ALB, ECS/EKS, RDS, Redis, S3, KMS, IAM, and CloudWatch.
- **Required Before Launch:** Use Secrets Manager or SSM Parameter Store.
- **Required Before Launch:** Deploy RDS Multi-AZ.
- **Recommended Before Launch:** Add blue/green or canary deployment.
- **Future Enhancement:** Add multi-region DR architecture.

## Docker Checklist

- **Required Before Launch:** Add production images for API, workers, and frontend if self-hosted.
- **Required Before Launch:** Add healthchecks.
- **Required Before Launch:** Scan images for vulnerabilities.
- **Recommended Before Launch:** Add SBOM generation.
- **Future Enhancement:** Add image signing and provenance.

## Nginx Checklist

- **Required Before Launch:** Validate TLS config and security headers.
- **Required Before Launch:** Add route-specific upload/body limits.
- **Required Before Launch:** Confirm WebSocket upgrade behavior behind production load balancer.
- **Recommended Before Launch:** Add structured access logs.
- **Future Enhancement:** Add edge caching for static assets.

## S3 Checklist

- **Required Before Launch:** Use private buckets only.
- **Required Before Launch:** Enable KMS encryption.
- **Required Before Launch:** Validate signed URL expiration.
- **Required Before Launch:** Add upload malware scanning.
- **Recommended Before Launch:** Add lifecycle/retention rules.
- **Future Enhancement:** Add storage tiering.

## WebSocket Checklist

- **Required Before Launch:** Add Redis adapter for multi-instance Socket.IO.
- **Required Before Launch:** Define sticky-session or compatible load-balancer strategy.
- **Required Before Launch:** Add connection limits and rate limits.
- **Recommended Before Launch:** Add WebSocket metrics and alerts.
- **Future Enhancement:** Add replay/resync protocol for missed events.

## Worker Checklist

- **Required Before Launch:** Use durable job/outbox tables or managed queue.
- **Required Before Launch:** Add idempotency keys and dead-letter handling.
- **Required Before Launch:** Add distributed locking or atomic claim semantics.
- **Recommended Before Launch:** Add worker dashboard and retry controls.
- **Future Enhancement:** Add priority queues per workload.

## CI/CD Checklist

- **Required Before Launch:** Add CI workflow for backend, backend-new, and frontend.
- **Required Before Launch:** Run lint, build, tests, integration tests, Prisma validation, npm audit, and Docker build.
- **Required Before Launch:** Add migration dry-run/review gate.
- **Required Before Launch:** Block deploy on critical/high vulnerabilities.
- **Recommended Before Launch:** Add preview environments.
- **Future Enhancement:** Add automated rollback and release scorecards.

## Assumptions

- This checklist is root-level because the production readiness audit covered the entire project.
- This is documentation only; no application code changes are part of this checklist.
- The checklist reflects current audit findings and should be updated as launch blockers are resolved.
