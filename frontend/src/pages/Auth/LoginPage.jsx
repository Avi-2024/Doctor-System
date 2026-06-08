import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('CLINIC_OWNER');

  const handleMockLogin = () => {
    const rolePayload = role === 'RECEPTIONIST' ? 'STAFF' : role;
    const payload = {
      sub: 'user-1',
      email: 'demo@clinic.com',
      role: rolePayload,
      clinicId: 'clinic-1',
      clinicIds: ['clinic-1', 'clinic-2'],
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };

    const encodedPayload = btoa(JSON.stringify(payload));
    const fakeToken = `header.${encodedPayload}.signature`;

    login({ accessToken: fakeToken, refreshToken: 'refresh-token' });
    navigate('/dashboard');
  };

  return (
    <div>
      <h1>Login</h1>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="CLINIC_OWNER">Clinic Owner</option>
        <option value="DOCTOR">Doctor</option>
        <option value="RECEPTIONIST">Receptionist</option>
      </select>
      <button type="button" onClick={handleMockLogin}>
        Sign In (Demo)
      </button>
    </div>
  );
}

export default LoginPage;
