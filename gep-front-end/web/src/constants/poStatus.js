export const PO_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FULFILLED: 'FULFILLED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
};

export const PO_STATUS_ORDER = [
  PO_STATUS.DRAFT,
  PO_STATUS.SUBMITTED,
  PO_STATUS.APPROVED,
  PO_STATUS.FULFILLED,
  PO_STATUS.CLOSED,
];

export const PO_STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  FULFILLED: 'Fulfilled',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

/** Tailwind classes for the status Badge. Tokens, never hex. */
export const PO_STATUS_BADGE = {
  DRAFT: 'bg-surface-container-high text-on-surface',
  SUBMITTED: 'bg-secondary-container text-on-secondary-container',
  APPROVED: 'bg-success-container text-on-success-container',
  REJECTED: 'bg-error-container text-on-error-container',
  FULFILLED: 'bg-primary-container text-on-primary-container',
  CLOSED: 'bg-surface-container text-on-surface-variant',
  CANCELLED: 'bg-surface-container text-on-surface-variant',
};

/** Allowed transitions per status. Used to gate the action buttons in detail pages. */
export const PO_TRANSITIONS = {
  DRAFT: ['submit', 'cancel', 'edit', 'delete'],
  SUBMITTED: ['approve', 'reject', 'cancel'],
  APPROVED: ['fulfill', 'cancel'],
  REJECTED: ['revise'],
  FULFILLED: ['close'],
  CLOSED: [],
  CANCELLED: [],
};
