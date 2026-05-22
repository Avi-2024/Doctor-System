import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Heart,
  Keyboard,
  Phone,
  Stethoscope,
  Thermometer,
  UserCheck,
  UserPlus,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { receptionistApi } from '@/services/receptionistApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegForm    { fullName: string; phone: string; gender: string }
interface BookForm   { patientId: string; doctorId: string; appointmentDate: string; startTime: string; endTime: string }
interface VitalsForm { appointmentId: string; temperatureC: string; pulseBpm: string; systolicBp: string; diastolicBp: string }
interface PayForm    { billingId: string; amount: string; mode: string }

type Flash = { type: 'success' | 'error'; msg: string } | null;

// ─── Shared primitives ───────────────────────────────────────────────────────

const FieldLabel: React.FC<{ icon?: React.ElementType; label: string; htmlFor?: string }> = ({ icon: Icon, label, htmlFor }) => (
  <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-secondary">
    {Icon && <Icon size={11} strokeWidth={2.5} />} {label}
  </label>
);

const PanelInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      {...props}
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-border-soft bg-bg-subtle px-3.5 py-2.5 text-sm font-medium text-ink-primary outline-none transition-all duration-150',
        'placeholder:text-ink-muted hover:border-border-default focus:border-brand-500/50 focus:bg-white focus:shadow-soft',
        props.className,
      )}
    />
  )
);
PanelInput.displayName = 'PanelInput';

const PanelSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select
    {...props}
    className={cn(
      'w-full rounded-xl border border-border-soft bg-bg-subtle px-3.5 py-2.5 text-sm font-medium text-ink-primary outline-none transition-all duration-150',
      'hover:border-border-default focus:border-brand-500/50 focus:bg-white focus:shadow-soft',
      props.className,
    )}
  >
    {children}
  </select>
);

// ─── Panels ──────────────────────────────────────────────────────────────────

