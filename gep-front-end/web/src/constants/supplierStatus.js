export const SUPPLIER_STATUS = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLACKLISTED: 'BLACKLISTED',
};

export const SUPPLIER_STATUS_ORDER = [
  SUPPLIER_STATUS.PENDING_APPROVAL,
  SUPPLIER_STATUS.ACTIVE,
  SUPPLIER_STATUS.INACTIVE,
  SUPPLIER_STATUS.BLACKLISTED,
];

export const SUPPLIER_STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  BLACKLISTED: 'Blacklisted',
};

export const SUPPLIER_STATUS_BADGE = {
  PENDING_APPROVAL: 'bg-tertiary-container text-on-tertiary-container',
  ACTIVE: 'bg-success-container text-on-success-container',
  INACTIVE: 'bg-surface-container-high text-on-surface-variant',
  BLACKLISTED: 'bg-error-container text-on-error-container',
};

export const SUPPLIER_TRANSITIONS = {
  PENDING_APPROVAL: ['approve', 'blacklist'],
  ACTIVE: ['deactivate', 'blacklist'],
  INACTIVE: ['reactivate', 'blacklist'],
  BLACKLISTED: [],
};
