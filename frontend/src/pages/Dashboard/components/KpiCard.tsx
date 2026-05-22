import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend: number; // % change
  trendLabel?: string;
  accent: 'brand' | 'cyan' | 'amber' | 'rose';
  data: { v: number }[];
}

const ACCENT_MAP = {
  brand: {
    iconBg: 'from-brand-500/15 to-brand-500/5',
    iconColor: 'text-brand-600',
    chartStroke: '#2563EB',
    chartFill: 'rgba(37, 99, 235, 0.18)',
    glow: 'group-hover:shadow-[0_0_40px_rgba(37,99,235,0.18)]',
  },
  cyan: {
    iconBg: 'from-cyan-500/15 to-cyan-500/5',
    iconColor: 'text-cyan-600',
    chartStroke: '#06B6D4',
    chartFill: 'rgba(6, 182, 212, 0.18)',
    glow: 'group-hover:shadow-[0_0_40px_rgba(6,182,212,0.18)]',
  },
  amber: {
    iconBg: 'from-amber-500/15 to-amber-500/5',
    iconColor: 'text-amber-600',
    chartStroke: '#F59E0B',
    chartFill: 'rgba(245, 158, 11, 0.18)',
    glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.18)]',
  },
  rose: {
    iconBg: 'from-rose-500/15 to-rose-500/5',
    iconColor: 'text-rose-600',
    chartStroke: '#F43F5E',
    chartFill: 'rgba(244, 63, 94, 0.18)',
    glow: 'group-hover:shadow-[0_0_40px_rgba(244,63,94,0.18)]',
  },
};

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest).toLocaleString());

  React.useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.4, ease: [0.4, 0, 0.2, 1] });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

export function KpiCard({ label, value, icon: Icon, trend, trendLabel = 'from yesterday', accent, data }: KpiCardProps) {
  const styles = ACCENT_MAP[accent];
  const isUp = trend >= 0;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}>
      <Card className={cn('group overflow-hidden p-5 transition-shadow duration-300', styles.glow)}>
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-105',
              styles.iconBg
            )}
          >
            <Icon className={cn('h-5 w-5', styles.iconColor)} strokeWidth={2} />
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}
          >
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isUp ? '+' : ''}
            {trend}%
          </div>
        </div>

        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-ink-secondary">{label}</p>
        <p className="mt-1 text-[32px] font-bold leading-none tracking-tight text-ink-primary">
          <AnimatedNumber value={value} />
        </p>
        <p className="mt-1.5 text-xs text-ink-muted">
          {isUp ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
        </p>

        {/* Mini trend chart */}
        <div className="-mx-1 -mb-2 mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${accent}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={styles.chartStroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={styles.chartStroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={styles.chartStroke}
                strokeWidth={2}
                fill={`url(#grad-${accent})`}
                dot={false}
                isAnimationActive
                animationDuration={1100}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}

export default KpiCard;
