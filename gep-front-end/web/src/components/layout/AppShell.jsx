import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const TITLES = [
  [/^\/$/, 'Dashboard'],
  [/^\/dashboard\/buyer/, 'Buyer dashboard'],
  [/^\/dashboard\/approver/, 'Approver dashboard'],
  [/^\/dashboard\/admin/, 'Admin dashboard'],
  [/^\/analytics\/spend/, 'Spend analytics'],
  [/^\/analytics\/operations/, 'Operations'],
  [/^\/suppliers\/new/, 'New supplier'],
  [/^\/suppliers\/pending-approval/, 'Pending supplier approvals'],
  [/^\/suppliers\/aggregations/, 'Supplier aggregations'],
  [/^\/suppliers\/[^/]+\/edit/, 'Edit supplier'],
  [/^\/suppliers\/[^/]+/, 'Supplier'],
  [/^\/suppliers/, 'Suppliers'],
  [/^\/purchase-orders\/new/, 'New purchase order'],
  [/^\/purchase-orders\/[^/]+\/edit/, 'Edit purchase order'],
  [/^\/purchase-orders\/[^/]+/, 'Purchase order'],
  [/^\/purchase-orders/, 'Purchase orders'],
  [/^\/approvals/, 'Approval queue'],
  [/^\/users\/new/, 'New user'],
  [/^\/users\/[^/]+\/edit/, 'Edit user'],
  [/^\/users/, 'Users'],
  [/^\/account\/change-password/, 'Change password'],
];

function titleFor(pathname) {
  for (const [re, t] of TITLES) if (re.test(pathname)) return t;
  return 'Order Oasis';
}

export function AppShell() {
  const { pathname } = useLocation();
  const title = titleFor(pathname);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar />
      <Topbar title={title} />
      <main className="ml-sidebar-collapsed mt-16 min-h-[calc(100vh-64px)] p-container-padding">
        <Outlet />
      </main>
    </div>
  );
}
