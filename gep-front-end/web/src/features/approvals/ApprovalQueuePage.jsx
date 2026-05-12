import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Search } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Checkbox } from '@/components/primitives/Checkbox';
import { Input } from '@/components/primitives/Input';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { ReasonDialog } from '@/components/feedback/ReasonDialog';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { FilterBar } from '@/components/data/FilterBar';
import { KpiStrip } from '@/components/data/KpiStrip';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { CardView } from '@/components/views/CardView';
import { KanbanBoard } from '@/components/views/KanbanBoard';
import { GridView } from '@/components/views/GridView';
import { useViewMode } from '@/hooks/useViewMode';
import { usePOs } from '@/features/purchase-orders/usePOs';
import { POCard } from '@/features/purchase-orders/components/POCard';
import { POStatusBadge } from '@/features/purchase-orders/components/POStatusBadge';
import { usePOColumns } from '@/features/purchase-orders/components/usePOColumns';
import { poApi } from '@/api/poApi';
import { qk } from '@/api/queryKeys';
import { REASONS } from '@/constants/reasons';
import { PO_STATUS } from '@/constants/poStatus';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/lib/format';
import { ERR, isErrorCode, getErrorMessage } from '@/lib/apiError';

const SCREEN_KEY = 'pos.approvals';

