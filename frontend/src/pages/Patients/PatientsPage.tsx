import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Stethoscope,
  X,
} from 'lucide-react';
import { localAppointments, localPatients } from '@/services/localStore';
import { cn, initialsOf } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

type StatusKind = 'Active' | 'Follow-up' | 'Stable' | 'Critical' | 'Inactive';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender?: string;
  contact: string;
  address?: string;
  status: StatusKind;
  lastVisit: string;
  createdAt?: string;
}

const STATUS_BADGE: Record<StatusKind, { variant: 'success' | 'warning' | 'brand' | 'danger' | 'neutral'; label: string }> = {
  Active: { variant: 'success', label: 'Active' },
  'Follow-up': { variant: 'warning', label: 'Follow-up' },
  Stable: { variant: 'brand', label: 'Stable' },
  Critical: { variant: 'danger', label: 'Critical' },
  Inactive: { variant: 'neutral', label: 'Inactive' },
};

const PAGE_SIZE = 8;

const emptyForm = { name: '', age: '', gender: 'Male', contact: '', address: '' };

function relativeDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return date.toLocaleDateString();
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [ageFilter, setAgeFilter] = React.useState<'all' | 'child' | 'adult' | 'senior'>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | StatusKind>('all');
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [page, setPage] = React.useState(1);
  const [showModal, setShowModal] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [formError, setFormError] = React.useState('');
  const [toast, setToast] = React.useState('');

  React.useEffect(() => {
    localPatients.seed();
    setPatients(localPatients.getAll() as Patient[]);
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        (p.id ?? '').toLowerCase().includes(q) ||
        (p.contact ?? '').toLowerCase().includes(q);

      const age = Number(p.age);
      const matchesAge =
        ageFilter === 'all' ||
        (ageFilter === 'child' && age < 18) ||
        (ageFilter === 'adult' && age >= 18 && age < 60) ||
        (ageFilter === 'senior' && age >= 60);

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesAge && matchesStatus;
    });
  }, [patients, search, ageFilter, statusFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, ageFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const handleAddPatient = () => {
    if (!form.name.trim() || !form.age || !form.contact.trim()) {
      setFormError('Name, Age and Contact are required.');
      return;
    }
    const patient = localPatients.add({ ...form, age: Number(form.age) }) as Patient;
    setPatients(localPatients.getAll() as Patient[]);
    setShowModal(false);
    setForm(emptyForm);
    setFormError('');
    localAppointments.addToQueue(patient.id, patient.name, patient.age, 'New patient visit');
    showToast(`${patient.name} added to waiting queue.`);
  };

  const startConsultation = (p: Patient) => {
    localAppointments.addToQueue(p.id, p.name, p.age, 'Consultation');
    navigate('/doctor/consultation');
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-page text-ink-primary">Patients</h1>
            <p className="page-subtitle">Manage and view all your patients</p>
          </div>
          <Button size="lg" onClick={() => setShowModal(true)}>
            <Plus size={16} strokeWidth={2.4} />
            Add New Patient
          </Button>
        </motion.div>

        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-2.5 text-sm text-emerald-700 backdrop-blur-sm"
          >
            {toast}
          </motion.div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID or contact..."
                className="pl-10"
              />
            </div>

            <FilterSelect
              value={ageFilter}
              onChange={(v) => setAgeFilter(v as typeof ageFilter)}
              options={[
                { value: 'all', label: 'All Age Groups' },
                { value: 'child', label: 'Children (<18)' },
                { value: 'adult', label: 'Adults (18-59)' },
                { value: 'senior', label: 'Seniors (60+)' },
              ]}
            />

            <FilterSelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Follow-up', label: 'Follow-up' },
                { value: 'Stable', label: 'Stable' },
                { value: 'Critical', label: 'Critical' },
              ]}
            />

            <Button variant="secondary" size="md" className="h-11">
              <Filter size={14} />
              <span className="hidden sm:inline">Advanced</span>
            </Button>
          </div>
        </Card>

        {/* Table card */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-border-soft">
                  <Th className="pl-6">Patient</Th>
                  <Th>Age</Th>
                  <Th>Contact</Th>
                  <Th>Last Visit</Th>
                  <Th>Status</Th>
                  <Th className="pr-6 text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: idx * 0.02 }}
                    className="group border-b border-border-soft/60 transition-colors duration-200 ease-premium hover:bg-brand-50/30 last:border-b-0"
                  >
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{initialsOf(p.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-primary">{p.name}</p>
                          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                            {p.id?.toString().slice(0, 12)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-ink-primary">{p.age}</p>
                      <p className="text-xs text-ink-muted">{p.gender ?? 'Male'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1.5 text-sm text-ink-primary">
                        <Phone size={12} className="text-ink-muted" />
                        {p.contact}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1.5 text-sm text-ink-primary">
                        <Calendar size={12} className="text-ink-muted" />
                        {new Date(`${p.lastVisit}T00:00:00`).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <p className="text-xs text-ink-muted">{relativeDay(p.lastVisit)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={STATUS_BADGE[p.status]?.variant ?? 'neutral'}>
                        {STATUS_BADGE[p.status]?.label ?? p.status}
                      </Badge>
                    </td>
                    <td className="py-4 pl-4 pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label="View profile"
                              className="grid h-9 w-9 place-items-center rounded-lg text-ink-secondary opacity-0 transition-all duration-200 ease-premium group-hover:opacity-100 hover:bg-brand-50 hover:text-brand-600"
                            >
                              <Eye size={15} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>View profile</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label="Start consultation"
                              onClick={() => startConsultation(p)}
                              className="grid h-9 w-9 place-items-center rounded-lg text-ink-secondary opacity-0 transition-all duration-200 ease-premium group-hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Stethoscope size={15} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Start consultation</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label="Write prescription"
                              onClick={() => navigate(`/prescription/new?patientId=${p.id}`)}
                              className="grid h-9 w-9 place-items-center rounded-lg text-ink-secondary opacity-0 transition-all duration-200 ease-premium group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <FileText size={15} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Write prescription</TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="More actions"
                              className="grid h-9 w-9 place-items-center rounded-lg text-ink-secondary transition hover:bg-slate-100 hover:text-ink-primary"
                            >
                              <MoreVertical size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => startConsultation(p)}>
                              <Stethoscope size={14} /> Start Consultation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/prescription/new?patientId=${p.id}`)}>
                              <FileText size={14} /> Write Prescription
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye size={14} /> View Full Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="mx-auto inline-flex flex-col items-center gap-3">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-ink-muted">
                          <Search size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-primary">No patients found</p>
                          <p className="text-xs text-ink-secondary">Try adjusting your filters or add a new patient.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft bg-slate-50/40 px-6 py-4">
            <p className="text-xs text-ink-secondary">
              Showing <span className="font-semibold text-ink-primary">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-semibold text-ink-primary">
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              of <span className="font-semibold text-ink-primary">{filtered.length}</span> patients
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="grid h-9 w-9 place-items-center rounded-lg border border-border-soft bg-white text-ink-secondary transition hover:border-brand-500/30 hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'h-9 min-w-[36px] rounded-lg px-2 text-sm font-semibold transition-all duration-200 ease-premium',
                      isActive
                        ? 'bg-brand-600 text-white shadow-glow'
                        : 'border border-border-soft bg-white text-ink-secondary hover:border-brand-500/30 hover:text-ink-primary'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-1 text-ink-muted">…</span>
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    className="h-9 min-w-[36px] rounded-lg border border-border-soft bg-white px-2 text-sm font-semibold text-ink-secondary transition hover:border-brand-500/30 hover:text-ink-primary"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="grid h-9 w-9 place-items-center rounded-lg border border-border-soft bg-white text-ink-secondary transition hover:border-brand-500/30 hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </Card>

        {/* Add Patient Modal */}
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) { setFormError(''); setForm(emptyForm); }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>Patient will be auto-added to the waiting queue.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              <Field label="Patient Name *">
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Age *">
                  <Input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                    placeholder="In years"
                  />
                </Field>
                <Field label="Gender">
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    className="h-11 w-full rounded-input border border-border bg-white px-3 text-sm text-ink-primary outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>

              <Field label="Mobile Number *">
                <Input
                  value={form.contact}
                  onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))}
                  placeholder="10 digit number"
                />
              </Field>

              <Field label="Address">
                <Input
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Home address (optional)"
                />
              </Field>

              {formError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-2 flex gap-2.5">
              <Button onClick={handleAddPatient} className="flex-1">
                Save &amp; Add to Queue
              </Button>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'bg-slate-50/60 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted',
        className
      )}
    >
      {children}
    </th>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 inline-block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-input border border-border bg-white pl-4 pr-9 text-sm font-medium text-ink-primary outline-none transition-all duration-200 ease-premium hover:border-ink-muted/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronRight size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-ink-muted" />
    </div>
  );
}
