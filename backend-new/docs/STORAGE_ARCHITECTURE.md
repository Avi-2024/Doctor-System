# Storage Architecture

## Purpose

Storage manages binary assets while MySQL remains the source of truth for metadata and business state.

Supported file categories:

- Patient documents.
- Lab reports.
- Prescriptions.
- Exports.
- Clinic assets.
- Attachments.

Storage is infrastructure. Files are not business records; metadata is authoritative.

## Technology

- AWS S3 for object storage.
- MySQL metadata through `storage_files`.
- Signed URL service for temporary access.
- Virus scanning layer.
- Storage workers for orphan detection, retention, archive, and purge.

## Storage Principles

- Every file belongs to a clinic.
- Every file has metadata.
- Metadata is authoritative.
- Objects are private.
- Direct bucket access is prohibited.
- Signed URLs are mandatory.
- Access is authorized and audited.
- Objects are immutable after upload.
- Deleted files remain recoverable during retention.

## Ownership Model

Ownership chain:

`Clinic -> Module -> Business Record -> Storage Object`

Examples:

- Patient document: Clinic -> Patient -> Patient Record -> File.
- Lab report: Clinic -> Lab Report -> File.
- Prescription export: Clinic -> Prescription -> Export File.
- Audit export: Clinic or Platform -> Audit Export -> File.

Every file must resolve ownership to a clinic unless it is a platform-only asset.

## Metadata Model

Primary table:

- `storage_files`

Required fields:

- id.
- clinic_id.
- module_name.
- entity_type.
- entity_id.
- storage_key.
- file_name.
- file_size.
- mime_type.
- checksum.
- uploaded_by.
- status.
- created_at.
- deleted_at.
- retention_until.

Supporting tables:

- `storage_folders`.
- `storage_access_logs`.

Missing metadata means the file does not exist from the platform perspective.

## Storage Key Standard

Pattern:

`tenant/{clinicId}/{module}/{year}/{month}/{file}`

Examples:

- `tenant/123/patients/2026/06/file.pdf`
- `tenant/123/labs/2026/06/report.pdf`
- `tenant/123/exports/2026/06/export.zip`

Rules:

- Do not use original filenames as trusted keys.
- Generate collision-resistant object names.
- Keep clinic id in every tenant object key.
- Keep module path for lifecycle and investigation.

## Upload Flow

1. Upload request.
2. Authentication.
3. Tenant validation.
4. Authorization.
5. Module/entity validation.
6. File size validation.
7. MIME and extension validation.
8. Checksum validation.
9. Virus scan.
10. Generate storage key.
11. Upload to S3.
12. Persist metadata.
13. Create audit event.
14. Return success.

Upload completion requires both:

- S3 object.
- Metadata record.

## Failure Recovery

Upload fails:

- Do not persist metadata.

Metadata persistence fails after object upload:

- Delete object.
- Audit recovery failure if delete fails.

Virus scan fails:

- Reject upload.
- Do not persist business metadata.

Partial uploads:

- Must not survive.
- Orphan detection job verifies.

## Validation Rules

Validate:

- Maximum size.
- Allowed MIME type.
- Allowed extension.
- MIME/extension match.
- Checksum.
- Tenant.
- Module.
- Entity ownership.
- User permission.

Allowed file types should be module-specific:

- Patient/lab/prescription documents: PDF, common image formats where approved.
- Exports: CSV, PDF, ZIP.
- Clinic assets: image formats.

Executable files are prohibited.

## Virus Scanning

Every upload must be virus scanned before becoming available.

Options:

- Synchronous scan for small files.
- Quarantine then asynchronous scan for larger files.

Status model:

- Upload Requested.
- Validating.
- Virus Scanning.
- Stored.
- Available.
- Archived.
- Deleted.
- Purged.

Files in scanning/quarantine state are not downloadable.

## Download Flow

1. Request file access.
2. Authenticate.
3. Resolve tenant.
4. Authorize module/entity access.
5. Validate metadata exists and is available.
6. Generate signed URL.
7. Audit signed URL generation or download.
8. Return signed URL.

Signed URL duration:

- Default: 5 minutes.
- Maximum: 15 minutes for approved use cases.

## Deletion and Retention

Deletion is soft:

- Mark metadata deleted.
- Set deleted_at and deleted_by.
- Keep object until retention policy allows purge.

Retention:

- Patient documents: 10 years.
- Lab reports: 10 years.
- Billing exports: 7 years.
- Audit exports: permanent.
- Temporary report exports: usually 30 days.

Purge requires:

- Retention expiry.
- Authorized job.
- Audit trail.

## Export Storage

Path:

`tenant/{clinicId}/exports/`

Characteristics:

- Temporary.
- Signed URL access only.
- Expiration required.
- Automatically purged after retention window.

## Access Control

Storage permissions:

- `storage.upload`
- `storage.download`
- `storage.delete`
- `storage.restore`

Module permissions also apply.

Examples:

- Lab report download requires lab report read/download permission and storage download permission.
- Patient document upload requires patient record permission and storage upload permission.
- Audit export download requires audit export permission.

## Audit Events

Audit:

- Upload.
- Download.
- Signed URL generation.
- Delete.
- Restore.
- Archive.
- Recovery.
- Export creation.

Audit metadata:

- actor.
- clinic.
- file id.
- entity type/id.
- operation.
- timestamp.
- ip address.
- user agent.

## Monitoring

Metrics:

- storage usage by clinic.
- upload rate.
- download rate.
- failure rate.
- virus scan failures.
- archive volume.
- purge volume.
- orphan count.
- signed URL generation count.

Alerts:

- S3 unavailable.
- virus scan unavailable.
- orphan count above threshold.
- metadata/object mismatch.
- suspicious download volume.

## Invariants

- Every file belongs to a clinic.
- Every file has metadata.
- Every upload is virus scanned.
- Every download is authorized.
- Every object uses signed URLs.
- Direct public access is prohibited.
- Storage is never the source of truth.
- Metadata remains authoritative.
- Deleted files remain recoverable during retention.
- Cross-tenant access is impossible.
- Every file operation is auditable.
- All storage access passes through StorageService.