export function ApprovalQueuePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useViewMode(SCREEN_KEY, 'grid');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [rejectFor, setRejectFor] = useState(null); // single PO id when rejecting
  const qc = useQueryClient();

  const params = useMemo(
    () => ({
      status: PO_STATUS.SUBMITTED,
      q: q || undefined,
      page: 1,
      page_size: 100,
      sort: '-created_at',
    }),
    [q]
  );
  const { data, isLoading, isError, refetch } = usePOs(params);
  const allItems = data?.items || [];
  const limit = user?.approval_limit;

  // Hide POs that exceed approver's limit. The list endpoint does not enforce this
  // (only /aggregations/pending-approvals does — see po/aggregations.spec.js).
  // Admins / unlimited users see everything.
  const items = useMemo(() => {
    if (limit == null) return allItems;
    return allItems.filter((p) => Number(p.total_amount || 0) <= Number(limit));
  }, [allItems, limit]);

  const totalAwaiting = items.length;
  const totalValue = items.reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const selectedItems = items.filter((p) => selected.has(p.id));
  const selectedTotal = selectedItems.reduce((s, p) => s + Number(p.total_amount || 0), 0);

  const baseColumns = usePOColumns({ showBuyer: true });
  const columns = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          aria-label="Select all"
          checked={items.length > 0 && selected.size === items.length}
          onChange={(e) => {
            if (e.target.checked) setSelected(new Set(items.map((p) => p.id)));
            else setSelected(new Set());
          }}
        />
      ),
      cell: (info) => {
        const id = info.row.original.id;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              aria-label="Select PO"
              checked={selected.has(id)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(id);
                else next.delete(id);
                setSelected(next);
              }}
            />
          </div>
        );
      },
    },
    ...baseColumns,
    {
      id: 'actions',
      header: '',
      cell: (info) => {
        const po = info.row.original;
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Check className="h-3.5 w-3.5" />}
              onClick={() => approveOne.mutate(po.id)}
              disabled={approveOne.isPending}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={() => setRejectFor(po)}
            >
              Reject
            </Button>
          </div>
        );
      },
      meta: { align: 'right' },
    },
  ];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pos', 'list'] });
    qc.invalidateQueries({ queryKey: ['pos', 'agg'] });
  };

  const approveOne = useMutation({
    mutationFn: (id) => poApi.approve(id),
    onSuccess: (_, id) => {
      toast.success('PO approved');
      setSelected((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      invalidate();
    },
    onError: (err) => {
      if (isErrorCode(err, ERR.APPROVAL_LIMIT_EXCEEDED)) {
        toast.error('This PO exceeds your approval limit.');
      } else if (isErrorCode(err, ERR.INVALID_STATUS_TRANSITION)) {
        toast.error('This PO is no longer awaiting approval.');
      } else {
        toast.error(getErrorMessage(err, 'Could not approve PO.'));
      }
    },
  });

  const bulkApprove = useMutation({
    mutationFn: async (ids) => {
      const results = await Promise.allSettled(ids.map((id) => poApi.approve(id)));
      return results;
    },
    onSuccess: (results, ids) => {
      const failed = results.filter((r) => r.status === 'rejected').length;
      const ok = results.length - failed;
      if (failed) {
        toast.error(`${ok} approved, ${failed} failed`);
      } else {
        toast.success(`${ok} PO${ok === 1 ? '' : 's'} approved`);
      }
      setSelected(new Set());
      setBulkConfirm(false);
      invalidate();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => poApi.reject(id, { reason }),
    onSuccess: (_, vars) => {
      toast.success('PO rejected');
      setSelected((s) => {
        const n = new Set(s);
        n.delete(vars.id);
        return n;
      });
      setRejectFor(null);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not reject PO.')),
  });

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="mb-widget-gap flex flex-wrap items-end justify-between gap-3">
        <p className="text-body-base text-on-surface-variant">
          Submitted POs within your approval limit. Approve in bulk or open a PO to review line
          items before deciding.
        </p>
        <div className="flex items-center gap-2">
          <ViewSwitcher value={view} onChange={setView} />
        </div>
      </div>

      <KpiStrip
        items={[
          { label: 'Awaiting approval', value: totalAwaiting, note: 'Within your limit' },
          {
            label: 'Total value',
            value: formatCurrency(totalValue, 'INR'),
            note: 'Sum of pending POs',
          },
          {
            label: 'Approval limit',
            value: limit != null ? formatCurrency(limit, 'INR') : 'Unlimited',
            note: 'Your ceiling',
          },
          { label: 'Selected', value: selected.size, note: 'Ready for bulk approve' },
        ]}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            placeholder="Search by PO number or supplier"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {selected.size > 0 ? (
          <Button
            variant="primary"
            leftIcon={<Check className="h-4 w-4" />}
            onClick={() => setBulkConfirm(true)}
          >
            Approve selected ({selected.size})
          </Button>
        ) : null}
      </div>

      <FilterBar
        filters={
          selected.size > 0
            ? [
                {
                  key: 'selected',
                  label: `Selected total: ${formatCurrency(selectedTotal, 'INR')}`,
                  onRemove: () => setSelected(new Set()),
                },
              ]
            : []
        }
      />

      {view === 'grid' ? (
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Pending purchase orders</h3>
          </CardHeader>
          <CardBody className="p-0">
            <GridView
              columns={columns}
              data={items}
              isLoading={isLoading}
              onRowClick={(p) => navigate(`/purchase-orders/${p.id}`)}
              emptyState={
                <EmptyState
                  title="Your queue is clear"
                  description="No POs are awaiting your approval right now."
                />
              }
            />
          </CardBody>
        </Card>
      ) : view === 'card' ? (
        <CardView
          items={items}
          isLoading={isLoading}
          onItemClick={(p) => navigate(`/purchase-orders/${p.id}`)}
          renderCard={(p) => <POCard po={p} />}
          emptyState={<EmptyState title="Your queue is clear" />}
        />
      ) : (
        <KanbanBoard
          items={items}
          columns={[{ key: PO_STATUS.SUBMITTED, label: 'Awaiting approval' }]}
          groupBy={() => PO_STATUS.SUBMITTED}
          isLoading={isLoading}
          onItemClick={(p) => navigate(`/purchase-orders/${p.id}`)}
          renderCard={(p) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-on-surface">{p.po_number}</span>
                <POStatusBadge status={p.status} />
              </div>
              <div className="truncate text-body-sm text-on-surface-variant">
                {p.supplier_name || p.supplier_id}
              </div>
              <div className="font-mono text-body-sm text-on-surface">
                {formatCurrency(p.total_amount || 0, p.currency || 'INR')}
              </div>
            </div>
          )}
        />
      )}

      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={() => bulkApprove.mutate(Array.from(selected))}
        title={`Approve ${selected.size} POs?`}
        description={`Each PO is approved independently. Total value: ${formatCurrency(selectedTotal, 'INR')}.`}
        confirmLabel={`Approve ${selected.size}`}
        loading={bulkApprove.isPending}
      />

      <ReasonDialog
        open={Boolean(rejectFor)}
        onClose={() => setRejectFor(null)}
        onConfirm={(reason) =>
          rejectFor && rejectMutation.mutate({ id: rejectFor.id, reason })
        }
        title={`Reject ${rejectFor?.po_number || 'PO'}`}
        description="The buyer will see this reason and may revise and resubmit."
        chips={REASONS.PO_REJECT}
        confirmLabel="Reject"
        variant="danger"
        loading={rejectMutation.isPending}
      />
    </div>
  );
}
