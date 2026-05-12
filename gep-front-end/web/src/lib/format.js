import { format as dfFormat, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat().format(Number(value));
}

export function formatDate(iso, pattern = 'dd MMM yyyy') {
  if (!iso) return '—';
  try {
    return dfFormat(typeof iso === 'string' ? parseISO(iso) : iso, pattern);
  } catch {
    return '—';
  }
}

export function formatRelative(iso) {
  if (!iso) return '—';
  try {
    return formatDistanceToNowStrict(typeof iso === 'string' ? parseISO(iso) : iso, { addSuffix: true });
  } catch {
    return '—';
  }
}
