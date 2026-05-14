import { useQuery } from '@tanstack/react-query';
import { poApi } from '@/api/poApi';
import { supplierApi } from '@/api/supplierApi';
import { qk } from '@/api/queryKeys';

/**
 * Normalisers for the aggregation envelopes. The PO service wraps everything
 * as { data, generated_at, period?, year? }, while `/aggregations/pending-approvals`
 * is a scalar { count, total_value }. Source of truth:
 *   tests/api/src/tests/po/aggregations.spec.js
 */

function pickList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function usePoByStatus() {
  return useQuery({
    queryKey: qk.pos.byStatus,
    queryFn: poApi.byStatus,
    select: (d) => pickList(d),
  });
}

export function usePoSpendBySupplier(params = { period: 'ytd', limit: 5 }) {
  return useQuery({
    queryKey: qk.pos.spendBySupplier(params),
    queryFn: () => poApi.spendBySupplier(params),
    select: (d) => pickList(d),
  });
}

export function usePoSpendByCategory(params = { period: 'ytd' }) {
  return useQuery({
    queryKey: qk.pos.spendByCategory(params),
    queryFn: () => poApi.spendByCategory(params),
    select: (d) => pickList(d),
  });
}

/**
 * Returns 12 months for the chosen year, zero-filling missing months so the
 * line chart shows a continuous axis.
 */
export function usePoMonthlySpend(year = new Date().getUTCFullYear()) {
  return useQuery({
    queryKey: qk.pos.monthlySpend({ year }),
    queryFn: () => poApi.monthlySpend({ year }),
    select: (d) => {
      const rows = pickList(d);
      const byMonth = new Map(rows.map((r) => [r.month, r]));
      return Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const row = byMonth.get(m) || { month: m, total_spend: 0, po_count: 0 };
        return { ...row, label: new Date(year, i, 1).toLocaleString(undefined, { month: 'short' }) };
      });
    },
  });
}

/** Scalar — returns { count, total_value } as-is. */
export function usePoPendingApprovals() {
  return useQuery({
    queryKey: qk.pos.pendingApprovals({}),
    queryFn: () => poApi.pendingApprovals(),
    select: (d) => ({
      count: Number(d?.count ?? 0),
      total_value: Number(d?.total_value ?? 0),
    }),
  });
}

export function usePoCycleTime() {
  return useQuery({
    queryKey: qk.pos.cycleTime({}),
    queryFn: () => poApi.cycleTime(),
    select: (d) => pickList(d),
  });
}

/* Supplier aggregations */

export function useSupplierByStatus() {
  return useQuery({
    queryKey: qk.suppliers.byStatus,
    queryFn: supplierApi.aggregationsByStatus,
    select: (d) => pickList(d),
  });
}

export function useSupplierByCategory() {
  return useQuery({
    queryKey: qk.suppliers.byCategory,
    queryFn: supplierApi.aggregationsByCategory,
    select: (d) => pickList(d),
  });
}

export function useSupplierByCountry() {
  return useQuery({
    queryKey: qk.suppliers.byCountry,
    queryFn: supplierApi.aggregationsByCountry,
    select: (d) => pickList(d),
  });
}

export function useSupplierTopRated(params = { limit: 10 }) {
  return useQuery({
    queryKey: qk.suppliers.topRated(params),
    queryFn: () => supplierApi.topRated(params),
    select: (d) => pickList(d),
  });
}
