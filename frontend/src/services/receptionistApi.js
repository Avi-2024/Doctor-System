const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const receptionistApi = {
  quickRegisterPatient: ({ clinicId, token, payload }) => request('/patients', { method: 'POST', token, body: { clinicId, ...payload } }),
  quickBookAppointment: ({ clinicId, token, payload }) =>
    request('/appointments/book', { method: 'POST', token, body: { clinicId, ...payload } }),
  saveVitals: ({ clinicId, token, payload }) => request('/visits/vitals', { method: 'POST', token, body: { clinicId, ...payload } }),
  updateAppointmentStatus: ({ clinicId, token, appointmentId, status }) =>
    request(`/appointments/${appointmentId}/status`, { method: 'PATCH', token, body: { clinicId, status } }),
  enterPayment: ({ clinicId, token, billingId, payload }) =>
    request(`/billing/${billingId}/payments`, { method: 'POST', token, body: { clinicId, ...payload } }),
};
