import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full rounded-lg border bg-surface-container-low px-3 py-2 text-body-base text-on-surface placeholder:text-on-surface-variant',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-secondary resize-y',
        invalid ? 'border-error' : 'border-outline-variant focus:border-secondary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
});
