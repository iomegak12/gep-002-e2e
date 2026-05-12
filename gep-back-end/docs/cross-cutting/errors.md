# Error Model

All three services return a uniform error envelope so clients can write a single error handler.

## Envelope

```json
{
  "error": {
    "code": "SUPPLIER_NOT_ACTIVE",
    "message": "Supplier must be ACTIVE to be used on a submitted PO.",
    "details": { "supplier_id": "..." },
    "correlation_id": "8d2a..."
  }
}
```

| Field | Notes |
|---|---|
| `code` | Stable, SCREAMING_SNAKE_CASE machine identifier. Safe to switch on. |
| `message` | Human-readable. May change between versions; do **not** parse. |
| `details` | Optional, free-form object with context for the failure. |
| `correlation_id` | Echoed back from the `X-Correlation-Id` request header if present, otherwise generated. |

## HTTP status mapping

| Status | When |
|---|---|
| `400 BAD_REQUEST` | Validation failure (Zod / Pydantic). `details` contains field-level errors. |
| `401 UNAUTHORIZED` | Missing/invalid/expired JWT. |
| `403 FORBIDDEN` | Authenticated but role/ownership/limit check failed. |
| `404 NOT_FOUND` | Resource does not exist. |
| `409 CONFLICT` | Unique-constraint violations, **invalid state transitions** (e.g. `INVALID_STATUS_TRANSITION`), and other business-rule conflicts. |
| `422 UNPROCESSABLE_ENTITY` | Semantically valid but rejected (rare — most cases collapse into 400 or 409). |
| `500 INTERNAL_ERROR` | Unhandled failure. Body still follows the envelope. |

## Common codes

| Code | Service(s) |
|---|---|
| `AUTH_FAILED` | iam — bad email/password. |
| `UNAUTHORIZED` | all — token missing/invalid. |
| `FORBIDDEN` | all — role check failed. |
| `VALIDATION_FAILED` | all — body/query failed schema validation. |
| `NOT_FOUND` | all. |
| `INVALID_STATUS_TRANSITION` | supplier-service, po-service — disallowed lifecycle move. |
| `SUPPLIER_NOT_ACTIVE` | po-service — referenced supplier is not `ACTIVE`. |
| `APPROVAL_LIMIT_EXCEEDED` | po-service — approver's limit < PO total. |
| `EMAIL_ALREADY_EXISTS` | iam — unique constraint on `users.email`. |
| `SUPPLIER_CODE_ALREADY_EXISTS` | supplier-service — duplicate `supplier_code`. |
