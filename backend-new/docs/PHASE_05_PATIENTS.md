# PHASE 05 - Patients

## Objective

Build the patient registry and patient records foundation with strict PHI audit and tenant isolation.

## Modules

- Patients
- Patient Records

## Dependencies

- Phase 04 Tenants.
- Phase 03 RBAC.
- Audit logs.
- Storage metadata interface from Phase 11 can be integrated later.

## Deliverables

- Patient registration.
- Patient update.
- Patient archive/restore.
- Patient search.
- Patient records create/read/update/archive.
- PHI read audit hooks.
- Patient timeline base query.
- Duplicate patient prevention rules.

## Tests

- Patient code unique per clinic.
- Search filters tenant-scoped.
- Cross-tenant read/update/delete blocked.
- PHI view audited.
- Archive and restore behavior.
- Validation for demographics/contact fields.

## Exit Criteria

- Patient data can safely support appointments, clinical, lab, billing, and reports.

## Risks

- Duplicate patient policy affects downstream clinical history.
- Overly generic patient records can weaken reporting unless later normalized.

