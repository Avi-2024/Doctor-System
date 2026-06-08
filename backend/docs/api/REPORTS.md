# Reports API

Base route: `/api/v1/reports`

Method: `GET`  
Route: `/summary`  
Description: Fetch tenant operational summary.  
Request: Optional `from` and `to` dates.  
Response: Patient, appointment, revenue, and dues metrics.  
Permissions: Super Admin, Clinic Owner, or Receptionist.

Method: `GET`  
Route: `/doctor-utilization`  
Description: Fetch doctor appointment, completion, no-show, and booked-minute metrics.  
Request: Optional `from` and `to` dates.  
Response: Standard response containing utilization items.  
Permissions: `reports:read`.
