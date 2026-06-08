# Lab Tests API

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/lab-tests`, `/api/v1/lab-tests/:id`  
Description: Manage clinic lab test catalog.  
Request: Lab test payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: `lab:manage`; writes require management roles.
