import { cn } from '@/lib/cn';
import { SUPPLIER_STATUS_BADGE, SUPPLIER_STATUS_LABELS } from '@/constants/supplierStatus';

export function SupplierStatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-label-caps uppercase',
        SUPPLIER_STATUS_BADGE[status] || 'bg-surface-container-high text-on-surface',
        className
      )}
    >
      {SUPPLIER_STATUS_LABELS[status] || status || '—'}
    </span>
  );
}
