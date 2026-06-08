# Subscriptions And Settings API

Base route: `/api/v1/subscription-plans`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage global SaaS plans.  
Request: Plan payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: Super Admin.

Base routes: `/api/v1/subscriptions`, `/api/v1/settings`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage clinic subscription links and settings.  
Request: Module payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: Super Admin and Clinic Owner; subscription writes require Super Admin.

Usage limits: Active plans enforce `users`, `patients`, `monthlyAppointments`, `storageBytes`, and `monthlyWhatsAppMessages` during writes.

Method: `GET`  
Route: `/api/v1/subscriptions/current/usage`  
Description: Fetch active plan, limits, and current usage.  
Request: Authenticated request.  
Response: Standard response containing subscription, plan, and usage.  
Permissions: Super Admin or Clinic Owner.
