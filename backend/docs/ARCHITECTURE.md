# Backend Architecture

Backend uses feature-based modules with MySQL.

Each complex module owns routes, validators, controllers, services, and repositories. Simple CRUD modules use the shared tenant-safe resource factory while remaining mounted from their feature folder.

## Flow

`route -> validation -> auth -> tenant -> RBAC/permissions -> controller -> service -> repository -> MySQL`

## Multi-Tenancy

Tenant tables use `clinic_id`, `created_by`, `updated_by`, `is_deleted`, `created_at`, and `updated_at`. SQL queries use parameter binding. Tenant repositories always include `clinic_id` and `is_deleted = FALSE`.

Super Admin tenant overrides require valid UUID values. Role guards and granular permission guards protect module endpoints.

## Transactions

Clinic onboarding, refresh-token rotation, appointment booking, queue token generation, and payment recording use MySQL transactions.

Clinic onboarding assigns a bounded default trial. Subscription limits are checked transactionally before supported writes.

WhatsApp delivery uses exponential retries. Stale processing records recover before each worker batch.

## Runtime

Docker Compose runs MySQL, API, notification worker, and Nginx. `ecosystem.config.cjs` supports hosts with PM2 installed by operations.

Structured request logs include request IDs and latency. Sentry captures server errors when `SENTRY_DSN` is configured.

## Migrations

Run:

```powershell
npm run db:migrate
```

Production containers execute migrations before starting API.

Run isolated MySQL integration tests:

```powershell
npm run test:integration
```

`MYSQL_TEST_DATABASE` must end with `_test`.
