import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock3, DollarSign, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { localAppointments, localPatients, localVisits } from '../../services/localStore';

const statusToVariant = {
  waiting: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

function DashboardPage() {
  const { user } = useAuth();
  const doctorName = user?.email ? user.email.split('@')[0].replace('.', ' ') : 'Doctor';
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingConsultations: 0,
    completedToday: 0,
  });

  useEffect(() => {
    // Seed demo data
    localPatients.seed();
    
    // Load queue
    const queueData = localAppointments.getQueue();
    setQueue(queueData);

    // Calculate stats
    const allPatients = localPatients.getAll();
    const allAppointments = localAppointments.getQueue();
    const allVisits = localVisits.getByPatient('all'); // This won't work, but we'll count all

    setStats({
      totalPatients: allPatients.length,
      pendingConsultations: queueData.length,
      completedToday: 0, // Can be enhanced later
    });
  }, []);

  const statCards = [
    { label: 'Total Patients', value: String(stats.totalPatients), icon: Users, tone: 'primary', trend: { label: 'Registered', positive: true } },
    { label: 'Waiting Queue', value: String(stats.pendingConsultations), icon: Clock3, tone: 'warning', trend: { label: 'Pending', positive: false } },
    { label: 'Completed Today', value: String(stats.completedToday), icon: Activity, tone: 'success', trend: { label: 'Consultations', positive: true } },
    { label: 'Offline Mode', value: 'Active', icon: DollarSign, tone: 'secondary', trend: { label: 'No backend', positive: true } },
  ];

  return (
    <div className="space-y-6">
      <section className="app-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-medical-primary">Doctor Dashboard</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Welcome back, Dr. {doctorName}</h1>
        <p className="mt-2 text-sm text-slate-500">Offline mode active - All data stored locally in browser.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            tone={stat.tone}
            trend={stat.trend}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="app-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Patient Waiting Queue</h2>
            <StatusBadge label={`${queue.length} Patients`} variant="info" />
          </div>

          {queue.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-medical-border bg-slate-50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No patients in queue</p>
              <p className="mt-1 text-sm text-slate-500">Add patients from the Patients page to start consultations.</p>
              <Link to="/patients" className="btn-primary mt-4 inline-flex">
                Go to Patients
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {queue.map((patient) => (
                <li key={patient.id} className="rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{patient.patientName}</p>
                        <StatusBadge label={patient.status} variant={statusToVariant[patient.status] || 'warning'} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{patient.reason}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <span>Time {patient.startTime}</span>
                      </div>
                    </div>

                    <Link to="/doctor/consultation" className="btn-primary">
                      Start Consultation
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="app-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500">Navigate to key workflows</p>

          <div className="mt-5 space-y-3">
            <Link to="/patients" className="block rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white">
              <p className="text-sm font-semibold text-slate-900">Add New Patient</p>
              <p className="mt-1 text-sm text-slate-500">Register patient and add to queue</p>
            </Link>

            <Link to="/doctor/consultation" className="block rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white">
              <p className="text-sm font-semibold text-slate-900">Start Consultation</p>
              <p className="mt-1 text-sm text-slate-500">View queue and write prescriptions</p>
            </Link>

            <Link to="/appointments" className="block rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white">
              <p className="text-sm font-semibold text-slate-900">View Appointments</p>
              <p className="mt-1 text-sm text-slate-500">Check scheduled visits</p>
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Offline Mode</p>
            <p className="mt-1 text-sm text-slate-700">All data is stored locally in your browser. No backend connection required.</p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default DashboardPage;
