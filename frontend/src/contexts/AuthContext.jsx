import React, { createContext, useContext, useMemo, useState } from 'react';
import { authStorage } from '../services/authStorage';
import { decodeJwtPayload, isTokenExpired } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(authStorage.getAccessToken());
  const [refreshToken, setRefreshToken] = useState(authStorage.getRefreshToken());

  const jwtPayload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);

  const isAuthenticated = Boolean(accessToken && jwtPayload && !isTokenExpired(jwtPayload));

  const user = useMemo(() => {
    if (!jwtPayload) return null;

    const normalizedRole = jwtPayload.role === 'STAFF' ? 'RECEPTIONIST' : jwtPayload.role;

    return {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      role: normalizedRole,
      clinicId: jwtPayload.clinicId,
      clinicIds: jwtPayload.clinicIds || (jwtPayload.clinicId ? [jwtPayload.clinicId] : []),
      rawRole: jwtPayload.role,
    };
  }, [jwtPayload]);

  const [activeClinicId, setActiveClinicId] = useState(user?.clinicId || null);

  const login = ({ accessToken: newAccessToken, refreshToken: newRefreshToken }) => {
    authStorage.setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken || refreshToken);

    const payload = decodeJwtPayload(newAccessToken);
    setActiveClinicId(payload?.clinicId || null);
  };

  const logout = () => {
    authStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    setActiveClinicId(null);
  };

  const switchClinic = (clinicId) => {
    if (!user?.clinicIds?.includes(clinicId)) return;
    setActiveClinicId(clinicId);
  };

  const value = {
    isAuthenticated,
    accessToken,
    refreshToken,
    user,
    activeClinicId,
    login,
    logout,
    switchClinic,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
