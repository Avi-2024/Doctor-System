import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Save,
  Shield,
  Stethoscope,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';

type Tab = 'clinic' | 'staff' | 'notifications' | 'security';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'clinic',        label: 'Clinic Profile',  icon: Building2 },
  { id: 'staff',         label: 'Staff & Roles',   icon: Users     },
  { id: 'notifications', label: 'Notifications',   icon: Bell      },
  { id: 'security',      label: 'Security',        icon: Shield    },
];

const STAFF = [
  { name: 'Dr. Ramesh Rao',    role: 'DOCTOR',      email: 'rao@clinic.com',        status: 'active'   },
  { name: 'Dr. Priya Shah',    role: 'DOCTOR',      email: 'pshah@clinic.com',      status: 'active'   },
  { name: 'Anjali Desai',      role: 'RECEPTIONIST',email: 'anjali@clinic.com',     status: 'active'   },
  { name: 'Suresh Kumar',      role: 'RECEPTIONIST',email: 'suresh@clinic.com',     status: 'inactive' },
];

const ROLE_BADGE = {
  DOCTOR:       { variant: 'success' as const,  label: 'Doctor'       },
  RECEPTIONIST: { variant: 'neutral' as const,  label: 'Receptionist' },
  CLINIC_OWNER: { variant: 'warning' as const,  label: 'Owner'        },
};

