/**
 * Backend Technical Plan
 * Documents modular MySQL architecture.
 */

# Doctor System Technical Plan

## Architecture

Doctor System uses Node.js, Express, MySQL, JWT refresh rotation, AWS S3, Socket.IO, and Meta WhatsApp Cloud API.

Backend follows feature-based modular architecture:

```text
backend/src/
|-- common/
|   |-- constants/
|   |-- errors/
|   |-- middleware/
|   |-- modules/
|   |-- repositories/
|   `-- utils/
|-- config/
|-- database/
|   `-- migrations/
|-- modules/
|   |-- auth/
|   |-- clinics/
|   |-- users/
|   |-- patients/
|   |-- appointments/
|   |-- queue/
|   |-- clinical/
|   |-- prescriptions/
|   |-- lab/
|   |-- billing/
|   `-- integrations/
|-- app.js
`-- server.js
```

## Request Flow

`route -> validator -> auth/tenant/RBAC -> controller -> service -> repository -> MySQL`

## Data Standards

- MySQL migrations own schema changes.
- Tenant records carry `clinic_id`.
- Tenant indexes start with `clinic_id`.
- Writes use transactions where needed.
- Deletes remain soft deletes.
- SQL is parameterized.
- Responses use `{ success, message, data, meta? }`.
