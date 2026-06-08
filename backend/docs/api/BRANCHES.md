# Branches API

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/branches`, `/api/v1/branches/:id`  
Description: Create, list, read, update, or soft-delete clinic branches.  
Request: Branch payload, UUID path, or pagination query.  
Response: Standard response; lists include pagination metadata.  
Permissions: `clinics:manage`.
