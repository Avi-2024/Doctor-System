import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  BadgeIndianRupee,
  Calendar,
  Clock,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MONTHLY_PATIENTS = [
  { month: 'Dec', patients: 210, revenue: 84000 },
  { month: 'Jan', patients: 245, revenue: 98000 },
  { month: 'Feb', patients: 230, revenue: 92000 },
  { month: 'Mar', patients: 280, revenue: 112000 },
  { month: 'Apr', patients: 320, revenue: 128000 },
  { month: 'May', patients: 298, revenue: 119200 },
];

const DAILY_VISITS = [
  { day: 'Mon', visits: 38 },
  { day: 'Tue', visits: 45 },
  { day: 'Wed', visits: 29 },
  { day: 'Thu', visits: 52 },
  { day: 'Fri', visits: 41 },
  { day: 'Sat', visits: 63 },
  { day: 'Sun', visits: 22 },
];

const DIAGNOSIS_MIX = [
  { name: 'Viral Fever',     value: 28, color: '#6366f1' },
  { name: 'Hypertension',    value: 18, color: '#06b6d4' },
  { name: 'Diabetes',        value: 15, color: '#10b981' },
  { name: 'Respiratory',     value: 22, color: '#f59e0b' },
  { name: 'Other',           value: 17, color: '#94a3b8' },
];

const TOP_DOCTORS = [
  { name: 'Dr. Ramesh Rao',  consults: 142, revenue: '₹71,000',  rating: 4.9 },
  { name: 'Dr. Priya Shah',  consults: 118, revenue: '₹59,000',  rating: 4.7 },
];

const PERIOD_FILTERS = ['7D', '30D', '3M', '6M', '1Y'] as const;

type Period = typeof PERIOD_FILTERS[number];

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

const KPI = [
  { label: 'Total Patients',  value: '1,583', change: '+12%', up: true,  icon: Users,             color: 'text-brand-600 bg-brand-50'    },
  { label: 'Monthly Revenue', value: '₹1.19L', change: '+8%', up: true,  icon: BadgeIndianRupee, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Avg Wait Time',   value: '14 min', change: '-3m', up: true,  icon: Clock,             color: 'text-cyan-600 bg-cyan-50'      },
  { label: 'Consultations',   value: '298',    change: '-7%', up: false, icon: Stethoscope,       color: 'text-amber-600 bg-amber-50'    },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30D');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Insights</p>
          <h1 className="text-2xl font-bold text-ink-primary">Analytics Dashboard</h1>
          <p className="text-sm text-ink-secondary">Clinic performance and patient trends</p>
        </div>

        <div className="flex gap-1 rounded-xl border border-border-soft bg-bg-subtle p-1">
          {PERIOD_FILTERS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                period === p ? 'bg-white text-ink-primary shadow-soft' : 'text-ink-secondary hover:text-ink-primary'
              )}>
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="flex items-center gap-4 p-5">
              <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', k.color)}>
                <k.icon size={18} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-ink-primary">{k.value}</p>
                <p className="text-xs font-semibold text-ink-secondary">{k.label}</p>
                <p className={cn('flex items-center gap-0.5 text-[11px] font-bold', k.up ? 'text-emerald-600' : 'text-rose-500')}>
                  {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {k.change}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Revenue & patients area chart */}
        <Card>
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <p className="font-bold text-ink-primary">Revenue &amp; Patient Volume</p>
              <p className="text-xs text-ink-secondary">Monthly overview</p>
            </div>
            <div className="flex gap-3 text-[11px] font-semibold text-ink-secondary">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-600 inline-block"/>Revenue</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400 inline-block"/>Patients</span>
            </div>
          </div>
          <CardContent className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_PATIENTS} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-patients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="revenue"  stroke="#6366f1" strokeWidth={2} fill="url(#grad-revenue)"  dot={false} />
                <Area type="monotone" dataKey="patients" stroke="#06b6d4" strokeWidth={2} fill="url(#grad-patients)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily visits bar chart */}
        <Card>
          <div className="p-5 pb-3">
            <p className="font-bold text-ink-primary">Daily Visits This Week</p>
            <p className="text-xs text-ink-secondary">Patient visits by day of week</p>
          </div>
          <CardContent className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DAILY_VISITS} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="visits" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Doctor performance */}
        <Card>
          <div className="p-5 pb-4">
            <p className="font-bold text-ink-primary">Doctor Performance</p>
            <p className="text-xs text-ink-secondary">Consultations and revenue this month</p>
          </div>
          <CardContent className="space-y-3 px-4 pb-5">
            {TOP_DOCTORS.map((d) => (
              <div key={d.name} className="flex items-center gap-4 rounded-xl border border-border-soft bg-white p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Stethoscope size={16} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-primary">{d.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-ink-secondary">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {d.consults} consults</span>
                    <span className="flex items-center gap-1"><BadgeIndianRupee size={10} /> {d.revenue}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-500">★ {d.rating}</p>
                  <p className="text-[11px] text-ink-muted">rating</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Diagnosis mix donut */}
        <Card>
          <div className="p-5 pb-3">
            <p className="font-bold text-ink-primary">Diagnosis Mix</p>
            <p className="text-xs text-ink-secondary">Top conditions this month</p>
          </div>
          <CardContent className="flex flex-col items-center px-4 pb-5">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={DIAGNOSIS_MIX} cx="50%" cy="50%" innerRadius={46} outerRadius={70}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {DIAGNOSIS_MIX.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid w-full grid-cols-2 gap-1.5">
              {DIAGNOSIS_MIX.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px] text-ink-secondary">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
                  {d.name} <span className="ml-auto font-bold text-ink-primary">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
