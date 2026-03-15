import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function DoctorDashboardPage() {
  const { user, activeClinicId } = useAuth();

  return (
    <div className="space-y-6">
      <section className="app-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-medical-primary">Doctor Console</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Clinical Workspace</h1>
        <p className="mt-2 text-sm text-slate-500">Doctor: {user?.email || 'doctor@clinic.com'} | Active Clinic: {activeClinicId || 'N/A'}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link to="/doctor/consultation" className="app-card rounded-2xl p-5 transition hover:-translate-y-1">
          <ClipboardList className="text-medical-primary" size={18} />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">Start Consultation</h2>
          <p className="mt-2 text-sm text-slate-500">Open patient queue, diagnosis panel, and prescription workflow.</p>
        </Link>

        <Link to="/appointments" className="app-card rounded-2xl p-5 transition hover:-translate-y-1">
          <CalendarDays className="text-medical-primary" size={18} />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">View Appointments</h2>
          <p className="mt-2 text-sm text-slate-500">Track upcoming visits by timeline and status.</p>
        </Link>

        <Link to="/patients" className="app-card rounded-2xl p-5 transition hover:-translate-y-1">
          <UserRound className="text-medical-primary" size={18} />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">Patient Records</h2>
          <p className="mt-2 text-sm text-slate-500">Search patient history and quickly open profiles.</p>
        </Link>
      </section>
    </div>
  );
}

export default DoctorDashboardPage;
