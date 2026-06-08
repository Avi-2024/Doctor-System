# Appointments And Queue API

Base route: `/api/v1/appointments`

Method: `POST | GET`  
Route: `/`  
Description: Book conflict-safe appointments or list appointments.  
Request: Appointment payload or pagination query.  
Response: Standard response.  
Permissions: Clinic staff.

Method: `PATCH`  
Route: `/:id/:action`  
Description: Cancel, check in, complete, or mark no-show.  
Request: UUID path and supported action.  
Response: Standard response containing updated appointment.  
Permissions: Clinic staff.

Base route: `/api/v1/queue`

Method: `POST`  
Route: `/check-in`, `/call-next`  
Description: Generate queue token or atomically call next patient.  
Request: Queue workflow payload.  
Response: Standard response containing queue entry.  
Permissions: Clinic staff.

Method: `GET | PATCH`  
Route: `/`, `/:id/:action`  
Description: List queue or transition queue state.  
Request: Pagination query or UUID and action.  
Response: Standard response.  
Permissions: Clinic staff.

Base routes: `/api/v1/doctor-schedules`, `/api/v1/doctor-leaves`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage doctor schedules and leave periods.  
Request: Schedule or leave payload.  
Response: Standard response.  
Permissions: Clinic management and doctors.
