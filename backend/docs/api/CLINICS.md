# Clinics API

Base route: `/api/v1/clinics`

Method: `POST`  
Route: `/onboard`  
Description: Transactionally create clinic and owner.  
Request: `{ clinic, owner }`  
Response: Standard response containing clinic and owner.  
Permissions: Public bootstrap.

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: List or read tenant clinics. Super Admin lists all clinics without a tenant filter.  
Request: Clinic payload, UUID path, or pagination query.  
Response: Standard response; lists include pagination metadata.  
Permissions: Super Admin or Clinic Owner.

Method: `PATCH`  
Route: `/current`  
Description: Update current clinic profile, branding, contact, and timezone.  
Request: Allowlisted clinic profile fields.  
Response: Standard response containing clinic.  
Permissions: Super Admin or Clinic Owner.

Method: `PATCH | DELETE`  
Route: `/:id/status`, `/:id`  
Description: Update clinic status or soft-delete clinic.  
Request: Clinic UUID and status payload.  
Response: Standard response.  
Permissions: Super Admin.

Base route: `/api/v1/branches`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage tenant clinic branches.  
Request: Branch payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: Super Admin or Clinic Owner.
