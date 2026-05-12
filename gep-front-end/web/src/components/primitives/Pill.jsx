import { cn } from '@/lib/cn';

export function Pill({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-surface-container-high px-2 py-0.5 text-label-caps uppercase text-on-surface',
        className
      )}
    >
      {children}
    </span>
  );
}
