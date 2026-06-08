# API Reference

All routes use `/api/v1`.

## Auth

Method: POST  
Route: `/auth/login`  
Description: Authenticate user.  
Request: `clinicId?`, `email`, `password`  
Response: `{ success, message, data: { user } }`  
Permissions: Public.

Method: POST  
Route: `/auth/refresh`  
Description: Rotate refresh token.  
Request: Refresh cookie or `refreshToken`.  
Response: `{ success, message, data: { user } }`  
Permissions: Valid refresh token.

Method: POST / GET  
Route: `/auth/logout`, `/auth/me`  
Description: Logout or fetch current user.  
Request: Access token.  
Response: Standard response.  
Permissions: Authenticated user.

Method: POST  
Route: `/auth/password-reset`, `/auth/password-reset/confirm`  
Description: Request or consume one-time password reset token.  
Request: Email request or token with new password.  
Response: Standard response.  
Permissions: Public, rate limited.

## Clinics

Method: POST  
Route: `/clinics/onboard`  
Description: Transactionally create clinic and owner.  
Request: `clinic`, `owner`  
Response: Clinic and owner.  
Permissions: Public bootstrap.

Method: GET  
Route: `/clinics`, `/clinics/:id`  
Description: Read clinic records.  
Request: Pagination query.  
Response: Standard response.  
Permissions: Super admin, clinic owner.

## Users

Method: POST / GET / PATCH / DELETE  
Route: `/users`  
Description: Manage tenant users.  
Request: User payload or pagination.  
Response: Standard response.  
Permissions: Super admin, clinic owner.

## Patients

Method: POST / GET / PATCH / DELETE  
Route: `/patients`, `/patients/:id`  
Description: Manage tenant patients.  
Request: Patient payload or pagination.  
Response: Standard response.  
Permissions: Clinic staff.

## Appointments

Method: POST / GET  
Route: `/appointments`  
Description: Book conflict-safe appointments or list them.  
Request: Appointment payload or pagination.  
Response: Standard response.  
Permissions: Clinic staff.

Method: PATCH  
Route: `/appointments/:id/:action`  
Description: Transition appointment state.  
Request: `cancel`, `checkIn`, `complete`, or `noShow`.  
Response: Updated appointment.  
Permissions: Clinic staff.

## Queue

Method: POST / GET  
Route: `/queue/check-in`, `/queue/call-next`, `/queue`  
Description: Manage atomic waiting-room tokens.  
Request: Queue workflow payload.  
Response: Standard response.  
Permissions: Clinic staff.

Method: PATCH  
Route: `/queue/:id/:action`  
Description: Start, complete, skip, or mark no-show.  
Request: Queue id and lifecycle action.  
Response: Updated queue entry.  
Permissions: Clinic staff.

## Clinical

Method: POST / GET / PATCH / DELETE  
Route: `/clinical`, `/clinical/:id`  
Description: Manage consultations.  
Request: Clinical payload.  
Response: Standard response.  
Permissions: Clinical roles.

## Prescriptions And Lab

Method: POST / GET / PATCH / DELETE  
Route: `/prescriptions`, `/lab-orders`  
Description: Manage prescriptions and lab orders.  
Request: Module payload.  
Response: Standard response.  
Permissions: Clinical roles.

## Billing

Method: POST / GET  
Route: `/billing/invoices`, `/billing/payments`  
Description: Create trusted invoices and transactional payments.  
Request: Invoice or payment payload.  
Response: Standard response.  
Permissions: Billing roles.

## Storage

Method: POST / GET  
Route: `/storage/attachments`, `/storage/attachments/:id/url`  
Description: Upload S3 attachment or create signed URL.  
Request: Multipart file or attachment id.  
Response: Standard response.  
Permissions: Clinic staff.

## WhatsApp

Method: GET / POST  
Route: `/whatsapp/webhook`, `/whatsapp/messages`  
Description: Verify Meta webhook or queue message.  
Request: Meta payload or outbound message.  
Response: Standard response.  
Permissions: Signed webhook or authorized staff.

## Reports

Method: GET  
Route: `/reports/summary`  
Description: Fetch tenant operational summary.  
Request: Access token.  
Response: Patient, appointment, revenue, and dues metrics.  
Permissions: Super admin, owner, receptionist.
