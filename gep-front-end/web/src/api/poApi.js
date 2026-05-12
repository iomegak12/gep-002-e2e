import { poClient } from './axios';

const BASE = '/api/v1/purchase-orders';

export const poApi = {
  list: (params) => poClient.get(BASE, { params }).then((r) => r.data),
  get: (id) => poClient.get(`${BASE}/${id}`).then((r) => r.data),
  create: (payload) => poClient.post(BASE, payload).then((r) => r.data),
  update: (id, payload) => poClient.patch(`${BASE}/${id}`, payload).then((r) => r.data),
  remove: (id) => poClient.delete(`${BASE}/${id}`).then((r) => r.data),

  // line items
  listLineItems: (id) => poClient.get(`${BASE}/${id}/line-items`).then((r) => r.data),
  addLineItem: (id, payload) =>
    poClient.post(`${BASE}/${id}/line-items`, payload).then((r) => r.data),
  updateLineItem: (id, lineId, payload) =>
    poClient.patch(`${BASE}/${id}/line-items/${lineId}`, payload).then((r) => r.data),
  removeLineItem: (id, lineId) =>
    poClient.delete(`${BASE}/${id}/line-items/${lineId}`).then((r) => r.data),

  // transitions
  submit: (id) => poClient.post(`${BASE}/${id}/submit`).then((r) => r.data),
  approve: (id) => poClient.post(`${BASE}/${id}/approve`).then((r) => r.data),
  reject: (id, payload) => poClient.post(`${BASE}/${id}/reject`, payload).then((r) => r.data),
  revise: (id) => poClient.post(`${BASE}/${id}/revise`).then((r) => r.data),
  fulfill: (id, payload) => poClient.post(`${BASE}/${id}/fulfill`, payload).then((r) => r.data),
  close: (id) => poClient.post(`${BASE}/${id}/close`).then((r) => r.data),
  cancel: (id, payload) => poClient.post(`${BASE}/${id}/cancel`, payload).then((r) => r.data),

  // aggregations
  byStatus: () => poClient.get(`${BASE}/aggregations/by-status`).then((r) => r.data),
  spendBySupplier: (params) =>
    poClient.get(`${BASE}/aggregations/spend-by-supplier`, { params }).then((r) => r.data),
  spendByCategory: (params) =>
    poClient.get(`${BASE}/aggregations/spend-by-category`, { params }).then((r) => r.data),
  monthlySpend: (params) =>
    poClient.get(`${BASE}/aggregations/monthly-spend`, { params }).then((r) => r.data),
  pendingApprovals: (params) =>
    poClient.get(`${BASE}/aggregations/pending-approvals`, { params }).then((r) => r.data),
  cycleTime: (params) =>
    poClient.get(`${BASE}/aggregations/cycle-time`, { params }).then((r) => r.data),
};
