import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import { qk } from '@/api/queryKeys';

function normalizeList(payload, params) {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, page: params.page, page_size: params.page_size };
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

export function useUsers(params) {
  return useQuery({
    queryKey: qk.auth.users(params),
    queryFn: () => authApi.listUsers(params),
    select: (d) => normalizeList(d, params),
    keepPreviousData: true,
  });
}
