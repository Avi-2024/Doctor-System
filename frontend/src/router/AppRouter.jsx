import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/Auth/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AppointmentsPage from '../pages/Appointments/AppointmentsPage';
import PatientsPage from '../pages/Patients/PatientsPage';
import BillingPage from '../pages/Billing/BillingPage';
import PrescriptionsPage from '../pages/Prescriptions/PrescriptionsPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import DoctorDashboardPage from '../pages/Doctor/DoctorDashboardPage';
import ConsultationPage from '../pages/Doctor/ConsultationPage';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/doctor" element={<DoctorDashboardPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'RECEPTIONIST']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/billing" element={<BillingPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'DOCTOR']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/doctor/consultation" element={<ConsultationPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRouter;
