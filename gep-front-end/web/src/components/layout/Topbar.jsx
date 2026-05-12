import { Link, useNavigate } from 'react-router-dom';
import { Bell, HelpCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROLE_LABELS } from '@/constants/roles';
import { ThemeToggle } from './ThemeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import { HealthIndicator } from './HealthIndicator';

export function Topbar({ title, breadcrumbs }) {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  function onLogout() {
    clear();
    navigate('/login', { replace: true });
  }

  const primaryRole = user?.roles?.[0];

  return (
    <header className="fixed left-sidebar-collapsed right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-container-padding">
      <div className="flex flex-col gap-0.5">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        {title ? <h1 className="text-headline-md font-bold text-on-surface">{title}</h1> : null}
      </div>
      <div className="flex items-center gap-3">
        <HealthIndicator />
        <ThemeToggle />
        <button
          type="button"
          aria-label="Help"
          className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        >
          <Bell className="h-5 w-5" />
        </button>
        {user ? (
          <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-2 py-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary text-body-sm font-semibold">
              {(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-body-base text-on-surface">{user.full_name}</span>
              <span className="text-body-sm text-on-surface-variant">
                {primaryRole ? ROLE_LABELS[primaryRole] : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-body-base text-on-surface-variant hover:text-on-surface"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
