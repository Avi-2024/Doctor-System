# Schedules API

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/doctor-schedules`, `/api/v1/doctor-schedules/:id`  
Description: Manage doctor weekly schedules.  
Request: Schedule payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: `appointments:read` or `appointments:write`.

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/doctor-leaves`, `/api/v1/doctor-leaves/:id`  
Description: Manage doctor leave periods.  
Request: Leave payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: `appointments:read` or `appointments:write`.
