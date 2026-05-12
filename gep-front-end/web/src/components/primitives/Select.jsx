import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(function Select(
  { className, invalid, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-9 w-full appearance-none rounded-lg border bg-surface-container-low pl-3 pr-8 text-body-base text-on-surface',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-secondary',
          invalid ? 'border-error' : 'border-outline-variant focus:border-secondary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
    </div>
  );
});
