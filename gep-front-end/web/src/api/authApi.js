import { authClient } from './axios';

const BASE = '/api/v1/auth';

export const authApi = {
  login: (payload) => authClient.post(`${BASE}/login`, payload).then((r) => r.data),
  me: () => authClient.get(`${BASE}/me`).then((r) => r.data),
  changeMyPassword: (payload) => authClient.patch(`${BASE}/me/password`, payload).then((r) => r.data),
  logout: () => authClient.post(`${BASE}/logout`).then((r) => r.data),

  listUsers: (params) => authClient.get(`${BASE}/users`, { params }).then((r) => r.data),
  getUser: (id) => authClient.get(`${BASE}/users/${id}`).then((r) => r.data),
  createUser: (payload) => authClient.post(`${BASE}/users`, payload).then((r) => r.data),
  updateUser: (id, payload) => authClient.patch(`${BASE}/users/${id}`, payload).then((r) => r.data),
  resetUserPassword: (id, payload) =>
    authClient.post(`${BASE}/users/${id}/reset-password`, payload).then((r) => r.data),
};
