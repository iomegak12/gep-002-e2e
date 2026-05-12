import { Coins, Building2, ClipboardList, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { HeroWidget } from '@/components/widgets/HeroWidget';
import { MetricTile } from '@/components/widgets/MetricTile';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useAuthStore } from '@/stores/authStore';

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')?.[0] || 'admin';

  return (
    <div>
      <HeroWidget
        eyebrow={`Welcome, ${firstName}`}
        title="System overview"
        description="Approve new suppliers, manage users and keep procurement healthy across the organisation."
        action={{ to: '/suppliers/pending-approval', label: 'Review pending suppliers' }}
      />

      <div className="mb-widget-gap grid grid-cols-1 gap-widget-gap md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total spend YTD"
          value="—"
          note="Approved purchases this year"
          icon={<Coins className="h-4 w-4" />}
        />
        <MetricTile
          label="Active suppliers"
          value="—"
          note="Eligible for new POs"
          icon={<Building2 className="h-4 w-4" />}
        />
        <MetricTile
          label="Pending supplier approvals"
          value="—"
          note="Suppliers awaiting your decision"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <MetricTile
          label="Active users"
          value="—"
          note="Accounts able to sign in"
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
          <CardBody className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            <p className="pt-2 text-body-sm text-on-surface-variant">
              Connected to supplier data in Phase 3.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">System activity</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            <p className="pt-2 text-body-sm text-on-surface-variant">
              Recent user activity and status changes will appear here.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
