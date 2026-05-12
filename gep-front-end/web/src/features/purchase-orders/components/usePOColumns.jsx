import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { POStatusBadge } from './POStatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

const ch = createColumnHelper();

export function usePOColumns({ showBuyer = true } = {}) {
  return useMemo(
    () =>
      [
        ch.accessor('po_number', {
          header: 'PO',
          meta: { mono: true },
          cell: (info) => (
            <div className="font-mono text-on-surface">{info.getValue() || '—'}</div>
          ),
        }),
        ch.accessor((row) => row.supplier_name || row.supplier?.display_name, {
          id: 'supplier',
          header: 'Supplier',
          cell: (info) => info.getValue() || info.row.original.supplier_id || '—',
        }),
        ch.accessor('status', {
          header: 'Status',
          cell: (info) => <POStatusBadge status={info.getValue()} />,
        }),
        showBuyer
          ? ch.accessor((row) => row.buyer_name || row.created_by, {
              id: 'buyer',
              header: 'Buyer',
              cell: (info) => info.getValue() || '—',
            })
          : null,
        ch.accessor('total_amount', {
          header: 'Total',
          cell: (info) => {
            const v = info.getValue();
            const r = info.row.original;
            return v != null ? formatCurrency(v, r.currency || 'INR') : '—';
          },
          meta: { mono: true, align: 'right' },
        }),
        ch.accessor('expected_delivery_date', {
          header: 'Expected',
          cell: (info) => (info.getValue() ? formatDate(info.getValue()) : '—'),
          meta: { mono: true },
        }),
        ch.accessor('created_at', {
          header: 'Created',
          cell: (info) => (info.getValue() ? formatDate(info.getValue()) : '—'),
          meta: { mono: true },
        }),
      ].filter(Boolean),
    [showBuyer]
  );
}
