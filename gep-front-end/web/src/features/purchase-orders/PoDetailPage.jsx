import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { poApi } from '@/api/poApi';
import { qk } from '@/api/queryKeys';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ErrorState } from '@/components/data/ErrorState';
import { POStatusBadge } from './components/POStatusBadge';
import { POStatusActions } from './components/POStatusActions';
import { PAYMENT_TERM_LABELS } from '@/constants/supplierCatalog';
import { PO_STATUS, PO_STATUS_LABELS } from '@/constants/poStatus';
import { formatCurrency, formatDate, formatRelative } from '@/lib/format';
import { computeTotals } from '@/lib/schemas/poSchema';

const TIMELINE = [
  PO_STATUS.DRAFT,
  PO_STATUS.SUBMITTED,
  PO_STATUS.APPROVED,
  PO_STATUS.FULFILLED,
  PO_STATUS.CLOSED,
];

function Dl({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-outline-variant/40 py-2 last:border-b-0 md:flex-row md:items-baseline md:gap-3">
      <dt className="w-44 shrink-0 text-label-caps uppercase text-on-surface-variant">{label}</dt>
      <dd className="text-body-base text-on-surface">{children ?? '—'}</dd>
    </div>
  );
}

function StatusTimeline({ status }) {
  const idx = TIMELINE.indexOf(status);
  // Off-the-happy-path statuses (REJECTED, CANCELLED) are shown via a banner instead.
  const branched = status === PO_STATUS.REJECTED || status === PO_STATUS.CANCELLED;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TIMELINE.map((s, i) => {
        const done = !branched && idx >= 0 && i < idx;
        const active = !branched && i === idx;
        return (
          <div key={s} className="flex items-center gap-2">
            <span
              className={
                'flex h-6 w-6 items-center justify-center rounded-full border text-body-sm font-semibold ' +
                (active
                  ? 'border-primary bg-primary text-on-primary'
                  : done
                    ? 'border-primary bg-primary-container text-on-primary-container'
                    : 'border-outline-variant bg-surface text-on-surface-variant')
              }
            >
              {i + 1}
            </span>
            <span
              className={
                'text-body-sm ' +
                (active ? 'text-on-surface' : 'text-on-surface-variant')
              }
            >
              {PO_STATUS_LABELS[s]}
            </span>
            {i < TIMELINE.length - 1 ? (
              <span className="h-px w-6 bg-outline-variant" aria-hidden />
            ) : null}
          </div>
        );
      })}
      {branched ? <POStatusBadge status={status} className="ml-2" /> : null}
    </div>
  );
}

