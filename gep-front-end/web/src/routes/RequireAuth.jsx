import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/authApi';
import { qk } from '@/api/queryKeys';
import { Skeleton } from '@/components/primitives/Skeleton';

export function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  const location = useLocation();

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    enabled: Boolean(token) && !user,
    retry: 0,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (!token) setStatus('unauthenticated');
  }, [token, setStatus]);

  if (!token) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  if (token && !user && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  if (!user) return null;
  return <Outlet />;
}
