# PHASE 11 - Storage

## Objective

Build secure AWS S3-backed storage abstraction and metadata control.

## Modules

- Storage
- Storage access logs
- Storage retention workers

## Dependencies

- Phase 04 Tenants.
- Phase 03 RBAC.
- Audit logs.

## Deliverables

- S3 adapter boundary.
- Upload validation.
- MIME/extension/size/checksum checks.
- Virus scanning interface.
- Storage key generation.
- Metadata persistence.
- Signed URL generation.
- Download authorization.
- Soft delete/restore.
- Access audit logs.
- Orphan detection worker design.

## Tests

- File type mismatch rejected.
- Oversized file rejected.
- Cross-tenant signed URL blocked.
- Metadata rollback on upload failure.
- Object cleanup on metadata failure.
- Access logging generated.

## Exit Criteria

- Business modules can store files only through StorageService.

## Risks

- Virus scanning provider must be chosen before production uploads.
- Direct S3 access must remain impossible.

