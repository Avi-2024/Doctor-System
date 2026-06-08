# Auth API

Base route: `/api/v1/auth`

Method: `POST`  
Route: `/login`  
Description: Authenticate user and issue access and refresh tokens.  
Request: `{ clinicId?, email, password }`  
Response: `{ success, message, data: { user } }` plus secure refresh cookie.  
Permissions: Public.

Method: `POST`  
Route: `/refresh`  
Description: Rotate a valid refresh token.  
Request: Refresh cookie or `{ refreshToken }`.  
Response: `{ success, message, data: { user } }` plus rotated refresh cookie.  
Permissions: Valid refresh token.

Method: `POST`  
Route: `/logout`  
Description: Revoke current refresh token.  
Request: Access token and refresh cookie.  
Response: Standard response.  
Permissions: Authenticated user.

Method: `GET`  
Route: `/me`  
Description: Fetch authenticated user context.  
Request: Access token.  
Response: Standard response containing user.  
Permissions: Authenticated user.

Method: `POST`  
Route: `/password-reset`  
Description: Request one-time password reset.  
Request: `{ email, clinicId? }`  
Response: Standard response.  
Permissions: Public, rate limited.

Method: `POST`  
Route: `/password-reset/confirm`  
Description: Consume reset token and change password.  
Request: `{ token, password }`  
Response: Standard response.  
Permissions: Valid reset token.
