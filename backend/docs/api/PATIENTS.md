# Patients API

Base routes: `/api/v1/patients`, `/api/v1/patient-records`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage tenant patients.  
Request: Patient payload, UUID path, or pagination query.  
Response: Standard response; lists include pagination metadata.  
Permissions: Clinic staff.

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/patient-records`, `/api/v1/patient-records/:id`  
Description: Manage family, history, allergy, and document records.  
Request: `{ patient_id, record_type, record_data }` or UUID path.  
Response: Standard response.  
Permissions: Reads by clinic staff; writes by owners and doctors.
