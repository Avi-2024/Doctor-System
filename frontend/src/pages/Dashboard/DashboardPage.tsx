import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  Pill,
  Sparkles,
  Stethoscope,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { localAppointments, localPatients, localVisits } from '@/services/localStore';
import { cn, formatRelativeTime, initialsOf } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import KpiCard from './components/KpiCard';

// Seed demo patients on first load
localPatients.seed();

type QueueItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  reason: string;
  status: string;
  startTime: string;
  createdAt: string;
};

// Mock sparkline data — would come from API in production
const SPARK = (base: number, n = 14): { v: number }[] =>
  Array.from({ length: n }, (_, i) => ({
    v: Math.max(0, base + Math.round(Math.sin(i * 0.7) * (base * 0.18)) + (i % 3) * 2),
  }));

const PRIORITY_VARIANTS = {
  high: { variant: 'danger' as const, label: 'High Priority' },
  medium: { variant: 'warning' as const, label: 'Medium Priority' },
  low: { variant: 'success' as const, label: 'Low Priority' },
};

const TODAYS_SCHEDULE = [
  { time: '09:00 AM', name: 'Aarav Sharma', type: 'General Checkup', status: 'completed' as const },
  { time: '10:30 AM', name: 'Maya Verma', type: 'Follow-up', status: 'in_progress' as const },
  { time: '11:45 AM', name: 'Rohan Iyer', type: 'Consultation', status: 'waiting' as const },
  { time: '02:30 PM', name: 'Sneha Patel', type: 'General Checkup', status: 'upcoming' as const },
  { time: '04:00 PM', name: 'Vikram Singh', type: 'Follow-up', status: 'upcoming' as const },
];

const STATUS_STYLES = {
  completed: { dot: 'bg-emerald-500', text: 'Completed', badge: 'success' as const },
  in_progress: { dot: 'bg-amber-500', text: 'In Progress', badge: 'warning' as const },
  waiting: { dot: 'bg-rose-500', text: 'Waiting', badge: 'danger' as const },
  upcoming: { dot: 'bg-slate-400', text: 'Upcoming', badge: 'neutral' as const },
};

const AI_INSIGHTS = [
  {
    icon: CalendarCheck2,
    color: 'text-amber-600 bg-amber-50',
    title: '3 patients are overdue for follow-up',
    description: 'Take action to improve patient care.',
    cta: 'View Patients',
    href: '/patients',
  },
  {
    icon: FileText,
    color: 'text-rose-600 bg-rose-50',
    title: '2 prescriptions are pending review',
    description: 'Review and approve pending prescriptions.',
    cta: 'Review Now',
    href: '/prescriptions',
  },
  {
    icon: BarChart3,
    color: 'text-emerald-600 bg-emerald-50',
    title: '12% increase in patients this week',
    description: "Compared to last week's data.",
    cta: 'View Analytics',
    href: '/dashboard',
  },
];

