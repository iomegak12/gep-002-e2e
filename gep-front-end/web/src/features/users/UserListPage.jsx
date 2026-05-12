import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus, Search, KeyRound, Pencil } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Pill } from '@/components/primitives/Pill';
import { Pagination } from '@/components/data/Pagination';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { GridView } from '@/components/views/GridView';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { useUsers } from './useUsers';
import { ResetPasswordModal } from '@/features/auth/ResetPasswordModal';
import { ALL_ROLES, ROLE_LABELS } from '@/constants/roles';
import { formatCurrency, formatDate } from '@/lib/format';

const ch = createColumnHelper();

export function UserListPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [resetting, setResetting] = useState(null);

  const params = useMemo(
    () => ({
      q: q || undefined,
      role: role || undefined,
      page,
      page_size: pageSize,
    }),
    [q, role, page, pageSize]
  );
  const { data, isLoading, isError, refetch } = useUsers(params);
  const items = data?.items || [];
  const total = data?.total || 0;

  const columns = [
    ch.accessor('full_name', {
      header: 'Name',
      cell: (info) => (
        <div className="min-w-[10rem]">
          <div className="font-medium text-on-surface">{info.getValue() || '—'}</div>
          <div className="text-body-sm text-on-surface-variant">{info.row.original.email}</div>
        </div>
      ),
    }),
    ch.accessor('roles', {
      header: 'Roles',
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {(info.getValue() || []).map((r) => (
            <Pill key={r}>{ROLE_LABELS[r] || r}</Pill>
          ))}
        </div>
      ),
    }),
    ch.accessor('approval_limit', {
      header: 'Approval limit',
      cell: (info) => {
        const v = info.getValue();
        return v != null ? formatCurrency(v, 'INR') : '—';
      },
      meta: { mono: true, align: 'right' },
    }),
    ch.accessor('is_active', {
      header: 'Status',
      cell: (info) =>
        info.getValue() ? (
          <Pill className="bg-success-container text-on-success-container">Active</Pill>
        ) : (
          <Pill className="bg-error-container text-on-error-container">Inactive</Pill>
        ),
    }),
    ch.accessor('created_at', {
      header: 'Created',
      cell: (info) => (info.getValue() ? formatDate(info.getValue()) : '—'),
      meta: { mono: true },
    }),
    {
      id: 'actions',
      header: '',
      cell: (info) => {
        const u = info.row.original;
        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<KeyRound className="h-3.5 w-3.5" />}
              onClick={() => setResetting(u)}
            >
              Reset password
            </Button>
            <Link to={`/users/${u.id}/edit`}>
              <Button size="sm" variant="secondary" leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                Edit
              </Button>
            </Link>
          </div>
        );
      },
      meta: { align: 'right' },
    },
  ];

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="mb-widget-gap flex flex-wrap items-end justify-between gap-3">
        <p className="text-body-base text-on-surface-variant">
          Manage user accounts, roles, and approval limits.
        </p>
        <Link to="/users/new">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            New user
          </Button>
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            placeholder="Search by name or email"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="min-w-[10rem]"
        >
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-title-sm text-on-surface">Users</h3>
          <span className="text-label-caps uppercase text-on-surface-variant">
            {total} total
          </span>
        </CardHeader>
        <CardBody className="p-0">
          <GridView
            columns={columns}
            data={items}
            isLoading={isLoading}
            onRowClick={(u) => navigate(`/users/${u.id}/edit`)}
            emptyState={
              <EmptyState
                title="No users match"
                description="Try clearing filters or invite a new teammate."
                action={
                  <Link to="/users/new">
                    <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                      New user
                    </Button>
                  </Link>
                }
              />
            }
          />
        </CardBody>
        <div>
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
      </Card>

      <ResetPasswordModal
        open={Boolean(resetting)}
        user={resetting}
        onClose={() => setResetting(null)}
      />
    </div>
  );
}
