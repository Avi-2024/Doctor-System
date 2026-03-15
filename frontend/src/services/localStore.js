// Offline local storage - backend ke bina kaam karta hai

const KEYS = {
  patients: 'ds_patients',
  appointments: 'ds_appointments',
  visits: 'ds_visits',
};

const load = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const uid = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Patients ────────────────────────────────────────────────────────────────

export const localPatients = {
  getAll: () => load(KEYS.patients),

  add: (data) => {
    const patients = load(KEYS.patients);
    const patient = {
      id: uid(),
      name: data.name,
      age: data.age,
      gender: data.gender || 'Male',
      contact: data.contact,
      address: data.address || '',
      status: 'Active',
      lastVisit: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    patients.unshift(patient);
    save(KEYS.patients, patients);
    return patient;
  },

  seed: () => {
    if (load(KEYS.patients).length > 0) return;
    const demo = [
      { id: 'PT-001', name: 'Aarav Sharma', age: 32, gender: 'Male', contact: '9876543210', address: 'Delhi', status: 'Active', lastVisit: '2026-03-03', createdAt: '2026-03-03T10:00:00Z' },
      { id: 'PT-002', name: 'Maya Verma', age: 27, gender: 'Female', contact: '9876543211', address: 'Mumbai', status: 'Follow-up', lastVisit: '2026-03-02', createdAt: '2026-03-02T10:00:00Z' },
      { id: 'PT-003', name: 'Rohan Iyer', age: 45, gender: 'Male', contact: '9876543212', address: 'Pune', status: 'Active', lastVisit: '2026-02-28', createdAt: '2026-02-28T10:00:00Z' },
    ];
    save(KEYS.patients, demo);
  },
};

// ─── Appointments / Queue ─────────────────────────────────────────────────────

export const localAppointments = {
  getQueue: () => load(KEYS.appointments).filter((a) => a.status === 'waiting'),

  addToQueue: (patientId, patientName, patientAge, reason = 'General consultation') => {
    const appointments = load(KEYS.appointments);
    const appt = {
      id: uid(),
      patientId,
      patientName,
      patientAge,
      reason,
      status: 'waiting',
      startTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };
    appointments.unshift(appt);
    save(KEYS.appointments, appointments);
    return appt;
  },

  markCompleted: (appointmentId) => {
    const appointments = load(KEYS.appointments).map((a) =>
      a.id === appointmentId ? { ...a, status: 'completed' } : a
    );
    save(KEYS.appointments, appointments);
  },
};

// ─── Visits / Prescriptions ───────────────────────────────────────────────────

export const localVisits = {
  getByPatient: (patientId) => load(KEYS.visits).filter((v) => v.patientId === patientId),

  save: (data) => {
    const visits = load(KEYS.visits);
    const visit = {
      id: uid(),
      patientId: data.patientId,
      patientName: data.patientName,
      patientAge: data.patientAge,
      appointmentId: data.appointmentId,
      diagnosis: data.diagnosis,
      notes: data.notes,
      medicines: data.medicines || [],
      tests: data.tests || [],
      date: new Date().toISOString(),
    };
    visits.unshift(visit);
    save(KEYS.visits, visits);
    return visit;
  },

  getById: (visitId) => load(KEYS.visits).find((v) => v.id === visitId) || null,
};
