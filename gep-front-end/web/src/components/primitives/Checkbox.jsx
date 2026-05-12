import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Checkbox = forwardRef(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-outline-variant bg-surface-container-low text-secondary',
        'focus:outline-none focus:ring-2 focus:ring-secondary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
});
