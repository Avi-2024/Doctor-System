# Users API

Base route: `/api/v1/users`

Method: `POST`  
Route: `/`  
Description: Create tenant staff user.  
Request: `{ full_name, email, phone?, password, role, permissions? }`  
Response: Standard response containing safe user fields.  
Permissions: Super Admin or Clinic Owner.

Method: `GET`  
Route: `/`  
Description: List tenant users.  
Request: `page`, `limit`, `search`, `sortBy`, `sortOrder`, filters.  
Response: Paginated standard response.  
Permissions: Super Admin or Clinic Owner.

Method: `PATCH | DELETE`  
Route: `/:id`  
Description: Update or soft-delete tenant user.  
Request: UUID path and allowlisted user fields.  
Response: Standard response.  
Permissions: Super Admin or Clinic Owner.

Method: `POST | GET | DELETE`  
Route: `/invitations`, `/invitations/:id`  
Description: Invite, list, or revoke tenant user invitations.  
Request: Invitation payload, pagination query, or UUID path.  
Response: Standard response.  
Permissions: Super Admin or Clinic Owner.

Method: `POST`  
Route: `/invitations/accept`  
Description: Accept invitation and create user account.  
Request: `{ token, password }`  
Response: Standard response containing user.  
Permissions: Valid invitation token.
