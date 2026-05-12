import { z } from 'zod';
import { PAYMENT_TERMS } from '@/constants/supplierCatalog';

const paymentTerms = PAYMENT_TERMS.map((p) => p.value);

const emptyToUndef = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const toNumber = (v) =>
  v === '' || v === null || v === undefined ? undefined : typeof v === 'string' ? Number(v) : v;

export const lineItemSchema = z.object({
  line_number: z.coerce.number().int().min(1),
  item_description: z.string().trim().min(1, 'Required').max(200),
  sku: z.preprocess(emptyToUndef, z.string().max(60).optional()),
  quantity: z.preprocess(toNumber, z.number().positive('Must be > 0')),
  unit_of_measure: z.string().trim().min(1, 'Required').max(20),
  unit_price: z.preprocess(toNumber, z.number().nonnegative('Must be ≥ 0')),
  tax_rate: z.preprocess(toNumber, z.number().min(0).max(100).default(0)),
  notes: z.preprocess(emptyToUndef, z.string().max(500).optional()),
});

export const poAddressSchema = z.object({
  street: z.string().trim().min(1, 'Required'),
  city: z.string().trim().min(1, 'Required'),
  state: z.string().trim().min(1, 'Required'),
  country: z.string().trim().min(2, 'Required'),
  postal_code: z.string().trim().min(1, 'Required'),
});

export const createPoSchema = z.object({
  supplier_id: z.string().uuid('Pick a supplier'),
  currency: z.string().trim().length(3, 'Three-letter currency code'),
  payment_terms: z.enum(paymentTerms),
  expected_delivery_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  delivery_address: poAddressSchema,
  notes: z.preprocess(emptyToUndef, z.string().max(1000).optional()),
  line_items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
});

export const updatePoSchema = z.object({
  payment_terms: z.enum(paymentTerms).optional(),
  expected_delivery_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .optional(),
  delivery_address: poAddressSchema.partial().optional(),
  notes: z.preprocess(emptyToUndef, z.string().max(1000).optional()),
});

/** Compute totals client-side so the wizard can show a live grand total. */
export function computeTotals(lineItems = []) {
  let subtotal = 0;
  let tax = 0;
  for (const li of lineItems) {
    const qty = Number(li.quantity) || 0;
    const price = Number(li.unit_price) || 0;
    const rate = Number(li.tax_rate) || 0;
    const line = qty * price;
    subtotal += line;
    tax += line * (rate / 100);
  }
  return {
    subtotal: round(subtotal),
    tax_total: round(tax),
    total_amount: round(subtotal + tax),
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export const poDefaults = {
  supplier_id: '',
  currency: 'INR',
  payment_terms: 'NET_30',
  expected_delivery_date: '',
  delivery_address: { street: '', city: '', state: '', country: 'IN', postal_code: '' },
  notes: '',
  line_items: [
    {
      line_number: 1,
      item_description: '',
      sku: '',
      quantity: 1,
      unit_of_measure: 'EA',
      unit_price: 0,
      tax_rate: 18,
      notes: '',
    },
  ],
};
