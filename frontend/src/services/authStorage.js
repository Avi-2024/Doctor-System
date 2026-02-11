const ACCESS_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || 'doctor_system_access_token';
const REFRESH_KEY = import.meta.env.VITE_REFRESH_TOKEN_STORAGE_KEY || 'doctor_system_refresh_token';

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  setTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
