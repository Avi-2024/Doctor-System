import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BadgeIndianRupee,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  FileText,
  Filter,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';

type PayStatus = 'paid' | 'pending' | 'overdue' | 'partial';

interface Invoice {
  id: string;
  patient: string;
  phone: string;
  date: string;
  service: string;
  amount: number;
  paid: number;
  status: PayStatus;
  mode?: string;
}

const INVOICES: Invoice[] = [
  { id: 'INV-2024', patient: 'Aarav Sharma',  phone: '98765-43210', date: '21 May 2026', service: 'General Consultation',  amount: 500,  paid: 500,  status: 'paid',    mode: 'UPI'  },
  { id: 'INV-2023', patient: 'Maya Verma',    phone: '91234-56789', date: '21 May 2026', service: 'Follow-up + Rx',        amount: 350,  paid: 200,  status: 'partial', mode: 'Cash' },
  { id: 'INV-2022', patient: 'Rohan Iyer',    phone: '97654-32109', date: '20 May 2026', service: 'Consultation + Reports', amount: 950,  paid: 0,    status: 'pending'  },
  { id: 'INV-2021', patient: 'Sneha Patel',   phone: '94567-12345', date: '20 May 2026', service: 'Specialist Consult',    amount: 1200, paid: 1200, status: 'paid',    mode: 'Card' },
  { id: 'INV-2020', patient: 'Vikram Singh',  phone: '92345-67890', date: '18 May 2026', service: 'Emergency Visit',       amount: 2500, paid: 0,    status: 'overdue'  },
  { id: 'INV-2019', patient: 'Priya Nair',    phone: '96789-01234', date: '17 May 2026', service: 'General Consultation',  amount: 500,  paid: 500,  status: 'paid',    mode: 'UPI'  },
  { id: 'INV-2018', patient: 'Karan Mehta',   phone: '98901-23456', date: '16 May 2026', service: 'Blood Reports Review',  amount: 750,  paid: 750,  status: 'paid',    mode: 'Cash' },
];

const STATUS_META: Record<PayStatus, { badge: 'success'|'warning'|'danger'|'neutral'; icon: React.ElementType; label: string }> = {
  paid:    { badge: 'success', icon: CheckCircle2, label: 'Paid'    },
  pending: { badge: 'warning', icon: Clock,        label: 'Pending' },
  overdue: { badge: 'danger',  icon: XCircle,      label: 'Overdue' },
  partial: { badge: 'neutral', icon: BadgeIndianRupee, label: 'Partial' },
};

const KPI = [
  { label: 'Total Revenue',   value: '₹6,200', sub: '+12% from last week', trend: 'up',   icon: TrendingUp,  color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Pending Dues',    value: '₹3,450', sub: '3 invoices',         trend: 'down', icon: Clock,       color: 'text-amber-600 bg-amber-50'   },
  { label: 'Overdue',         value: '₹2,500', sub: '1 invoice',          trend: 'down', icon: TrendingDown,color: 'text-rose-600 bg-rose-50'     },
  { label: 'Today Collected', value: '₹700',   sub: '2 payments',         trend: 'up',   icon: CreditCard,  color: 'text-brand-600 bg-brand-50'   },
];

const FILTERS: { key: PayStatus | 'all'; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'paid',    label: 'Paid'    },
  { key: 'pending', label: 'Pending' },
  { key: 'partial', label: 'Partial' },
  { key: 'overdue', label: 'Overdue' },
];

export default function BillingPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<PayStatus | 'all'>('all');

  const filtered = INVOICES.filter((inv) => {
    const matchSearch = inv.patient.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || inv.status === activeFilter;
    return matchSearch && matchFilter;
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
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Finance</p>
          <h1 className="text-2xl font-bold text-ink-primary">Billing &amp; Payments</h1>
          <p className="text-sm text-ink-secondary">Invoices, dues, and payment collection</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download size={14} /> Export
          </Button>
          <Button size="sm">
            <Plus size={14} /> New Invoice
          </Button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Card className="flex items-center gap-4 p-5">
              <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', k.color)}>
                <k.icon size={18} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-ink-primary">{k.value}</p>
                <p className="text-xs font-semibold text-ink-secondary">{k.label}</p>
                <p className="text-[11px] text-ink-muted">{k.sub}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Table card */}
      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-5 pb-4">
          <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-bg-subtle px-3.5 py-2.5 transition-all focus-within:border-brand-500/40 focus-within:bg-white focus-within:shadow-soft flex-1 min-w-56 max-w-72">
            <Search size={14} className="shrink-0 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient or invoice…"
              className="w-full bg-transparent text-sm font-medium text-ink-primary outline-none placeholder:text-ink-muted"
            />
          </div>

          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150',
                  activeFilter === f.key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-ink-secondary hover:bg-bg-subtle'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-border-soft px-3 py-2 text-xs font-bold text-ink-secondary transition hover:bg-bg-subtle">
            <Filter size={12} /> Filter <ChevronDown size={11} />
          </button>
        </div>

        {/* Table */}
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-soft bg-bg-subtle/60">
                  {['Invoice', 'Patient', 'Service', 'Date', 'Amount', 'Paid', 'Mode', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/60">
                <AnimatePresence>
                  {filtered.map((inv, idx) => {
                    const meta = STATUS_META[inv.status];
                    const balance = inv.amount - inv.paid;
                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group transition-colors hover:bg-bg-subtle/40"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-xs font-bold text-brand-600">{inv.id}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{inv.patient.split(' ').map(w => w[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-ink-primary">{inv.patient}</p>
                              <p className="text-[11px] text-ink-muted">{inv.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-ink-secondary">{inv.service}</td>
                        <td className="px-5 py-3.5 text-ink-secondary">{inv.date}</td>
                        <td className="px-5 py-3.5 font-bold text-ink-primary">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-emerald-600">₹{inv.paid.toLocaleString()}</p>
                          {balance > 0 && (
                            <p className="text-[11px] text-rose-500">due ₹{balance.toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {inv.mode ? (
                            <span className="rounded-md bg-bg-subtle px-2 py-0.5 text-xs font-semibold text-ink-secondary">{inv.mode}</span>
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={meta.badge} className="gap-1">
                            <meta.icon size={10} strokeWidth={2.5} />
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex items-center gap-1.5">
                            {(inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial') && (
                              <Button size="sm" className="h-7 px-2 text-[11px]">
                                <CreditCard size={11} /> Collect
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <FileText size={13} />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <FileText size={32} className="mx-auto mb-3 text-ink-muted" />
                <p className="font-semibold text-ink-secondary">No invoices found</p>
                <p className="text-sm text-ink-muted">Try adjusting your search or filter</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border-soft/60 px-5 py-3">
            <p className="text-xs text-ink-secondary">
              {filtered.length} of {INVOICES.length} invoices
            </p>
            <p className="text-xs font-bold text-ink-secondary">
              Total collected:{' '}
              <span className="text-emerald-600">
                ₹{filtered.reduce((a, b) => a + b.paid, 0).toLocaleString()}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
