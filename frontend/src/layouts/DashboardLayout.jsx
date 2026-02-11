import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import { useAuth } from '../contexts/AuthContext';

function DashboardLayout() {
  const { activeClinicId, user, switchClinic } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ padding: 16, flex: 1 }}>
        <header>
          <h2>Role Dashboard</h2>
          <div>
            <span>Active Clinic: {activeClinicId || 'N/A'}</span>
            {user?.clinicIds?.length > 1 && (
              <select value={activeClinicId || ''} onChange={(e) => switchClinic(e.target.value)}>
                {user.clinicIds.map((clinicId) => (
                  <option key={clinicId} value={clinicId}>
                    {clinicId}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
