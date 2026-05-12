export const qk = {
  auth: {
    me: ['auth', 'me'],
    users: (params) => ['auth', 'users', params],
    user: (id) => ['auth', 'user', id],
  },
  suppliers: {
    list: (params) => ['suppliers', 'list', params],
    detail: (id) => ['suppliers', 'detail', id],
    scorecard: (id) => ['suppliers', 'scorecard', id],
    search: (q) => ['suppliers', 'search', q],
    byCategory: ['suppliers', 'agg', 'by-category'],
    byCountry: ['suppliers', 'agg', 'by-country'],
    byStatus: ['suppliers', 'agg', 'by-status'],
    topRated: (params) => ['suppliers', 'agg', 'top-rated', params],
  },
  pos: {
    list: (params) => ['pos', 'list', params],
    detail: (id) => ['pos', 'detail', id],
    lineItems: (id) => ['pos', id, 'line-items'],
    byStatus: ['pos', 'agg', 'by-status'],
    spendBySupplier: (params) => ['pos', 'agg', 'spend-by-supplier', params],
    spendByCategory: (params) => ['pos', 'agg', 'spend-by-category', params],
    monthlySpend: (params) => ['pos', 'agg', 'monthly-spend', params],
    pendingApprovals: (params) => ['pos', 'agg', 'pending-approvals', params],
    cycleTime: (params) => ['pos', 'agg', 'cycle-time', params],
  },
};
