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
import ReceptionistDashboardPage from '../pages/Receptionist/ReceptionistDashboardPage';

import MessagesPage from '../pages/Messages/MessagesPage';
import AnalyticsPage from '../pages/Analytics/AnalyticsPage';


function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST']} />}>
        <Route element={<DashboardLayout />}>

          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients"    element={<PatientsPage />} />
          <Route path="/doctor"      element={<DoctorDashboardPage />} />
          <Route path="/reception"   element={<ReceptionistDashboardPage />} />
          <Route path="/messages"    element={<MessagesPage />} />
          <Route path="/analytics"   element={<AnalyticsPage />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/doctor" element={<DoctorDashboardPage />} />
          <Route path="/reception" element={<ReceptionistDashboardPage />} />

        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'RECEPTIONIST']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/billing" element={<BillingPage />} />
        </Route>
      </Route>

   </Routes >

        

  );
}

export default AppRouter;
