import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { HeroWidget } from '@/components/widgets/HeroWidget';
import { MetricTile } from '@/components/widgets/MetricTile';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { usePOs } from '@/features/purchase-orders/usePOs';
import { usePoCycleTime, usePoPendingApprovals } from '@/features/analytics/useAggregations';
import { POStatusBadge } from '@/features/purchase-orders/components/POStatusBadge';
import { formatCurrency, formatRelative } from '@/lib/format';
import { PO_STATUS } from '@/constants/poStatus';

export function ApproverDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')?.[0] || 'there';
  const limit = user?.approval_limit;

  const queue = usePOs({
    status: PO_STATUS.SUBMITTED,
    page: 1,
    page_size: 50,
    sort: '-created_at',
  });
  const allSubmitted = queue.data?.items || [];
  // Mirror approver-limit gating from the queue page.
  const eligible =
    limit == null ? allSubmitted : allSubmitted.filter((p) => Number(p.total_amount || 0) <= Number(limit));

  const recentlyApproved = usePOs({
    status: PO_STATUS.APPROVED,
    page: 1,
    page_size: 10,
    sort: '-updated_at',
  });
  const approvedItems = recentlyApproved.data?.items || [];

  const pending = usePoPendingApprovals();
  const cycle = usePoCycleTime();
  const cycleAvg = (() => {
    const rows = cycle.data || [];
    if (rows.length === 0) return null;
    const totalPo = rows.reduce((s, r) => s + Number(r.po_count || 0), 0);
    if (totalPo === 0) return null;
    return rows.reduce((s, r) => s + Number(r.average_days || 0) * Number(r.po_count || 0), 0) / totalPo;
  })();

  return (
    <div>
      {eligible.length > 0 ? (
        <HeroWidget
          eyebrow={`Welcome, ${firstName}`}
          title={`You have ${eligible.length} PO${eligible.length === 1 ? '' : 's'} awaiting your approval`}
          description="Approve eligible POs within your limit, or reject with a reason for the buyer to revise."
          action={{ to: '/approvals', label: 'Open approval queue' }}
        />
      ) : (
        <HeroWidget
          eyebrow={`Welcome, ${firstName}`}
          title="Your queue is clear"
          description="No POs are awaiting your approval right now. Browse purchase orders or check operations metrics."
          action={{ to: '/analytics/operations', label: 'View operations' }}
        />
      )}

      <div className="mb-widget-gap grid grid-cols-1 gap-widget-gap md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Pending approvals"
          value={queue.isLoading ? '—' : eligible.length}
          note="POs in your queue within limit"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricTile
          label="Pending value"
          value={
            pending.isLoading || pending.data?.total_value == null
              ? '—'
              : formatCurrency(pending.data.total_value, 'INR')
          }
          note="Sum of submitted POs"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricTile
          label="Avg cycle"
          value={cycleAvg != null ? `${cycleAvg.toFixed(1)} d` : '—'}
          note="Submission to fulfillment"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricTile
          label="Approval limit"
          value={limit != null ? formatCurrency(limit, 'INR') : 'Unlimited'}
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
          <CardBody className="p-0">
            {queue.isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : eligible.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">
                Nothing in your queue. Take a moment.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {eligible.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/purchase-orders/${p.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-on-surface">{p.po_number}</div>
                        <div className="truncate text-body-sm text-on-surface-variant">
                          {p.supplier_snapshot?.display_name || p.supplier_id} ·{' '}
                          {formatRelative(p.submitted_at || p.created_at)}
                        </div>
                      </div>
                      <span className="font-mono text-body-sm text-on-surface">
                        {formatCurrency(p.total_amount || 0, p.currency || 'INR')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Recently approved</h3>
          </CardHeader>
          <CardBody className="p-0">
            {recentlyApproved.isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : approvedItems.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">No recent approvals.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {approvedItems.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/purchase-orders/${p.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-on-surface">{p.po_number}</div>
                        <div className="truncate text-body-sm text-on-surface-variant">
                          {p.supplier_snapshot?.display_name || p.supplier_id} ·{' '}
                          {formatRelative(p.approved_at || p.updated_at)}
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
