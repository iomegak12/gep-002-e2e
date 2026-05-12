import { Clock, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { HeroWidget } from '@/components/widgets/HeroWidget';
import { MetricTile } from '@/components/widgets/MetricTile';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useAuthStore } from '@/stores/authStore';

export function ApproverDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')?.[0] || 'there';
  const limit = user?.approval_limit;

  return (
    <div>
      <HeroWidget
        eyebrow={`Welcome, ${firstName}`}
        title="Review purchase orders awaiting your approval"
        description="Approve eligible POs within your approval limit, or reject with a reason for the buyer to revise."
        action={{ to: '/approvals', label: 'Open approval queue' }}
      />

      <div className="mb-widget-gap grid grid-cols-1 gap-widget-gap md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Pending approvals"
          value="—"
          note="POs in your queue within limit"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricTile
          label="Approved this week"
          value="—"
          note="POs you have approved in the last 7 days"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricTile
          label="Avg approval cycle"
          value="—"
          note="Average days from submission to decision"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricTile
          label="Approval limit"
          value={
            limit !== null && limit !== undefined ? new Intl.NumberFormat().format(limit) : '—'
          }
          note="Maximum PO total you may approve"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Top of approval queue</h3>
            <Link to="/approvals">
              <Button variant="ghost" size="sm">
                View queue
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            <p className="pt-2 text-body-sm text-on-surface-variant">
              Connected to pending-approvals aggregation in Phase 4.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Recently approved by me</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            <p className="pt-2 text-body-sm text-on-surface-variant">
              Your approval activity feed will appear here.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
