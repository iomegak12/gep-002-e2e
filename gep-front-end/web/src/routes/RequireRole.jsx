import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function RequireRole({ roles = [], children }) {
  const user = useAuthStore((s) => s.user);
  const ok = user?.roles?.some((r) => roles.includes(r));
  if (!ok) return <Navigate to="/403" replace />;
  return children || <Outlet />;
}
