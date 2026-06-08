# Clinical API

Base routes: `/api/v1/clinical`, `/api/v1/vitals`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage consultations and patient vitals.  
Request: Clinical payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: Clinical roles; vitals also allow reception staff.
