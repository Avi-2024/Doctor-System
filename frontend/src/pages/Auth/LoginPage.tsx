import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Secure & Compliant',
    sub: 'HIPAA compliant and data encrypted',
    color: 'from-brand-500/15 to-brand-500/5 text-brand-600',
  },
  {
    icon: Users,
    title: 'All-in-One Platform',
    sub: 'Appointments, patients, prescriptions & more',
    color: 'from-cyan-500/15 to-cyan-500/5 text-cyan-600',
  },
  {
    icon: BarChart3,
    title: 'AI-Powered Insights',
    sub: 'Smart analytics to help you make better decisions',
    color: 'from-violet-500/15 to-violet-500/5 text-violet-600',
  },
];

// ─── Brand Mark (medical stethoscope + cross) ────────────────────────────────

const BrandMark = () => (
  <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
    <defs>
      <linearGradient id="brand-mark-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#2563EB" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path
      d="M14 6v8a6 6 0 0 0 12 0V6"
      stroke="url(#brand-mark-grad)" strokeWidth="2.4" strokeLinecap="round" fill="none"
    />
    <circle cx="20" cy="26" r="4" fill="none" stroke="url(#brand-mark-grad)" strokeWidth="2.4" />
    <path d="M20 30v3" stroke="url(#brand-mark-grad)" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M18 34h4" stroke="url(#brand-mark-grad)" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="14" cy="5" r="1.6" fill="url(#brand-mark-grad)" />
    <circle cx="26" cy="5" r="1.6" fill="url(#brand-mark-grad)" />
  </svg>
);

// ─── Social brand icons ──────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" fill="#34A853"/>
    <path d="M5.84 14.12a6.6 6.6 0 0 1 0-4.24V7.04H2.18a11 11 0 0 0 0 9.92l3.66-2.84z" fill="#FBBC04"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.28 9.14 5.38 12 5.38z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-primary" aria-hidden="true" fill="currentColor">
    <path d="M17.05 12.04c-.03-2.74 2.24-4.06 2.34-4.13-1.27-1.86-3.26-2.12-3.96-2.15-1.68-.17-3.29 1-4.15 1-.87 0-2.18-.97-3.59-.95-1.84.03-3.55 1.07-4.5 2.71-1.92 3.33-.49 8.27 1.39 10.97.91 1.32 2 2.81 3.42 2.75 1.38-.06 1.9-.89 3.57-.89 1.66 0 2.14.89 3.59.86 1.49-.02 2.42-1.34 3.32-2.67 1.05-1.53 1.48-3.02 1.51-3.1-.03-.01-2.9-1.12-2.94-4.4zM14.34 4.18c.76-.92 1.27-2.2 1.13-3.48-1.09.04-2.42.73-3.21 1.65-.71.81-1.33 2.11-1.16 3.36 1.22.09 2.47-.62 3.24-1.53z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <rect x="1"  y="1"  width="10" height="10" fill="#F25022"/>
    <rect x="13" y="1"  width="10" height="10" fill="#7FBA00"/>
    <rect x="1"  y="13" width="10" height="10" fill="#00A4EF"/>
    <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
  </svg>
);

// ─── Floating ambient illustration (bottom-left) ─────────────────────────────

