import { cn } from '@/lib/cn';

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-surface-container-high',
        className
      )}
    />
  );
}
