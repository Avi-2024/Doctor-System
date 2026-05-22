import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type EventStatus = 'confirmed' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';
type EventType = 'General Checkup' | 'Follow-up' | 'Consultation' | 'Procedure';

interface CalendarEvent {
  id: string;
  patient: string;
  type: EventType;
  status: EventStatus;
  day: number; // 0 = Mon, ..., 6 = Sun
  startMinute: number; // minutes from 00:00
  durationMinute: number;
}

const VIEW_OPTIONS = ['Day', 'Week', 'Month'] as const;
type ViewMode = (typeof VIEW_OPTIONS)[number];

const EVENT_STYLES: Record<EventStatus, { bar: string; bg: string; border: string; text: string; dot: string }> = {
  confirmed:    { bar: 'bg-emerald-500', bg: 'bg-emerald-50/90',  border: 'border-emerald-200', text: 'text-emerald-900', dot: 'bg-emerald-500' },
  in_progress:  { bar: 'bg-amber-500',   bg: 'bg-amber-50/90',    border: 'border-amber-200',   text: 'text-amber-900',   dot: 'bg-amber-500'   },
  waiting:      { bar: 'bg-rose-500',    bg: 'bg-rose-50/90',     border: 'border-rose-200',    text: 'text-rose-900',    dot: 'bg-rose-500'    },
  completed:    { bar: 'bg-brand-500',   bg: 'bg-brand-50/90',    border: 'border-brand-200',   text: 'text-brand-900',   dot: 'bg-brand-500'   },
  cancelled:    { bar: 'bg-slate-400',   bg: 'bg-slate-50/90',    border: 'border-slate-200',   text: 'text-slate-700',   dot: 'bg-slate-400'   },
};

const STATUS_FILTERS: { key: EventStatus; label: string; color: string }[] = [
  { key: 'confirmed',   label: 'Confirmed',   color: 'text-emerald-600' },
  { key: 'in_progress', label: 'In Progress', color: 'text-amber-600'   },
  { key: 'waiting',     label: 'Waiting',     color: 'text-rose-600'    },
  { key: 'completed',   label: 'Completed',   color: 'text-brand-600'   },
  { key: 'cancelled',   label: 'Cancelled',   color: 'text-slate-500'   },
];

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9 AM → 6 PM
const HOUR_HEIGHT = 72; // px per hour
const START_HOUR = 9;

