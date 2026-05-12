import axios from 'axios';

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8001';
const SUPPLIER_URL = import.meta.env.VITE_SUPPLIER_URL || 'http://localhost:8002';
const PO_URL = import.meta.env.VITE_PO_URL || 'http://localhost:8003';

export const HEALTH_SERVICES = [
  { key: 'auth', label: 'Auth service', baseUrl: AUTH_URL },
  { key: 'supplier', label: 'Supplier service', baseUrl: SUPPLIER_URL },
  { key: 'po', label: 'Purchase order service', baseUrl: PO_URL },
];

async function probe(service) {
  const start = performance.now();
  try {
    const res = await axios.get(`${service.baseUrl}/health`, {
      timeout: 5000,
      // Skip our auth interceptor: use a plain axios call.
    });
    const latency = Math.round(performance.now() - start);
    const ok = res?.data?.ok === true || res?.status === 200;
    return { ...service, status: ok ? 'up' : 'degraded', httpStatus: res?.status, latency };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      ...service,
      status: 'down',
      httpStatus: err?.response?.status ?? 0,
      latency,
      error: err?.message || 'Request failed',
    };
  }
}

export async function probeAllHealth() {
  return Promise.all(HEALTH_SERVICES.map(probe));
}
