/** Enum-like lookups used by Supplier forms and filters. */

export const SUPPLIER_CATEGORIES = [
  { value: 'RAW_MATERIALS', label: 'Raw materials' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'LOGISTICS', label: 'Logistics' },
  { value: 'IT_SERVICES', label: 'IT services' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Professional services' },
  { value: 'MRO', label: 'MRO' },
  { value: 'CAPEX', label: 'Capex' },
  { value: 'OTHER', label: 'Other' },
];

export const SUPPLIER_CATEGORY_LABELS = Object.fromEntries(
  SUPPLIER_CATEGORIES.map((c) => [c.value, c.label])
);

export const PAYMENT_TERMS = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'NET_15', label: 'NET 15' },
  { value: 'NET_30', label: 'NET 30' },
  { value: 'NET_45', label: 'NET 45' },
  { value: 'NET_60', label: 'NET 60' },
  { value: 'NET_90', label: 'NET 90' },
  { value: 'ADVANCE_50_50', label: 'Advance 50/50' },
];

export const PAYMENT_TERM_LABELS = Object.fromEntries(
  PAYMENT_TERMS.map((c) => [c.value, c.label])
);

/** Short reusable list — the field accepts free text, this is just for ergonomics. */
export const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
];

export const REGION_OPTIONS = [
  { value: 'APAC', label: 'APAC' },
  { value: 'EMEA', label: 'EMEA' },
  { value: 'AMERICAS', label: 'Americas' },
];

/** Two-letter ISO 3166-1 country codes used most often by the seed. Free text otherwise. */
export const COUNTRY_OPTIONS = [
  { value: 'IN', label: 'IN — India' },
  { value: 'US', label: 'US — United States' },
  { value: 'GB', label: 'GB — United Kingdom' },
  { value: 'DE', label: 'DE — Germany' },
  { value: 'FR', label: 'FR — France' },
  { value: 'SG', label: 'SG — Singapore' },
  { value: 'AE', label: 'AE — UAE' },
  { value: 'AU', label: 'AU — Australia' },
  { value: 'CA', label: 'CA — Canada' },
  { value: 'JP', label: 'JP — Japan' },
];
