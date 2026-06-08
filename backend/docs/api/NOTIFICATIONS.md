# Notifications API

Method: `POST`  
Route: `/api/v1/notifications/reminders`  
Description: Queue in-app or WhatsApp reminder.  
Request: `{ channel, recipient, message, patientId?, payload?, scheduledFor? }`  
Response: Standard response containing queued reminder.  
Permissions: `notifications:manage`.

Method: `GET`  
Route: `/api/v1/notifications`, `/api/v1/notifications/:id`  
Description: Read tenant notification delivery records.  
Request: UUID path or pagination query.  
Response: Standard response.  
Permissions: `notifications:manage`.

Method: `PATCH`  
Route: `/api/v1/notifications/:id/read`  
Description: Mark in-app notification read.  
Request: Notification UUID.  
Response: Standard response.  
Permissions: `notifications:manage`.
