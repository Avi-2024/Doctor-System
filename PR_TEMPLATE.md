# Pull Request Template

## Summary

Describe what changed and why.

## Scope

- [ ] Backend `backend-new`
- [ ] Frontend
- [ ] Database/Prisma
- [ ] Documentation
- [ ] Infrastructure
- [ ] Tests only

## Launch Scope

- [ ] In outpatient MVP/V1 scope
- [ ] Explicitly approved exception
- [ ] Does not introduce V2-only functionality

## API Changes

List new or changed endpoints, request/response shapes, and compatibility notes.

## Database Changes

- [ ] No database changes
- [ ] Prisma/schema changes included
- [ ] Migration reviewed
- [ ] Migration dry-run completed
- [ ] Rollback/forward-fix plan included

## Security Checklist

- [ ] No secrets committed
- [ ] Logs/errors/audit payloads redacted
- [ ] Auth/session behavior reviewed
- [ ] Tenant isolation reviewed
- [ ] RBAC reviewed
- [ ] Upload/webhook/provider behavior reviewed if applicable
- [ ] npm audit/security scan reviewed

## Tenant And RBAC Checklist

- [ ] Tenant context comes from trusted context
- [ ] No client-provided tenant ID overrides authenticated scope
- [ ] Protected routes have permission guards
- [ ] Platform bypass is explicit and audited
- [ ] Cross-tenant tests added for high-risk paths

## Audit And Observability

- [ ] Audit logs added for sensitive reads/writes
- [ ] Request logs include request ID and tenant/user context where available
- [ ] Metrics/alerts updated for production behavior
- [ ] Errors use standard response envelope

## Tests Run

Paste exact commands:

```bash
npm run lint
npm run build
npm test
```

Add any integration, E2E, migration, or manual test results.

## Screenshots Or API Examples

Add screenshots, curl examples, or Postman examples when helpful.

## Rollback Plan

Describe how to roll back this change. Include migration compatibility if applicable.

## Reviewer Notes

Call out risky areas, assumptions, tradeoffs, or follow-up work.
