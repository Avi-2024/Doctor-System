# Tenant Isolation Architecture

## Tenant Model

The tenant root is `Clinic`.

Each clinic owns:

- Users.
- Branches.
- Patients.
- Appointments.
- Queue entries.
- Consultations.
- Vitals.
- Prescriptions.
- Lab records.
- Billing records.
- Notifications.
- WhatsApp records.
- Storage metadata.
- Reports.
- Audit logs.

The platform uses a shared MySQL database and shared schema with strict logical isolation.

## Data Classification

| Classification | Examples | Isolation Rule |
| --- | --- | --- |
| Tenant-owned | patients, appointments, consultations, prescriptions, invoices, notifications, storage_files | Must include `clinic_id`; every query filters by `clinic_id`. |
| Platform-owned | subscription_plans, system roles, reserved permissions, platform settings | Super Admin only; no tenant ownership unless customized. |
| Shared reference | countries, languages, currencies, timezones, medical codes | Read-only; no tenant-specific data. |

## Request Context

Every authenticated request receives immutable context:

- requestId.
- userId.
- clinicId.
- branchId.
- roleIds.
- permissions.
- ipAddress.
- userAgent.
- requestTimestamp.

Tenant context:

- `clinicId`.
- `branchId`.
- `tenantType`.

Clinic users derive tenant context from the token. Super Admin may explicitly provide tenant context for support operations, but the provided clinic must exist, be valid, and be active unless the operation is a lifecycle/recovery operation.

## Layer Enforcement

### Authentication Layer

- Validates identity.
- Resolves user's clinic.
- Blocks suspended clinic login.
- Blocks disabled users.
- Does not make authorization decisions.

### Tenant Resolution Layer

- Attaches `req.tenant`.
- Prevents non-Super Admin tenant override.
- Validates explicit Super Admin tenant context.

### Authorization Layer

- Evaluates permissions within current tenant.
- Applies scopes: OWN, ASSIGNED, BRANCH, CLINIC, ALL.
- `ALL` is platform-wide only for Super Admin.
- Clinic users can never cross tenant boundaries.

### Controller Layer

- Passes tenant context into services.
- Does not infer tenant ownership.

### Service Layer

- Validates resource ownership before read, update, delete, export, restore, or finalization.
- Coordinates branch ownership where required.
- Rejects cross-clinic relationships.

### Repository Layer

- Final persistence enforcement point.
- Every tenant-owned method requires `clinicId`.
- Tenant-less repository methods for tenant-owned tables are prohibited.
- Query builders always include `clinic_id` and `is_deleted = false` unless explicitly reading archived records.

### Database Layer

- Tenant-owned tables include `clinic_id`.
- Tenant-first indexes are mandatory.
- Foreign keys prevent orphaned records.
- Unique constraints include `clinic_id` where uniqueness is tenant-local.

## Branch Isolation

Branches provide sub-tenant operational segmentation.

Branch-scoped resources:

- Appointments.
- Queue entries.
- Doctor schedules.
- Doctor leaves where branch-specific.
- Branch dashboards.
- Branch reports.
- Operational notifications.

Rules:

- Branch isolation never bypasses clinic isolation.
- Branch users can only access branch-scoped data where their scope allows it.
- Clinic Owner can access all branches in the clinic.
- Super Admin can access branches only through explicit tenant context.

## Storage Isolation

S3 key standard:

`tenant/{clinicId}/{module}/{year}/{month}/{file}`

Rules:

- Every storage metadata record contains `clinic_id`.
- Signed URL generation validates tenant, module, entity, and permission.
- Direct bucket access is prohibited.
- Cross-tenant storage access is impossible through API.
- Storage workers must operate with tenant context.

## WebSocket Isolation

Connection context:

- userId.
- clinicId.
- roles.
- permissions.
- sessionId.

Room patterns:

- `clinic:{clinicId}`
- `clinic:{clinicId}:branch:{branchId}`
- `doctor:{doctorId}`
- `user:{userId}`

Rules:

- Every socket connection is authenticated.
- Tenant context is immutable.
- Clients cannot self-select rooms.
- Room assignment is server-controlled.
- Broadcasts include tenant validation.
- Session revocation disconnects active sockets.

## Notification Isolation

Notification records include:

- clinic_id.
- recipient_id.
- recipient_type.
- channel.
- payload.

Rules:

- Recipient must belong to the same clinic.
- Notification workers process within tenant boundaries.
- WhatsApp accounts, messages, and templates contain `clinic_id`.
- Cross-tenant communication is prohibited.

## Reporting and Export Isolation

Rules:

- Report queries include `clinic_id`.
- Clinic reports cannot mix tenant data.
- Report exports are tenant-scoped.
- Cross-tenant aggregation is restricted to Super Admin platform reports.
- Exports use signed URLs and retention windows.

## Cache Isolation

All cache keys include tenant identifiers.

Correct:

- `clinic:{clinicId}:patients:list:{hash}`
- `clinic:{clinicId}:appointments:today`
- `clinic:{clinicId}:permissions:user:{userId}:v:{version}`

Forbidden:

- `patients:list`
- `appointments:today`
- `permissions:{userId}`

Cache invalidation must be tenant-scoped.

## Event Isolation

Every tenant-owned event includes:

- tenantId.
- eventId.
- eventName.
- eventVersion.
- correlationId.
- causationId.
- producer.
- payload.

Rules:

- Events without tenant context are invalid for tenant-owned workflows.
- Consumers validate ownership before side effects.
- Sensitive payload data is minimized.

## Tenant Lifecycle

### Provisioning

Transaction creates:

- Clinic.
- Owner user.
- Default roles.
- Default permissions/assignments.
- Trial subscription.
- Default settings.
- Default branch.
- Audit log.
- Outbox event.

Partial tenant creation is prohibited.

### Suspension

Suspended clinic behavior:

- Login disabled.
- API access denied except approved administrative/recovery paths.
- Notifications stopped.
- WebSocket access denied/disconnected.
- Data remains intact.

### Archive

Archived clinic behavior:

- Read-only.
- Reporting, exports, and audit review allowed.
- Writes prohibited.

### Deletion/Purge

Direct deletion is prohibited.

Lifecycle:

`Active -> Suspended -> Archived -> Retention Period -> Permanent Purge`

Purges require:

- Super Admin authorization.
- Retention validation.
- Backup/export review.
- Audit record.

## Testing Requirements

Tenant isolation tests must cover:

- Cross-clinic read attempt.
- Cross-clinic update attempt.
- Cross-clinic delete/archive attempt.
- Cross-clinic export attempt.
- Cross-clinic file signed URL attempt.
- Cross-clinic socket subscription attempt.
- Cross-clinic notification delivery prevention.
- Super Admin explicit tenant context.
- Branch scope restrictions.
- Repository method missing `clinicId` fails or is impossible.

## Invariants

- Every tenant-owned table contains `clinic_id`.
- Every tenant query filters by `clinic_id`.
- Tenant context is resolved after authentication and before authorization.
- Repositories never infer tenant independently.
- Permissions never bypass tenant boundaries.
- Cache keys are tenant-scoped.
- Storage keys are tenant-scoped.
- Socket rooms are tenant-scoped.
- Reports and exports are tenant-scoped.
- Events include tenantId.
- Cross-tenant access is a security incident.

