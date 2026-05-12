import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, BarChart3 } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
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
import { useSuppliers } from './useSuppliers';
import { useSupplierColumns } from './components/useSupplierColumns';
import { SupplierCard } from './components/SupplierCard';
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABELS,
  COUNTRY_OPTIONS,
} from '@/constants/supplierCatalog';
import {
  SUPPLIER_STATUS,
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_STATUS_ORDER,
  SUPPLIER_STATUS_BADGE,
} from '@/constants/supplierStatus';
import { useAuthStore } from '@/stores/authStore';
import { can } from '@/lib/permissions';

const SCREEN_KEY = 'suppliers.directory';
const KANBAN_COLUMNS = SUPPLIER_STATUS_ORDER.map((s) => ({
  key: s,
  label: SUPPLIER_STATUS_LABELS[s],
  badgeClass: SUPPLIER_STATUS_BADGE[s],
}));

export function SupplierDirectoryPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useViewMode(SCREEN_KEY, 'grid');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const params = useMemo(
    () => ({
      q: q || undefined,
      status: status || undefined,
      category: category || undefined,
      country: country || undefined,
      // Kanban needs all statuses; bump the page size up so each column is meaningful.
      page,
      page_size: view === 'kanban' ? 100 : pageSize,
      sort: '-created_at',
    }),
    [q, status, category, country, page, pageSize, view]
  );

  const { data, isLoading, isError, refetch } = useSuppliers(params);
  const items = data?.items || [];
  const total = data?.total || 0;
  const columns = useSupplierColumns();

  const appliedFilters = [
    status && {
      key: 'status',
      label: `Status: ${SUPPLIER_STATUS_LABELS[status] || status}`,
      onRemove: () => setStatus(''),
    },
    category && {
      key: 'category',
      label: `Category: ${SUPPLIER_CATEGORY_LABELS[category] || category}`,
      onRemove: () => setCategory(''),
    },
    country && { key: 'country', label: `Country: ${country}`, onRemove: () => setCountry('') },
    q && { key: 'q', label: `Search: "${q}"`, onRemove: () => setQ('') },
  ].filter(Boolean);

  const onItemClick = (s) => navigate(`/suppliers/${s.id}`);

  return (
    <div>
      <div className="mb-widget-gap flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-body-base text-on-surface-variant">
            Browse the supplier master. Filter to find who you can raise POs against today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/suppliers/aggregations">
            <Button variant="secondary" leftIcon={<BarChart3 className="h-4 w-4" />}>
              Aggregations
            </Button>
          </Link>
          {can.createSupplier(user) ? (
            <Link to="/suppliers/new">
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                New supplier
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <KpiStrip
        items={[
          { label: 'Total suppliers', value: total ? String(total) : '—', note: 'Matches your filters' },
          { label: 'Active', value: items.filter((s) => s.status === 'ACTIVE').length, note: 'Eligible for new POs' },
          { label: 'Pending', value: items.filter((s) => s.status === 'PENDING_APPROVAL').length, note: 'Awaiting admin review' },
          { label: 'Blacklisted', value: items.filter((s) => s.status === 'BLACKLISTED').length, note: 'Disqualified suppliers' },
        ]}
      />

      {/* Filter controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            placeholder="Search by name, code or category"
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
          {SUPPLIER_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {SUPPLIER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="min-w-[10rem]"
        >
          <option value="">All categories</option>
          {SUPPLIER_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPage(1);
          }}
          className="min-w-[10rem]"
        >
          <option value="">All countries</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <div className="ml-auto">
          <ViewSwitcher value={view} onChange={setView} />
        </div>
      </div>

      <FilterBar
        filters={appliedFilters}
        extras={
          <span className="text-body-sm text-on-surface-variant">
            {total ? `${total} supplier${total === 1 ? '' : 's'}` : ''}
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
                title="No suppliers match"
                description="Try clearing some filters or onboard a new supplier to get started."
                action={
                  can.createSupplier(user) ? (
                    <Link to="/suppliers/new">
                      <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                        New supplier
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
            renderCard={(s) => <SupplierCard supplier={s} />}
            emptyState={
              <EmptyState
                title="No suppliers match"
                description="Try clearing some filters or onboard a new supplier."
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
      ) : (
        <KanbanBoard
          items={items}
          columns={KANBAN_COLUMNS}
          groupBy={(s) => s.status}
          isLoading={isLoading}
          onItemClick={onItemClick}
          renderCard={(s) => (
            <div className="flex flex-col gap-1">
              <div className="truncate font-medium text-on-surface">
                {s.display_name || s.legal_name}
              </div>
              <div className="truncate font-mono text-body-sm text-on-surface-variant">
                {s.supplier_code}
              </div>
              <div className="mt-1 text-body-sm text-on-surface-variant">
                {SUPPLIER_CATEGORY_LABELS[s.category] || s.category} · {s.country}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
