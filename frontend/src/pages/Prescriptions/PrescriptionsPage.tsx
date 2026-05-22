import * as React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Beaker,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileCheck2,
  FilePlus2,
  Pill,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { cn, initialsOf } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';

type RxStatus = 'active' | 'completed' | 'cancelled';

interface Prescription {
  id: string;
  patient: string;
  age: number;
  diagnosis: string;
  medicines: string[];
  date: string;
  followUp?: string;
  status: RxStatus;
  doctor: string;
}

const PRESCRIPTIONS: Prescription[] = [
  { id: 'RX-2048', patient: 'Aarav Sharma',  age: 34, diagnosis: 'Viral Fever',         medicines: ['Dolo 650',  'Cetirizine', 'Pantoprazole'],   date: '21 May 2026', followUp: '28 May 2026', status: 'active',    doctor: 'Dr. Rao'    },
  { id: 'RX-2047', patient: 'Maya Verma',    age: 28, diagnosis: 'Upper Respiratory',    medicines: ['Amoxicillin', 'Benadryl', 'Vitamin C'],       date: '21 May 2026', followUp: '30 May 2026', status: 'active',    doctor: 'Dr. Rao'    },
  { id: 'RX-2046', patient: 'Rohan Iyer',    age: 45, diagnosis: 'Hypertension F/U',     medicines: ['Amlodipine', 'Telmisartan'],                  date: '20 May 2026',                           status: 'completed', doctor: 'Dr. Rao'    },
  { id: 'RX-2045', patient: 'Sneha Patel',   age: 31, diagnosis: 'Allergic Rhinitis',    medicines: ['Montair-LC', 'Fluticasone Nasal Spray'],      date: '20 May 2026', followUp: '03 Jun 2026', status: 'active',    doctor: 'Dr. Rao'    },
  { id: 'RX-2044', patient: 'Vikram Singh',  age: 52, diagnosis: 'Diabetes Mellitus T2', medicines: ['Metformin 500', 'Glipizide', 'Rosuvastatin'], date: '18 May 2026',                           status: 'active',    doctor: 'Dr. Rao'    },
  { id: 'RX-2043', patient: 'Priya Nair',    age: 27, diagnosis: 'Migraine',             medicines: ['Sumatriptan', 'Domperidone'],                 date: '17 May 2026', followUp: '24 May 2026', status: 'completed', doctor: 'Dr. Rao'    },
  { id: 'RX-2042', patient: 'Karan Mehta',   age: 39, diagnosis: 'Gastritis',            medicines: ['Pantoprazole', 'Antacid Syrup', 'Domperidone'],date:'16 May 2026',                          status: 'cancelled', doctor: 'Dr. Rao'    },
];

const STATUS_META: Record<RxStatus, { badge: 'success'|'neutral'|'danger'; label: string }> = {
  active:    { badge: 'success', label: 'Active'    },
  completed: { badge: 'neutral', label: 'Completed' },
  cancelled: { badge: 'danger',  label: 'Cancelled' },
};

const QUICK_FEATURES = [
  { icon: FileCheck2,  title: 'Template Library',  sub: 'Pre-built medicine templates for common diagnoses', color: 'text-brand-600 bg-brand-50',   accent: 'hover:border-brand-500/30' },
  { icon: ShieldCheck, title: 'Safety Checks',     sub: 'Drug interaction & dosage caution alerts',         color: 'text-emerald-600 bg-emerald-50', accent: 'hover:border-emerald-500/30' },
  { icon: Printer,     title: 'Print & Share',      sub: 'Export with clinic branding, shareable PDF',       color: 'text-cyan-600 bg-cyan-50',       accent: 'hover:border-cyan-500/30'  },
  { icon: Beaker,      title: 'Drug Database',      sub: 'Search 50,000+ generic and brand medicines',       color: 'text-violet-600 bg-violet-50',   accent: 'hover:border-violet-500/30' },
];

