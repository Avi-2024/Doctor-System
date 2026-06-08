# Subscriptions API

Method: `POST | GET | PATCH | DELETE`  
Route: `/api/v1/subscriptions`, `/api/v1/subscriptions/:id`  
Description: Manage clinic subscription links and states.  
Request: Subscription payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: Reads require `subscriptions:manage`; writes require Super Admin.

Method: `GET`  
Route: `/api/v1/subscriptions/current/usage`  
Description: Fetch active plan limits and current usage.  
Request: Authenticated request.  
Response: Standard response containing subscription, plan, and usage.  
Permissions: `subscriptions:manage`.
