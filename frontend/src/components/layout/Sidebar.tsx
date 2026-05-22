import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Crown,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  type LucideIcon,
  MessageSquare,
  Pill,
  Settings,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, initialsOf } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

type Role = 'CLINIC_OWNER' | 'DOCTOR' | 'RECEPTIONIST' | 'STAFF';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'] },
      { label: 'Doctor Console', to: '/doctor', icon: Stethoscope, roles: ['CLINIC_OWNER', 'DOCTOR'] },
      { label: 'Consultation', to: '/doctor/consultation', icon: ClipboardList, roles: ['CLINIC_OWNER', 'DOCTOR'] },
      { label: 'Patients', to: '/patients', icon: Users, roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'] },
      { label: 'Appointments', to: '/appointments', icon: CalendarDays, roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'] },
      { label: 'Prescriptions', to: '/prescriptions', icon: Pill, roles: ['CLINIC_OWNER', 'DOCTOR'] },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Reports', to: '/billing', icon: FileText, roles: ['CLINIC_OWNER', 'RECEPTIONIST'] },
      { label: 'Messages', to: '/messages', icon: MessageSquare, roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'], badge: '3' },
      { label: 'Analytics', to: '/analytics', icon: BarChart3, roles: ['CLINIC_OWNER'] },
      { label: 'Settings', to: '/settings', icon: Settings, roles: ['CLINIC_OWNER'] },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const role = (user?.role ?? 'DOCTOR') as Role;

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);


  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-[272px] shrink-0 flex-col overflow-hidden bg-bg-sidebar text-slate-100 shadow-sidebar transition-transform duration-300 ease-premium md:static md:h-full md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-r-none md:rounded-r-[0]">
          <div className="absolute -left-20 top-32 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -right-12 bottom-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative flex h-full flex-col">
          {/* Brand */}
          <div className="flex items-center justify-between px-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-glow">
                <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Doctor System</p>
                <p className="text-sm font-semibold text-white">Medical Dashboard</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
            >
              <X size={16} />
            </button>
          </div>

       

          {/* Navigation */}
          <nav className="mt-6 flex-1 overflow-y-auto px-4 pb-4" aria-label="Sidebar">
            {visibleSections.map((section, idx) => (
              <div key={section.title} className={cn(idx > 0 && 'mt-6')}>
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <NavLink to={item.to} onClick={onClose} className="block">
                        {({ isActive }) => (
                          <motion.div
                            whileHover={{ x: 3 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className={cn(
                              'group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition-colors duration-200 ease-premium',
                              isActive ? 'text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            )}
                          >
                            {isActive && (
                              <>
                                <motion.span
                                  layoutId="sidebar-active-bg"
                                  className="absolute inset-0 rounded-xl bg-sidebar-active shadow-[0_8px_24px_rgba(37,99,235,0.18)]"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                                <motion.span
                                  layoutId="sidebar-active-bar"
                                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400 shadow-[0_0_12px_rgba(96,165,250,0.7)]"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                              </>
                            )}
                            <item.icon
                              size={18}
                              className={cn(
                                'relative z-10 transition-colors duration-200',
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                              )}
                              strokeWidth={isActive ? 2.2 : 1.8}
                            />
                            <span className="relative z-10 text-sm font-medium">{item.label}</span>
                            {item.badge && (
                              <Badge
                                variant="brand"
                                className="relative z-10 ml-auto h-5 min-w-[20px] justify-center border-brand-500/30 bg-brand-500/15 px-1.5 py-0 text-[10px] text-brand-200"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </motion.div>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Upgrade card */}
          <div className="mx-4 mb-3 rounded-sidebar border border-white/10 bg-gradient-to-br from-brand-500/15 to-cyan-500/10 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-glow">
                <Crown className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Unlock advanced features and analytics.
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-2 text-xs font-semibold text-white shadow-glow transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
            >
              Upgrade Now
            </button>
          </div>

          {/* Footer actions */}
          <div className="border-t border-white/5 px-4 py-3">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 ease-premium hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={18} strokeWidth={1.8} />
              Logout
            </button>
            <a
              href="#help"
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-500 transition hover:text-slate-300"
            >
              <LifeBuoy size={14} strokeWidth={1.8} />
              Help & Support
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
