import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Star } from 'lucide-react';
import { supplierApi } from '@/api/supplierApi';
import { qk } from '@/api/queryKeys';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Pill } from '@/components/primitives/Pill';
import { Button } from '@/components/primitives/Button';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ErrorState } from '@/components/data/ErrorState';
import { SupplierStatusBadge } from './components/SupplierStatusBadge';
import { SupplierStatusActions } from './components/SupplierStatusActions';
import {
  SUPPLIER_CATEGORY_LABELS,
  PAYMENT_TERM_LABELS,
} from '@/constants/supplierCatalog';
import { formatCurrency, formatDate, formatRelative } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { can } from '@/lib/permissions';

function Dl({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-outline-variant/40 py-2 last:border-b-0 md:flex-row md:items-baseline md:gap-3">
      <dt className="w-40 shrink-0 text-label-caps uppercase text-on-surface-variant">{label}</dt>
      <dd className="text-body-base text-on-surface">{children ?? '—'}</dd>
    </div>
  );
}

export function SupplierDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);

  const detailQuery = useQuery({
    queryKey: qk.suppliers.detail(id),
    queryFn: () => supplierApi.get(id),
    enabled: Boolean(id),
  });
  const scoreQuery = useQuery({
    queryKey: qk.suppliers.scorecard(id),
    queryFn: () => supplierApi.scorecard(id),
    enabled: Boolean(id),
    retry: 0,
  });

  if (detailQuery.isError) return <ErrorState onRetry={detailQuery.refetch} />;
  const supplier = detailQuery.data;
  // The list endpoint flattens scorecard fields onto the supplier; the dedicated
  // scorecard endpoint (if available) returns the same shape. Merge with the
  // supplier so either source works.
  const score = { ...(supplier || {}), ...(scoreQuery.data || supplier?.scorecard || {}) };
  const rating = score?.rating;
  const otd = score?.on_time_delivery_rate ?? score?.otd_pct;
  const orders = score?.total_orders_count ?? score?.total_orders;
  const totalSpend = score?.total_spend_inr ?? score?.total_spend;
  const totalCurrency = score?.total_spend_inr != null ? 'INR' : supplier?.currency || 'USD';
  const cycleDays = score?.avg_cycle_days;
  const ratingValid = rating != null && Number(rating) > 0;
  const otdValid = otd != null && Number(otd) > 0;
  const spendValid = totalSpend != null && Number(totalSpend) > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-widget-gap flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {detailQuery.isLoading || !supplier ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <>
              <h1 className="truncate text-display-lg text-on-surface">
                {supplier.display_name || supplier.legal_name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-body-base text-on-surface-variant">
                <span className="font-mono">{supplier.supplier_code}</span>
                <span>·</span>
                <span>{SUPPLIER_CATEGORY_LABELS[supplier.category] || supplier.category}</span>
                <span>·</span>
                <span>{supplier.country}</span>
                <SupplierStatusBadge status={supplier.status} />
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {can.editSupplier(user) && supplier ? (
            <Link to={`/suppliers/${supplier.id}/edit`}>
              <Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />}>
                Edit
              </Button>
            </Link>
          ) : null}
          {can.transitionSupplier(user) && supplier ? (
            <SupplierStatusActions supplier={supplier} />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-3">
        {/* Left/main */}
        <div className="flex flex-col gap-widget-gap lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Identity</h3>
            </CardHeader>
            <CardBody>
              {detailQuery.isLoading || !supplier ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <dl>
                  <Dl label="Legal name">{supplier.legal_name}</Dl>
                  <Dl label="Display name">{supplier.display_name}</Dl>
                  <Dl label="Supplier code">
                    <span className="font-mono">{supplier.supplier_code}</span>
                  </Dl>
                  <Dl label="Tax ID">
                    <span className="font-mono">{supplier.tax_id || '—'}</span>
                  </Dl>
                  <Dl label="Category">
                    {SUPPLIER_CATEGORY_LABELS[supplier.category] || supplier.category}
                  </Dl>
                  <Dl label="Sub-category">{supplier.sub_category || '—'}</Dl>
                  <Dl label="Region">{supplier.region || '—'}</Dl>
                  <Dl label="Created">
                    {supplier.created_at ? formatDate(supplier.created_at) : '—'}
                  </Dl>
                  <Dl label="Last updated">
                    {supplier.updated_at ? formatRelative(supplier.updated_at) : '—'}
                  </Dl>
                </dl>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Contact &amp; address</h3>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {detailQuery.isLoading || !supplier ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <>
                  <dl>
                    <Dl label="Primary contact">{supplier.contact?.primary_name}</Dl>
                    <Dl label="Email">{supplier.contact?.email}</Dl>
                    <Dl label="Phone">
                      <span className="font-mono">{supplier.contact?.phone}</span>
                    </Dl>
                  </dl>
                  <dl>
                    <Dl label="Street">{supplier.address?.street}</Dl>
                    <Dl label="City">{supplier.address?.city}</Dl>
                    <Dl label="State">{supplier.address?.state}</Dl>
                    <Dl label="Postal code">
                      <span className="font-mono">{supplier.address?.postal_code}</span>
                    </Dl>
                  </dl>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Commercial terms</h3>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {detailQuery.isLoading || !supplier ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <>
                  <dl>
                    <Dl label="Payment terms">
                      {PAYMENT_TERM_LABELS[supplier.payment_terms] || supplier.payment_terms}
                    </Dl>
                    <Dl label="Currency">{supplier.currency}</Dl>
                  </dl>
                  <dl>
                    <Dl label="Tags">
                      {(supplier.tags || []).length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {supplier.tags.map((t) => (
                            <Pill key={t}>{t}</Pill>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </Dl>
                  </dl>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Certifications</h3>
            </CardHeader>
            <CardBody>
              {detailQuery.isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (supplier?.certifications || []).length === 0 ? (
                <p className="text-body-base text-on-surface-variant">
                  No certifications recorded.
                </p>
              ) : (
                <table className="w-full text-body-base">
                  <thead>
                    <tr className="border-b border-outline-variant text-left text-label-caps uppercase text-on-surface-variant">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Issued by</th>
                      <th className="py-2">Valid until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.certifications.map((c, i) => (
                      <tr key={i} className="border-b border-outline-variant/40">
                        <td className="py-2 pr-3">{c.name}</td>
                        <td className="py-2 pr-3">{c.issued_by}</td>
                        <td className="py-2 font-mono">{c.valid_until}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-widget-gap">
          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Scorecard</h3>
              <span className="text-label-caps uppercase text-on-surface-variant">
                {score?.last_updated_at ? `Updated ${formatRelative(score.last_updated_at)}` : ''}
              </span>
            </CardHeader>
            <CardBody>
              {scoreQuery.isLoading && !score ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-display-lg font-bold text-primary">
                      {ratingValid ? Number(rating).toFixed(1) : '—'}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">of 5.0</span>
                    {ratingValid ? (
                      <Star className="ml-1 h-4 w-4 text-primary" aria-hidden />
                    ) : null}
                  </div>
                  <div className="mt-1 text-label-caps uppercase text-on-surface-variant">
                    Composite rating
                  </div>
                  <div className="my-4 h-px bg-outline-variant" />
                  <dl>
                    <Dl label="On-time delivery">
                      {otdValid ? `${Number(otd).toFixed(1)}%` : '—'}
                    </Dl>
                    <Dl label="Total orders">
                      <span className="font-mono">{orders ?? '—'}</span>
                    </Dl>
                    <Dl label="Total spend">
                      {spendValid ? formatCurrency(totalSpend, totalCurrency) : '—'}
                    </Dl>
                    <Dl label="Avg cycle time">
                      {cycleDays != null
                        ? `${Number(cycleDays).toFixed(1)} days`
                        : '—'}
                    </Dl>
                  </dl>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-start gap-3 rounded-lg border border-secondary-container bg-secondary-container/30 p-3 text-on-secondary-container">
                <div className="text-body-base font-medium">Why this matters</div>
              </div>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                The scorecard updates every time a PO is fulfilled. Use it to prioritise category
                buyers and to flag suppliers for requalification.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
