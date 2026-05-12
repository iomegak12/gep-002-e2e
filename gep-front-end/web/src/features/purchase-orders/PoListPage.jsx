import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Tabs } from '@/components/primitives/Tabs';
import { Pagination } from '@/components/data/Pagination';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { FilterBar } from '@/components/data/FilterBar';
import { KpiStrip } from '@/components/data/KpiStrip';
import { GridView } from '@/components/views/GridView';
import { CardView } from '@/components/views/CardView';
import { KanbanBoard } from '@/components/views/KanbanBoard';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { useViewMode } from '@/hooks/useViewMode';
import { usePOs } from './usePOs';
import { usePOColumns } from './components/usePOColumns';
import { POCard } from './components/POCard';
import {
  PO_STATUS,
  PO_STATUS_BADGE,
  PO_STATUS_LABELS,
  PO_STATUS_ORDER,
} from '@/constants/poStatus';
import { useAuthStore } from '@/stores/authStore';
import { can } from '@/lib/permissions';
import { ROLES } from '@/constants/roles';

const SCREEN_KEY = 'pos.list';
const KANBAN_COLUMNS = [
  ...PO_STATUS_ORDER,
  PO_STATUS.REJECTED,
  PO_STATUS.CANCELLED,
].map((s) => ({
  key: s,
  label: PO_STATUS_LABELS[s],
  badgeClass: PO_STATUS_BADGE[s],
}));

const SCOPE_TABS = [
  { value: 'mine', label: 'My POs' },
  { value: 'all', label: 'All POs' },
];

export function PoListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useViewMode(SCREEN_KEY, 'grid');
  // Buyers default to their own POs; approvers/admins oversee everyone's by default.
  const defaultScope = user?.roles?.includes(ROLES.BUYER) ? 'mine' : 'all';
  const [scope, setScope] = useState(defaultScope);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const params = useMemo(
    () => ({
      q: q || undefined,
      status: status || undefined,
      buyer_id: scope === 'mine' ? user?.id : undefined,
      min_amount: minAmount || undefined,
      max_amount: maxAmount || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      page,
      page_size: view === 'kanban' ? 100 : pageSize,
      sort: '-created_at',
    }),
    [q, status, scope, user?.id, minAmount, maxAmount, fromDate, toDate, page, pageSize, view]
  );

  const { data, isLoading, isError, refetch } = usePOs(params);
  const items = data?.items || [];
  const total = data?.total || 0;
  const columns = usePOColumns({ showBuyer: scope === 'all' });

  const appliedFilters = [
    status && {
      key: 'status',
      label: `Status: ${PO_STATUS_LABELS[status] || status}`,
      onRemove: () => setStatus(''),
    },
    minAmount && { key: 'min', label: `Min: ${minAmount}`, onRemove: () => setMinAmount('') },
    maxAmount && { key: 'max', label: `Max: ${maxAmount}`, onRemove: () => setMaxAmount('') },
    fromDate && { key: 'from', label: `From ${fromDate}`, onRemove: () => setFromDate('') },
    toDate && { key: 'to', label: `To ${toDate}`, onRemove: () => setToDate('') },
    q && { key: 'q', label: `Search: "${q}"`, onRemove: () => setQ('') },
  ].filter(Boolean);

  const counts = useMemo(() => {
    const by = {};
    for (const p of items) by[p.status] = (by[p.status] || 0) + 1;
    return by;
  }, [items]);

  const onItemClick = (p) => navigate(`/purchase-orders/${p.id}`);

  return (
    <div>
      <div className="mb-widget-gap flex flex-wrap items-end justify-between gap-3">
        <p className="text-body-base text-on-surface-variant">
          Manage purchase orders across their lifecycle, from draft to closed.
        </p>
        <div className="flex items-center gap-2">
          {can.createPO(user) ? (
            <Link to="/purchase-orders/new">
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                New PO
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <KpiStrip
        items={[
          { label: 'Total', value: total ? String(total) : '—', note: 'Matches your filters' },
          { label: 'Drafts', value: counts.DRAFT || 0, note: 'Not yet submitted' },
          {
            label: 'Awaiting approval',
            value: counts.SUBMITTED || 0,
            note: 'In approver queue',
          },
          {
            label: 'Awaiting fulfillment',
            value: counts.APPROVED || 0,
            note: 'Approved, not yet delivered',
          },
        ]}
      />

      {/* Scope tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs value={scope} onChange={(v) => { setScope(v); setPage(1); }} items={SCOPE_TABS} />
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            placeholder="Search by PO number or supplier"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="min-w-[10rem]"
        >
          <option value="">All statuses</option>
          {KANBAN_COLUMNS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          step="0.01"
          placeholder="Min total"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          className="w-28"
        />
        <Input
          type="number"
          step="0.01"
          placeholder="Max total"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          className="w-28"
        />
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-40"
          title="From created date"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-40"
          title="To created date"
        />
        <div className="ml-auto">
          <ViewSwitcher value={view} onChange={setView} />
        </div>
      </div>

      <FilterBar
        filters={appliedFilters}
        extras={
          <span className="text-body-sm text-on-surface-variant">
            {total ? `${total} PO${total === 1 ? '' : 's'}` : ''}
          </span>
        }
      />

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : view === 'grid' ? (
        <>
          <GridView
            columns={columns}
            data={items}
            isLoading={isLoading}
            onRowClick={onItemClick}
            emptyState={
              <EmptyState
                title="No POs to show"
                description={
                  scope === 'mine'
                    ? 'You have not raised any purchase orders matching these filters.'
                    : 'No purchase orders match these filters.'
                }
                action={
                  can.createPO(user) ? (
                    <Link to="/purchase-orders/new">
                      <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                        New PO
                      </Button>
                    </Link>
                  ) : null
                }
              />
            }
          />
          <div className="mt-3 rounded-2xl border border-outline-variant bg-surface">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          </div>
        </>
      ) : view === 'card' ? (
        <>
          <CardView
            items={items}
            isLoading={isLoading}
            onItemClick={onItemClick}
            renderCard={(p) => <POCard po={p} />}
            emptyState={<EmptyState title="No POs to show" />}
          />
          <div className="mt-3 rounded-2xl border border-outline-variant bg-surface">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          </div>
        </>
      ) : (
        <KanbanBoard
          items={items}
          columns={KANBAN_COLUMNS}
          groupBy={(p) => p.status}
          isLoading={isLoading}
          onItemClick={onItemClick}
          renderCard={(p) => (
            <div className="flex flex-col gap-1">
              <div className="font-mono font-medium text-on-surface">{p.po_number || '—'}</div>
              <div className="truncate text-body-sm text-on-surface-variant">
                {p.supplier_name || p.supplier?.display_name || p.supplier_id}
              </div>
              <div className="mt-1 font-mono text-body-sm text-on-surface">
                {p.total_amount != null
                  ? new Intl.NumberFormat(undefined, {
                      style: 'currency',
                      currency: p.currency || 'INR',
                    }).format(p.total_amount)
                  : '—'}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
