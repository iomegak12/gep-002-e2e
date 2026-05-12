import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Coins, Wallet, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Tabs } from '@/components/primitives/Tabs';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ErrorState } from '@/components/data/ErrorState';
import { KpiStrip } from '@/components/data/KpiStrip';
import {
  usePoByStatus,
  usePoSpendBySupplier,
  usePoSpendByCategory,
  usePoMonthlySpend,
} from './useAggregations';
import { useSupplierNames } from './useSupplierNames';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/supplierCatalog';
import { formatCurrency } from '@/lib/format';

const PIE_COLORS = [
  'rgb(232 177 76)',
  'rgb(111 169 246)',
  'rgb(92 198 137)',
  'rgb(234 91 91)',
  'rgb(255 195 110)',
  'rgb(168 199 250)',
  'rgb(178 232 198)',
  'rgb(250 184 184)',
];

const PERIOD_TABS = [
  { value: 'mtd', label: 'MTD' },
  { value: 'qtd', label: 'QTD' },
  { value: 'ytd', label: 'YTD' },
];

const tooltipStyle = {
  background: 'rgb(var(--color-surface))',
  border: '1px solid rgb(var(--color-outline-variant))',
  borderRadius: 8,
  color: 'rgb(var(--color-on-surface))',
  fontSize: 13,
};
const axisTick = { fill: 'rgb(var(--color-on-surface-variant))', fontSize: 11 };

