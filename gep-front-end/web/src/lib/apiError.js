/**
 * Helpers for the GEP-SCM error envelope.
 *
 * The backend wraps every error as:
 *   { error: { code: string, message: string, correlation_id: string } }
 *
 * Source of truth: tests/api/src/helpers/assert.js#expectErrorEnvelope
 * and the *.spec.js files under tests/api/src/tests.
 *
 * Known codes (NOT exhaustive — only what the UI explicitly reacts to):
 */
export const ERR = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_FAILED: 'AUTH_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INVALID_STATE_FOR_EDIT: 'INVALID_STATE_FOR_EDIT',
  APPROVAL_LIMIT_EXCEEDED: 'APPROVAL_LIMIT_EXCEEDED',
  PURCHASE_ORDER_NOT_FOUND: 'PURCHASE_ORDER_NOT_FOUND',
  SUPPLIER_NOT_FOUND: 'SUPPLIER_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
};

/** Return the canonical error code string, or undefined. */
export function getErrorCode(err) {
  return (
    err?.response?.data?.error?.code ||
    // Defensive fallbacks for non-conforming services / older envelopes
    err?.response?.data?.code ||
    undefined
  );
}

/** Return the canonical error message, or a sensible fallback. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message ||
    fallback
  );
}

/** Convenience: `if (isErrorCode(err, ERR.DUPLICATE_RESOURCE)) {...}` */
export function isErrorCode(err, code) {
  return getErrorCode(err) === code;
}

/** Correlation id for support handoffs. */
export function getCorrelationId(err) {
  return err?.response?.data?.error?.correlation_id;
}
