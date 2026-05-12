import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary:
    'bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-surface text-on-surface border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-error text-on-error hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
};

const SIZES = {
  sm: 'h-8 px-3 text-body-sm',
  md: 'h-9 px-4 text-body-base',
  lg: 'h-11 px-5 text-title-sm',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', leftIcon, rightIcon, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {leftIcon ? <span className="inline-flex h-4 w-4 items-center">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="inline-flex h-4 w-4 items-center">{rightIcon}</span> : null}
    </button>
  );
});