// Mock weekly appointments
const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1',  patient: 'Aarav Sharma',  type: 'General Checkup', status: 'confirmed',   day: 0, startMinute: 540,  durationMinute: 45 },
  { id: '2',  patient: 'Maya Verma',    type: 'Follow-up',       status: 'in_progress', day: 0, startMinute: 600,  durationMinute: 30 },
  { id: '3',  patient: 'Rohan Iyer',    type: 'Consultation',    status: 'waiting',     day: 0, startMinute: 660,  durationMinute: 30 },
  { id: '4',  patient: 'Sneha Patel',   type: 'Follow-up',       status: 'completed',   day: 0, startMinute: 840,  durationMinute: 30 },
  { id: '5',  patient: 'Arjun Kumar',   type: 'General Checkup', status: 'confirmed',   day: 0, startMinute: 900,  durationMinute: 45 },
  { id: '6',  patient: 'Vikram Singh',  type: 'General Checkup', status: 'confirmed',   day: 0, startMinute: 960,  durationMinute: 45 },
  { id: '7',  patient: 'Neha Tiwari',   type: 'Consultation',    status: 'waiting',     day: 0, startMinute: 1020, durationMinute: 30 },

  { id: '8',  patient: 'Rohan Iyer',    type: 'Follow-up',       status: 'in_progress', day: 1, startMinute: 570,  durationMinute: 30 },
  { id: '9',  patient: 'Aarav Sharma',  type: 'Consultation',    status: 'confirmed',   day: 1, startMinute: 690,  durationMinute: 45 },
  { id: '10', patient: 'Priya Mehta',   type: 'Consultation',    status: 'confirmed',   day: 1, startMinute: 780,  durationMinute: 30 },
  { id: '11', patient: 'Maya Verma',    type: 'General Checkup', status: 'confirmed',   day: 1, startMinute: 870,  durationMinute: 45 },
  { id: '12', patient: 'Sneha Patel',   type: 'Follow-up',       status: 'completed',   day: 1, startMinute: 1050, durationMinute: 30 },

  { id: '13', patient: 'Rohan Iyer',    type: 'Consultation',    status: 'confirmed',   day: 2, startMinute: 540,  durationMinute: 45 },
  { id: '14', patient: 'Vikram Singh',  type: 'Consultation',    status: 'in_progress', day: 2, startMinute: 630,  durationMinute: 45 },
  { id: '15', patient: 'Maya Verma',    type: 'Follow-up',       status: 'confirmed',   day: 2, startMinute: 720,  durationMinute: 30 },
  { id: '16', patient: 'Priya Mehta',   type: 'Follow-up',       status: 'completed',   day: 2, startMinute: 810,  durationMinute: 30 },
  { id: '17', patient: 'Neha Tiwari',   type: 'Consultation',    status: 'waiting',     day: 2, startMinute: 870,  durationMinute: 30 },
  { id: '18', patient: 'Rohan Iyer',    type: 'General Checkup', status: 'confirmed',   day: 2, startMinute: 1020, durationMinute: 30 },

  { id: '19', patient: 'Aarav Sharma',  type: 'Consultation',    status: 'confirmed',   day: 3, startMinute: 690,  durationMinute: 45 },

  { id: '20', patient: 'Maya Verma',    type: 'Follow-up',       status: 'in_progress', day: 4, startMinute: 660,  durationMinute: 30 },
  { id: '21', patient: 'Arjun Kumar',   type: 'General Checkup', status: 'confirmed',   day: 4, startMinute: 870,  durationMinute: 30 },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(display).padStart(2, '0')}:00 ${period}`;
}

function formatRange(startMin: number, durationMin: number): string {
  const fmt = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${String(display).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };
  return `${fmt(startMin)} – ${fmt(startMin + durationMin)}`;
}

function getWeekDates(refDate: Date): Date[] {
  const day = refDate.getDay();
  // Convert Sunday=0 → Monday-start week
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function AppointmentsPage() {
  const [refDate, setRefDate] = React.useState(new Date());
  const [view, setView] = React.useState<ViewMode>('Week');
  const [activeStatuses, setActiveStatuses] = React.useState<Set<EventStatus>>(
    new Set(['confirmed', 'in_progress', 'waiting', 'completed', 'cancelled'])
  );

  const weekDates = getWeekDates(refDate);
  const today = new Date();
  const monthLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short' })} ${weekDates[0].getDate()} – ${weekDates[6].getDate()}, ${weekDates[6].getFullYear()}`;

  const visibleEvents = MOCK_EVENTS.filter((e) => activeStatuses.has(e.status));

  const goPrev = () => {
    const d = new Date(refDate);
    d.setDate(d.getDate() - 7);
    setRefDate(d);
  };
  const goNext = () => {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 7);
    setRefDate(d);
  };
  const goToday = () => setRefDate(new Date());

  const toggleStatus = (s: EventStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
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
          <h1 className="text-page text-ink-primary">Appointments</h1>
          <p className="page-subtitle">Manage your clinic appointments and schedule</p>
        </div>
        <Button size="lg">
          <Plus size={16} strokeWidth={2.4} />
          Add Appointment
        </Button>
      </motion.div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={goToday}>
            Today
          </Button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous week"
              className="grid h-10 w-10 place-items-center rounded-lg border border-border-soft bg-white text-ink-secondary transition hover:border-brand-500/30 hover:text-ink-primary"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next week"
              className="grid h-10 w-10 place-items-center rounded-lg border border-border-soft bg-white text-ink-secondary transition hover:border-brand-500/30 hover:text-ink-primary"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <p className="text-sm font-semibold text-ink-primary">{monthLabel}</p>

          <div className="ml-auto inline-flex rounded-lg border border-border-soft bg-white p-1">
            {VIEW_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                  view === v ? 'bg-brand-600 text-white shadow-glow' : 'text-ink-secondary hover:text-ink-primary'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        {/* ─── Week calendar ──────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              {/* Day headers */}
              <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border-soft">
                <div className="grid place-items-center border-r border-border-soft py-3 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  IST
                </div>
                {weekDates.map((date, idx) => {
                  const isToday = sameDay(date, today);
                  return (
                    <div key={idx} className="border-r border-border-soft py-3 text-center last:border-r-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{DAYS[idx]}</p>
                      <p
                        className={cn(
                          'mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition',
                          isToday ? 'bg-brand-600 text-white shadow-glow' : 'text-ink-primary'
                        )}
                      >
                        {date.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="relative grid grid-cols-[64px_repeat(7,1fr)]">
                {/* Hour labels column */}
                <div className="border-r border-border-soft">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{ height: HOUR_HEIGHT }}
                      className="flex items-start justify-end border-b border-border-soft pr-2 pt-1.5 text-[10px] font-semibold text-ink-muted"
                    >
                      {formatHour(h)}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDates.map((_, dayIdx) => {
                  const dayEvents = visibleEvents.filter((e) => e.day === dayIdx);
                  return (
                    <div key={dayIdx} className="relative border-r border-border-soft last:border-r-0">
                      {/* Hour cells background */}
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          style={{ height: HOUR_HEIGHT }}
                          className="border-b border-border-soft/60 transition-colors hover:bg-brand-50/20"
                        />
                      ))}

                      {/* Events */}
                      {dayEvents.map((event) => {
                        const startOffsetMin = event.startMinute - START_HOUR * 60;
                        const top = (startOffsetMin / 60) * HOUR_HEIGHT;
                        const height = (event.durationMinute / 60) * HOUR_HEIGHT - 2;
                        const styles = EVENT_STYLES[event.status];

                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            whileHover={{ scale: 1.02, zIndex: 10 }}
                            style={{ top, height, minHeight: 38 }}
                            className={cn(
                              'group absolute inset-x-1 cursor-pointer overflow-hidden rounded-lg border pl-2.5 pr-2 py-1 shadow-sm transition-shadow duration-200 hover:shadow-elevated',
                              styles.bg,
                              styles.border
                            )}
                          >
                            <span className={cn('absolute left-0 top-0 h-full w-1', styles.bar)} />
                            <p className={cn('truncate text-[11px] font-bold leading-tight', styles.text)}>{event.patient}</p>
                            <p className="truncate text-[10px] font-medium text-ink-secondary">{event.type}</p>
                            <p className="truncate text-[9px] text-ink-muted">
                              {formatRange(event.startMinute, event.durationMinute)}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Mini calendar + filters ─────────────────────────────── */}
        <div className="space-y-6">
          <MiniCalendar refDate={refDate} onSelect={setRefDate} weekDates={weekDates} today={today} />

          <Card className="p-5">
            <p className="text-card text-ink-primary">Filters</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  All Doctors
                </label>
                <select className="h-10 w-full appearance-none rounded-lg border border-border-soft bg-white px-3 text-sm font-medium text-ink-primary outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10">
                  <option>All Doctors</option>
                  <option>Dr. Demo</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  All Statuses
                </label>
                <select className="h-10 w-full appearance-none rounded-lg border border-border-soft bg-white px-3 text-sm font-medium text-ink-primary outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10">
                  <option>All Statuses</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Status</p>
              <div className="mt-2 space-y-1.5">
                {STATUS_FILTERS.map((s) => {
                  const isActive = activeStatuses.has(s.key);
                  return (
                    <label
                      key={s.key}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                    >
                      <span className="relative grid h-4 w-4 place-items-center">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleStatus(s.key)}
                          className="peer absolute h-full w-full cursor-pointer appearance-none rounded-[5px] border border-border-soft bg-white checked:border-brand-600 checked:bg-brand-600"
                        />
                        <svg
                          className="pointer-events-none relative h-2.5 w-2.5 stroke-white opacity-0 peer-checked:opacity-100"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className={cn('text-sm font-medium', s.color)}>{s.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({
  refDate,
  onSelect,
  weekDates,
  today,
}: {
  refDate: Date;
  onSelect: (d: Date) => void;
  weekDates: Date[];
  today: Date;
}) {
  const monthName = refDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDayIdx = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Build 6×7 grid
  const cells: { date: Date; outside: boolean }[] = [];
  for (let i = startDayIdx - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), outside: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, outside: true });
  }

  const goPrev = () => onSelect(new Date(year, month - 1, refDate.getDate()));
  const goNext = () => onSelect(new Date(year, month + 1, refDate.getDate()));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous month"
          className="grid h-7 w-7 place-items-center rounded-lg text-ink-secondary transition hover:bg-slate-100 hover:text-ink-primary"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="text-sm font-bold text-ink-primary">{monthName}</p>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          className="grid h-7 w-7 place-items-center rounded-lg text-ink-secondary transition hover:bg-slate-100 hover:text-ink-primary"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((c, idx) => {
          const isToday = sameDay(c.date, today);
          const inWeek = weekDates.some((d) => sameDay(d, c.date));
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(c.date)}
              className={cn(
                'h-7 rounded-md text-xs font-medium transition-all duration-200',
                c.outside ? 'text-ink-muted/50' : 'text-ink-primary',
                isToday && 'bg-brand-600 text-white shadow-glow',
                !isToday && inWeek && !c.outside && 'bg-brand-50 text-brand-700',
                !isToday && !inWeek && 'hover:bg-slate-100'
              )}
            >
              {c.date.getDate()}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
