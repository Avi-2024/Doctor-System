import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-slate-50 text-ink-secondary',
        brand: 'border-brand-200 bg-brand-50 text-brand-700',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
        danger: 'border-red-200 bg-red-50 text-red-700',
        neutral: 'border-slate-200 bg-slate-50 text-slate-600',
        outline: 'border-border bg-transparent text-ink-secondary',
      },
      dot: {
        true: 'before:mr-1 before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-[""]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      dot: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, dot, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, dot }), className)} {...props} />;
}

export { Badge, badgeVariants };
