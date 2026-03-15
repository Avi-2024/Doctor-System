import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarRange, Filter, Plus, Search } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { localAppointments, localPatients } from '../../services/localStore';

const statusVariantMap = {
  waiting: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    // Load all appointments (not just queue)
    const stored = JSON.parse(localStorage.getItem('ds_appointments') || '[]');
    setAppointments(stored);
  }, []);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesSearch =
          (appointment.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
          (appointment.reason || '').toLowerCase().includes(search.toLowerCase()) ||
          (appointment.id || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
        
        const appointmentDate = appointment.createdAt ? appointment.createdAt.split('T')[0] : '';
        const matchesDate = !dateFilter || appointmentDate === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
      }),
    [appointments, search, statusFilter, dateFilter]
  );

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (monthStart.getDay() + 6) % 7;

  const appointmentCountByDay = filteredAppointments.reduce((acc, appointment) => {
    if (!appointment.createdAt) return acc;
    const date = new Date(appointment.createdAt);
    if (date.getMonth() === month && date.getFullYear() === year) {
      const day = date.getDate();
      acc[day] = (acc[day] || 0) + 1;
    }
    return acc;
  }, {});

  const calendarCells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, idx) => idx + 1)];
  const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleAddDemoAppointment = () => {
    const patients = localPatients.getAll();
    if (patients.length === 0) {
      alert('Please add patients first!');
      return;
    }
    const randomPatient = patients[Math.floor(Math.random() * patients.length)];
    localAppointments.addToQueue(randomPatient.id, randomPatient.name, randomPatient.age, 'Demo appointment');
    setAppointments(JSON.parse(localStorage.getItem('ds_appointments') || '[]'));
  };

  return (
    <div className="space-y-6">
      <section className="app-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Appointments</h1>
            <p className="page-subtitle">Manage visits with filters and calendar view.</p>
          </div>
          <button type="button" className="btn-primary" onClick={handleAddDemoAppointment}>
            <Plus size={15} />
            Add Demo Appointment
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <label htmlFor="appointment-search" className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="appointment-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, reason, or ID"
              className="pl-10"
            />
          </label>

          <label htmlFor="appointment-date" className="relative">
            <CalendarRange size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="appointment-date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="pl-10" />
          </label>

          <label htmlFor="appointment-status" className="relative">
            <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select id="appointment-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="pl-10">
              <option value="all">All statuses</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="app-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">All Appointments</h2>
            <StatusBadge label={`${filteredAppointments.length} Results`} variant="info" />
          </div>

          <ul className="mt-4 space-y-3">
            {filteredAppointments.map((appointment) => (
              <li key={appointment.id} className="rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{appointment.patientName}</p>
                    <p className="mt-1 text-sm text-slate-500">{appointment.reason}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.08em] text-slate-400">{appointment.id}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{appointment.startTime}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {appointment.createdAt ? new Date(appointment.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </p>
                    <div className="mt-2">
                      <StatusBadge label={appointment.status} variant={statusVariantMap[appointment.status] || 'warning'} className="capitalize" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {filteredAppointments.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-medical-border bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No appointments found. Add patients to queue from Patients page.
              </li>
            ) : null}
          </ul>
        </article>

        <article className="app-card p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Calendar View</h2>
            <div className="inline-flex items-center gap-2 rounded-full border border-medical-border bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              <CalendarClock size={14} />
              {monthLabel}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-16 rounded-2xl border border-dashed border-slate-200" />;
              }

              const count = appointmentCountByDay[day] || 0;

              return (
                <div
                  key={day}
                  className={`h-16 rounded-2xl border p-2 text-left ${
                    count > 0 ? 'border-blue-200 bg-blue-50' : 'border-medical-border bg-white'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-600">{day}</p>
                  {count > 0 ? <p className="mt-1 text-xs text-medical-primary">{count} appt{count > 1 ? 's' : ''}</p> : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-slate-700">
            <p className="font-semibold">Offline Mode Active</p>
            <p className="mt-1">Calendar shows appointments from localStorage.</p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default AppointmentsPage;
