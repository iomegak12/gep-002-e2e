import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-lg border bg-surface-container-low px-3 text-body-base text-on-surface placeholder:text-on-surface-variant',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-secondary',
        invalid ? 'border-error' : 'border-outline-variant focus:border-secondary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
});
