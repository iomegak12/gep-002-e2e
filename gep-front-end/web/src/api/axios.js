import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8001';
const SUPPLIER_URL = import.meta.env.VITE_SUPPLIER_URL || 'http://localhost:8002';
const PO_URL = import.meta.env.VITE_PO_URL || 'http://localhost:8003';

function createClient(baseURL) {
  const instance = axios.create({
    baseURL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      if (status === 401) {
        useAuthStore.getState().clear();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          const from = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.assign(`/login?from=${from}`);
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export const authClient = createClient(AUTH_URL);
export const supplierClient = createClient(SUPPLIER_URL);
export const poClient = createClient(PO_URL);
