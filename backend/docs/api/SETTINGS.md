# Settings API

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/settings`, `/api/v1/settings/:id`  
Description: Manage tenant or platform settings.  
Request: Setting payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: `settings:manage`; platform settings require Super Admin.
