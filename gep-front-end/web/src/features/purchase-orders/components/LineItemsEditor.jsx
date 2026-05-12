import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import { computeTotals } from '@/lib/schemas/poSchema';
import { formatCurrency } from '@/lib/format';

const UOM_OPTIONS = ['EA', 'KG', 'L', 'M', 'HR', 'BOX', 'PCS', 'SET'];

function LineItemTotalCell({ index }) {
  const row = useWatch({ name: `line_items.${index}` });
  const qty = Number(row?.quantity) || 0;
  const price = Number(row?.unit_price) || 0;
  const rate = Number(row?.tax_rate) || 0;
  const line = qty * price;
  const total = line + line * (rate / 100);
  return <span className="font-mono">{total.toFixed(2)}</span>;
}

export function LineItemsEditor({ currency = 'INR' }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' });
  const items = useWatch({ control, name: 'line_items' }) || [];
  const totals = computeTotals(items);
  const lineItemsErr = errors.line_items;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-title-sm text-on-surface">Line items</h4>
          <p className="text-body-sm text-on-surface-variant">
            Quantity × unit price, taxed at the line rate.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() =>
            append({
              line_number: fields.length + 1,
              item_description: '',
              sku: '',
              quantity: 1,
              unit_of_measure: 'EA',
              unit_price: 0,
              tax_rate: 18,
              notes: '',
            })
          }
        >
          Add line item
        </Button>
      </div>

      {typeof lineItemsErr?.message === 'string' ? (
        <p className="mb-2 text-body-sm text-error">{lineItemsErr.message}</p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-outline-variant">
        <table className="w-full min-w-[920px] text-body-base">
          <thead className="bg-surface-container-low">
            <tr className="text-left text-label-caps uppercase text-on-surface-variant">
              <th className="px-2 py-2 w-10">#</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2 w-28">SKU</th>
              <th className="px-2 py-2 w-24 text-right">Qty</th>
              <th className="px-2 py-2 w-24">UoM</th>
              <th className="px-2 py-2 w-32 text-right">Unit price</th>
              <th className="px-2 py-2 w-24 text-right">Tax %</th>
              <th className="px-2 py-2 w-32 text-right">Line total</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => {
              const rowErr = (errors.line_items && errors.line_items[i]) || {};
              return (
                <tr key={f.id} className="border-t border-outline-variant/40">
                  <td className="px-2 py-2 align-top font-mono text-on-surface-variant">{i + 1}</td>
                  <td className="px-2 py-2 align-top">
                    <Input
                      placeholder="Standard widget"
                      invalid={Boolean(rowErr.item_description)}
                      {...register(`line_items.${i}.item_description`)}
                    />
                    {rowErr.item_description ? (
                      <p className="mt-1 text-body-sm text-error">
                        {rowErr.item_description.message}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Input placeholder="WID-001" {...register(`line_items.${i}.sku`)} />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      className="text-right"
                      invalid={Boolean(rowErr.quantity)}
                      {...register(`line_items.${i}.quantity`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <select
                      className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-low px-2 text-body-base text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                      {...register(`line_items.${i}.unit_of_measure`)}
                    >
                      {UOM_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right"
                      invalid={Boolean(rowErr.unit_price)}
                      {...register(`line_items.${i}.unit_price`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="text-right"
                      {...register(`line_items.${i}.tax_rate`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-2 py-2 text-right align-middle text-on-surface">
                    <LineItemTotalCell index={i} />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <button
                      type="button"
                      aria-label="Remove line"
                      onClick={() => remove(i)}
                      disabled={fields.length === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-error disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-outline-variant bg-surface-container-low">
              <td colSpan={6} className="px-2 py-2 text-right text-label-caps uppercase text-on-surface-variant">
                Subtotal
              </td>
              <td />
              <td className="px-2 py-2 text-right font-mono text-on-surface">
                {formatCurrency(totals.subtotal, currency)}
              </td>
              <td />
            </tr>
            <tr className="bg-surface-container-low">
              <td colSpan={6} className="px-2 py-2 text-right text-label-caps uppercase text-on-surface-variant">
                Tax total
              </td>
              <td />
              <td className="px-2 py-2 text-right font-mono text-on-surface">
                {formatCurrency(totals.tax_total, currency)}
              </td>
              <td />
            </tr>
            <tr className="bg-surface-container-low">
              <td colSpan={6} className="px-2 py-2 text-right text-title-sm text-on-surface">
                Grand total
              </td>
              <td />
              <td className="px-2 py-2 text-right font-mono text-title-sm text-primary">
                {formatCurrency(totals.total_amount, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
