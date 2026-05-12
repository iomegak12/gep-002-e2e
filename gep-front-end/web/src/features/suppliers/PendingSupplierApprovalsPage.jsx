import { Link, useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useSuppliers } from './useSuppliers';
import { useSupplierColumns } from './components/useSupplierColumns';
import { SupplierStatusActions } from './components/SupplierStatusActions';
import { GridView } from '@/components/views/GridView';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';

export function PendingSupplierApprovalsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useSuppliers({
    status: 'PENDING_APPROVAL',
    page: 1,
    page_size: 100,
    sort: '-created_at',
  });
  const items = data?.items || [];

  const baseColumns = useSupplierColumns();
  const columns = [
    ...baseColumns,
    {
      id: 'actions',
      header: '',
      cell: (info) => (
        <div onClick={(e) => e.stopPropagation()}>
          <SupplierStatusActions supplier={info.row.original} compact />
        </div>
      ),
      meta: { align: 'right' },
    },
  ];

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="mb-widget-gap flex items-end justify-between gap-3">
        <p className="text-body-base text-on-surface-variant">
          Review new supplier submissions. Approve to make them eligible for POs, or blacklist to
          disqualify.
        </p>
        <Link to="/suppliers?status=PENDING_APPROVAL">
          <Button variant="ghost">View in directory</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-title-sm text-on-surface">Awaiting decision</h3>
          <span className="text-label-caps uppercase text-on-surface-variant">
            {items.length} pending
          </span>
        </CardHeader>
        <CardBody className="p-0">
          <GridView
            columns={columns}
            data={items}
            isLoading={isLoading}
            onRowClick={(s) => navigate(`/suppliers/${s.id}`)}
            emptyState={
              <EmptyState
                title="Nothing pending"
                description="All supplier submissions have been reviewed."
                icon={<ClipboardCheck className="h-5 w-5" />}
              />
            }
          />
        </CardBody>
      </Card>
    </div>
  );
}