interface ToggleRowProps {
  label: string;
  sub: string;
  icon: React.ElementType;
  value: boolean;
  onChange: (v: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, sub, icon: Icon, value, onChange }) => (
  <div className="flex items-center justify-between rounded-xl border border-border-soft bg-white p-4">
    <div className="flex items-center gap-3">
      <div className={cn('grid h-9 w-9 place-items-center rounded-xl transition-colors', value ? 'bg-brand-50 text-brand-600' : 'bg-bg-subtle text-ink-muted')}>
        <Icon size={15} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-bold text-ink-primary">{label}</p>
        <p className="text-xs text-ink-secondary">{sub}</p>
      </div>
    </div>
    <button onClick={() => onChange(!value)} className="text-ink-muted transition-colors hover:text-brand-600">
      {value ? <ToggleRight size={28} className="text-brand-600" /> : <ToggleLeft size={28} />}
    </button>
  </div>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('clinic');
  const [saved, setSaved] = useState(false);

  const [clinicForm, setClinicForm] = useState({
    name:     'City Care Clinic',
    phone:    '+91 98765 43210',
    email:    'admin@citycare.clinic',
    address:  '12, Medical Complex, MG Road, Bangalore 560001',
    website:  'https://citycare.clinic',
    timezone: 'Asia/Kolkata',
    openTime: '09:00',
    closeTime:'21:00',
  });

  const [notifSettings, setNotifSettings] = useState({
    appointmentReminders: true,
    smsNotifications:     true,
    emailNotifications:   false,
    newPatientAlert:      true,
    paymentReceipts:      true,
    dailyDigest:          false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const FieldInput = ({ id, label, icon: Icon, value, onChange, type = 'text' }: {
    id: string; label: string; icon?: React.ElementType; value: string;
    onChange: (v: string) => void; type?: string;
  }) => (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-secondary">
        {Icon && <Icon size={10} strokeWidth={2.5} />} {label}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border-soft bg-bg-subtle px-4 py-2.5 text-sm font-medium text-ink-primary outline-none transition-all placeholder:text-ink-muted hover:border-border-default focus:border-brand-500/50 focus:bg-white focus:shadow-soft"
      />
    </div>
  );

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
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Administration</p>
          <h1 className="text-2xl font-bold text-ink-primary">Clinic Settings</h1>
          <p className="text-sm text-ink-secondary">Manage profile, staff, and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saved} className="gap-2">
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-border-soft bg-bg-subtle p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-150 sm:justify-start sm:px-4',
              activeTab === t.id
                ? 'bg-white text-ink-primary shadow-soft'
                : 'text-ink-secondary hover:text-ink-primary'
            )}
          >
            <t.icon size={13} strokeWidth={2} />
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Clinic Profile */}
          {activeTab === 'clinic' && (
            <>
              <Card>
                <div className="flex items-center gap-2.5 p-6 pb-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Building2 size={16} strokeWidth={2} />
                  </div>
                  <p className="font-bold text-ink-primary">Basic Information</p>
                </div>
                <CardContent className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
                  <FieldInput id="c-name"    label="Clinic Name"  icon={Building2} value={clinicForm.name}    onChange={(v) => setClinicForm(p => ({ ...p, name: v }))} />
                  <FieldInput id="c-phone"   label="Phone"        icon={Phone}     value={clinicForm.phone}   onChange={(v) => setClinicForm(p => ({ ...p, phone: v }))} />
                  <FieldInput id="c-email"   label="Email"        icon={Mail}      value={clinicForm.email}   onChange={(v) => setClinicForm(p => ({ ...p, email: v }))} type="email" />
                  <FieldInput id="c-website" label="Website"      icon={Globe}     value={clinicForm.website} onChange={(v) => setClinicForm(p => ({ ...p, website: v }))} />
                  <div className="sm:col-span-2">
                    <FieldInput id="c-addr" label="Address" value={clinicForm.address} onChange={(v) => setClinicForm(p => ({ ...p, address: v }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <div className="flex items-center gap-2.5 p-6 pb-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                    <Clock size={16} strokeWidth={2} />
                  </div>
                  <p className="font-bold text-ink-primary">Working Hours &amp; Timezone</p>
                </div>
                <CardContent className="grid gap-4 px-6 pb-6 sm:grid-cols-3">
                  <FieldInput id="c-tz"    label="Timezone"   value={clinicForm.timezone}  onChange={(v) => setClinicForm(p => ({ ...p, timezone: v }))} />
                  <FieldInput id="c-open"  label="Opens at"   value={clinicForm.openTime}  onChange={(v) => setClinicForm(p => ({ ...p, openTime: v }))}  type="time" />
                  <FieldInput id="c-close" label="Closes at"  value={clinicForm.closeTime} onChange={(v) => setClinicForm(p => ({ ...p, closeTime: v }))} type="time" />
                </CardContent>
              </Card>
            </>
          )}

          {/* Staff & Roles */}
          {activeTab === 'staff' && (
            <Card>
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Users size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-bold text-ink-primary">Staff Members</p>
                    <p className="text-xs text-ink-secondary">{STAFF.length} members</p>
                  </div>
                </div>
                <Button size="sm" className="gap-1.5">
                  <Users size={13} /> Invite Staff
                </Button>
              </div>
              <CardContent className="space-y-2 px-4 pb-5">
                {STAFF.map((s) => {
                  const roleM = ROLE_BADGE[s.role as keyof typeof ROLE_BADGE] ?? { variant: 'neutral' as const, label: s.role };
                  return (
                    <div key={s.email}
                      className="group flex flex-wrap items-center gap-4 rounded-xl border border-border-soft bg-white p-4 transition-all hover:border-border-default hover:shadow-soft">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{s.name.split(' ').map(w => w[0]).join('').slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-ink-primary">{s.name}</p>
                        <p className="flex items-center gap-1 text-xs text-ink-secondary">
                          <Mail size={10} /> {s.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={roleM.variant}>{roleM.label}</Badge>
                        <Badge variant={s.status === 'active' ? 'success' : 'danger'} className="capitalize">{s.status}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronRight size={13} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <div className="flex items-center gap-2.5 p-6 pb-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <Bell size={16} strokeWidth={2} />
                </div>
                <p className="font-bold text-ink-primary">Notification Preferences</p>
              </div>
              <CardContent className="space-y-3 px-5 pb-5">
                <ToggleRow label="Appointment Reminders" sub="Send SMS reminders before appointments" icon={Bell}
                  value={notifSettings.appointmentReminders}
                  onChange={(v) => setNotifSettings(p => ({ ...p, appointmentReminders: v }))} />
                <ToggleRow label="SMS Notifications" sub="Enable all SMS-based notifications" icon={MessageSquare}
                  value={notifSettings.smsNotifications}
                  onChange={(v) => setNotifSettings(p => ({ ...p, smsNotifications: v }))} />
                <ToggleRow label="Email Notifications" sub="Send notifications via email" icon={Mail}
                  value={notifSettings.emailNotifications}
                  onChange={(v) => setNotifSettings(p => ({ ...p, emailNotifications: v }))} />
                <ToggleRow label="New Patient Alerts" sub="Alert when a new patient registers" icon={Stethoscope}
                  value={notifSettings.newPatientAlert}
                  onChange={(v) => setNotifSettings(p => ({ ...p, newPatientAlert: v }))} />
                <ToggleRow label="Payment Receipts" sub="Auto-send payment receipts to patients" icon={Bell}
                  value={notifSettings.paymentReceipts}
                  onChange={(v) => setNotifSettings(p => ({ ...p, paymentReceipts: v }))} />
                <ToggleRow label="Daily Digest" sub="Receive daily summary at end of day" icon={Mail}
                  value={notifSettings.dailyDigest}
                  onChange={(v) => setNotifSettings(p => ({ ...p, dailyDigest: v }))} />
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-2.5 p-6 pb-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
                    <Lock size={16} strokeWidth={2} />
                  </div>
                  <p className="font-bold text-ink-primary">Password &amp; Access</p>
                </div>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldInput id="s-pass" label="Current Password" type="password" value="" onChange={() => {}} />
                    <FieldInput id="s-new"  label="New Password"     type="password" value="" onChange={() => {}} />
                  </div>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Lock size={13} /> Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <div className="flex items-center gap-2.5 p-6 pb-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
                    <Shield size={16} strokeWidth={2} />
                  </div>
                  <p className="font-bold text-ink-primary">Active Sessions</p>
                </div>
                <CardContent className="space-y-3 px-5 pb-5">
                  {[
                    { device: 'Chrome on Windows', ip: '122.168.1.1', lastSeen: 'Now',             current: true  },
                    { device: 'Safari on iPhone',  ip: '122.168.1.2', lastSeen: '2 hours ago',     current: false },
                    { device: 'Firefox on MacOS',  ip: '103.56.8.11', lastSeen: 'Yesterday 9 PM',  current: false },
                  ].map((s) => (
                    <div key={s.ip} className="flex items-center justify-between rounded-xl border border-border-soft bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-2.5 w-2.5 rounded-full', s.current ? 'bg-emerald-500' : 'bg-slate-300')} />
                        <div>
                          <p className="text-sm font-bold text-ink-primary">{s.device}</p>
                          <p className="text-xs text-ink-secondary">{s.ip} · {s.lastSeen}</p>
                        </div>
                      </div>
                      {s.current ? (
                        <Badge variant="success">Current</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
