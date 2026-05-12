import { useQueries } from '@tanstack/react-query';
import { supplierApi } from '@/api/supplierApi';
import { qk } from '@/api/queryKeys';

/**
 * Given a list of supplier ids, returns a Map<id, displayName>.
 * Re-uses the per-supplier detail cache so navigating to a detail page is hot.
 */
export function useSupplierNames(ids = []) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: qk.suppliers.detail(id),
      queryFn: () => supplierApi.get(id),
      enabled: Boolean(id),
      staleTime: 5 * 60_000,
    })),
  });
  const map = new Map();
  ids.forEach((id, i) => {
    const data = results[i]?.data;
    if (data) map.set(id, data.display_name || data.legal_name || id);
  });
  return map;
}
