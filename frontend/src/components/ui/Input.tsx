import React from 'react';
import { cn } from '@/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: Variant;
  error?: string;
  label?: string;
  hint?: string;
}

const baseCls =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm transition-all ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, error, label, hint, id, ...props }, ref) => {
    const resolvedId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label htmlFor={resolvedId} className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={resolvedId}
          className={cn(
            baseCls,
            error && 'border-red-500/60 focus:ring-red-500/25 focus:border-red-500',
            variant === 'ghost' && 'border-transparent bg-transparent px-0 focus:ring-0',
            error ? undefined : variant && variant !== 'ghost' && (variant === 'secondary'
              ? 'bg-secondary border-transparent' : undefined),
          )}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;