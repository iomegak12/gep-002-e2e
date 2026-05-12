import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Field } from '@/components/primitives/Field';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import {
  SUPPLIER_CATEGORIES,
  PAYMENT_TERMS,
  CURRENCY_OPTIONS,
  REGION_OPTIONS,
  COUNTRY_OPTIONS,
} from '@/constants/supplierCatalog';

/* ---------- Step 1: Identity ---------- */

export function IdentityStep({ readOnlyCode = false }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Supplier code"
          required
          error={errors.supplier_code?.message}
          help={readOnlyCode ? 'Cannot be changed after creation.' : 'Unique. Cannot be changed after creation.'}
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              invalid={invalid}
              readOnly={readOnlyCode}
              placeholder="SUP-IN-00456"
              {...register('supplier_code')}
            />
          )}
        </Field>
        <Field label="Tax ID" error={errors.tax_id?.message}>
          {({ id, invalid }) => (
            <Input id={id} invalid={invalid} placeholder="33ABCDE5678G1Z3" {...register('tax_id')} />
          )}
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Legal name" required error={errors.legal_name?.message}>
          {({ id, invalid }) => (
            <Input id={id} invalid={invalid} placeholder="Sundaram Logistics Pvt Ltd" {...register('legal_name')} />
          )}
        </Field>
        <Field label="Display name" required error={errors.display_name?.message}>
          {({ id, invalid }) => (
            <Input id={id} invalid={invalid} placeholder="Sundaram Logistics" {...register('display_name')} />
          )}
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Category" required error={errors.category?.message}>
          {({ id, invalid }) => (
            <Select id={id} invalid={invalid} {...register('category')}>
              {SUPPLIER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Sub-category" error={errors.sub_category?.message}>
          {({ id, invalid }) => (
            <Input id={id} invalid={invalid} placeholder="Road freight" {...register('sub_category')} />
          )}
        </Field>
        <Field label="Region" error={errors.region?.message}>
          {({ id, invalid }) => (
            <Select id={id} invalid={invalid} {...register('region')}>
              <option value="">—</option>
              {REGION_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </div>
  );
}

/* ---------- Step 2: Contact & address ---------- */

export function ContactAndAddressStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const contactErr = errors.contact || {};
  const addrErr = errors.address || {};
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h4 className="mb-3 text-title-sm text-on-surface">Primary contact</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Name" required error={contactErr.primary_name?.message}>
            {({ id, invalid }) => (
              <Input id={id} invalid={invalid} placeholder="Meera Iyer" {...register('contact.primary_name')} />
            )}
          </Field>
          <Field label="Email" required error={contactErr.email?.message}>
            {({ id, invalid }) => (
              <Input id={id} type="email" invalid={invalid} placeholder="meera@example.com" {...register('contact.email')} />
            )}
          </Field>
          <Field label="Phone" required error={contactErr.phone?.message}>
            {({ id, invalid }) => (
              <Input id={id} invalid={invalid} placeholder="+91-9123456789" {...register('contact.phone')} />
            )}
          </Field>
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-title-sm text-on-surface">Registered address</h4>
        <Field label="Street" required error={addrErr.street?.message}>
          {({ id, invalid }) => (
            <Input id={id} invalid={invalid} placeholder="12 Anna Salai" {...register('address.street')} />
          )}
        </Field>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="City" required error={addrErr.city?.message}>
            {({ id, invalid }) => (
              <Input id={id} invalid={invalid} placeholder="Madurai" {...register('address.city')} />
            )}
          </Field>
          <Field label="State" required error={addrErr.state?.message}>
            {({ id, invalid }) => (
              <Input id={id} invalid={invalid} placeholder="Tamil Nadu" {...register('address.state')} />
            )}
          </Field>
          <Field label="Country" required error={addrErr.country?.message}>
            {({ id, invalid }) => (
              <Select id={id} invalid={invalid} {...register('address.country')}>
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
              <Input id={id} invalid={invalid} placeholder="625001" {...register('address.postal_code')} />
            )}
          </Field>
        </div>
      </section>
    </div>
  );
}

/* ---------- Step 3: Commercial terms ---------- */

export function CommercialStep() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const tags = watch('tags') || [];

  function addTag(value) {
    const v = value.trim();
    if (!v || tags.includes(v)) return;
    setValue('tags', [...tags, v], { shouldDirty: true });
  }
  function removeTag(v) {
    setValue(
      'tags',
      tags.filter((t) => t !== v),
      { shouldDirty: true }
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>
      <Field label="Country (registered)" required error={errors.country?.message} help="Country of registration. Often matches the address country.">
        {({ id, invalid }) => (
          <Select id={id} invalid={invalid} {...register('country')}>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Tags" help="Press Enter to add. Used to filter the supplier directory.">
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Chip key={t} onRemove={() => removeTag(t)}>
              {t}
            </Chip>
          ))}
          <input
            placeholder="e.g. preferred, msme"
            className="min-w-[10rem] flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-body-base text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </Field>
    </div>
  );
}

/* ---------- Step 4: Certifications + review ---------- */

export function CertificationsAndReviewStep() {
  const { control, register, getValues } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'certifications' });
  const values = getValues();

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-title-sm text-on-surface">Certifications</h4>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => append({ name: '', issued_by: '', valid_until: '' })}
          >
            Add certification
          </Button>
        </div>
        {fields.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">No certifications yet — optional.</p>
        ) : (
          <table className="w-full text-body-base">
            <thead>
              <tr className="border-b border-outline-variant text-left text-label-caps uppercase text-on-surface-variant">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Issued by</th>
                <th className="py-2 pr-2">Valid until</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={f.id} className="border-b border-outline-variant/40">
                  <td className="py-2 pr-2">
                    <Input placeholder="ISO 9001" {...register(`certifications.${i}.name`)} />
                  </td>
                  <td className="py-2 pr-2">
                    <Input placeholder="BSI" {...register(`certifications.${i}.issued_by`)} />
                  </td>
                  <td className="py-2 pr-2">
                    <Input placeholder="2027-03-31" {...register(`certifications.${i}.valid_until`)} />
                  </td>
                  <td className="py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => remove(i)} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h4 className="mb-3 text-title-sm text-on-surface">Review</h4>
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:grid-cols-2">
          <ReviewItem label="Supplier code" value={values.supplier_code} mono />
          <ReviewItem label="Legal name" value={values.legal_name} />
          <ReviewItem label="Display name" value={values.display_name} />
          <ReviewItem label="Category" value={values.category} />
          <ReviewItem label="Country" value={values.country} />
          <ReviewItem label="Payment terms" value={values.payment_terms} />
          <ReviewItem label="Currency" value={values.currency} />
          <ReviewItem
            label="Tags"
            value={(values.tags || []).join(', ') || '—'}
          />
        </div>
      </section>
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
