import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROLES } from '@/constants/roles';
import { Tooltip } from '@/components/primitives/Tooltip';
import { cn } from '@/lib/cn';

function SidebarItem({ to, icon: Icon, label }) {
  return (
    <Tooltip label={label} side="right" className="block">
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          cn(
            'mx-auto flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
            isActive
              ? 'bg-surface-container-high text-primary border-l-4 border-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
          )
        }
        aria-label={label}
      >
        <Icon className="h-5 w-5" />
      </NavLink>
    </Tooltip>
  );
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const has = (role) => Boolean(user?.roles?.includes(role));
  const hasAny = (...roles) => roles.some(has);

  return (
    <nav
      className="fixed left-0 top-0 z-30 flex h-full w-sidebar-collapsed flex-col border-r border-outline-variant bg-surface-container-lowest py-base"
      aria-label="Primary"
    >
      <div className="flex h-16 items-center justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high">
          <LayoutDashboard className="h-5 w-5 text-on-surface" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2">
        <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <SidebarItem to="/analytics/spend" icon={BarChart3} label="Spend analytics" />
        <SidebarItem to="/suppliers" icon={Package} label="Suppliers" />
        <SidebarItem to="/purchase-orders" icon={ShoppingCart} label="Purchase orders" />
        {hasAny(ROLES.APPROVER, ROLES.ADMIN) ? (
          <SidebarItem to="/approvals" icon={ClipboardList} label="Approvals" />
        ) : null}
        {has(ROLES.ADMIN) ? <SidebarItem to="/users" icon={Users} label="Users" /> : null}
      </div>
      <div className="mt-auto px-2">
        <SidebarItem to="/account/change-password" icon={Settings} label="Settings" />
      </div>
    </nav>
  );
}
