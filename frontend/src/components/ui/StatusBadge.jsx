import React from 'react';

const variantStyles = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-600',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
};

function StatusBadge({ label, variant = 'neutral', className = '' }) {
  const styles = variantStyles[variant] || variantStyles.neutral;

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles} ${className}`}>
      {label}
    </span>
  );
}

export default StatusBadge;