const ACTIVITY = [
  { icon: UserPlus, name: 'Aarav Sharma', action: 'registered', accent: 'text-brand-600 bg-brand-50', when: Date.now() - 2 * 60_000 },
  { icon: Pill, name: 'Maya Verma', action: 'Prescription created for', accent: 'text-rose-600 bg-rose-50', when: Date.now() - 15 * 60_000 },
  { icon: CalendarDays, name: 'Rohan Iyer', action: 'Appointment booked by', accent: 'text-amber-600 bg-amber-50', when: Date.now() - 32 * 60_000 },
  { icon: Stethoscope, name: 'Sneha Patel', action: 'Consultation completed for', accent: 'text-emerald-600 bg-emerald-50', when: Date.now() - 60 * 60_000 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [stats, setStats] = React.useState({ patients: 0, appointments: 0, waiting: 0, consultations: 0 });

  React.useEffect(() => {
    const patients = localPatients.getAll();
    const queueItems = localAppointments.getQueue() as QueueItem[];
    const visits = localVisits as unknown as { getByPatient: (id: string) => unknown[] };
    setQueue(queueItems);
    setStats({
      patients: Math.max(128, patients.length),
      appointments: 24,
      waiting: queueItems.length || 6,
      consultations: 18,
    });
    void visits;
  }, []);

  const displayName = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'Doctor';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-primary sm:text-[32px]">
            {greeting}, <span className="capitalize">Dr. {displayName.split(' ')[0]}</span>
            <span className="ml-1 inline-block animate-pulse-soft" aria-hidden>
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">Here's what's happening at City Care Clinic today.</p>
        </div>
      </motion.div>

      {/* ── KPI Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Patients" value={stats.patients} icon={Users} trend={12} accent="brand" data={SPARK(128)} />
        <KpiCard label="Appointments" value={stats.appointments} icon={CalendarDays} trend={8} accent="cyan" data={SPARK(24)} />
        <KpiCard label="Waiting Now" value={stats.waiting} icon={Clock3} trend={-2} accent="amber" data={SPARK(6)} />
        <KpiCard label="Consultations" value={stats.consultations} icon={HeartPulse} trend={15} accent="rose" data={SPARK(18)} />
      </div>

      {/* ── Main Grid: Queue + Today's Schedule ───────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Patient Queue */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <Users size={16} strokeWidth={2} />
              </div>
              <div>
                <p className="text-card text-ink-primary">Patient Queue</p>
                <p className="text-xs text-ink-secondary">Live waiting list</p>
              </div>
            </div>
            <Link
              to="/patients"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2 px-3 pb-3">
            {(queue.length > 0 ? queue.slice(0, 3) : QUEUE_FALLBACK).map((item, idx) => {
              const priority = (['high', 'medium', 'low'] as const)[idx % 3];
              const waitTime = [25, 15, 8][idx % 3];
              const waitColor = ['text-rose-600', 'text-amber-600', 'text-emerald-600'][idx % 3];

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center gap-4 rounded-2xl border border-transparent bg-slate-50/40 p-3 transition-all duration-200 ease-premium hover:border-border-soft hover:bg-white hover:shadow-soft"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="text-xs">{initialsOf(item.patientName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-primary">{item.patientName}</p>
                    <p className="text-xs text-ink-muted">
                      {item.patientAge ?? '—'} years, {idx % 2 === 0 ? 'Male' : 'Female'}
                    </p>
                  </div>
                  <Badge variant={PRIORITY_VARIANTS[priority].variant} className="hidden sm:inline-flex">
                    {PRIORITY_VARIANTS[priority].label}
                  </Badge>
                  <div className="hidden text-right md:block">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Wait Time</p>
                    <p className={cn('text-sm font-bold', waitColor)}>{waitTime} min</p>
                  </div>
                  <Button asChild size="sm" variant="secondary" className="opacity-0 transition-opacity group-hover:opacity-100">
                    <Link to="/doctor/consultation">
                      Start Consultation <ChevronRight size={12} />
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                <CalendarDays size={16} strokeWidth={2} />
              </div>
              <p className="text-card text-ink-primary">Today's Schedule</p>
            </div>
            <Link to="/appointments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View calendar
            </Link>
          </div>

          <CardContent className="px-3 pb-4">
            <ol className="relative space-y-3.5 pl-1">
              {TODAYS_SCHEDULE.map((s, idx) => {
                const style = STATUS_STYLES[s.status];
                return (
                  <li key={s.time} className="relative flex items-start gap-3 pl-5">
                    <span className={cn('absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ring-4', style.dot, `ring-${s.status === 'completed' ? 'emerald' : s.status === 'in_progress' ? 'amber' : s.status === 'waiting' ? 'rose' : 'slate'}-100`)} />
                    {idx < TODAYS_SCHEDULE.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-[calc(100%+10px)] w-px bg-border-soft" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-ink-secondary">{s.time}</p>
                        <Badge variant={style.badge} className="px-1.5 py-0 text-[10px]">
                          {style.text}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-ink-primary">{s.name}</p>
                      <p className="text-xs text-ink-muted">{s.type}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* ── AI Insights + Recent Activity + Quick Actions ───────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* AI Insights */}
        <Card>
          <div className="flex items-center gap-2.5 p-6 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500/10 to-cyan-500/10 text-brand-600">
              <Sparkles size={16} strokeWidth={2} />
            </div>
            <div>
              <p className="text-card text-ink-primary">AI Insights</p>
              <p className="text-xs text-ink-secondary">Smart alerts &amp; suggestions</p>
            </div>
          </div>

          <CardContent className="space-y-2.5 px-4 pb-4">
            {AI_INSIGHTS.map((insight) => (
              <motion.div
                key={insight.title}
                whileHover={{ x: 2 }}
                className="group flex items-start gap-3 rounded-xl border border-border-soft bg-white p-3 transition hover:border-brand-500/20 hover:shadow-soft"
              >
                <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', insight.color)}>
                  <insight.icon size={15} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-ink-primary">{insight.title}</p>
                  <p className="mt-0.5 text-xs text-ink-secondary">{insight.description}</p>
                  <Link
                    to={insight.href}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 transition hover:gap-2"
                  >
                    {insight.cta} <ArrowRight size={10} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <Activity size={16} strokeWidth={2} />
              </div>
              <p className="text-card text-ink-primary">Recent Activity</p>
            </div>
            <a href="#all" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </a>
          </div>

          <CardContent className="space-y-3 px-4 pb-4">
            {ACTIVITY.map((a) => (
              <div key={a.name + a.action} className="flex items-start gap-3 rounded-xl border border-transparent p-2 transition hover:bg-slate-50">
                <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', a.accent)}>
                  <a.icon size={15} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight text-ink-primary">
                    {a.action.startsWith('Prescription') || a.action.includes('booked') || a.action.startsWith('Consultation')
                      ? <>
                          {a.action} <span className="font-semibold">{a.name}</span>
                        </>
                      : <>
                          New patient <span className="font-semibold">{a.name}</span> {a.action}
                        </>}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{formatRelativeTime(a.when)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2.5 p-6 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Sparkles size={16} strokeWidth={2} />
            </div>
            <p className="text-card text-ink-primary">Quick Actions</p>
          </div>

          <CardContent className="grid grid-cols-2 gap-2.5 px-4 pb-4">
            <QuickAction icon={UserPlus} label="Add New Patient" to="/patients" accent="brand" />
            <QuickAction icon={Stethoscope} label="Start Consultation" to="/doctor/consultation" accent="emerald" />
            <QuickAction icon={Pill} label="Write Prescription" to="/prescriptions" accent="rose" />
            <QuickAction icon={FileText} label="View Reports" to="/billing" accent="amber" />
            <div className="col-span-2">
              <Link
                to="/billing"
                className="group flex items-center gap-3 rounded-xl border border-brand-500/20 bg-gradient-to-r from-brand-50 via-brand-50/40 to-cyan-50 p-4 transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 text-white shadow-glow">
                  <Upload size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-primary">Upload Documents</p>
                  <p className="text-xs text-ink-secondary">Lab reports, scans, documents</p>
                </div>
                <ArrowRight size={14} className="text-brand-600 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  to: string;
  accent: 'brand' | 'emerald' | 'rose' | 'amber';
}) {
  const colors = {
    brand: 'from-brand-500/15 to-brand-500/5 text-brand-600',
    emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600',
    rose: 'from-rose-500/15 to-rose-500/5 text-rose-600',
    amber: 'from-amber-500/15 to-amber-500/5 text-amber-600',
  } as const;

  return (
    <Link
      to={to}
      className="group flex flex-col items-start gap-2 rounded-xl border border-border-soft bg-white p-3.5 transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-soft"
    >
      <div className={cn('grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br transition-transform group-hover:scale-105', colors[accent])}>
        <Icon size={15} strokeWidth={2} />
      </div>
      <p className="text-xs font-semibold leading-tight text-ink-primary">{label}</p>
    </Link>
  );
}

const QUEUE_FALLBACK = [
  { id: 'q1', patientId: 'PT-001', patientName: 'Aarav Sharma', patientAge: 32, reason: 'Checkup', status: 'waiting', startTime: '09:00', createdAt: '' },
  { id: 'q2', patientId: 'PT-002', patientName: 'Maya Verma', patientAge: 27, reason: 'Follow-up', status: 'waiting', startTime: '10:30', createdAt: '' },
  { id: 'q3', patientId: 'PT-003', patientName: 'Rohan Iyer', patientAge: 45, reason: 'Consultation', status: 'waiting', startTime: '11:45', createdAt: '' },
];
