# PHASE 08 - Clinical

## Objective

Build consultation, vitals, prescription, and clinical timeline workflows with immutable finalization.

## Modules

- Clinical
- Vitals
- Prescriptions
- Prescription Templates

## Dependencies

- Phase 05 Patients.
- Phase 06 Appointments.
- Phase 07 Queue.
- RBAC and audit.

## Deliverables

- Consultation create/update/finalize.
- Clinical timeline.
- Vitals create/update/history.
- Prescription draft/update/finalize/export hook.
- Prescription items.
- Prescription templates.
- Amendment guard for finalized records.
- Clinical read/export audit.

## Tests

- Finalized consultation immutable.
- Finalized prescription immutable.
- Doctor ownership/assignment.
- PHI read audited.
- Vitals unit validation.
- Prescription snapshot preserved.
- Timeline tenant isolation.

## Exit Criteria

- Clinical records become authoritative treatment history.

## Risks

- JSON-heavy clinical data may limit reporting.
- Amendment workflow must be explicit before production.

