import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Wizard } from '@/components/forms/Wizard';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { poApi } from '@/api/poApi';
import { createPoSchema, poDefaults } from '@/lib/schemas/poSchema';
import { ERR, isErrorCode, getErrorMessage } from '@/lib/apiError';
import {
  SupplierStep,
  LineItemsStep,
  DeliveryStep,
  ReviewStep,
} from './components/PoFormSteps';

const STEPS = [
  {
    id: 'supplier',
    label: 'Supplier',
    fields: ['supplier_id'],
    render: () => <SupplierStep />,
  },
  {
    id: 'line-items',
    label: 'Line items',
    fields: ['line_items'],
    render: () => <LineItemsStep />,
  },
  {
    id: 'delivery',
    label: 'Delivery & terms',
    fields: [
      'currency',
      'payment_terms',
      'expected_delivery_date',
      'delivery_address.street',
      'delivery_address.city',
      'delivery_address.state',
      'delivery_address.country',
      'delivery_address.postal_code',
      'notes',
    ],
    render: () => <DeliveryStep />,
  },
  {
    id: 'review',
    label: 'Review & submit',
    fields: [],
    render: () => <ReviewStep />,
  },
];

export function CreatePoWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (payload) => poApi.create(payload),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['pos', 'list'] });
      toast.success(`Draft ${created.po_number || 'PO'} created`);
      navigate(`/purchase-orders/${created.id}`);
    },
    onError: (err) => {
      // Contract: tests/api/src/tests/po/create.spec.js
      if (isErrorCode(err, ERR.VALIDATION_FAILED)) {
        toast.error(getErrorMessage(err, 'Some PO fields are invalid. Please review.'));
      } else if (isErrorCode(err, ERR.INSUFFICIENT_ROLE)) {
        toast.error('Only buyers can create purchase orders.');
      } else {
        toast.error(getErrorMessage(err, 'Could not create PO. Please try again.'));
      }
    },
  });

  return (
    <Wizard
      steps={STEPS}
      schema={createPoSchema}
      defaultValues={poDefaults}
      submitLabel="Save as draft"
      onSubmit={(values) => create.mutateAsync(values)}
      aside={
        <>
          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">How submission works</h3>
            </CardHeader>
            <CardBody>
              <ol className="list-decimal space-y-2 pl-5 text-body-sm text-on-surface-variant">
                <li>Save your PO as a Draft from this wizard.</li>
                <li>
                  From the PO detail page, click <b>Submit</b> to route it for approval.
                </li>
                <li>
                  An approver decides — if rejected, you can <b>Revise</b> and submit again.
                </li>
              </ol>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Tips</h3>
            </CardHeader>
            <CardBody>
              <ul className="list-disc space-y-1 pl-5 text-body-sm text-on-surface-variant">
                <li>Only ACTIVE suppliers can receive POs.</li>
                <li>Totals update live as you edit line items.</li>
                <li>You can edit a Draft at any time before submission.</li>
              </ul>
            </CardBody>
          </Card>
        </>
      }
    />
  );
}
