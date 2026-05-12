import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supplierApi } from '@/api/supplierApi';
import { qk } from '@/api/queryKeys';
import { Wizard } from '@/components/forms/Wizard';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ErrorState } from '@/components/data/ErrorState';
import { supplierCreateSchema, supplierDefaults } from '@/lib/schemas/supplierSchema';
import {
  IdentityStep,
  ContactAndAddressStep,
  CommercialStep,
  CertificationsAndReviewStep,
} from './components/SupplierForm';
import { SupplierStatusBadge } from './components/SupplierStatusBadge';

function makeSteps(readOnlyCode) {
  return [
    {
      id: 'identity',
      label: 'Identity',
      fields: ['legal_name', 'display_name', 'category', 'sub_category', 'region', 'tax_id'],
      render: () => <IdentityStep readOnlyCode={readOnlyCode} />,
    },
    {
      id: 'contact',
      label: 'Contact & address',
      fields: [
        'contact.primary_name',
        'contact.email',
        'contact.phone',
        'address.street',
        'address.city',
        'address.state',
        'address.country',
        'address.postal_code',
      ],
      render: () => <ContactAndAddressStep />,
    },
    {
      id: 'commercial',
      label: 'Commercial',
      fields: ['payment_terms', 'currency', 'country', 'tags'],
      render: () => <CommercialStep />,
    },
    {
      id: 'review',
      label: 'Review',
      fields: ['certifications'],
      render: () => <CertificationsAndReviewStep />,
    },
  ];
}

export function EditSupplierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detail = useQuery({
    queryKey: qk.suppliers.detail(id),
    queryFn: () => supplierApi.get(id),
    enabled: Boolean(id),
  });

  const update = useMutation({
    mutationFn: (payload) => {
      // strip supplier_code; the server treats it as immutable
      const { supplier_code, ...rest } = payload;
      return supplierApi.update(id, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.suppliers.detail(id) });
      qc.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      toast.success('Supplier updated');
      navigate(`/suppliers/${id}`);
    },
    onError: () => toast.error('Could not update supplier. Please try again.'),
  });

  const defaults = useMemo(() => {
    if (!detail.data) return supplierDefaults;
    return { ...supplierDefaults, ...detail.data };
  }, [detail.data]);

  const steps = useMemo(() => makeSteps(true), []);

  if (detail.isError) return <ErrorState onRetry={detail.refetch} />;
  if (detail.isLoading || !detail.data) return <Skeleton className="h-96 w-full" />;

  return (
    <Wizard
      key={detail.data?.id /* re-mount with fresh defaults */}
      steps={steps}
      schema={supplierCreateSchema}
      defaultValues={defaults}
      submitLabel="Save changes"
      onSubmit={(v) => update.mutateAsync(v)}
      aside={
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Status</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <SupplierStatusBadge status={detail.data.status} />
            <p className="text-body-sm text-on-surface-variant">
              Editing a supplier does not change its status. Use the actions on the detail page to
              approve, deactivate or blacklist.
            </p>
          </CardBody>
        </Card>
      }
    />
  );
}
