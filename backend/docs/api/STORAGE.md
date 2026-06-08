# Storage API

Base route: `/api/v1/storage`

Method: `POST`  
Route: `/attachments`  
Description: Upload attachment to configured S3 bucket.  
Request: Multipart `file` plus attachment metadata.  
Response: Standard response containing attachment record.  
Permissions: Clinic staff.

Method: `GET`  
Route: `/attachments`, `/attachments/:id/url`  
Description: List attachments or create temporary signed URL.  
Request: Pagination query or attachment UUID.  
Response: Standard response.  
Permissions: Clinic staff.