export function PoDetailPage() {
  const { id } = useParams();
  const detail = useQuery({
    queryKey: qk.pos.detail(id),
    queryFn: () => poApi.get(id),
    enabled: Boolean(id),
  });

  if (detail.isError) return <ErrorState onRetry={detail.refetch} />;
  const po = detail.data;

  // Server typically supplies totals; fall back to client-side compute for older responses.
  const totals = po?.line_items
    ? {
        subtotal: po.subtotal ?? computeTotals(po.line_items).subtotal,
        tax_total: po.tax_total ?? computeTotals(po.line_items).tax_total,
        total_amount: po.total_amount ?? computeTotals(po.line_items).total_amount,
      }
    : { subtotal: 0, tax_total: 0, total_amount: 0 };

  return (
    <div>
      {/* Header */}
      <div className="mb-widget-gap flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {detail.isLoading || !po ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <>
              <h1 className="font-mono text-display-lg text-on-surface">
                {po.po_number || 'New PO'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-body-base text-on-surface-variant">
                <span>
                  {po.supplier_name || po.supplier?.display_name || po.supplier_id}
                </span>
                <span>·</span>
                <span>{formatDate(po.created_at)}</span>
                <POStatusBadge status={po.status} />
              </div>
            </>
          )}
        </div>
        {po ? <POStatusActions po={po} /> : null}
      </div>

      {po?.status === PO_STATUS.REJECTED && po.rejection_reason ? (
        <div
          role="alert"
          className="mb-widget-gap flex items-start gap-3 rounded-2xl border border-error-container bg-error-container/30 p-4 text-on-error-container"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <div className="text-body-base font-medium">PO rejected</div>
            <div className="text-body-sm">{po.rejection_reason}</div>
          </div>
        </div>
      ) : null}

      {po ? (
        <Card className="mb-widget-gap">
          <CardBody>
            <StatusTimeline status={po.status} />
          </CardBody>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-3">
        <div className="flex flex-col gap-widget-gap lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Line items</h3>
            </CardHeader>
            <CardBody className="p-0">
              {detail.isLoading || !po ? (
                <div className="p-6">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (po.line_items || []).length === 0 ? (
                <p className="p-6 text-body-base text-on-surface-variant">No line items.</p>
              ) : (
                <table className="w-full text-body-base">
                  <thead className="border-b border-outline-variant bg-surface-container-low">
                    <tr className="text-left text-label-caps uppercase text-on-surface-variant">
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2">UoM</th>
                      <th className="px-4 py-2 text-right">Unit price</th>
                      <th className="px-4 py-2 text-right">Tax %</th>
                      <th className="px-4 py-2 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.line_items.map((li) => {
                      const qty = Number(li.quantity) || 0;
                      const price = Number(li.unit_price) || 0;
                      const rate = Number(li.tax_rate) || 0;
                      const line = qty * price;
                      const total = line + line * (rate / 100);
                      return (
                        <tr key={li.id || li.line_number} className="border-b border-outline-variant/40">
                          <td className="px-4 py-2 font-mono text-on-surface-variant">
                            {li.line_number}
                          </td>
                          <td className="px-4 py-2">
                            <div className="text-on-surface">{li.item_description}</div>
                            {li.notes ? (
                              <div className="text-body-sm text-on-surface-variant">{li.notes}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-2 font-mono text-on-surface-variant">
                            {li.sku || '—'}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">{qty}</td>
                          <td className="px-4 py-2">{li.unit_of_measure}</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatCurrency(price, po.currency || 'INR')}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">{rate}%</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatCurrency(total, po.currency || 'INR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-surface-container-low">
                    <tr>
                      <td colSpan={6} />
                      <td className="px-4 py-2 text-right text-label-caps uppercase text-on-surface-variant">
                        Subtotal
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatCurrency(totals.subtotal, po.currency || 'INR')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} />
                      <td className="px-4 py-2 text-right text-label-caps uppercase text-on-surface-variant">
                        Tax
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatCurrency(totals.tax_total, po.currency || 'INR')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} />
                      <td className="px-4 py-2 text-right text-title-sm text-on-surface">
                        Total
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-title-sm text-primary">
                        {formatCurrency(totals.total_amount, po.currency || 'INR')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardBody>
          </Card>

          {po?.notes ? (
            <Card>
              <CardHeader>
                <h3 className="text-title-sm text-on-surface">Notes</h3>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-body-base text-on-surface">{po.notes}</p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-widget-gap">
          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Details</h3>
            </CardHeader>
            <CardBody>
              {detail.isLoading || !po ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <dl>
                  <Dl label="Supplier">
                    {po.supplier_id ? (
                      <Link
                        to={`/suppliers/${po.supplier_id}`}
                        className="text-primary hover:underline"
                      >
                        {po.supplier_name || po.supplier?.display_name || po.supplier_id}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </Dl>
                  <Dl label="Currency">{po.currency || '—'}</Dl>
                  <Dl label="Payment terms">
                    {PAYMENT_TERM_LABELS[po.payment_terms] || po.payment_terms || '—'}
                  </Dl>
                  <Dl label="Expected delivery">
                    {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}
                  </Dl>
                  <Dl label="Actual delivery">
                    {po.actual_delivery_date ? formatDate(po.actual_delivery_date) : '—'}
                  </Dl>
                  <Dl label="Buyer">{po.buyer_name || po.created_by || '—'}</Dl>
                  <Dl label="Approver">{po.approver_name || po.approved_by || '—'}</Dl>
                  <Dl label="Created">
                    {po.created_at ? formatRelative(po.created_at) : '—'}
                  </Dl>
                  <Dl label="Updated">
                    {po.updated_at ? formatRelative(po.updated_at) : '—'}
                  </Dl>
                </dl>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Delivery address</h3>
            </CardHeader>
            <CardBody>
              {detail.isLoading || !po ? (
                <Skeleton className="h-24 w-full" />
              ) : po.delivery_address ? (
                <address className="not-italic text-body-base text-on-surface">
                  {po.delivery_address.street}
                  <br />
                  {po.delivery_address.city}, {po.delivery_address.state}{' '}
                  {po.delivery_address.postal_code}
                  <br />
                  {po.delivery_address.country}
                </address>
              ) : (
                <p className="text-body-base text-on-surface-variant">Not provided.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
