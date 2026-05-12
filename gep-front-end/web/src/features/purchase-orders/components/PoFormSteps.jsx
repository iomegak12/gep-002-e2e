import { useFormContext, useWatch } from 'react-hook-form';
import { Field } from '@/components/primitives/Field';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Textarea } from '@/components/primitives/Textarea';
import { SupplierTypeahead } from './SupplierTypeahead';
import { LineItemsEditor } from './LineItemsEditor';
import {
  PAYMENT_TERMS,
  CURRENCY_OPTIONS,
  COUNTRY_OPTIONS,
} from '@/constants/supplierCatalog';
import { computeTotals } from '@/lib/schemas/poSchema';
import { formatCurrency } from '@/lib/format';

/* Step 1 — Supplier */
export function SupplierStep() {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const value = watch('supplier_id');

  return (
    <Field label="Supplier" required error={errors.supplier_id?.message}>
      <SupplierTypeahead
        value={value}
        error={errors.supplier_id?.message}
        onChange={(id, supplier) => {
          setValue('supplier_id', id, { shouldDirty: true, shouldValidate: true });
          // Default the PO currency & payment terms to the supplier's, if present.
          if (supplier?.currency) {
            setValue('currency', supplier.currency, { shouldDirty: true });
          }
          if (supplier?.payment_terms) {
            setValue('payment_terms', supplier.payment_terms, { shouldDirty: true });
          }
        }}
      />
    </Field>
  );
}

/* Step 2 — Line items */
export function LineItemsStep() {
  const currency = useWatch({ name: 'currency' }) || 'INR';
  return <LineItemsEditor currency={currency} />;
}

/* Step 3 — Delivery & terms */
export function DeliveryStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const addrErr = errors.delivery_address || {};
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Currency" required error={errors.currency?.message}>
          {({ id, invalid }) => (
            <Select id={id} invalid={invalid} {...register('currency')}>
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Payment terms" required error={errors.payment_terms?.message}>
          {({ id, invalid }) => (
            <Select id={id} invalid={invalid} {...register('payment_terms')}>
              {PAYMENT_TERMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          label="Expected delivery date"
          required
          error={errors.expected_delivery_date?.message}
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              type="date"
              invalid={invalid}
              {...register('expected_delivery_date')}
            />
          )}
        </Field>
      </div>

      <section>
        <h4 className="mb-3 text-title-sm text-on-surface">Delivery address</h4>
        <Field label="Street" required error={addrErr.street?.message}>
          {({ id, invalid }) => (
            <Input
              id={id}
              invalid={invalid}
              placeholder="Warehouse 3, Hinjewadi Phase 2"
              {...register('delivery_address.street')}
            />
          )}
        </Field>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="City" required error={addrErr.city?.message}>
            {({ id, invalid }) => (
              <Input id={id} invalid={invalid} placeholder="Pune" {...register('delivery_address.city')} />
            )}
          </Field>
          <Field label="State" required error={addrErr.state?.message}>
            {({ id, invalid }) => (
              <Input id={id} invalid={invalid} placeholder="MH" {...register('delivery_address.state')} />
            )}
          </Field>
          <Field label="Country" required error={addrErr.country?.message}>
            {({ id, invalid }) => (
              <Select id={id} invalid={invalid} {...register('delivery_address.country')}>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Postal code" required error={addrErr.postal_code?.message}>
            {({ id, invalid }) => (
              <Input id={id} invalid={invalid} placeholder="411019" {...register('delivery_address.postal_code')} />
            )}
          </Field>
        </div>
      </section>

      <Field label="Notes" error={errors.notes?.message} help="Visible to the supplier on the PO PDF.">
        {({ id, invalid }) => (
          <Textarea
            id={id}
            invalid={invalid}
            placeholder="Reference SO-12345; deliver to Gate B."
            rows={3}
            {...register('notes')}
          />
        )}
      </Field>
    </div>
  );
}

/* Step 4 — Review */
export function ReviewStep() {
  const values = useWatch();
  const totals = computeTotals(values?.line_items || []);
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-title-sm text-on-surface">Review &amp; submit</h4>
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:grid-cols-2">
        <ReviewItem label="Supplier" value={values?.supplier_id} mono />
        <ReviewItem label="Currency" value={values?.currency} />
        <ReviewItem label="Payment terms" value={values?.payment_terms} />
        <ReviewItem label="Expected delivery" value={values?.expected_delivery_date} mono />
        <ReviewItem
          label="Delivery address"
          value={[
            values?.delivery_address?.street,
            values?.delivery_address?.city,
            values?.delivery_address?.state,
            values?.delivery_address?.postal_code,
            values?.delivery_address?.country,
          ]
            .filter(Boolean)
            .join(', ')}
        />
        <ReviewItem label="Line items" value={`${values?.line_items?.length || 0}`} />
      </div>
      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
        <div className="flex items-center justify-between text-body-base text-on-surface-variant">
          <span>Subtotal</span>
          <span className="font-mono">
            {formatCurrency(totals.subtotal, values?.currency || 'INR')}
          </span>
        </div>
        <div className="flex items-center justify-between text-body-base text-on-surface-variant">
          <span>Tax</span>
          <span className="font-mono">
            {formatCurrency(totals.tax_total, values?.currency || 'INR')}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-outline-variant pt-2 text-title-sm text-on-surface">
          <span>Total</span>
          <span className="font-mono text-primary">
            {formatCurrency(totals.total_amount, values?.currency || 'INR')}
          </span>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant">
        Submitting routes this PO to an approver. The PO total is checked against the approver's
        approval limit on their side.
      </p>
    </div>
  );
}

function ReviewItem({ label, value, mono }) {
  return (
    <div>
      <div className="text-label-caps uppercase text-on-surface-variant">{label}</div>
      <div className={mono ? 'mt-1 font-mono text-on-surface' : 'mt-1 text-on-surface'}>
        {value || '—'}
      </div>
    </div>
  );
}
