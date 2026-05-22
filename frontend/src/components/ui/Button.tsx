import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn text-sm font-semibold transition-all duration-200 ease-premium focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-glow hover:-translate-y-0.5 hover:brightness-105 focus-visible:ring-brand-500/30',
        secondary:
          'border border-border bg-white text-ink-primary hover:-translate-y-0.5 hover:border-ink-muted/30 hover:bg-slate-50 focus-visible:ring-brand-500/15',
        ghost:
          'text-ink-secondary hover:bg-slate-100 hover:text-ink-primary focus-visible:ring-brand-500/15',
        outline:
          'border border-border bg-transparent text-ink-primary hover:bg-slate-50 focus-visible:ring-brand-500/15',
        danger:
          'border border-red-200 bg-red-50 text-danger hover:bg-red-100 focus-visible:ring-red-200/40',
        link: 'text-brand-600 underline-offset-4 hover:underline focus-visible:ring-brand-500/15',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
