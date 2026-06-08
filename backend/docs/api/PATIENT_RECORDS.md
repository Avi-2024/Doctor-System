# Patient Records API

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/patient-records`, `/api/v1/patient-records/:id`  
Description: Manage family, history, allergy, and document records.  
Request: `{ patient_id, record_type, record_data }`, UUID path, or pagination query.  
Response: Standard response.  
Permissions: `patients:read` or `patients:write`.
