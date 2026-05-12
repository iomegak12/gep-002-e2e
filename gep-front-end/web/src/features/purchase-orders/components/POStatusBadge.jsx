import { cn } from '@/lib/cn';
import { PO_STATUS_BADGE, PO_STATUS_LABELS } from '@/constants/poStatus';

export function POStatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-label-caps uppercase',
        PO_STATUS_BADGE[status] || 'bg-surface-container-high text-on-surface',
        className
      )}
    >
      {PO_STATUS_LABELS[status] || status || '—'}
    </span>
  );
}
