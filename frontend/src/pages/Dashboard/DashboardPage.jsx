import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

function DashboardPage() {
  const { user } = useAuth();
  return <div>Welcome {user?.role} Dashboard</div>;
}

export default DashboardPage;
