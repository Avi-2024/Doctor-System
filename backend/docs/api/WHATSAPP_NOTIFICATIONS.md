# WhatsApp And Notifications API

Base route: `/api/v1/whatsapp`

Method: `GET | POST`  
Route: `/webhook`  
Description: Verify Meta webhook or receive signed events.  
Request: Meta verification query or signed webhook body.  
Response: Meta-compatible acknowledgement.  
Permissions: Verified Meta request.

Method: `POST`  
Route: `/messages`, `/messages/:id/send`  
Description: Queue outbound message or send queued message.  
Request: Message payload or message UUID.  
Response: Standard response.  
Permissions: Authorized clinic staff.

Base routes: `/api/v1/whatsapp-accounts`, `/api/v1/whatsapp-messages`, `/api/v1/notifications`

Method: `POST | GET | PATCH | DELETE`  
Route: `/`, `/:id`  
Description: Manage WhatsApp accounts, history, and notifications.  
Request: Module payload, UUID path, or pagination query.  
Response: Standard response.  
Permissions: Authorized tenant roles.

Delivery behavior: Failed outbound messages retry with exponential backoff. Stale processing messages recover automatically.