const PANELS = [
  { id: 'register',  label: 'Register Patient',    icon: UserPlus,    shortcut: 'Alt+R', color: 'text-brand-600 bg-brand-50 group-hover:bg-brand-100' },
  { id: 'book',      label: 'Book Appointment',    icon: CalendarDays, shortcut: 'Alt+B', color: 'text-cyan-600 bg-cyan-50 group-hover:bg-cyan-100'   },
  { id: 'vitals',    label: 'Record Vitals',        icon: Activity,    shortcut: 'Alt+V', color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100' },
  { id: 'queue',     label: 'Queue Status',         icon: UserCheck,   shortcut: 'Alt+W', color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-100'  },
  { id: 'payment',   label: 'Collect Payment',      icon: CreditCard,  shortcut: 'Alt+M', color: 'text-rose-600 bg-rose-50 group-hover:bg-rose-100'    },
];

export default function ReceptionistDashboardPage() {
  const { accessToken, activeClinicId } = useAuth() as { accessToken: string; activeClinicId: string };

  const [activePanel, setActivePanel] = useState('register');
  const [flash, setFlash] = useState<Flash>(null);

  const [regForm, setRegForm]   = useState<RegForm>({ fullName: '', phone: '', gender: 'male' });
  const [bookForm, setBookForm] = useState<BookForm>({ patientId: '', doctorId: '', appointmentDate: '', startTime: '', endTime: '' });
  const [vitalsForm, setVitalsForm] = useState<VitalsForm>({ appointmentId: '', temperatureC: '', pulseBpm: '', systolicBp: '', diastolicBp: '' });
  const [statusApptId, setStatusApptId] = useState('');
  const [payForm, setPayForm]   = useState<PayForm>({ billingId: '', amount: '', mode: 'cash' });

  const [loadMap, setLoadMap] = useState<Record<string, boolean>>({});

  const phoneRef = useRef<HTMLInputElement | null>(null);

  const setLoad = (key: string, v: boolean) => setLoadMap(prev => ({ ...prev, [key]: v }));

  const withFlash = async (key: string, cb: () => Promise<void>) => {
    setFlash(null);
    setLoad(key, true);
    try {
      await cb();
      setFlash({ type: 'success', msg: 'Saved successfully' });
      setTimeout(() => setFlash(null), 4000);
    } catch (err: unknown) {
      setFlash({ type: 'error', msg: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setLoad(key, false);
    }
  };

  const quickRegister  = () => withFlash('register', async () => {
    await receptionistApi.quickRegisterPatient({ clinicId: activeClinicId, token: accessToken, payload: regForm });
    setRegForm({ fullName: '', phone: '', gender: 'male' });
  });

  const quickBook = () => withFlash('book', async () => {
    await receptionistApi.quickBookAppointment({ clinicId: activeClinicId, token: accessToken, payload: bookForm });
  });

  const saveVitals = () => withFlash('vitals', async () => {
    await receptionistApi.saveVitals({
      clinicId: activeClinicId, token: accessToken,
      payload: {
        appointmentId: vitalsForm.appointmentId,
        vitals: {
          temperatureC: Number(vitalsForm.temperatureC),
          pulseBpm: Number(vitalsForm.pulseBpm),
          systolicBp: Number(vitalsForm.systolicBp),
          diastolicBp: Number(vitalsForm.diastolicBp),
        },
      },
    });
  });

  const markStatus = (status: string) => withFlash('queue', async () => {
    await receptionistApi.updateAppointmentStatus({ clinicId: activeClinicId, token: accessToken, appointmentId: statusApptId, status });
  });

  const savePayment = () => withFlash('payment', async () => {
    await receptionistApi.enterPayment({
      clinicId: activeClinicId, token: accessToken,
      billingId: payForm.billingId,
      payload: { amount: Number(payForm.amount), mode: payForm.mode },
    });
  });

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'r') { e.preventDefault(); setActivePanel('register'); quickRegister(); }
      if (key === 'b') { e.preventDefault(); setActivePanel('book');     quickBook(); }
      if (key === 'v') { e.preventDefault(); setActivePanel('vitals');   saveVitals(); }
      if (key === 'w') { e.preventDefault(); setActivePanel('queue');    markStatus('waiting'); }
      if (key === 'c') { e.preventDefault(); markStatus('completed'); }
      if (key === 'm') { e.preventDefault(); setActivePanel('payment');  savePayment(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regForm, bookForm, vitalsForm, statusApptId, payForm]);

  return (
    <div className="space-y-6" tabIndex={-1}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Front Desk</p>
          <h1 className="text-2xl font-bold text-ink-primary">Receptionist Fast Desk</h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
            <Keyboard size={12} /> Keyboard shortcuts: Alt+R / B / V / W / C / M
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-2.5">
          <Zap size={14} className="text-amber-600" strokeWidth={2.5} />
          <p className="text-xs font-bold text-amber-700">Fast Desk Mode Active</p>
        </div>
      </motion.div>

      {/* Flash message */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold',
              flash.type === 'success'
                ? 'border-emerald-300/50 bg-emerald-50 text-emerald-700'
                : 'border-rose-300/50 bg-rose-50 text-rose-700'
            )}
          >
            {flash.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {flash.msg}
            <button onClick={() => setFlash(null)} className="ml-auto">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel switcher */}
      <div className="flex flex-wrap gap-2">
        {PANELS.map((p) => {
          const active = activePanel === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id)}
              className={cn(
                'group flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all duration-150',
                active
                  ? 'border-brand-500/30 bg-white shadow-elevated text-ink-primary'
                  : 'border-border-soft bg-bg-subtle text-ink-secondary hover:border-border-default hover:bg-white'
              )}
            >
              <div className={cn('grid h-6 w-6 place-items-center rounded-lg transition-colors', p.color)}>
                <p.icon size={12} strokeWidth={2.5} />
              </div>
              {p.label}
              <span className="hidden rounded-md bg-bg-subtle px-1.5 py-0.5 text-[10px] text-ink-muted sm:block">
                {p.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePanel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activePanel === 'register' && (
            <Card>
              <div className="flex items-center gap-2.5 p-6 pb-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <UserPlus size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-ink-primary">Quick Patient Registration</p>
                  <p className="text-xs text-ink-secondary">Register a walk-in patient in seconds</p>
                </div>
              </div>
              <CardContent className="px-6 pb-6">
                <form onSubmit={(e) => { e.preventDefault(); quickRegister(); }} className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel icon={UserRound} label="Full Name" htmlFor="reg-name" />
                    <PanelInput id="reg-name" autoFocus placeholder="Patient full name" value={regForm.fullName}
                      onChange={(e) => setRegForm(p => ({ ...p, fullName: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && phoneRef.current?.focus()} />
                  </div>
                  <div>
                    <FieldLabel icon={Phone} label="Phone" htmlFor="reg-phone" />
                    <PanelInput id="reg-phone" ref={phoneRef} placeholder="10-digit phone" value={regForm.phone}
                      onChange={(e) => setRegForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel label="Gender" htmlFor="reg-gender" />
                    <PanelSelect id="reg-gender" value={regForm.gender}
                      onChange={(e) => setRegForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </PanelSelect>
                  </div>
                  <div className="sm:col-span-3">
                    <Button type="submit" disabled={loadMap.register} className="gap-2">
                      <UserPlus size={14} />
                      {loadMap.register ? 'Registering…' : 'Register Patient (Alt+R)'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activePanel === 'book' && (
            <Card>
              <div className="flex items-center gap-2.5 p-6 pb-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                  <CalendarDays size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-ink-primary">Appointment Booking</p>
                  <p className="text-xs text-ink-secondary">Schedule a patient visit with a doctor</p>
                </div>
              </div>
              <CardContent className="px-6 pb-6">
                <form onSubmit={(e) => { e.preventDefault(); quickBook(); }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <FieldLabel icon={UserRound} label="Patient ID" htmlFor="book-pid" />
                    <PanelInput id="book-pid" placeholder="Patient ID" value={bookForm.patientId}
                      onChange={(e) => setBookForm(p => ({ ...p, patientId: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={Stethoscope} label="Doctor ID" htmlFor="book-did" />
                    <PanelInput id="book-did" placeholder="Doctor ID" value={bookForm.doctorId}
                      onChange={(e) => setBookForm(p => ({ ...p, doctorId: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={CalendarDays} label="Date" htmlFor="book-date" />
                    <PanelInput id="book-date" type="date" value={bookForm.appointmentDate}
                      onChange={(e) => setBookForm(p => ({ ...p, appointmentDate: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={Clock} label="Start Time" htmlFor="book-start" />
                    <PanelInput id="book-start" placeholder="HH:MM" value={bookForm.startTime}
                      onChange={(e) => setBookForm(p => ({ ...p, startTime: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={Clock} label="End Time" htmlFor="book-end" />
                    <PanelInput id="book-end" placeholder="HH:MM" value={bookForm.endTime}
                      onChange={(e) => setBookForm(p => ({ ...p, endTime: e.target.value }))} />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={loadMap.book} className="gap-2">
                      <CalendarDays size={14} />
                      {loadMap.book ? 'Booking…' : 'Book Appointment (Alt+B)'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activePanel === 'vitals' && (
            <Card>
              <div className="flex items-center gap-2.5 p-6 pb-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Activity size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-ink-primary">Record Vitals</p>
                  <p className="text-xs text-ink-secondary">Enter patient vitals before consultation</p>
                </div>
              </div>
              <CardContent className="px-6 pb-6">
                <form onSubmit={(e) => { e.preventDefault(); saveVitals(); }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FieldLabel label="Appointment ID" htmlFor="v-appt" />
                    <PanelInput id="v-appt" placeholder="Appointment ID" value={vitalsForm.appointmentId}
                      onChange={(e) => setVitalsForm(p => ({ ...p, appointmentId: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={Thermometer} label="Temperature (°C)" htmlFor="v-temp" />
                    <PanelInput id="v-temp" type="number" step="0.1" placeholder="37.0" value={vitalsForm.temperatureC}
                      onChange={(e) => setVitalsForm(p => ({ ...p, temperatureC: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={Heart} label="Pulse (bpm)" htmlFor="v-pulse" />
                    <PanelInput id="v-pulse" type="number" placeholder="72" value={vitalsForm.pulseBpm}
                      onChange={(e) => setVitalsForm(p => ({ ...p, pulseBpm: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={Activity} label="Systolic BP" htmlFor="v-sys" />
                    <PanelInput id="v-sys" type="number" placeholder="120" value={vitalsForm.systolicBp}
                      onChange={(e) => setVitalsForm(p => ({ ...p, systolicBp: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={Activity} label="Diastolic BP" htmlFor="v-dia" />
                    <PanelInput id="v-dia" type="number" placeholder="80" value={vitalsForm.diastolicBp}
                      onChange={(e) => setVitalsForm(p => ({ ...p, diastolicBp: e.target.value }))} />
                  </div>
                  <div className="flex items-end sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={loadMap.vitals} className="gap-2">
                      <Activity size={14} />
                      {loadMap.vitals ? 'Saving…' : 'Save Vitals (Alt+V)'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activePanel === 'queue' && (
            <Card>
              <div className="flex items-center gap-2.5 p-6 pb-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <UserCheck size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-ink-primary">Queue Status</p>
                  <p className="text-xs text-ink-secondary">Update appointment status in the queue</p>
                </div>
              </div>
              <CardContent className="px-6 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <FieldLabel label="Appointment ID" htmlFor="q-appt" />
                    <PanelInput id="q-appt" placeholder="Appointment ID" value={statusApptId}
                      onChange={(e) => setStatusApptId(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" disabled={loadMap.queue} onClick={() => markStatus('waiting')} className="gap-2">
                      <Clock size={14} />
                      Mark Waiting (Alt+W)
                    </Button>
                    <Button disabled={loadMap.queue} onClick={() => markStatus('completed')} className="gap-2">
                      <CheckCircle2 size={14} />
                      Mark Completed (Alt+C)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activePanel === 'payment' && (
            <Card>
              <div className="flex items-center gap-2.5 p-6 pb-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
                  <CreditCard size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-ink-primary">Collect Payment</p>
                  <p className="text-xs text-ink-secondary">Record payment against a billing record</p>
                </div>
              </div>
              <CardContent className="px-6 pb-6">
                <form onSubmit={(e) => { e.preventDefault(); savePayment(); }} className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel label="Billing ID" htmlFor="pay-bid" />
                    <PanelInput id="pay-bid" placeholder="Billing ID" value={payForm.billingId}
                      onChange={(e) => setPayForm(p => ({ ...p, billingId: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel icon={CreditCard} label="Amount (₹)" htmlFor="pay-amt" />
                    <PanelInput id="pay-amt" type="number" placeholder="0" value={payForm.amount}
                      onChange={(e) => setPayForm(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel label="Mode" htmlFor="pay-mode" />
                    <PanelSelect id="pay-mode" value={payForm.mode}
                      onChange={(e) => setPayForm(p => ({ ...p, mode: e.target.value }))}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="insurance">Insurance</option>
                    </PanelSelect>
                  </div>
                  <div className="sm:col-span-3">
                    <Button type="submit" disabled={loadMap.payment} className="gap-2">
                      <CreditCard size={14} />
                      {loadMap.payment ? 'Processing…' : 'Collect Payment (Alt+M)'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Shortcuts reference */}
      <Card className="border-border-soft/60 bg-bg-subtle/60 p-5">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
          <Keyboard size={12} /> Keyboard Shortcuts
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ['Alt+R', 'Register Patient'],
            ['Alt+B', 'Book Appointment'],
            ['Alt+V', 'Save Vitals'],
            ['Alt+W', 'Mark Waiting'],
            ['Alt+C', 'Mark Completed'],
            ['Alt+M', 'Collect Payment'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-2 rounded-lg border border-border-soft bg-white px-3 py-1.5">
              <kbd className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-secondary">{key}</kbd>
              <span className="text-xs text-ink-secondary">{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
