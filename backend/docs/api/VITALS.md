# Vitals API

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/vitals`, `/api/v1/vitals/:id`  
Description: Manage patient vital records.  
Request: Vital payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: `clinical:read` or `clinical:write`.
