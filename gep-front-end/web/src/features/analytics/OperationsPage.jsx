import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Clock, Timer, ArrowRight, Wallet } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ErrorState } from '@/components/data/ErrorState';
import { KpiStrip } from '@/components/data/KpiStrip';
import { usePoPendingApprovals, usePoCycleTime, usePoByStatus } from './useAggregations';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/supplierCatalog';
import { formatCurrency } from '@/lib/format';

const axisTick = { fill: 'rgb(var(--color-on-surface-variant))', fontSize: 11 };
const tooltipStyle = {
  background: 'rgb(var(--color-surface))',
  border: '1px solid rgb(var(--color-outline-variant))',
  borderRadius: 8,
  color: 'rgb(var(--color-on-surface))',
  fontSize: 13,
};

export function OperationsPage() {
  const pending = usePoPendingApprovals();
  const cycle = usePoCycleTime();
  const byStatus = usePoByStatus();

  const submittedCount =
    (byStatus.data || []).find((r) => r.status === 'SUBMITTED')?.count || 0;

  const cycleData = (cycle.data || []).map((r) => ({
    name: SUPPLIER_CATEGORY_LABELS[r.category] || r.category,
    average_days: Number(r.average_days || 0),
    po_count: Number(r.po_count || 0),
  }));

  const overallAvg =
    cycleData.length > 0
      ? cycleData.reduce((s, r) => s + r.average_days * r.po_count, 0) /
        Math.max(
          1,
          cycleData.reduce((s, r) => s + r.po_count, 0)
        )
      : 0;

  return (
    <div>
      <div className="mb-widget-gap flex flex-wrap items-end justify-between gap-3">
        <p className="text-body-base text-on-surface-variant">
          Operational health of the procurement flow. Use the queue link to action pending POs.
        </p>
        <Link to="/approvals">
          <Button variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Approval queue
          </Button>
        </Link>
      </div>

      <KpiStrip
        items={[
          {
            label: 'Pending approvals',
            value: pending.data?.count ?? '—',
            note: 'Within your limit',
            icon: <Clock className="h-4 w-4" />,
          },
          {
            label: 'Pending value',
            value:
              pending.data?.total_value != null
                ? formatCurrency(pending.data.total_value, 'INR')
                : '—',
            note: 'Sum of submitted POs',
            icon: <Wallet className="h-4 w-4" />,
          },
          {
            label: 'Avg cycle time',
            value: cycleData.length > 0 ? `${overallAvg.toFixed(1)} d` : '—',
            note: 'Submission to fulfillment',
            icon: <Timer className="h-4 w-4" />,
          },
          {
            label: 'Submitted (queued)',
            value: submittedCount,
            note: 'All approvers combined',
            icon: <Clock className="h-4 w-4" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Cycle time by category</h3>
            <span className="text-label-caps uppercase text-on-surface-variant">
              Days, DRAFT → FULFILLED
            </span>
          </CardHeader>
          <CardBody className="h-72">
            {cycle.isError ? (
              <ErrorState onRetry={cycle.refetch} />
            ) : cycle.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycleData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgb(var(--color-outline-variant) / 0.4)" vertical={false} />
                  <XAxis dataKey="name" tick={axisTick} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <RTooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, n) =>
                      n === 'average_days' ? [`${Number(v).toFixed(1)} d`, 'Avg cycle'] : [v, n]
                    }
                  />
                  <Bar dataKey="average_days" fill="rgb(var(--color-primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Throughput</h3>
          </CardHeader>
          <CardBody className="p-0">
            {cycle.isLoading ? (
              <div className="p-6">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <table className="w-full text-body-base">
                <thead className="border-b border-outline-variant bg-surface-container-low text-left text-label-caps uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2 text-right">Avg cycle (days)</th>
                    <th className="px-4 py-2 text-right">POs</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleData.map((row) => (
                    <tr key={row.name} className="border-b border-outline-variant/40">
                      <td className="px-4 py-2 text-on-surface">{row.name}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.average_days.toFixed(1)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{row.po_count}</td>
                    </tr>
                  ))}
                  {cycleData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-on-surface-variant">
                        No fulfilled POs yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
