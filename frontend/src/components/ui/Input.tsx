import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink-primary outline-none transition-all duration-200 ease-premium',
        'placeholder:text-ink-muted',
        'hover:border-ink-muted/30',
        'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
