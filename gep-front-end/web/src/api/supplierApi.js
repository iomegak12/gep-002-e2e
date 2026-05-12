import { supplierClient } from './axios';

const BASE = '/api/v1/suppliers';

export const supplierApi = {
  list: (params) => supplierClient.get(BASE, { params }).then((r) => r.data),
  search: (params) => supplierClient.get(`${BASE}/search`, { params }).then((r) => r.data),
  get: (id) => supplierClient.get(`${BASE}/${id}`).then((r) => r.data),
  scorecard: (id) => supplierClient.get(`${BASE}/${id}/scorecard`).then((r) => r.data),
  create: (payload) => supplierClient.post(BASE, payload).then((r) => r.data),
  update: (id, payload) => supplierClient.patch(`${BASE}/${id}`, payload).then((r) => r.data),
  remove: (id) => supplierClient.delete(`${BASE}/${id}`).then((r) => r.data),

  approve: (id, payload) => supplierClient.post(`${BASE}/${id}/approve`, payload).then((r) => r.data),
  deactivate: (id, payload) => supplierClient.post(`${BASE}/${id}/deactivate`, payload).then((r) => r.data),
  reactivate: (id, payload) => supplierClient.post(`${BASE}/${id}/reactivate`, payload).then((r) => r.data),
  blacklist: (id, payload) => supplierClient.post(`${BASE}/${id}/blacklist`, payload).then((r) => r.data),

  aggregationsByCategory: () =>
    supplierClient.get(`${BASE}/aggregations/by-category`).then((r) => r.data),
  aggregationsByCountry: () =>
    supplierClient.get(`${BASE}/aggregations/by-country`).then((r) => r.data),
  aggregationsByStatus: () =>
    supplierClient.get(`${BASE}/aggregations/by-status`).then((r) => r.data),
  topRated: (params) =>
    supplierClient.get(`${BASE}/aggregations/top-rated`, { params }).then((r) => r.data),
};
