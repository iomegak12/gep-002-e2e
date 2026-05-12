import { MetricTile } from '@/components/widgets/MetricTile';

/** Tight 4-up KPI strip used at the top of directory pages and dashboards. */
export function KpiStrip({ items = [] }) {
  return (
    <div className="mb-widget-gap grid grid-cols-1 gap-widget-gap md:grid-cols-2 xl:grid-cols-4">
      {items.map((m, i) => (
        <MetricTile key={m.label || i} {...m} />
      ))}
    </div>
  );
}
