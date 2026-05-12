import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { poApi } from '@/api/poApi';
import { qk } from '@/api/queryKeys';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ErrorState } from '@/components/data/ErrorState';
import { updatePoSchema } from '@/lib/schemas/poSchema';
import { DeliveryStep } from './components/PoFormSteps';
import { PO_STATUS, PO_STATUS_LABELS } from '@/constants/poStatus';
import { POStatusBadge } from './components/POStatusBadge';
import { ERR, isErrorCode, getErrorMessage } from '@/lib/apiError';

export function EditPoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detail = useQuery({
    queryKey: qk.pos.detail(id),
    queryFn: () => poApi.get(id),
    enabled: Boolean(id),
  });

  const form = useForm({
    resolver: zodResolver(updatePoSchema),
    defaultValues: {
      payment_terms: 'NET_30',
      expected_delivery_date: '',
      delivery_address: { street: '', city: '', state: '', country: 'IN', postal_code: '' },
      notes: '',
      currency: 'INR',
    },
  });

  // Hydrate form when the PO loads.
  useEffect(() => {
    if (!detail.data) return;
    form.reset({
      payment_terms: detail.data.payment_terms || 'NET_30',
      expected_delivery_date: detail.data.expected_delivery_date || '',
      delivery_address: detail.data.delivery_address || {
        street: '',
        city: '',
        state: '',
        country: 'IN',
        postal_code: '',
      },
      notes: detail.data.notes || '',
      currency: detail.data.currency || 'INR',
    });
  }, [detail.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useMutation({
    mutationFn: (payload) => poApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pos.detail(id) });
      qc.invalidateQueries({ queryKey: ['pos', 'list'] });
      toast.success('PO updated');
      navigate(`/purchase-orders/${id}`);
    },
    onError: (err) => {
      // Contract: gep-back-end/tests/src/tests/po/line-items.spec.js (INVALID_STATE_FOR_EDIT)
      if (isErrorCode(err, ERR.INVALID_STATE_FOR_EDIT)) {
        toast.error('This PO is no longer in Draft and cannot be edited.');
      } else if (isErrorCode(err, ERR.VALIDATION_FAILED)) {
        toast.error(getErrorMessage(err, 'Some fields are invalid. Please review.'));
      } else {
        toast.error(getErrorMessage(err, 'Could not update PO. Please try again.'));
      }
    },
  });

  if (detail.isError) return <ErrorState onRetry={detail.refetch} />;
  if (detail.isLoading || !detail.data) return <Skeleton className="h-96 w-full" />;

  const po = detail.data;
  const editable = po.status === PO_STATUS.DRAFT;

  if (!editable) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-title-sm text-on-surface">PO is not editable</h3>
          <POStatusBadge status={po.status} />
        </CardHeader>
        <CardBody>
          <div className="flex items-start gap-3 rounded-lg border border-tertiary-container bg-tertiary-container/30 p-3 text-on-tertiary-container">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div className="text-body-base">
              Only <strong>Draft</strong> POs can be edited. This PO is{' '}
              <strong>{PO_STATUS_LABELS[po.status]}</strong>. Use the status actions on the detail
              page (Revise, Cancel) if you need to make changes.
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={() => navigate(`/purchase-orders/${id}`)}>
              Back to PO
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  function onSubmit(values) {
    // Strip currency since UpdatePO doesn't accept it on the server.
    const { currency, ...payload } = values;
    update.mutate(payload);
  }

  return (
    <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-3">
      <div className="flex flex-col gap-widget-gap lg:col-span-2">
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">
              Edit {po.po_number || 'draft PO'}
            </h3>
            <POStatusBadge status={po.status} />
          </CardHeader>
          <CardBody>
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-6"
              >
                <DeliveryStep />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => navigate(`/purchase-orders/${id}`)}
                    disabled={update.isPending}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={update.isPending}>
                    {update.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col gap-widget-gap">
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">Editing a draft</h3>
          </CardHeader>
          <CardBody>
            <p className="text-body-sm text-on-surface-variant">
              On a draft you can update payment terms, expected delivery, address and notes. To
              change the supplier or line items, delete this draft and create a new PO.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
