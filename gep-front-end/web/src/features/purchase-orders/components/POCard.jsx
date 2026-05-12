import { Calendar } from 'lucide-react';
import { CardBody } from '@/components/primitives/Card';
import { POStatusBadge } from './POStatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

export function POCard({ po }) {
  return (
    <CardBody className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-title-sm text-on-surface">{po.po_number || '—'}</div>
          <div className="truncate text-body-sm text-on-surface-variant">
            {po.supplier_name || po.supplier?.display_name || po.supplier_id}
          </div>
        </div>
        <POStatusBadge status={po.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-outline-variant pt-3 text-body-sm">
        <div>
          <div className="text-label-caps uppercase text-on-surface-variant">Total</div>
          <div className="font-mono text-on-surface">
            {po.total_amount != null
              ? formatCurrency(po.total_amount, po.currency || 'INR')
              : '—'}
          </div>
        </div>
        <div>
          <div className="text-label-caps uppercase text-on-surface-variant">Expected</div>
          <div className="flex items-center gap-1 font-mono text-on-surface">
            <Calendar className="h-3 w-3 text-on-surface-variant" />
            {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}
          </div>
        </div>
      </div>
      {po.buyer_name ? (
        <div className="text-body-sm text-on-surface-variant">By {po.buyer_name}</div>
      ) : null}
    </CardBody>
  );
}
