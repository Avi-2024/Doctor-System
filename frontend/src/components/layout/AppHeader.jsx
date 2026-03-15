import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function AppHeader({ onMenuClick }) {
  const { activeClinicId, user, switchClinic } = useAuth();
  const clinicIds = user?.clinicIds || [];
  const doctorName = user?.email ? user.email.split('@')[0].replace('.', ' ') : 'Doctor';
  const doctorInitial = doctorName.slice(0, 1).toUpperCase();
  const roleLabel = user?.role ? user.role.replace('_', ' ') : 'Doctor';
  const clinicValue = activeClinicId && clinicIds.includes(activeClinicId) ? activeClinicId : clinicIds[0] || '';

  return (
    <header className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-soft backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" className="icon-button md:hidden" aria-label="Open menu" onClick={onMenuClick}>
            <Menu size={18} />
          </button>
          <label htmlFor="global-search" className="relative w-full lg:w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input id="global-search" type="search" placeholder="Search patients, appointments, prescriptions..." className="pl-10" />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[190px] flex-1 sm:flex-none">
            <select
              value={clinicValue}
              onChange={(event) => switchClinic(event.target.value)}
              disabled={clinicIds.length === 0}
              aria-label="Select clinic"
            >
              {clinicIds.length === 0 ? <option value="">No clinic</option> : null}
              {clinicIds.map((clinicId) => (
                <option key={clinicId} value={clinicId}>
                  Clinic {clinicId}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="icon-button" aria-label="Notifications">
            <Bell size={18} />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-medical-border bg-white px-2 py-1.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-medical-primary text-sm font-semibold text-white">
              {doctorInitial}
            </span>
            <div className="hidden pr-1 sm:block">
              <p className="text-sm font-semibold capitalize text-slate-900">Dr. {doctorName}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
