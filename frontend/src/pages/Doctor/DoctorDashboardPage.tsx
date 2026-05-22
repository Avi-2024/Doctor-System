import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  Pill,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, initialsOf } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

const TODAY_APPOINTMENTS = [
  { time: '09:00 AM', patient: 'Aarav Sharma', type: 'General Checkup', status: 'completed' as const },
  { time: '10:30 AM', patient: 'Maya Verma',   type: 'Follow-up',       status: 'in_progress' as const },
  { time: '11:45 AM', patient: 'Rohan Iyer',   type: 'Consultation',    status: 'waiting' as const },
  { time: '02:30 PM', patient: 'Sneha Patel',  type: 'General Checkup', status: 'upcoming' as const },
  { time: '04:00 PM', patient: 'Vikram Singh', type: 'Follow-up',       status: 'upcoming' as const },
];

const STATUS = {
  completed:   { dot: 'bg-emerald-500', badge: 'success'  as const, label: 'Completed'   },
  in_progress: { dot: 'bg-amber-500',   badge: 'warning'  as const, label: 'In Progress' },
  waiting:     { dot: 'bg-rose-500',    badge: 'danger'   as const, label: 'Waiting'     },
  upcoming:    { dot: 'bg-slate-400',   badge: 'neutral'  as const, label: 'Upcoming'    },
};

const QUICK_ACTIONS = [
  { icon: Stethoscope, label: 'Start Consultation', sub: 'Open patient queue', to: '/doctor/consultation', accent: 'from-brand-500/15 to-brand-500/5 text-brand-600', hover: 'hover:border-brand-500/30' },
  { icon: CalendarDays, label: 'View Appointments',  sub: 'Today\'s schedule',   to: '/appointments',        accent: 'from-cyan-500/15 to-cyan-500/5 text-cyan-600',   hover: 'hover:border-cyan-500/30'  },
  { icon: Users,        label: 'Patient Records',    sub: 'Search & filter',     to: '/patients',            accent: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600', hover: 'hover:border-emerald-500/30' },
  { icon: FileText,     label: 'Write Prescription', sub: 'Create new Rx',       to: '/prescription/new',    accent: 'from-rose-500/15 to-rose-500/5 text-rose-600',   hover: 'hover:border-rose-500/30'  },
  { icon: Pill,         label: 'Prescriptions',      sub: 'History & templates', to: '/prescriptions',       accent: 'from-amber-500/15 to-amber-500/5 text-amber-600', hover: 'hover:border-amber-500/30' },
  { icon: TrendingUp,   label: 'Analytics',          sub: 'Stats & insights',    to: '/analytics',           accent: 'from-violet-500/15 to-violet-500/5 text-violet-600', hover: 'hover:border-violet-500/30' },
];

const STATS = [
  { label: 'Seen Today',   value: '7',  sub: '2 remaining', icon: Stethoscope, color: 'text-brand-600 bg-brand-50'   },
  { label: 'Total Patients', value: '128', sub: '+3 this week', icon: Users,   color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Avg Duration',  value: '18m', sub: 'per consult',  icon: Clock,    color: 'text-amber-600 bg-amber-50'    },
  { label: 'Prescriptions', value: '34',  sub: 'this month',   icon: Pill,     color: 'text-rose-600 bg-rose-50'      },
];

export default function DoctorDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useAuth() as any;
  const name: string = (user?.email as string | undefined)?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'Doctor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-4 ring-brand-500/20">
            <AvatarFallback className="text-base">{initialsOf(name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Doctor Console</p>
            <h1 className="text-2xl font-bold capitalize text-ink-primary">Dr. {name}</h1>
            <p className="text-sm text-ink-secondary">General Physician · City Care Clinic</p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link to="/doctor/consultation">
            <Stethoscope size={16} strokeWidth={2.2} />
            Start Consultation
          </Link>
        </Button>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Card className="flex items-center gap-4 p-5 transition-shadow duration-300 hover:shadow-elevated">
              <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', s.color)}>
                <s.icon size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-ink-primary">{s.value}</p>
                <p className="text-xs font-semibold text-ink-secondary">{s.label}</p>
                <p className="text-[11px] text-ink-muted">{s.sub}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Quick Actions */}
        <Card>
          <div className="flex items-center gap-2.5 p-6 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Sparkles size={15} strokeWidth={2} />
            </div>
            <p className="text-card text-ink-primary">Quick Actions</p>
          </div>
          <CardContent className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.to} to={a.to}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'group flex flex-col gap-3 rounded-2xl border border-border-soft bg-white p-4 transition-all duration-200',
                    a.hover
                  )}
                >
                  <div className={cn('grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br transition-transform duration-200 group-hover:scale-105', a.accent)}>
                    <a.icon size={17} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-primary">{a.label}</p>
                    <p className="text-xs text-ink-muted">{a.sub}</p>
                  </div>
                  <ArrowRight size={12} className="self-end text-ink-muted transition-transform group-hover:translate-x-0.5" />
                </motion.div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                <CalendarDays size={15} strokeWidth={2} />
              </div>
              <div>
                <p className="text-card text-ink-primary">Today's Schedule</p>
                <p className="text-[11px] text-ink-secondary">{TODAY_APPOINTMENTS.length} appointments</p>
              </div>
            </div>
            <Link to="/appointments" className="text-xs font-bold text-brand-600 transition hover:text-brand-700">
              View all →
            </Link>
          </div>

          <CardContent className="space-y-2 px-3 pb-4">
            {TODAY_APPOINTMENTS.map((a, idx) => {
              const st = STATUS[a.status];
              return (
                <motion.div
                  key={idx}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.18 }}
                  className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:border-border-soft hover:bg-white hover:shadow-soft"
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full ring-4 ring-opacity-20', st.dot,
                    a.status === 'completed' ? 'ring-emerald-200' :
                    a.status === 'in_progress' ? 'ring-amber-200' :
                    a.status === 'waiting' ? 'ring-rose-200' : 'ring-slate-200'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-primary">{a.patient}</p>
                    <p className="text-[11px] text-ink-secondary">{a.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-ink-secondary">{a.time}</p>
                    <Badge variant={st.badge} className="mt-0.5 px-1.5 py-0 text-[9px]">{st.label}</Badge>
                  </div>
                  {(a.status === 'waiting' || a.status === 'in_progress') && (
                    <Link
                      to="/doctor/consultation"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Button size="sm" className="h-7 px-2 text-[11px]">
                        <HeartPulse size={11} /> See
                      </Button>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* AI insight strip */}
      <Card className="border-brand-500/15 bg-gradient-to-r from-brand-50/60 via-transparent to-cyan-50/30 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 text-white shadow-glow">
            <Sparkles size={18} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-primary">AI Clinical Summary</p>
            <p className="text-xs text-ink-secondary">
              3 follow-up patients are overdue · 2 pending prescription reviews · Avg wait time 18 min today
            </p>
          </div>
          <Link to="/analytics">
            <Button variant="secondary" size="sm">
              View Analytics <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
