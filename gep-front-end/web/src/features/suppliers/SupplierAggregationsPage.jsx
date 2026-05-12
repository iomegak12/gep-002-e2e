import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ErrorState } from '@/components/data/ErrorState';
import {
  useSupplierByCategory,
  useSupplierByCountry,
  useSupplierByStatus,
  useSupplierTopRated,
} from '@/features/analytics/useAggregations';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/supplierCatalog';
import { SUPPLIER_STATUS_LABELS } from '@/constants/supplierStatus';
import { SupplierStatusBadge } from './components/SupplierStatusBadge';

const PIE_COLORS = [
  'rgb(232 177 76)',
  'rgb(111 169 246)',
  'rgb(92 198 137)',
  'rgb(234 91 91)',
  'rgb(168 199 250)',
  'rgb(255 195 110)',
  'rgb(178 232 198)',
  'rgb(250 184 184)',
];

function ChartCard({ title, children, isLoading, isError, onRetry }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-title-sm text-on-surface">{title}</h3>
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

function toBarData(arr, keyName = 'name', labelMap) {
  if (!Array.isArray(arr)) return [];
  return arr.map((entry) => {
    const k = entry[keyName] ?? entry.key ?? entry.label;
    return {
      name: labelMap?.[k] || k || '—',
      count: entry.count ?? entry.value ?? entry.total ?? 0,
    };
  });
}

export function SupplierAggregationsPage() {
  // Hooks unwrap the { data: [...], generated_at } envelope returned by the
  // supplier service — see useAggregations.js / pickList().
  const byCategory = useSupplierByCategory();
  const byCountry = useSupplierByCountry();
  const byStatus = useSupplierByStatus();
  const topRated = useSupplierTopRated({ limit: 10 });

  const categoryData = toBarData(byCategory.data, 'category', SUPPLIER_CATEGORY_LABELS);
  const countryData = toBarData(byCountry.data, 'country');
  const statusData = toBarData(byStatus.data, 'status', SUPPLIER_STATUS_LABELS);

  return (
    <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-2">
      <ChartCard
        title="By category"
        isLoading={byCategory.isLoading}
        isError={byCategory.isError}
        onRetry={byCategory.refetch}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgb(var(--color-on-surface-variant))', fontSize: 11 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: 'rgb(var(--color-on-surface-variant))', fontSize: 11 }} allowDecimals={false} />
            <RTooltip
              cursor={{ fill: 'rgb(var(--color-surface-container) / 0.6)' }}
              contentStyle={{
                background: 'rgb(var(--color-surface))',
                border: '1px solid rgb(var(--color-outline-variant))',
                borderRadius: 8,
                color: 'rgb(var(--color-on-surface))',
                fontSize: 13,
              }}
            />
            <Bar dataKey="count" fill="rgb(var(--color-primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="By country"
        isLoading={byCountry.isLoading}
        isError={byCountry.isError}
        onRetry={byCountry.refetch}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={countryData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: 'rgb(var(--color-on-surface-variant))', fontSize: 11 }} />
            <YAxis tick={{ fill: 'rgb(var(--color-on-surface-variant))', fontSize: 11 }} allowDecimals={false} />
            <RTooltip
              contentStyle={{
                background: 'rgb(var(--color-surface))',
                border: '1px solid rgb(var(--color-outline-variant))',
                borderRadius: 8,
                color: 'rgb(var(--color-on-surface))',
                fontSize: 13,
              }}
            />
            <Bar dataKey="count" fill="rgb(var(--color-secondary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="By status"
        isLoading={byStatus.isLoading}
        isError={byStatus.isError}
        onRetry={byStatus.refetch}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              dataKey="count"
              nameKey="name"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
            >
              {statusData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ color: 'rgb(var(--color-on-surface-variant))', fontSize: 12 }}
            />
            <RTooltip
              contentStyle={{
                background: 'rgb(var(--color-surface))',
                border: '1px solid rgb(var(--color-outline-variant))',
                borderRadius: 8,
                color: 'rgb(var(--color-on-surface))',
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardHeader>
          <h3 className="text-title-sm text-on-surface">Top rated suppliers</h3>
        </CardHeader>
        <CardBody className="p-0">
          {topRated.isError ? (
            <ErrorState onRetry={topRated.refetch} />
          ) : topRated.isLoading ? (
            <div className="p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <table className="w-full text-body-base">
              <thead>
                <tr className="border-b border-outline-variant text-left text-label-caps uppercase text-on-surface-variant">
                  <th className="px-4 py-2">Supplier</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {(topRated.data || []).map((s) => (
                  <tr key={s.id || s.supplier_code} className="border-b border-outline-variant/40">
                    <td className="px-4 py-2">
                      <div className="font-medium text-on-surface">
                        {s.display_name || s.legal_name}
                      </div>
                      <div className="font-mono text-body-sm text-on-surface-variant">
                        {s.supplier_code}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-on-surface">
                      {SUPPLIER_CATEGORY_LABELS[s.category] || s.category}
                    </td>
                    <td className="px-4 py-2">
                      <SupplierStatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-on-surface">
                      {s.rating != null ? Number(s.rating).toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
                {(topRated.data || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-on-surface-variant">
                      No data yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
