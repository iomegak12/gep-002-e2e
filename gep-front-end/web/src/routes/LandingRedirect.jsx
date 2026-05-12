import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROLES } from '@/constants/roles';

export function LandingRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  if (user.roles?.includes(ROLES.ADMIN)) return <Navigate to="/dashboard/admin" replace />;
  if (user.roles?.includes(ROLES.APPROVER)) return <Navigate to="/dashboard/approver" replace />;
  return <Navigate to="/dashboard/buyer" replace />;
}
