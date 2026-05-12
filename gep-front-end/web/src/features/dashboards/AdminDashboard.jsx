import { Link } from 'react-router-dom';
import { Coins, Building2, ClipboardList, Users } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { HeroWidget } from '@/components/widgets/HeroWidget';
import { MetricTile } from '@/components/widgets/MetricTile';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useSuppliers } from '@/features/suppliers/useSuppliers';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import { qk } from '@/api/queryKeys';
import {
  usePoMonthlySpend,
  useSupplierByStatus,
} from '@/features/analytics/useAggregations';
import { SupplierStatusBadge } from '@/features/suppliers/components/SupplierStatusBadge';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/supplierCatalog';
import { formatCurrency, formatRelative } from '@/lib/format';

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')?.[0] || 'admin';
  const year = new Date().getUTCFullYear();

  const pending = useSuppliers({
    status: 'PENDING_APPROVAL',
    page: 1,
    page_size: 10,
    sort: '-created_at',
  });
  const pendingItems = pending.data?.items || [];
  const pendingCount = pending.data?.total ?? pendingItems.length;

  const monthly = usePoMonthlySpend(year);
  const ytdSpend = (monthly.data || []).reduce((s, m) => s + Number(m.total_spend || 0), 0);

  const supplierStatus = useSupplierByStatus();
  const activeSuppliers =
    (supplierStatus.data || []).find((r) => r.status === 'ACTIVE')?.count ?? '—';

  const users = useQuery({
    queryKey: qk.auth.users({ page: 1, page_size: 1 }),
    queryFn: () => authApi.listUsers({ page: 1, page_size: 1 }),
  });
  const activeUsersCount = users.data?.total ?? '—';

  // Tail of recent suppliers — proxy for "system activity" until a dedicated audit feed exists.
  const recentSuppliers = useSuppliers({
    page: 1,
    page_size: 8,
    sort: '-updated_at',
  });
  const recentItems = recentSuppliers.data?.items || [];

  return (
    <div>
      <HeroWidget
        eyebrow={`Welcome, ${firstName}`}
        title="System overview"
        description="Approve new suppliers, manage users, and keep procurement healthy across the org."
        action={{ to: '/suppliers/pending-approval', label: 'Review pending suppliers' }}
      />

      <div className="mb-widget-gap grid grid-cols-1 gap-widget-gap md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total spend (YTD)"
          value={monthly.isLoading ? '—' : formatCurrency(ytdSpend, 'INR')}
          note={`Across ${year}`}
          icon={<Coins className="h-4 w-4" />}
        />
        <MetricTile
          label="Active suppliers"
          value={supplierStatus.isLoading ? '—' : activeSuppliers}
          note="Eligible for new POs"
          icon={<Building2 className="h-4 w-4" />}
        />
        <MetricTile
          label="Pending supplier approvals"
          value={pending.isLoading ? '—' : pendingCount}
          note="Awaiting your decision"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <MetricTile
          label="Users"
          value={users.isLoading ? '—' : activeUsersCount}
          note="All roles, all states"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Pending supplier approvals</h3>
            <Link to="/suppliers/pending-approval">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {pending.isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pendingItems.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">
                Nothing pending. All suppliers reviewed.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {pendingItems.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/suppliers/${s.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <div className="text-on-surface">{s.display_name || s.legal_name}</div>
                        <div className="truncate font-mono text-body-sm text-on-surface-variant">
                          {s.supplier_code} ·{' '}
                          {SUPPLIER_CATEGORY_LABELS[s.category] || s.category} · {s.country}
                        </div>
                      </div>
                      <SupplierStatusBadge status={s.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Recent supplier activity</h3>
          </CardHeader>
          <CardBody className="p-0">
            {recentSuppliers.isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentItems.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">No recent changes.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {recentItems.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/suppliers/${s.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <div className="text-on-surface">{s.display_name || s.legal_name}</div>
                        <div className="truncate text-body-sm text-on-surface-variant">
                          Updated {formatRelative(s.updated_at)}
                        </div>
                      </div>
                      <SupplierStatusBadge status={s.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
