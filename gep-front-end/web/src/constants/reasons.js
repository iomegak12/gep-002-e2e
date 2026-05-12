/**
 * Predefined reason chips for status transitions. Each list is shown as a chip group
 * by <ReasonPicker>; an extra "Other" chip reveals a free-text textarea.
 */
export const REASONS = {
  PO_REJECT: [
    'Insufficient justification',
    'Over budget',
    'Wrong supplier',
    'Specifications unclear',
    'Duplicate order',
    'Pricing mismatch',
  ],
  PO_CANCEL: [
    'Requirement changed',
    'Budget pulled',
    'Duplicate order',
    'Supplier unavailable',
    'Procurement deferred',
  ],
  SUPPLIER_DEACTIVATE: [
    'Quality concerns',
    'Compliance gap',
    'Inactive partnership',
    'Pricing dispute',
    'Capacity constraints',
  ],
  SUPPLIER_BLACKLIST: [
    'Legal or compliance breach',
    'Repeated quality failures',
    'Fraud suspicion',
    'Sanctions list match',
    'Ethics violation',
  ],
};

export const OTHER_REASON_LABEL = 'Other';
