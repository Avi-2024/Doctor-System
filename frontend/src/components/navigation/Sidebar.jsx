import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Pill,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'] },
  { label: 'Doctor Console', to: '/doctor', icon: Stethoscope, roles: ['CLINIC_OWNER', 'DOCTOR'] },
  { label: 'Consultation', to: '/doctor/consultation', icon: ClipboardList, roles: ['CLINIC_OWNER', 'DOCTOR'] },
  { label: 'Patients', to: '/patients', icon: Users, roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'] },
  { label: 'Appointments', to: '/appointments', icon: CalendarDays, roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'] },
  { label: 'Prescriptions', to: '/prescriptions', icon: Pill, roles: ['CLINIC_OWNER', 'DOCTOR'] },
];

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role;
  const sidebarLinks = menuItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {isOpen ? <button type="button" className="fixed inset-0 z-30 bg-slate-900/45 md:hidden" onClick={onClose} aria-label="Close menu overlay" /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col bg-medical-sidebar p-4 text-slate-100 shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:translate-x-0 md:shadow-none`}
      >
        <div className="flex items-center justify-between">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Doctor System</p>
            <p className="mt-1 text-base font-semibold text-white">Medical Dashboard</p>
          </div>
          <button type="button" className="icon-button border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 md:hidden" aria-label="Close menu" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-sky-200">{role?.replace('_', ' ') || 'User'}</p>
          <p className="mt-1 truncate text-sm text-slate-200">{user?.email || 'doctor@clinic.com'}</p>
        </div>

        <nav className="mt-6 flex-1 space-y-2" aria-label="Sidebar">
          {sidebarLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className="block" onClick={onClose}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 hover:bg-white/5"
                >
                  {isActive ? (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-0 rounded-2xl bg-medical-active shadow-[0_0_24px_rgba(14,165,233,0.35)]"
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    />
                  ) : null}
                  <item.icon size={18} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'}`} />
                  <span className={`relative z-10 text-sm font-medium ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-slate-100'}`}>{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/40"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