const AmbientIllustration = () => (
  <svg
    viewBox="0 0 320 240"
    className="pointer-events-none absolute bottom-0 left-0 h-[320px] w-[420px] opacity-90"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="il-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#2563EB" stopOpacity="0.07" />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.02" />
      </linearGradient>
      <linearGradient id="il-tube" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* soft ground glow */}
    <ellipse cx="160" cy="220" rx="170" ry="22" fill="url(#il-bg)" />

    {/* stethoscope (bottom curve) */}
    <path d="M60 100 Q60 170 130 180" stroke="url(#il-tube)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.65" />
    <path d="M100 100 Q100 170 170 180" stroke="url(#il-tube)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.65" />
    <circle cx="130" cy="186" r="14" fill="#cbd5e1" opacity="0.7" />
    <circle cx="130" cy="186" r="10" fill="#94a3b8" opacity="0.7" />
    <circle cx="130" cy="186" r="3"  fill="#475569" opacity="0.85" />

    {/* small plant (pot) */}
    <rect x="218" y="186" width="32" height="28" rx="4" fill="#e2e8f0" />
    <rect x="218" y="186" width="32" height="6"  rx="3" fill="#cbd5e1" />
    <path d="M234 186 v-22" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M234 172 q-10 -2 -14 -14" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M234 168 q 12 -2 16 -14"  stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <ellipse cx="220" cy="160" rx="6"  ry="3.5" fill="#10b981" opacity="0.85" />
    <ellipse cx="248" cy="156" rx="7"  ry="4"   fill="#10b981" opacity="0.85" />
    <ellipse cx="234" cy="146" rx="6"  ry="3.5" fill="#10b981" opacity="0.85" />

    {/* floating UI cards */}
    <g transform="translate(150 70)" opacity="0.7">
      <rect x="0" y="0" width="56" height="56" rx="12" fill="white" />
      <rect x="0" y="0" width="56" height="56" rx="12" fill="#2563EB" opacity="0.04" />
      <path d="M28 18 v20 M18 28 h20" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
    </g>

    <g transform="translate(72 36)" opacity="0.65">
      <rect x="0" y="0" width="64" height="40" rx="10" fill="white" />
      <rect x="8" y="10" width="20" height="3" rx="1.5" fill="#94a3b8" />
      <rect x="8" y="18" width="32" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="8" y="26" width="14" height="3" rx="1.5" fill="#e2e8f0" />
    </g>

    <g transform="translate(244 60)" opacity="0.7">
      <rect x="0" y="0" width="56" height="44" rx="10" fill="white" />
      <polyline points="6,32 18,22 28,28 40,12 50,18"
        fill="none" stroke="#06B6D4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="12" r="3" fill="#06B6D4" />
    </g>
  </svg>
);

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { login } = useAuth() as any;
  const navigate = useNavigate();

  const [email, setEmail]       = React.useState('demo@clinic.com');
  const [password, setPassword] = React.useState('demo-password');
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading]   = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      sub: 'user-1',
      email,
      role: 'DOCTOR',
      clinicId: 'clinic-1',
      clinicIds: ['clinic-1', 'clinic-2'],
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };
    const fakeToken = `header.${btoa(JSON.stringify(payload))}.signature`;

    setTimeout(() => {
      login({ accessToken: fakeToken, refreshToken: 'refresh-token' });
      navigate('/dashboard');
    }, 500);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F4F7FB]">
      {/* ─── Ambient background ────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.10),transparent_60%)] blur-3xl" />
        <div className="absolute -right-40 top-1/2 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.07),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-260px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.05),transparent_60%)] blur-3xl" />

        {/* floating particles */}
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[42%] top-[14%] h-2.5 w-2.5 rounded-full bg-brand-500/30 blur-[1px]"
        />
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[20%] top-[42%] h-2 w-2 rounded-full bg-cyan-500/30 blur-[1px]"
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[24%] top-[28%] h-2 w-2 rounded-full bg-violet-500/30 blur-[1px]"
        />
      </div>

      {/* ─── Layout ────────────────────────────────────────────────────────── */}
      <div className="mx-auto grid min-h-screen max-w-[1320px] grid-cols-1 gap-12 px-6 py-10 lg:grid-cols-[1fr_520px] lg:gap-16 lg:px-12 lg:py-14">

        {/* ─── LEFT: Branding ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-2 flex min-h-[640px] flex-col justify-between lg:order-1"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="flex items-center gap-2.5"
          >
            <BrandMark />
            <div className="leading-tight">
              <p className="text-[15px] font-extrabold tracking-[0.06em] text-ink-primary">DOCTOR SYSTEM</p>
              <p className="text-[11px] font-medium text-ink-muted">Medical Dashboard</p>
            </div>
          </motion.div>

          {/* Headline + features */}
          <div className="relative z-10 mt-12 max-w-[520px] lg:mt-0">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink-primary md:text-[48px] lg:text-[56px]"
            >
              Smarter Care,
              <br />
              <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">
                Better Outcomes
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-ink-secondary"
            >
              Manage your clinic, patients, and consultations with an intelligent medical platform.
            </motion.p>

            {/* Feature list */}
            <ul className="mt-9 space-y-3">
              {FEATURES.map((f, i) => (
                <motion.li
                  key={f.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.28 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -2 }}
                  className="group flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-3.5 pr-5 backdrop-blur-sm transition-all duration-300 hover:border-brand-500/15 hover:bg-white hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]"
                >
                  <div
                    className={cn(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110',
                      f.color,
                    )}
                  >
                    <f.icon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-ink-primary">{f.title}</p>
                    <p className="text-[12px] text-ink-secondary">{f.sub}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Bottom-left illustration */}
          <div className="pointer-events-none relative mt-10 hidden h-[260px] lg:block">
            <AmbientIllustration />
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="relative z-10 mt-8 text-center text-[11px] text-ink-muted lg:absolute lg:bottom-0 lg:left-1/2 lg:mt-0 lg:-translate-x-1/2"
          >
            © 2026 Doctor System. All rights reserved.
          </motion.p>
        </motion.section>

        {/* ─── RIGHT: Auth card ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 flex items-center justify-center lg:order-2"
        >
          <div className="relative w-full max-w-[480px]">
            {/* Card glow */}
            <div className="absolute -inset-1 -z-10 rounded-[36px] bg-gradient-to-br from-brand-500/15 via-transparent to-cyan-500/15 blur-2xl" />

            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative rounded-[32px] border border-white/60 bg-white/85 p-8 backdrop-blur-2xl shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18),0_8px_24px_-8px_rgba(15,23,42,0.06)] sm:p-10"
            >
              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
              >
                <h2 className="text-[28px] font-extrabold tracking-[-0.01em] text-ink-primary sm:text-[32px]">
                  Welcome Back <span className="inline-block animate-[wave_2.4s_ease-in-out_infinite] origin-[70%_70%]">👋</span>
                </h2>
                <p className="mt-1.5 text-sm text-ink-secondary">Sign in to your Doctor System account</p>
              </motion.div>

              <form onSubmit={handleLogin} className="mt-7 space-y-4">
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.32 }}
                >
                  <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-ink-primary">
                    Email Address
                  </label>
                  <div className="group relative">
                    <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand-600" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                      className="h-12 w-full rounded-xl border border-border-soft bg-white px-11 text-sm font-medium text-ink-primary outline-none transition-all duration-200 placeholder:text-ink-muted hover:border-border-default focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.38 }}
                >
                  <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-ink-primary">
                    Password
                  </label>
                  <div className="group relative">
                    <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand-600" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="h-12 w-full rounded-xl border border-border-soft bg-white px-11 text-sm font-medium text-ink-primary outline-none transition-all duration-200 placeholder:text-ink-muted hover:border-border-default focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-lg text-ink-muted transition-all hover:bg-bg-subtle hover:text-ink-primary"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </motion.div>

                {/* Remember + forgot */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.44 }}
                  className="flex items-center justify-between pt-1"
                >
                  <label className="flex cursor-pointer items-center gap-2.5 select-none">
                    <span className="relative grid h-[18px] w-[18px] place-items-center">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="peer absolute h-full w-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-border-default bg-white transition-all checked:border-brand-600 checked:bg-brand-600 hover:border-brand-500/60"
                      />
                      <svg
                        className="pointer-events-none relative h-2.5 w-2.5 stroke-white opacity-0 transition-opacity peer-checked:opacity-100"
                        fill="none" viewBox="0 0 24 24"
                        strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-[13px] font-medium text-ink-secondary">Remember me</span>
                  </label>

                  <a
                    href="#forgot"
                    className="text-[13px] font-semibold text-brand-600 transition hover:text-brand-700"
                  >
                    Forgot password?
                  </a>
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="pt-2"
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                    className={cn(
                      'group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold text-white',
                      'bg-gradient-to-br from-[#2563EB] to-[#3B82F6]',
                      'shadow-[0_12px_32px_-8px_rgba(37,99,235,0.45),0_2px_4px_rgba(37,99,235,0.2)]',
                      'transition-all duration-200 hover:brightness-[1.03] hover:shadow-[0_18px_36px_-8px_rgba(37,99,235,0.55)]',
                      'disabled:cursor-not-allowed disabled:opacity-90'
                    )}
                  >
                    {/* shimmer */}
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    />
                    {loading ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <ArrowRight size={15} strokeWidth={2.4} />
                        Sign In
                      </>
                    )}
                  </motion.button>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.56 }}
                  className="relative flex items-center pt-2"
                >
                  <div className="flex-1 border-t border-border-soft" />
                  <span className="px-3 text-[12px] text-ink-muted">or continue with</span>
                  <div className="flex-1 border-t border-border-soft" />
                </motion.div>

                {/* Social buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="grid grid-cols-3 gap-2.5"
                >
                  {[
                    { icon: <GoogleIcon />,    label: 'Google'    },
                    { icon: <AppleIcon />,     label: 'Apple'     },
                    { icon: <MicrosoftIcon />, label: 'Microsoft' },
                  ].map((s) => (
                    <motion.button
                      key={s.label}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border-soft bg-white/70 text-[13px] font-semibold text-ink-primary backdrop-blur-sm transition-all duration-200 hover:border-brand-500/20 hover:bg-white hover:shadow-[0_8px_20px_-8px_rgba(15,23,42,0.12)]"
                    >
                      {s.icon}
                      <span className="hidden sm:inline">{s.label}</span>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Create Account */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.66 }}
                  className="pt-2 text-center text-[13px] text-ink-secondary"
                >
                  Don't have an account?{' '}
                  <a href="#signup" className="font-bold text-brand-600 transition hover:text-brand-700">
                    Create Account
                  </a>
                </motion.p>
              </form>
            </motion.div>
          </div>
        </motion.section>
      </div>

      {/* wave keyframes for the emoji */}
      <style>{`
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          10%, 30%      { transform: rotate(14deg); }
          20%           { transform: rotate(-8deg); }
          40%           { transform: rotate(10deg); }
          50%           { transform: rotate(-4deg); }
        }
      `}</style>
    </main>
  );
}
