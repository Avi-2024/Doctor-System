import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  LogIn,
  ShieldCheck,
  Users,
  LineChart,
  Activity,
  Clock,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

export default function LoginPage() {
  const [remember, setRemember] = useState(true);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030816] text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_80%_50%,rgba(147,51,234,0.25),transparent_35%),linear-gradient(135deg,#050816,#08112A_45%,#020617)]" />

      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[38%] top-10 h-[520px] w-[160px] rounded-full bg-cyan-400/20 blur-3xl"
      />

      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-0 left-0 right-0 h-[260px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.35),transparent_65%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] items-center justify-between gap-10 px-6 py-8 lg:px-12">
        {/* Left Side */}
        <motion.section
          initial={{ opacity: 0, x: -60, filter: "blur(14px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8 }}
          className="hidden w-[52%] lg:block"
        >
          <div className="mb-14 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-700 shadow-[0_0_45px_rgba(34,211,238,0.45)]">
              <Stethoscope size={34} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Doctor System</h2>
              <p className="text-lg text-blue-200/80">Medical Dashboard</p>
            </div>
          </div>

          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-6 py-3 backdrop-blur-xl">
            <ShieldCheck className="text-cyan-300" size={20} />
            <span className="font-bold">Secure • Trusted • HIPAA Compliant</span>
          </div>

          <h1 className="max-w-[700px] text-[70px] font-black leading-[0.95] tracking-[-0.06em] xl:text-[78px]">
            Better care.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Smarter every day.
            </span>
          </h1>

          <p className="mt-8 max-w-[600px] text-xl leading-9 text-blue-100/80">
            A futuristic clinic workspace with intelligent records,
            appointments, analytics and secure medical workflows.
          </p>

          {/* Hologram Heart */}
          <motion.div
            animate={{ y: [0, -18, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative mt-12 flex h-[240px] w-[360px] items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute h-56 w-56 rounded-full border border-cyan-300/30"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute h-40 w-40 rounded-full border border-purple-400/30"
            />

            <div className="absolute bottom-0 h-12 w-64 rounded-full bg-cyan-400/30 blur-xl" />

            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                filter: [
                  "drop-shadow(0 0 25px rgba(34,211,238,0.8))",
                  "drop-shadow(0 0 45px rgba(168,85,247,0.9))",
                  "drop-shadow(0 0 25px rgba(34,211,238,0.8))",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-cyan-300"
            >
              <HeartPulse size={130} strokeWidth={1.4} />
            </motion.div>

            <motion.div
              animate={{ x: [0, 12, 0], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute right-4 top-10 rounded-2xl border border-cyan-300/25 bg-white/10 px-5 py-4 backdrop-blur-xl"
            >
              <p className="text-sm text-blue-100">Heart Rate</p>
              <p className="text-3xl font-bold">72 BPM</p>
            </motion.div>
          </motion.div>

          <div className="mt-10 grid max-w-[640px] gap-5">
            <Feature icon={<ShieldCheck />} title="Enterprise Security" text="Encrypted access for every clinic user" />
            <Feature icon={<Users />} title="Smart Workflow" text="Appointments, patients, billing and reports" />
            <Feature icon={<LineChart />} title="Real-time Analytics" text="Better clinical decisions with live insights" />
          </div>
        </motion.section>

        {/* Login Card */}
        <motion.section
          initial={{ opacity: 0, x: 70, scale: 0.95, filter: "blur(16px)" }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.85, delay: 0.15 }}
          className="mx-auto w-full max-w-[650px] rounded-[40px] border border-white/20 bg-white/[0.08] p-7 shadow-[0_0_80px_rgba(59,130,246,0.25)] backdrop-blur-2xl sm:p-10 lg:mx-0 lg:p-14"
        >
          <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-br from-white/15 via-white/5 to-blue-500/10" />

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="mb-10 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/10 shadow-[0_0_35px_rgba(59,130,246,0.35)]"
          >
            <span className="text-4xl">👋</span>
          </motion.div>

          <h1 className="text-5xl font-black tracking-[-0.055em] sm:text-6xl">
            Welcome back
          </h1>

          <p className="mt-4 text-lg text-blue-100/70">
            Sign in to continue managing your clinic
          </p>

          <form className="mt-12 space-y-8">
            <InputField
              label="Email address"
              icon={<Mail />}
              value="bidyutadmin@gmail.com"
              success
            />

            <InputField
              label="Password"
              icon={<Lock />}
              value="••••••••••••"
              rightIcon={<Eye />}
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className="flex items-center gap-3 text-blue-100/80"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
                    remember ? "bg-blue-500" : "border border-white/30"
                  }`}
                >
                  {remember && "✓"}
                </span>
                Remember me
              </button>

              <button className="font-semibold text-cyan-300 hover:text-cyan-200">
                Forgot password?
              </button>
            </div>

            <motion.button
              whileHover={{
                y: -3,
                boxShadow: "0 0 55px rgba(59,130,246,0.55)",
              }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex h-[70px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-xl font-black"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <LogIn />
              Sign In
            </motion.button>
          </form>

          <div className="my-9 flex items-center gap-5">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-blue-100/60">or</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <motion.div
            whileHover={{ y: -2 }}
            className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-cyan-300">
              <ShieldCheck size={28} />
            </div>
            <div className="flex-1">
              <p className="font-bold">Secure access for doctors & clinic staff</p>
              <p className="mt-1 text-sm text-blue-100/60">
                Protected by 256-bit encryption
              </p>
            </div>
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.9)]" />
          </motion.div>

          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-blue-100/50">
            <Lock size={15} />
            Your data is safe with us. We never compromise on security.
          </p>
        </motion.section>
      </div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 mx-auto mb-8 hidden max-w-[1180px] grid-cols-4 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-2xl lg:grid"
      >
        <Stat icon={<Activity />} value="99.9%" label="Uptime & Reliability" />
        <Stat icon={<Clock />} value="24/7" label="System Monitoring" />
        <Stat icon={<Users />} value="5000+" label="Happy Clinics" />
        <Stat icon={<ShieldCheck />} value="100%" label="Data Protection" />
      </motion.div>
    </main>
  );
}

function InputField({
  label,
  icon,
  rightIcon,
  value,
  success,
}: {
  label: string;
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
  value: string;
  success?: boolean;
}) {
  return (
    <div>
      <label className="mb-3 block font-bold text-blue-50">{label}</label>

      <div className="group relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-200/70 group-focus-within:text-cyan-300">
          {icon}
        </div>

        <input
          defaultValue={value}
          className="h-16 w-full rounded-2xl border border-white/20 bg-white/[0.07] pl-16 pr-14 font-semibold text-white outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-blue-100/40 hover:border-cyan-300/40 focus:border-cyan-300 focus:shadow-[0_0_0_5px_rgba(34,211,238,0.12)]"
        />

        {rightIcon && (
          <button
            type="button"
            className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-200/70 hover:text-cyan-300"
          >
            {rightIcon}
          </button>
        )}

        {success && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-400">
            ✓
          </div>
        )}
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <motion.div whileHover={{ x: 8 }} className="flex items-center gap-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 text-cyan-300 backdrop-blur-xl">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-blue-100/65">{text}</p>
      </div>
    </motion.div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex items-center justify-center gap-4 border-r border-white/10 last:border-r-0"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-sm text-blue-100/60">{label}</p>
      </div>
    </motion.div>
  );
}