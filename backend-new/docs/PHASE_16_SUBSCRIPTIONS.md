# PHASE 16 - Subscriptions

## Objective

Build full commercial subscription, plan, feature, limit, usage, renewal, expiry, and enforcement workflows.

## Modules

- Subscription Plans
- Clinic Subscriptions
- Subscription Usage
- Subscription Events
- Subscription Enforcement

## Dependencies

- Phase 04 Tenants.
- Phase 10 Billing.
- Phase 12 Notifications.
- Jobs.
- Audit logs.

## Deliverables

- Plan CRUD/versioning.
- Plan features.
- Plan limits.
- Clinic subscription assignment.
- Current subscription API.
- Usage tracking.
- Limit enforcement service.
- Renewal workflow.
- Expiry/grace/suspension workflow.
- Subscription notifications.
- Subscription workers.
- Subscription audit and events.

## Tests

- One active subscription per clinic.
- Plan version preserved.
- Limit enforcement blocks overuse.
- Usage counters tenant-scoped.
- Renewal transaction.
- Expiry worker applies grace/suspension.
- Billing integration.

## Exit Criteria

- Commercial SaaS enforcement is server-side, auditable, and tied to tenant lifecycle.

## Risks

- Limits can be bypassed if enforcement is scattered across modules.
- Billing/subscription coupling must remain transactional where money is involved.

