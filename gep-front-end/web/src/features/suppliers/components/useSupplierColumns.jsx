import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/supplierCatalog';
import { formatCurrency } from '@/lib/format';

const ch = createColumnHelper();

export function useSupplierColumns() {
  return useMemo(
    () => [
      ch.accessor('display_name', {
        header: 'Supplier',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="min-w-[10rem]">
              <div className="font-medium text-on-surface">
                {row.display_name || row.legal_name}
              </div>
              <div className="text-body-sm text-on-surface-variant">{row.legal_name}</div>
            </div>
          );
        },
      }),
      ch.accessor('supplier_code', {
        header: 'Code',
        meta: { mono: true },
      }),
      ch.accessor('category', {
        header: 'Category',
        cell: (info) => SUPPLIER_CATEGORY_LABELS[info.getValue()] || info.getValue(),
      }),
      ch.accessor('country', { header: 'Country' }),
      ch.accessor('status', {
        header: 'Status',
        cell: (info) => <SupplierStatusBadge status={info.getValue()} />,
      }),
      ch.accessor((row) => row.rating ?? row.scorecard?.rating, {
        id: 'rating',
        header: 'Rating',
        cell: (info) => {
          const v = info.getValue();
          return v != null && Number(v) > 0 ? Number(v).toFixed(1) : '—';
        },
        meta: { mono: true, align: 'right' },
      }),
      ch.accessor(
        (row) => row.on_time_delivery_rate ?? row.otd_pct ?? row.scorecard?.otd_pct,
        {
          id: 'otd',
          header: 'OTD %',
          cell: (info) => {
            const v = info.getValue();
            return v != null && Number(v) > 0 ? Number(v).toFixed(1) : '—';
          },
          meta: { mono: true, align: 'right' },
        }
      ),
      ch.accessor(
        (row) => row.total_orders_count ?? row.total_orders ?? row.scorecard?.total_orders,
        {
          id: 'orders',
          header: 'Orders',
          cell: (info) => info.getValue() ?? '—',
          meta: { mono: true, align: 'right' },
        }
      ),
      ch.accessor(
        (row) => row.total_spend_inr ?? row.total_spend ?? row.scorecard?.total_spend,
        {
          id: 'spend',
          header: 'Total spend',
          cell: (info) => {
            const v = info.getValue();
            if (v == null) return '—';
            // total_spend_inr is normalized to INR per the API contract.
            const row = info.row.original;
            const currency = row.total_spend_inr != null ? 'INR' : row.currency || 'USD';
            return formatCurrency(v, currency);
          },
          meta: { mono: true, align: 'right' },
        }
      ),
    ],
    []
  );
}
