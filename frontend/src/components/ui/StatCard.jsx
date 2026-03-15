import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, tone = 'primary', trend = { label: '+0.0%', positive: true } }) {
  const toneStyles = {
    primary: 'bg-blue-50 text-blue-700',
    secondary: 'bg-sky-50 text-sky-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  };

  const color = toneStyles[tone] || toneStyles.primary;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="app-card rounded-2xl p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-medical-border bg-slate-50 px-2.5 py-1 text-xs font-semibold">
        {trend.positive ? (
          <TrendingUp size={13} className="text-emerald-600" />
        ) : (
          <TrendingDown size={13} className="text-rose-600" />
        )}
        <span className={trend.positive ? 'text-emerald-700' : 'text-rose-700'}>{trend.label}</span>
      </div>
    </motion.article>
  );
}

export default StatCard;
