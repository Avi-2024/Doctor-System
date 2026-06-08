# Queue API

Method: `POST`  
Route: `/api/v1/queue/check-in`, `/api/v1/queue/call-next`  
Description: Check in patient or atomically call next patient.  
Request: Queue workflow payload.  
Response: Standard response.  
Permissions: `queue:manage`.

Method: `GET | PATCH`  
Route: `/api/v1/queue`, `/api/v1/queue/:id/:action`  
Description: List queue or transition queue entry.  
Request: Pagination query or UUID and action.  
Response: Standard response.  
Permissions: `queue:manage`.