export default function PrescriptionsPage() {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<RxStatus | 'all'>('all');

  const filtered = PRESCRIPTIONS.filter((rx) => {
    const matchSearch = rx.patient.toLowerCase().includes(search.toLowerCase()) ||
      rx.id.toLowerCase().includes(search.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeStatus === 'all' || rx.status === activeStatus;
    return matchSearch && matchStatus;
  });

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
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Prescriptions</p>
          <h1 className="text-2xl font-bold text-ink-primary">Prescription Workspace</h1>
          <p className="text-sm text-ink-secondary">Manage, print, and track patient medications</p>
        </div>
        <Button asChild>
          <Link to="/prescription/new">
            <FilePlus2 size={15} strokeWidth={2.2} />
            Write New Rx
          </Link>
        </Button>
      </motion.div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className={cn('cursor-pointer p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated', f.accent)}>
              <div className={cn('grid h-9 w-9 place-items-center rounded-xl mb-3', f.color)}>
                <f.icon size={16} strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-ink-primary">{f.title}</p>
              <p className="mt-0.5 text-[11px] text-ink-secondary">{f.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Prescription list */}
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-5 pb-4">
          <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-bg-subtle px-3.5 py-2.5 transition-all focus-within:border-brand-500/40 focus-within:bg-white focus-within:shadow-soft flex-1 min-w-56 max-w-72">
            <Search size={14} className="shrink-0 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, Rx ID, diagnosis…"
              className="w-full bg-transparent text-sm font-medium text-ink-primary outline-none placeholder:text-ink-muted"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'active', 'completed', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all',
                  activeStatus === s
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-ink-secondary hover:bg-bg-subtle'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="space-y-2.5 px-4 pb-5">
          <AnimatePresence>
            {filtered.map((rx, idx) => {
              const meta = STATUS_META[rx.status];
              return (
                <motion.div
                  key={rx.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group flex flex-wrap items-center gap-4 rounded-2xl border border-border-soft bg-white p-4 transition-all hover:border-border-default hover:shadow-soft"
                >
                  {/* Patient */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initialsOf(rx.patient)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-ink-primary">{rx.patient}</p>
                      <p className="text-[11px] text-ink-secondary">{rx.age} yrs · {rx.id}</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="min-w-[160px] flex-1">
                    <div className="flex items-center gap-1.5">
                      <Stethoscope size={12} className="text-ink-muted" />
                      <p className="text-sm font-semibold text-ink-primary">{rx.diagnosis}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rx.medicines.slice(0, 3).map((m) => (
                        <span key={m} className="flex items-center gap-0.5 rounded-md bg-bg-subtle px-1.5 py-0.5 text-[10px] font-semibold text-ink-secondary">
                          <Pill size={9} strokeWidth={2.5} /> {m}
                        </span>
                      ))}
                      {rx.medicines.length > 3 && (
                        <span className="rounded-md bg-bg-subtle px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted">
                          +{rx.medicines.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date + follow-up */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end text-[11px] text-ink-secondary">
                      <Calendar size={10} /> <span>{rx.date}</span>
                    </div>
                    {rx.followUp && (
                      <div className="mt-0.5 flex items-center gap-1 justify-end text-[11px] text-amber-600">
                        <Clock size={10} /> <span>F/U {rx.followUp}</span>
                      </div>
                    )}
                    <Badge variant={meta.badge} className="mt-1 text-[9px] px-1.5">
                      <CheckCircle2 size={9} /> {meta.label}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Print">
                      <Printer size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                      <Download size={14} />
                    </Button>
                    <Button size="sm" className="h-8 gap-1 px-3 text-xs" asChild>
                      <Link to="/prescription/new">
                        <Sparkles size={11} /> Edit
                      </Link>
                    </Button>
                    <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-bg-subtle">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Pill size={32} className="mx-auto mb-3 text-ink-muted" />
              <p className="font-semibold text-ink-secondary">No prescriptions found</p>
              <p className="text-sm text-ink-muted">Try adjusting your search or write a new prescription</p>
              <Button className="mt-4" asChild>
                <Link to="/prescription/new">
                  <FilePlus2 size={14} /> Write New Rx
                </Link>
              </Button>
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-between border-t border-border-soft/60 px-5 py-3">
          <p className="text-xs text-ink-secondary">{filtered.length} of {PRESCRIPTIONS.length} prescriptions</p>
          <p className="text-xs font-bold text-ink-secondary">
            Active: <span className="text-brand-600">{PRESCRIPTIONS.filter(r => r.status === 'active').length}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
