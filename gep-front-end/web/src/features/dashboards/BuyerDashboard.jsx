import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCircle2, Coins } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { HeroWidget } from '@/components/widgets/HeroWidget';
import { MetricTile } from '@/components/widgets/MetricTile';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { usePOs } from '@/features/purchase-orders/usePOs';
import { POStatusBadge } from '@/features/purchase-orders/components/POStatusBadge';
import { formatCurrency, formatRelative } from '@/lib/format';

export function BuyerDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')?.[0] || 'there';

  // Pull the latest 50 POs the user owns; everything below derives from this list.
  const mine = usePOs({
    buyer_id: user?.id,
    page: 1,
    page_size: 50,
    sort: '-created_at',
  });
  const items = mine.data?.items || [];

  const drafts = items.filter((p) => p.status === 'DRAFT');
  const submitted = items.filter((p) => p.status === 'SUBMITTED');
  const approved = items.filter((p) => p.status === 'APPROVED');
  const rejected = items.filter((p) => p.status === 'REJECTED');
  const ytdSpend = items
    .filter((p) => ['APPROVED', 'FULFILLED', 'CLOSED'].includes(p.status))
    .reduce((s, p) => s + Number(p.total_amount || 0), 0);

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
          value={mine.isLoading ? '—' : drafts.length}
          note="Drafts waiting to be submitted"
          icon={<FileText className="h-4 w-4" />}
        />
        <MetricTile
          label="Awaiting approval"
          value={mine.isLoading ? '—' : submitted.length}
          note="Submitted POs in review"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricTile
          label="Approved (open)"
          value={mine.isLoading ? '—' : approved.length}
          note="Approved POs awaiting fulfillment"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricTile
          label="My YTD spend"
          value={mine.isLoading ? '—' : formatCurrency(ytdSpend, 'INR')}
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
          <CardBody className="p-0">
            {mine.isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">
                You haven&apos;t created any POs yet.{' '}
                <Link to="/purchase-orders/new" className="text-primary hover:underline">
                  Create your first
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {items.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/purchase-orders/${p.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-on-surface">{p.po_number}</div>
                        <div className="truncate text-body-sm text-on-surface-variant">
                          {p.supplier_snapshot?.display_name || p.supplier_id} ·{' '}
                          {formatRelative(p.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-body-sm text-on-surface">
                          {formatCurrency(p.total_amount || 0, p.currency || 'INR')}
                        </span>
                        <POStatusBadge status={p.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Needs your attention</h3>
            <Link to="/purchase-orders/new">
              <Button variant="ghost" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                New PO
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {mine.isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rejected.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">
                No rejected POs. Nice and tidy.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {rejected.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/purchase-orders/${p.id}`}
                      className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-on-surface">{p.po_number}</div>
                        <div className="truncate text-body-sm text-error">
                          {p.rejection_reason || 'Rejected — open to revise'}
                        </div>
                      </div>
                      <POStatusBadge status={p.status} />
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
