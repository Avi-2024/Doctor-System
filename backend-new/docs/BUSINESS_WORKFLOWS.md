# Business Workflows

## Workflow Principles

- Services own workflows and transaction boundaries.
- Repositories only persist and query data.
- Critical workflows create audit records inside the same transaction whenever possible.
- Critical asynchronous effects use an outbox event written inside the transaction.
- External calls to WhatsApp, S3, email, SMS, or other providers happen after commit through workers.
- Every workflow validates tenant ownership before reading, updating, exporting, restoring, or deleting data.
- State transitions are explicit and invalid transitions return business errors.

## Clinic Onboarding

Transaction boundary:

1. Validate Super Admin authority.
2. Validate clinic code, owner email, default branch input, subscription plan, and tenant uniqueness.
3. Create clinic.
4. Create owner user.
5. Create system/default clinic roles.
6. Create default permissions or role permission links.
7. Assign Clinic Owner role.
8. Create trial or selected subscription.
9. Create primary branch.
10. Create default settings.
11. Create audit record.
12. Create outbox event `clinic.created.v1`.
13. Commit.

Rollback conditions:

- Duplicate clinic code.
- Duplicate owner email in tenant scope.
- Invalid subscription plan.
- Role or permission setup failure.
- Default branch failure.

## Authentication: Login

1. Validate email, password, optional clinic context.
2. Find active user.
3. Verify bcrypt password.
4. Verify clinic is active for clinic users.
5. Resolve roles and effective permissions.
6. Create session/refresh token record.
7. Generate short-lived access token.
8. Generate refresh token and store only hash.
9. Set HTTP-only secure cookies.
10. Audit login success or failure.

Failure handling:

- Invalid credentials return `401`.
- Disabled user returns `403`.
- Suspended clinic returns `403`.
- Public response never confirms whether the account exists.

## Authentication: Refresh Rotation

1. Validate refresh token cookie.
2. Verify JWT signature and expiry.
3. Hash presented refresh token.
4. Load active session token.
5. Detect reuse.
6. Revoke old refresh token.
7. Issue new access and refresh token pair.
8. Store new refresh token hash.
9. Update session last-used metadata.
10. Audit refresh.

Reuse detection:

- Revoke all user sessions.
- Increment token version where required.
- Emit security audit event.
- Return `401`.

## Password Reset

Request:

1. Validate email and clinic context.
2. Return generic success even when user does not exist.
3. If user exists and is active, generate raw reset token.
4. Store token hash with expiry.
5. Queue reset delivery notification.
6. Audit request.

Confirm:

1. Hash submitted token.
2. Load unused, unexpired token.
3. Update password hash.
4. Mark reset token used.
5. Increment token version.
6. Revoke all sessions.
7. Audit success.

## Staff Invitation

1. Clinic Owner or authorized admin validates subscription user limit.
2. Create pending user.
3. Assign at least one role.
4. Generate invitation token and store hash.
5. Create invitation record.
6. Queue invitation notification.
7. Audit invitation.
8. On acceptance, validate token, set password, activate user, create session, audit activation.

## RBAC Role Assignment

1. Authenticate actor and resolve tenant.
2. Validate actor has `rbac.manage` or equivalent.
3. Validate actor cannot assign stronger roles than they possess.
4. Validate reserved platform permissions are not assigned to tenant roles.
5. Create or revoke role assignment.
6. Invalidate permission cache.
7. Increment token version or revoke sessions for high-risk changes.
8. Audit role assignment or revocation.
9. Emit RBAC event.

## Patient Registration

1. Validate demographics, contact data, and duplicate criteria.
2. Generate tenant-scoped patient code.
3. Create patient with `clinic_id`.
4. Create audit record.
5. Emit `patient.created.v1`.
6. Return patient profile.

Rules:

- Patient code is unique within clinic.
- Patient code is immutable after creation.
- Archived patients cannot be used for new clinical workflows without restore.

## Patient Record Creation

1. Validate patient exists in current clinic.
2. Validate record type and payload.
3. If files are involved, use Storage workflow first or attach existing storage metadata.
4. Create patient record.
5. Audit create/view/export as applicable.
6. Emit patient record event.

Rules:

- Clinical data access is audited.
- Files are stored only through Storage module.

## Appointment Booking

Transaction boundary:

1. Validate patient, doctor, and branch belong to clinic.
2. Validate appointment date is not in the past.
3. Validate doctor schedule.
4. Validate doctor leave.
5. Validate no overlapping appointment.
6. Create appointment.
7. Create audit record.
8. Create outbox event `appointment.created.v1`.
9. Create reminder notification records if configured.
10. Commit.

State model:

- Scheduled -> Confirmed
- Scheduled -> Cancelled
- Confirmed -> Checked In
- Checked In -> In Consultation
- In Consultation -> Completed
- Confirmed -> No Show

All other transitions are invalid.

## Queue Check-In

Transaction boundary:

1. Validate appointment/patient/doctor/branch ownership.
2. Lock queue counter for clinic, branch, and date.
3. Increment counter.
4. Create queue entry with deterministic token number.
5. Update appointment to checked-in where applicable.
6. Audit check-in.
7. Emit `queue.created.v1` and `appointment.checked_in`.
8. Commit.
9. Socket publisher broadcasts to clinic and branch rooms.

Rules:

