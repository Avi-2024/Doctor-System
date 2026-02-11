import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function DoctorDashboardPage() {
  const { user, activeClinicId } = useAuth();

  return (
    <div>
      <h2>Doctor Dashboard</h2>
      <p>Doctor: {user?.email}</p>
      <p>Active Clinic: {activeClinicId || 'N/A'}</p>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/doctor/consultation">Start Consultation</Link>
        <Link to="/appointments">View Appointments</Link>
        <Link to="/patients">View Patients</Link>
      </div>
    </div>
  );
}

export default DoctorDashboardPage;
