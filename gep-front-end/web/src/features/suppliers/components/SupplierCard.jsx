import { Star } from 'lucide-react';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { CardBody } from '@/components/primitives/Card';
import { Pill } from '@/components/primitives/Pill';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/supplierCatalog';
import { formatCurrency } from '@/lib/format';

export function SupplierCard({ supplier }) {
  const total =
    supplier.total_spend_inr ?? supplier.total_spend ?? supplier.scorecard?.total_spend;
  const totalCurrency = supplier.total_spend_inr != null ? 'INR' : supplier.currency || 'USD';
  const rating = supplier.rating ?? supplier.scorecard?.rating;
  const otd =
    supplier.on_time_delivery_rate ?? supplier.otd_pct ?? supplier.scorecard?.otd_pct;
  const ratingValid = rating != null && Number(rating) > 0;
  const otdValid = otd != null && Number(otd) > 0;
  const totalValid = total != null && Number(total) > 0;
  return (
    <CardBody className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-title-sm text-on-surface">
            {supplier.display_name || supplier.legal_name}
          </div>
          <div className="truncate font-mono text-body-sm text-on-surface-variant">
            {supplier.supplier_code}
          </div>
        </div>
        <SupplierStatusBadge status={supplier.status} />
      </div>
      <div className="flex flex-wrap gap-1.5 text-body-sm">
        <Pill>{SUPPLIER_CATEGORY_LABELS[supplier.category] || supplier.category}</Pill>
        <Pill>{supplier.country}</Pill>
        {(supplier.tags || []).slice(0, 3).map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-outline-variant pt-3 text-body-sm">
        <div>
          <dt className="text-label-caps uppercase text-on-surface-variant">Rating</dt>
          <dd className="mt-0.5 flex items-center gap-1 font-mono text-on-surface">
            {ratingValid ? (
              <>
                <Star className="h-3 w-3 text-primary" />
                {Number(rating).toFixed(1)}
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-label-caps uppercase text-on-surface-variant">OTD</dt>
          <dd className="mt-0.5 font-mono text-on-surface">
            {otdValid ? `${Number(otd).toFixed(1)}%` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-label-caps uppercase text-on-surface-variant">Spend</dt>
          <dd className="mt-0.5 font-mono text-on-surface">
            {totalValid ? formatCurrency(total, totalCurrency) : '—'}
          </dd>
        </div>
      </dl>
    </CardBody>
  );
}
