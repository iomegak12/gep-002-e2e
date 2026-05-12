import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export function EmptyState({ title = 'Nothing here yet', description, action, icon, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center',
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
        {icon || <Info className="h-5 w-5" />}
      </div>
      <div>
        <div className="text-title-sm text-on-surface">{title}</div>
        {description ? (
          <div className="mt-1 max-w-md text-body-base text-on-surface-variant">{description}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
}
