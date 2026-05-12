import { Plus, FileText, Clock, CheckCircle2, Coins } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { HeroWidget } from '@/components/widgets/HeroWidget';
import { MetricTile } from '@/components/widgets/MetricTile';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';

export function BuyerDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')?.[0] || 'there';

  return (
    <div>
      <HeroWidget
        eyebrow={`Welcome back, ${firstName}`}
        title="Raise a purchase order"
        description="Pick a supplier, add line items and route it for approval. Drafts auto-save as you go."
        action={{ to: '/purchase-orders/new', label: 'Create a PO' }}
      />

      <div className="mb-widget-gap grid grid-cols-1 gap-widget-gap md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="My drafts"
          value="—"
          note="Drafts waiting to be submitted"
          icon={<FileText className="h-4 w-4" />}
        />
        <MetricTile
          label="Awaiting approval"
          value="—"
          note="Submitted POs in review"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricTile
          label="Approved (open)"
          value="—"
          note="Approved POs awaiting fulfillment"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricTile
          label="My YTD spend"
          value="—"
          note="Purchases approved this year"
          icon={<Coins className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">My recent POs</h3>
            <Link to="/purchase-orders">
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
              Connected to purchase order data in Phase 4.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Needs your attention</h3>
            <Button variant="ghost" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              New PO
            </Button>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            <p className="pt-2 text-body-sm text-on-surface-variant">
              Rejected POs and supplier follow-ups will be listed here.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
