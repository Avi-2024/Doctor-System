import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuByRole = {
  CLINIC_OWNER: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Doctor Console', to: '/doctor' },
    { label: 'Consultation', to: '/doctor/consultation' },
    { label: 'Appointments', to: '/appointments' },
    { label: 'Patients', to: '/patients' },
    { label: 'Billing', to: '/billing' },
    { label: 'Reception Desk', to: '/reception' },
    { label: 'Prescriptions', to: '/prescriptions' },
    { label: 'Reception Desk', to: '/reception' },
    { label: 'Settings', to: '/settings' },
    { label: 'Reception Desk', to: '/reception' },
  ],
  DOCTOR: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Doctor Console', to: '/doctor' },
    { label: 'Consultation', to: '/doctor/consultation' },
    { label: 'Appointments', to: '/appointments' },
    { label: 'Patients', to: '/patients' },
    { label: 'Prescriptions', to: '/prescriptions' },
    { label: 'Reception Desk', to: '/reception' },
  ],
  RECEPTIONIST: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Doctor Console', to: '/doctor' },
    { label: 'Consultation', to: '/doctor/consultation' },
    { label: 'Appointments', to: '/appointments' },
    { label: 'Patients', to: '/patients' },
    { label: 'Billing', to: '/billing' },
    { label: 'Reception Desk', to: '/reception' },
  ],
};

function Sidebar() {
  const { user, logout } = useAuth();
  const menuItems = menuByRole[user?.role] || [];

  return (
    <aside>
      <h3>Clinic SaaS</h3>
      <p>{user?.role || 'USER'}</p>
      <nav>
        {menuItems.map((item) => (
          <div key={item.to}>
            <NavLink to={item.to}>{item.label}</NavLink>
          </div>
        ))}
      </nav>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