function ChartCard({ title, isLoading, isError, onRetry, children, action }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-title-sm text-on-surface">{title}</h3>
        {action}
      </CardHeader>
      <CardBody className="h-72">
        {isError ? (
          <ErrorState onRetry={onRetry} />
        ) : isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
}

export function SpendAnalyticsPage() {
  const [period, setPeriod] = useState('ytd');
  const year = new Date().getUTCFullYear();

  const byStatus = usePoByStatus();
  const spendBySupplier = usePoSpendBySupplier({ period, limit: 5 });
  const spendByCategory = usePoSpendByCategory({ period });
  const monthly = usePoMonthlySpend(year);

  const supplierIds = useMemo(
    () => (spendBySupplier.data || []).map((r) => r.supplier_id),
    [spendBySupplier.data]
  );
  const supplierNames = useSupplierNames(supplierIds);

  const totals = useMemo(() => {
    const rows = byStatus.data || [];
    const totalSpend = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
    const totalPOs = rows.reduce((s, r) => s + Number(r.count || 0), 0);
    const approvedCount = rows.find((r) => r.status === 'APPROVED')?.count || 0;
    const fulfilledCount = rows.find((r) => r.status === 'FULFILLED')?.count || 0;
    const closedCount = rows.find((r) => r.status === 'CLOSED')?.count || 0;
    const openValue = rows
      .filter((r) => ['APPROVED', 'SUBMITTED'].includes(r.status))
      .reduce((s, r) => s + Number(r.total_amount || 0), 0);
    return { totalSpend, totalPOs, approvedCount, fulfilledCount, closedCount, openValue };
  }, [byStatus.data]);

  const ytdSpend = useMemo(
    () => (monthly.data || []).reduce((s, m) => s + Number(m.total_spend || 0), 0),
    [monthly.data]
  );

  const supplierChartData = useMemo(
    () =>
      (spendBySupplier.data || []).map((r) => ({
        name: supplierNames.get(r.supplier_id) || r.supplier_id?.slice(0, 8) || '—',
        total_spend: Number(r.total_spend || 0),
        po_count: Number(r.po_count || 0),
      })),
    [spendBySupplier.data, supplierNames]
  );

  const categoryChartData = useMemo(
    () =>
      (spendByCategory.data || []).map((r) => ({
        name: SUPPLIER_CATEGORY_LABELS[r.category] || r.category || '—',
        total_spend: Number(r.total_spend || 0),
        po_count: Number(r.po_count || 0),
      })),
    [spendByCategory.data]
  );

  const statusData = useMemo(
    () =>
      (byStatus.data || []).map((r) => ({
        name: r.status,
        value: Number(r.count || 0),
        total_amount: Number(r.total_amount || 0),
      })),
    [byStatus.data]
  );

  return (
    <div>
      <div className="mb-widget-gap flex flex-wrap items-end justify-between gap-3">
        <p className="text-body-base text-on-surface-variant">
          Spend insights across suppliers, categories and time. Filter by period to compare.
        </p>
        <Tabs value={period} onChange={setPeriod} items={PERIOD_TABS} />
      </div>

      <KpiStrip
        items={[
          {
            label: 'Total spend (YTD)',
            value: formatCurrency(ytdSpend, 'INR'),
            note: `${year} approved POs`,
            icon: <Coins className="h-4 w-4" />,
          },
          {
            label: 'Active POs',
            value: totals.approvedCount,
            note: 'Approved & awaiting fulfillment',
            icon: <ShoppingCart className="h-4 w-4" />,
          },
          {
            label: 'Open value',
            value: formatCurrency(totals.openValue, 'INR'),
            note: 'Submitted + approved',
            icon: <Wallet className="h-4 w-4" />,
          },
          {
            label: 'Total POs',
            value: totals.totalPOs,
            note: 'All statuses',
            icon: <TrendingUp className="h-4 w-4" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-2">
        <ChartCard
          title={`Monthly spend · ${year}`}
          isLoading={monthly.isLoading}
          isError={monthly.isError}
          onRetry={monthly.refetch}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly.data || []} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgb(var(--color-outline-variant) / 0.4)" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} />
              <YAxis
                tick={axisTick}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <RTooltip
                contentStyle={tooltipStyle}
                formatter={(v) => formatCurrency(v, 'INR')}
              />
              <Line
                type="monotone"
                dataKey="total_spend"
                stroke="rgb(var(--color-primary))"
                strokeWidth={2}
                dot={{ fill: 'rgb(var(--color-primary))', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Spend by category"
          isLoading={spendByCategory.isLoading}
          isError={spendByCategory.isError}
          onRetry={spendByCategory.refetch}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgb(var(--color-outline-variant) / 0.4)" vertical={false} />
              <XAxis dataKey="name" tick={axisTick} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis
                tick={axisTick}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <RTooltip
                contentStyle={tooltipStyle}
                formatter={(v) => formatCurrency(v, 'INR')}
              />
              <Bar dataKey="total_spend" fill="rgb(var(--color-secondary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={`Top suppliers · ${period.toUpperCase()}`}
          isLoading={spendBySupplier.isLoading}
          isError={spendBySupplier.isError}
          onRetry={spendBySupplier.refetch}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={supplierChartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke="rgb(var(--color-outline-variant) / 0.4)" horizontal={false} />
              <XAxis
                type="number"
                tick={axisTick}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <YAxis dataKey="name" type="category" tick={axisTick} width={140} />
              <RTooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v, 'INR')} />
              <Bar dataKey="total_spend" fill="rgb(var(--color-primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="PO status breakdown"
          isLoading={byStatus.isLoading}
          isError={byStatus.isError}
          onRetry={byStatus.refetch}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ color: 'rgb(var(--color-on-surface-variant))', fontSize: 12 }} />
              <RTooltip
                contentStyle={tooltipStyle}
                formatter={(v, _n, ctx) => [
                  `${v} POs · ${formatCurrency(ctx.payload.total_amount, 'INR')}`,
                  ctx.payload.name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="mt-widget-gap">
        <CardHeader>
          <h3 className="text-title-sm text-on-surface">Top suppliers (drill in)</h3>
          <Link to="/suppliers/aggregations" className="text-body-sm text-primary hover:underline">
            All supplier aggregations →
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          {spendBySupplier.isLoading ? (
            <div className="p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <table className="w-full text-body-base">
              <thead className="border-b border-outline-variant bg-surface-container-low text-left text-label-caps uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-2">Supplier</th>
                  <th className="px-4 py-2 text-right">POs</th>
                  <th className="px-4 py-2 text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {(spendBySupplier.data || []).map((row) => (
                  <tr key={row.supplier_id} className="border-b border-outline-variant/40">
                    <td className="px-4 py-2">
                      <Link
                        to={`/suppliers/${row.supplier_id}`}
                        className="text-on-surface hover:text-primary hover:underline"
                      >
                        {supplierNames.get(row.supplier_id) || row.supplier_id}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{row.po_count}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCurrency(row.total_spend || 0, 'INR')}
                    </td>
                  </tr>
                ))}
                {(spendBySupplier.data || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-on-surface-variant">
                      No PO data for this period.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <p className="mt-widget-gap text-body-sm text-on-surface-variant">
        Status counts shown here include all POs; spend totals are computed by the PO service over
        approved purchases.
      </p>
    </div>
  );
}
