import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Wizard } from '@/components/forms/Wizard';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Pill } from '@/components/primitives/Pill';
import { supplierApi } from '@/api/supplierApi';
import { supplierCreateSchema, supplierDefaults } from '@/lib/schemas/supplierSchema';
import { ERR, isErrorCode, getErrorMessage } from '@/lib/apiError';
import {
  IdentityStep,
  ContactAndAddressStep,
  CommercialStep,
  CertificationsAndReviewStep,
} from './components/SupplierForm';

const STEPS = [
  {
    id: 'identity',
    label: 'Identity',
    fields: [
      'supplier_code',
      'legal_name',
      'display_name',
      'category',
      'sub_category',
      'region',
      'tax_id',
    ],
    render: () => <IdentityStep />,
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
    label: 'Compliance & review',
    fields: ['certifications'],
    render: () => <CertificationsAndReviewStep />,
  },
];

export function CreateSupplierWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (payload) => supplierApi.create(payload),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      toast.success('Supplier submitted for approval');
      navigate(`/suppliers/${created.id}`);
    },
    onError: (err) => {
      // Contract: gep-back-end/tests/src/tests/supplier/crud.spec.js
      if (isErrorCode(err, ERR.DUPLICATE_RESOURCE)) {
        toast.error('That supplier code is already in use. Pick a different one.');
      } else if (isErrorCode(err, ERR.VALIDATION_FAILED)) {
        toast.error(getErrorMessage(err, 'Some fields are invalid. Please review and retry.'));
      } else {
        toast.error(getErrorMessage(err, 'Could not create supplier. Please try again.'));
      }
    },
  });

  return (
    <Wizard
      steps={STEPS}
      schema={supplierCreateSchema}
      defaultValues={supplierDefaults}
      submitLabel="Submit for approval"
      onSubmit={(values) => create.mutateAsync(values)}
      aside={
        <>
          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Lifecycle</h3>
            </CardHeader>
            <CardBody className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-label-caps uppercase text-on-surface-variant">Status</span>
                <Pill className="bg-tertiary-container text-on-tertiary-container">
                  Will be created as Pending
                </Pill>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                An administrator must approve this record before it becomes Active and eligible for
                purchase orders.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-title-sm text-on-surface">Validation</h3>
            </CardHeader>
            <CardBody>
              <ul className="list-disc space-y-1 pl-5 text-body-sm text-on-surface-variant">
                <li>Supplier code must be unique platform-wide.</li>
                <li>Tax ID format depends on country.</li>
                <li>Email and phone validated for format only.</li>
                <li>Certifications are optional.</li>
              </ul>
            </CardBody>
          </Card>
        </>
      }
    />
  );
}
