import { useQuery } from '@tanstack/react-query';
import { supplierApi } from '@/api/supplierApi';
import { qk } from '@/api/queryKeys';

/** Normalize a paginated list response into { items, total, page, page_size }. */
function normalizeList(payload, params) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: params.page,
      page_size: params.page_size,
    };
  }
  if (payload && typeof payload === 'object') {
    const items =
      (Array.isArray(payload.items) && payload.items) ||
      (Array.isArray(payload.data) && payload.data) ||
      (Array.isArray(payload.results) && payload.results) ||
      [];
    const meta = payload.meta || payload.pagination || payload;
    return {
      items,
      total: meta.total ?? meta.total_count ?? meta.count ?? items.length,
      page: meta.page ?? params.page,
      page_size: meta.page_size ?? meta.size ?? params.page_size,
    };
  }
  return { items: [], total: 0, page: params.page, page_size: params.page_size };
}

export function useSuppliers(params) {
  return useQuery({
    queryKey: qk.suppliers.list(params),
    queryFn: () => supplierApi.list(params),
    select: (data) => normalizeList(data, params),
    keepPreviousData: true,
  });
}
