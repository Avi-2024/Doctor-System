# Appointments API

Method: `POST | GET`  
Route: `/api/v1/appointments`  
Description: Book conflict-safe appointments or list appointments.  
Request: Appointment payload or pagination query.  
Response: Standard response.  
Permissions: `appointments:write` or `appointments:read`.

Method: `PATCH`  
Route: `/api/v1/appointments/:id/:action`  
Description: Cancel, check in, complete, or mark no-show.  
Request: Appointment UUID, action, and optional cancellation reason.  
Response: Standard response.  
Permissions: `appointments:write`.
