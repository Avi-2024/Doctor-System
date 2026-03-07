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

export const doctorApi = {
  getPatientQueue: ({ clinicId, token }) => request(`/appointments?clinicId=${clinicId}&status=waiting`, { token }),
  getPatientHistory: ({ clinicId, patientId, token }) =>
    request(`/patients/${patientId}/history?clinicId=${clinicId}`, { token }),
  saveVisit: ({ clinicId, token, payload }) => request('/visits', { method: 'POST', token, body: { clinicId, ...payload } }),
  generatePrescriptionPdf: ({ clinicId, visitId, token }) =>
    request(`/prescriptions/${visitId}/pdf?clinicId=${clinicId}`, { token }),
};
