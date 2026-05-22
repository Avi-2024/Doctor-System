import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Download,
  FileText,
  History,
  Mic,
  Pill,
  Plus,
  Save,
  Search,
  Sparkles,
  Stethoscope,
  TestTube2,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doctorApi } from '@/services/doctorApi';
import { cn, formatRelativeTime, initialsOf } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface QueueItem {
  id?: string;
  _id?: string;
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patient?: { _id?: string; fullName?: string };
  reason?: string;
  status?: string;
  startTime?: string;
  createdAt?: string;
}

interface VisitHistoryItem {
  id?: string;
  _id?: string;
  date?: string;
  createdAt?: string;
  diagnosis?: string;
  notes?: string;
  medicines?: Array<{ name: string; dosage?: string; frequency?: string }>;
  tests?: string[];
}

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

interface ConsultationForm {
  diagnosis: string;
  notes: string;
  medicines: Medicine[];
  tests: string[];
}

const COMMON_TESTS = ['CBC', 'LFT', 'KFT', 'TSH', 'Lipid Profile', 'HbA1c', 'X-Ray Chest', 'ECG', 'Urine Routine', 'Vitamin D'];

const AI_MEDICINE_SUGGESTIONS = [
  { name: 'Paracetamol', dosage: '500mg', frequency: '3 times daily' },
  { name: 'Pantoprazole', dosage: '40mg', frequency: 'Before breakfast' },
  { name: 'Cetirizine', dosage: '10mg', frequency: 'Once at night' },
  { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily' },
];

const EMPTY_MEDICINE: Medicine = { name: '', dosage: '', frequency: '', duration: '' };

export default function ConsultationPage() {
  const { accessToken, activeClinicId } = useAuth();
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [selected, setSelected] = React.useState<QueueItem | null>(null);
  const [history, setHistory] = React.useState<VisitHistoryItem[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [savedVisitId, setSavedVisitId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [queueSearch, setQueueSearch] = React.useState('');

  const [form, setForm] = React.useState<ConsultationForm>({
    diagnosis: '',
    notes: '',
    medicines: [{ ...EMPTY_MEDICINE }],
    tests: [],
  });

  const patientId = selected?.patientId || selected?.patient?._id || null;
  const patientName = selected?.patientName || selected?.patient?.fullName || 'Patient';
  const patientAge = selected?.patientAge ?? null;
  const appointmentId = selected?.id || selected?._id;

  React.useEffect(() => {
    if (!activeClinicId || !accessToken) {
      // Offline fallback handled by doctorApi
    }
    doctorApi
      .getPatientQueue({ clinicId: activeClinicId, token: accessToken })
      .then((res: any) => {
        const items: QueueItem[] = res.appointments || res.queue || [];
        setQueue(items);
        if (items.length > 0) setSelected((prev) => prev ?? items[0]);
      })
      .catch((e: Error) => setError(e.message));
  }, [activeClinicId, accessToken]);

  React.useEffect(() => {
    if (!patientId) return;
    doctorApi
      .getPatientHistory({ clinicId: activeClinicId, patientId, token: accessToken })
      .then((res: any) => setHistory(res.history || res.visits || []))
      .catch((e: Error) => setError(e.message));
    setSavedVisitId(null);
  }, [patientId, activeClinicId, accessToken]);

  const filteredQueue = React.useMemo(
    () =>
      queue.filter((q) => {
        const name = (q.patientName || q.patient?.fullName || '').toLowerCase();
        return name.includes(queueSearch.toLowerCase());
      }),
    [queue, queueSearch]
  );

  const updateMedicine = (idx: number, field: keyof Medicine, value: string) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const addMedicine = () =>
    setForm((prev) => ({ ...prev, medicines: [...prev.medicines, { ...EMPTY_MEDICINE }] }));

  const removeMedicine = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.length === 1 ? prev.medicines : prev.medicines.filter((_, i) => i !== idx),
    }));

  const applySuggestion = (s: Medicine) => {
    setForm((prev) => {
      const medicines = [...prev.medicines];
      const firstEmpty = medicines.findIndex((m) => !m.name.trim());
      if (firstEmpty >= 0) medicines[firstEmpty] = { ...s };
      else medicines.push({ ...s });
      return { ...prev, medicines };
    });
  };

  const toggleTest = (test: string) =>
    setForm((prev) => ({
      ...prev,
      tests: prev.tests.includes(test) ? prev.tests.filter((t) => t !== test) : [...prev.tests, test],
    }));

  const handleSave = async () => {
    if (!selected) {
      setError('Select a patient from the queue first.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const payload = {
        patientId,
        patientName,
        patientAge,
        appointmentId,
        diagnosis: form.diagnosis,
        notes: form.notes,
        tests: form.tests,
        medicines: form.medicines.filter((m) => m.name.trim()),
      };
      const res: any = await doctorApi.saveVisit({ clinicId: activeClinicId, token: accessToken, payload });
      const visitId = res.visit?.id || res.visit?._id;
      setSavedVisitId(visitId ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!savedVisitId) {
      setError('Submit prescription first to generate PDF.');
      return;
    }
    try {
      const res: any = await doctorApi.generatePrescriptionPdf({ clinicId: activeClinicId, visitId: savedVisitId, token: accessToken });
      if (res.pdfUrl) window.open(res.pdfUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-page text-ink-primary">Consultation</h1>
          <p className="page-subtitle">Review waiting patients and create prescriptions in a single workflow.</p>
        </div>
        {selected && (
          <div className="flex items-center gap-3 rounded-2xl border border-brand-500/20 bg-brand-50/40 px-4 py-2.5 backdrop-blur-sm">
            <Avatar className="h-9 w-9 ring-2 ring-brand-500/30">
              <AvatarFallback className="text-xs">{initialsOf(patientName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-ink-muted">Active patient</p>
              <p className="truncate text-sm font-semibold text-ink-primary">
                {patientName}{patientAge ? ` · ${patientAge}y` : ''}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Split workspace */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        {/* ─── LEFT: Queue + History ─────────────────────────────── */}
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          {/* Queue */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <Stethoscope size={15} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-primary">Patient Queue</p>
                  <p className="text-[11px] text-ink-muted">{queue.length} waiting</p>
                </div>
              </div>
              <Badge variant="brand" dot className="text-[10px]">Live</Badge>
            </div>

            <div className="px-3">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <Input
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Search queue..."
                  className="h-9 pl-9 text-sm"
                />
              </div>
            </div>

            <div className="max-h-[420px] space-y-1 overflow-y-auto p-2">
              {filteredQueue.map((item) => {
                const id = item.id || item._id;
                const isActive = id === (selected?.id || selected?._id);
                const name = item.patientName || item.patient?.fullName || 'Patient';
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => setSelected(item)}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ease-premium',
                      isActive
                        ? 'border-brand-500/40 bg-brand-50/60 shadow-soft'
                        : 'border-transparent hover:border-border-soft hover:bg-slate-50'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="active-queue-bar"
                        className="absolute -left-px top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500"
                      />
                    )}
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-[11px]">{initialsOf(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-primary">{name}</p>
                      <p className="truncate text-[11px] text-ink-secondary">{item.reason || 'Consultation'}</p>
                    </div>
                    {item.startTime && (
                      <div className="flex items-center gap-1 text-[10px] text-ink-muted">
                        <Clock size={10} />
                        {item.startTime}
                      </div>
                    )}
                  </motion.button>
                );
              })}

              {filteredQueue.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <p className="text-xs text-ink-muted">No patients in queue</p>
                </div>
              )}
            </div>
          </Card>

          {/* History */}
          <Card>
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                  <History size={15} strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-ink-primary">Patient History</p>
              </div>
              <span className="text-[10px] font-medium text-ink-muted">{history.length} visits</span>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto px-3 pb-3">
              {history.slice(0, 5).map((v, idx) => {
                const id = v.id || v._id || idx;
                const date = v.createdAt || v.date;
                return (
                  <div key={id} className="relative rounded-xl border border-border-soft bg-white p-3 transition hover:shadow-soft">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-ink-primary">
                        {v.diagnosis || 'No diagnosis recorded'}
                      </p>
                      <span className="shrink-0 text-[10px] text-ink-muted">
                        {date ? formatRelativeTime(date) : '—'}
                      </span>
                    </div>
                    {v.medicines && v.medicines.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {v.medicines.slice(0, 3).map((m, i) => (
                          <span key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-secondary">
                            {m.name}
                          </span>
                        ))}
                        {v.medicines.length > 3 && (
                          <span className="text-[10px] text-ink-muted">+{v.medicines.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {history.length === 0 && (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs text-ink-muted">No previous visits</p>
                </div>
              )}
            </div>
          </Card>
        </aside>

        {/* ─── RIGHT: Prescription builder ────────────────────────── */}
        <div className="space-y-5">
          {/* Vitals strip */}
          <Card className="p-5">
            <div className="flex items-center gap-2.5 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600">
                <Sparkles size={15} strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-ink-primary">Quick Vitals</p>
              <p className="text-[11px] text-ink-muted">(optional, last reading shown)</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <VitalChip label="BP" value="120/80" unit="mmHg" />
              <VitalChip label="Pulse" value="72" unit="bpm" />
              <VitalChip label="Temp" value="98.4" unit="°F" />
              <VitalChip label="SpO₂" value="98" unit="%" />
            </div>
          </Card>

          {/* Diagnosis + Notes */}
          <Card className="p-5">
            <div className="flex items-center gap-2.5 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <FileText size={15} strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-ink-primary">Diagnosis &amp; Notes</p>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 rounded-md border border-border-soft bg-white px-2 py-1 text-[11px] font-medium text-ink-secondary transition hover:border-brand-500/30 hover:text-brand-600"
                aria-label="Voice note"
              >
                <Mic size={11} /> Voice note
              </button>
            </div>

            <div className="space-y-3">
              <FieldLabel>Diagnosis</FieldLabel>
              <textarea
                value={form.diagnosis}
                onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))}
                placeholder="Enter primary diagnosis..."
                className="min-h-[88px] w-full resize-none rounded-input border border-border bg-white px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />

              <FieldLabel>Clinical Notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Examination findings, follow-up instructions, advice..."
                className="min-h-[80px] w-full resize-none rounded-input border border-border bg-white px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </Card>

          {/* Medicines */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600">
                  <Pill size={15} strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-ink-primary">Rx · Medicines</p>
              </div>
              <Button size="sm" variant="secondary" onClick={addMedicine}>
                <Plus size={13} /> Add Medicine
              </Button>
            </div>

            {/* AI suggestions */}
            <div className="px-5 pb-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                <Sparkles size={10} className="inline -mt-0.5 mr-1 text-brand-600" />
                AI Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {AI_MEDICINE_SUGGESTIONS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-gradient-to-r from-brand-50 to-cyan-50/50 px-2.5 py-1 text-[11px] font-medium text-brand-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <Pill size={10} />
                    {s.name}
                    <span className="text-ink-muted">{s.dosage}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Medicine rows */}
            <div className="space-y-2 px-3 pb-3">
              <AnimatePresence initial={false}>
                {form.medicines.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group grid grid-cols-[28px_1fr_1fr_1fr_36px] items-center gap-2 rounded-xl border border-border-soft bg-white p-2 transition hover:shadow-soft"
                  >
                    <span className="text-center text-[10px] font-bold text-ink-muted">{idx + 1}</span>
                    <Input
                      value={m.name}
                      onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                      placeholder="Medicine name"
                      className="h-9 border-transparent bg-slate-50/40 text-sm"
                    />
                    <Input
                      value={m.dosage}
                      onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                      placeholder="Dosage"
                      className="h-9 border-transparent bg-slate-50/40 text-sm"
                    />
                    <Input
                      value={m.frequency}
                      onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                      placeholder="Frequency"
                      className="h-9 border-transparent bg-slate-50/40 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedicine(idx)}
                      disabled={form.medicines.length === 1}
                      aria-label="Remove medicine"
                      className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>

          {/* Tests */}
          <Card className="p-5">
            <div className="flex items-center gap-2.5 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <TestTube2 size={15} strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-ink-primary">Investigations</p>
              <p className="text-[11px] text-ink-muted">{form.tests.length} selected</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_TESTS.map((test) => {
                const isActive = form.tests.includes(test);
                return (
                  <motion.button
                    key={test}
                    type="button"
                    onClick={() => toggleTest(test)}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-premium',
                      isActive
                        ? 'border-amber-500/30 bg-amber-50 text-amber-700 shadow-soft'
                        : 'border-border-soft bg-white text-ink-secondary hover:border-amber-500/30 hover:text-amber-700'
                    )}
                  >
                    {isActive && <X size={11} className="rotate-45" />}
                    {test}
                  </motion.button>
                );
              })}
            </div>
          </Card>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
              <AlertTriangle size={14} className="mr-1.5 inline" />
              {error}
            </div>
          )}

          {/* Sticky action bar */}
          <Card className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 border-brand-500/15 bg-white/95 p-3 shadow-elevated backdrop-blur-xl">
            <div className="flex flex-1 items-center gap-2 px-2">
              <Sparkles size={14} className="text-brand-600" />
              <p className="text-xs text-ink-secondary">
                {savedVisitId ? (
                  <span className="font-semibold text-emerald-600">Prescription saved · Ready to generate PDF</span>
                ) : (
                  <>
                    {form.medicines.filter((m) => m.name.trim()).length} medicines &middot; {form.tests.length} tests &middot;{' '}
                    {form.diagnosis ? 'diagnosis set' : 'no diagnosis'}
                  </>
                )}
              </p>
            </div>
            <Button variant="secondary" onClick={handleGeneratePdf} disabled={!savedVisitId}>
              <Download size={14} /> Generate PDF
            </Button>
            <Button onClick={handleSave} disabled={saving || !selected}>
              {saving ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} /> Submit Prescription
                  <ArrowRight size={12} />
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VitalChip({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-gradient-to-br from-slate-50/60 to-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-ink-primary">
        {value} <span className="text-xs font-medium text-ink-muted">{unit}</span>
      </p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{children}</p>;
}
