import { localAppointments, localVisits } from './localStore';
import { generatePrescriptionPdf } from './pdfGenerator';

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
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function tryOrOffline(apiFn, offlineFn) {
  try {
    return await apiFn();
  } catch {
    return offlineFn();
  }
}

export const doctorApi = {
  getPatientQueue: ({ clinicId, token }) =>
    tryOrOffline(
      () => request(`/appointments?clinicId=${clinicId}&status=waiting`, { token }),
      () => ({ appointments: localAppointments.getQueue() })
    ),

  getPatientHistory: ({ clinicId, patientId, token }) =>
    tryOrOffline(
      () => request(`/patients/${patientId}/history?clinicId=${clinicId}`, { token }),
      () => ({ history: localVisits.getByPatient(patientId) })
    ),

  saveVisit: ({ clinicId, token, payload }) =>
    tryOrOffline(
      () => request('/visits', { method: 'POST', token, body: { clinicId, ...payload } }),
      () => {
        const visit = localVisits.save(payload);
        if (payload.appointmentId) localAppointments.markCompleted(payload.appointmentId);
        return { visit };
      }
    ),

  generatePrescriptionPdf: ({ clinicId, visitId, token }) =>
    tryOrOffline(
      () => request(`/prescriptions/${visitId}/pdf?clinicId=${clinicId}`, { token }),
      () => {
        const visit = localVisits.getById(visitId);
        if (!visit) throw new Error('Visit not found');
        generatePrescriptionPdf(visit);
        return { pdfUrl: null, offline: true };
      }
    ),
};
