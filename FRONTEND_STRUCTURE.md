# React Frontend Structure (Multi-Clinic Clinic Management App)

## Folder Structure

```text
frontend/
└── src/
    ├── app/
    ├── assets/
    ├── components/
    │   ├── common/
    │   ├── forms/
    │   ├── feedback/
    │   └── navigation/
    ├── hooks/
    ├── layouts/
    ├── pages/
    │   ├── Auth/
    │   │   ├── components/
    │   │   └── hooks/
    │   ├── Dashboard/
    │   │   ├── components/
    │   │   └── widgets/
    │   ├── Appointments/
    │   │   ├── components/
    │   │   └── calendar/
    │   ├── Patients/
    │   │   ├── components/
    │   │   └── profile/
    │   ├── Billing/
    │   │   ├── components/
    │   │   └── reports/
    │   ├── Prescriptions/
    │   │   ├── components/
    │   │   └── templates/
    │   └── Settings/
    │       ├── components/
    │       └── tabs/
    ├── router/
    ├── services/
    ├── store/
    └── utils/
```

## Component List

### Auth
- `LoginPage`
- `SignupPage`
- `ForgotPasswordPage`
- `ResetPasswordPage`
- `ClinicSelectorPage`
- `AuthLayout`
- `LoginForm`
- `SignupForm`
- `OtpVerificationForm`

### Dashboard
- `DashboardPage`
- `DashboardLayout`
- `ClinicOverviewCard`
- `KpiCards`
- `TodayAppointmentsWidget`
- `RevenueSummaryWidget`
- `DoctorAvailabilityWidget`
- `RecentActivitiesWidget`

### Appointments
- `AppointmentsPage`
- `AppointmentList`
- `AppointmentFilters`
- `AppointmentCalendarView`
- `BookAppointmentModal`
- `RescheduleAppointmentModal`
- `AppointmentDetailsDrawer`
- `DoctorScheduleBoard`
- `HospitalTimeBadge`

### Patients
- `PatientsPage`
- `PatientList`
- `PatientFilters`
- `PatientProfilePage`
- `PatientInfoCard`
- `PatientVisitTimeline`
- `AddPatientModal`
- `EditPatientModal`

### Billing
- `BillingPage`
- `CreateInvoicePage`
- `InvoiceList`
- `InvoiceDetailsDrawer`
- `PaymentCollectionModal`
- `PaymentModeSelector`
- `DailyBillingReport`
- `MonthlyBillingReport`

### Prescriptions
- `PrescriptionsPage`
- `CreatePrescriptionPage`
- `PrescriptionList`
- `PrescriptionEditor`
- `MedicineRow`
- `PrescriptionPreview`
- `PrescriptionTemplateSelector`

### Settings
- `SettingsPage`
- `ClinicSettingsTab`
- `DoctorSettingsTab`
- `StaffSettingsTab`
- `RolesPermissionsTab`
- `WhatsAppIntegrationTab`
- `BillingSettingsTab`
- `NotificationSettingsTab`

### Shared/Common
- `AppShell`
- `Sidebar`
- `Topbar`
- `ClinicSwitcher`
- `PageHeader`
- `DataTable`
- `SearchInput`
- `Pagination`
- `StatusBadge`
- `ConfirmDialog`
- `Loader`
- `EmptyState`
- `ErrorState`
- `ToastProvider`
