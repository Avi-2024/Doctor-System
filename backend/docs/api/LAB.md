# Lab API

Base routes: `/api/v1/lab-tests`, `/api/v1/lab-orders`, `/api/v1/lab-reports`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage test catalog, lab orders, and reports.  
Request: Module payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: Clinic staff; catalog writes require management.