- Token numbers are unique per clinic, branch, and date.
- Counter conflicts are retried.
- No skipped token without audit trail.

## Consultation

1. Validate patient, doctor, optional appointment, and queue entry ownership.
2. Create draft consultation.
3. Attach notes, diagnoses, treatment plan, follow-up recommendations.
4. Add vitals and references through their modules.
5. On finalization, lock consultation from normal edits.
6. Create timeline entry.
7. Audit create/update/view/finalize/export.
8. Emit consultation events.

Rules:

- Finalized consultations are immutable except through an amendment workflow.
- Clinical records are permanently auditable.

## Vitals

1. Validate patient and optional consultation ownership.
2. Validate measurement units and ranges.
3. Create vitals record with timestamp.
4. Audit create/update/view.
5. Emit `vitals.recorded.v1`.

Rules:

- Historical vitals are preserved.
- Doctors may update before consultation finalization.

## Prescription Finalization

Transaction boundary:

1. Validate patient, doctor, and consultation ownership.
2. Validate medication items and instructions.
3. Create prescription draft or update draft.
4. Generate medication snapshot.
5. Finalize prescription.
6. Create audit record.
7. Emit `prescription.finalized.v1`.
8. Commit.

Rules:

- Only doctors finalize prescriptions.
- Finalized prescriptions are immutable.
- Template changes never affect existing prescriptions.

## Lab Order

Transaction boundary:

1. Validate patient and consultation ownership.
2. Validate at least one active lab test.
3. Create lab order.
4. Create lab order items with test and price snapshots.
5. Create audit record.
6. Emit `lab_order.created.v1`.
7. Commit.

Rules:

- Cancelled orders cannot be completed.
- Partial orders are prohibited.

## Lab Report Publication

1. Validate order is completed or eligible for report upload.
2. Upload report file through Storage module.
3. Create or update lab report draft.
4. Review result.
5. Publish report.
6. Audit create/update/view/download/publish.
7. Emit `lab_report.published.v1`.
8. Queue patient and doctor notifications.

Rules:

- Published reports become immutable.
- Reports require signed URLs for download.

## Invoice and Payment

Invoice transaction:

1. Validate source workflow and patient ownership.
2. Create invoice header.
3. Create invoice items.
4. Calculate subtotal, discounts, tax, total, due amount server-side.
5. Finalize or issue invoice.
6. Audit.
7. Emit invoice event.

Payment transaction:

1. Lock invoice.
2. Validate outstanding amount.
3. Prevent duplicate payment through idempotency key.
4. Create payment.
5. Create payment allocation.
6. Update invoice balance/status.
7. Generate receipt.
8. Audit.
9. Emit payment event.

Rules:

- Payments cannot exceed outstanding amount.
- Negative balances are prohibited.
- Refunds require original payment.
- Financial records are immutable after finalization except adjustment/refund workflows.

## Notifications

1. Business event occurs after commit.
2. Notification consumer resolves recipient.
3. Validate recipient contact, tenant, preferences, channel, and template.
4. Create notification and delivery job.
5. Worker claims job.
6. Provider adapter delivers.
7. Status and delivery history are persisted.
8. Retries occur with backoff.
9. Dead-letter after retry exhaustion.

Rules:

- Business requests never wait for provider delivery.
- Duplicate delivery must be prevented.
- Notification failures do not rollback business data.

## WhatsApp Outbound

1. Notification selects WhatsApp channel.
2. Resolve clinic WhatsApp account and approved template.
3. Resolve variables and validate template payload.
4. Persist WhatsApp message before provider call.
5. Worker sends through provider adapter.
6. Persist provider response and status.
7. Audit sent/failed.
8. Emit WhatsApp event.

## WhatsApp Webhook

1. Receive raw webhook payload.
2. Validate provider signature, source, timestamp, and payload.
3. Enforce idempotency using provider event id.
4. Persist webhook event.
5. Update message or account/template status.
6. Audit webhook received/processed/failed.
7. Emit status event.

## Storage Upload

1. Authenticate and resolve tenant.
2. Authorize module/entity access.
3. Validate size, MIME type, extension, checksum, module, and entity.
4. Virus scan.
5. Generate storage key under `tenant/{clinicId}/{module}/{year}/{month}/{file}`.
6. Upload to S3.
7. Persist metadata.
8. Audit upload.
9. Return metadata and signed URL when appropriate.

Failure recovery:

- If upload succeeds but metadata fails, delete object.
- If metadata succeeds but upload fails, rollback metadata.
- Orphan detection job runs daily.

## Report Export

1. Validate report permission and tenant.
2. Create report request or export job.
3. Worker generates report from authoritative data or aggregates.
4. Store export through Storage module.
5. Persist export metadata.
6. Audit report viewed/generated/exported.
7. Notify requester.

Rules:

- Heavy reports are asynchronous.
- Cross-tenant reports are Super Admin only.

## Tenant Suspension and Archive

Suspension:

1. Super Admin changes clinic status.
2. Login is disabled.
3. API writes denied.
4. Notifications stopped.
5. WebSocket connections disconnected.
6. Audit and emit `clinic.suspended.v1`.

Archive:

1. Super Admin archives clinic.
2. Data becomes read-only.
3. Reporting, exports, and audit review remain available.
4. Writes are prohibited.

Deletion:

- Direct deletion is prohibited.
- Purge requires retention period expiry, Super Admin approval, and audit trail.

