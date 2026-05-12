import { z } from 'zod';
import { SUPPLIER_CATEGORIES, PAYMENT_TERMS } from '@/constants/supplierCatalog';

const categories = SUPPLIER_CATEGORIES.map((c) => c.value);
const paymentTerms = PAYMENT_TERMS.map((c) => c.value);

const emptyToUndef = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const contactSchema = z.object({
  primary_name: z.string().trim().min(1, 'Required').max(120),
  email: z.string().trim().min(1, 'Required').email('Enter a valid email'),
  phone: z.string().trim().min(5, 'Enter a valid phone'),
});

export const addressSchema = z.object({
  street: z.string().trim().min(1, 'Required').max(200),
  city: z.string().trim().min(1, 'Required').max(80),
  state: z.string().trim().min(1, 'Required').max(80),
  country: z.string().trim().min(2, 'Required').max(80),
  postal_code: z.string().trim().min(1, 'Required').max(20),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  issued_by: z.string().trim().min(1, 'Required'),
  valid_until: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
});

export const supplierCreateSchema = z.object({
  supplier_code: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .max(40)
    .regex(/^[A-Za-z0-9-_]+$/, 'Letters, digits, dash or underscore only'),
  legal_name: z.string().trim().min(2, 'Required').max(200),
  display_name: z.string().trim().min(2, 'Required').max(120),
  category: z.enum(categories, { errorMap: () => ({ message: 'Pick a category' }) }),
  sub_category: z.preprocess(emptyToUndef, z.string().max(80).optional()),
  country: z.string().trim().min(2, 'Required'),
  region: z.preprocess(emptyToUndef, z.string().max(40).optional()),
  tax_id: z.preprocess(emptyToUndef, z.string().max(80).optional()),
  contact: contactSchema,
  address: addressSchema,
  payment_terms: z.enum(paymentTerms, { errorMap: () => ({ message: 'Pick payment terms' }) }),
  currency: z.string().trim().length(3, 'Three-letter currency code'),
  certifications: z.array(certificationSchema).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export const supplierUpdateSchema = supplierCreateSchema.partial().extend({
  supplier_code: z.string().optional(), // server ignores; UI keeps read-only
});

export const supplierDefaults = {
  supplier_code: '',
  legal_name: '',
  display_name: '',
  category: 'RAW_MATERIALS',
  sub_category: '',
  country: 'IN',
  region: 'APAC',
  tax_id: '',
  contact: { primary_name: '', email: '', phone: '' },
  address: { street: '', city: '', state: '', country: 'IN', postal_code: '' },
  payment_terms: 'NET_30',
  currency: 'INR',
  certifications: [],
  tags: [],
};
