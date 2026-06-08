# Billing API

Base route: `/api/v1/billing`

Method: `POST | GET`  
Route: `/invoices`  
Description: Create server-calculated invoices or list invoices.  
Request: Invoice payload or pagination query.  
Response: Standard response.  
Permissions: Authorized billing roles.

Method: `GET`  
Route: `/billing/invoices/:id`  
Description: Fetch invoice with normalized line items.  
Request: Invoice UUID.  
Response: Standard response containing invoice and items.  
Permissions: Authorized billing roles.

Method: `POST | GET`  
Route: `/payments`  
Description: Record transactional payment or list payments.  
Request: Payment payload or pagination query.  
Response: Standard response.  
Permissions: Authorized billing roles.
