import { cn } from '@/lib/cn';

export function Badge({ children, className, tone }) {
  const tones = {
    neutral: 'bg-surface-container-high text-on-surface',
    success: 'bg-success-container text-on-success-container',
    error: 'bg-error-container text-on-error-container',
    warning: 'bg-tertiary-container text-on-tertiary-container',
    info: 'bg-secondary-container text-on-secondary-container',
    primary: 'bg-primary-container text-on-primary-container',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-caps uppercase',
        tone ? tones[tone] : null,
        className
      )}
    >
      {children}
    </span>
  );
}
