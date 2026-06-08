# Prescriptions API

Base routes: `/api/v1/prescriptions`, `/api/v1/prescription-templates`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage prescriptions and reusable templates.  
Request: Prescription or template payload.  
Response: Standard response.  
Permissions: Super Admin, Clinic Owner, or Doctor.

Method: `GET`  
Route: `/api/v1/prescriptions/:id/export`  
Description: Fetch structured printable prescription record.  
Request: Prescription UUID.  
Response: Standard response containing clinic, patient, doctor, medicines, and advice.  
Permissions: `prescriptions:manage`.
