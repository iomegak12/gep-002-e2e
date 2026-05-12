# Conventions

A short catalogue of conventions shared across the three services. When in doubt, follow these.

## API

- **Base path:** `/api/v1` on every service.
- **Resource naming:** plural, kebab-case (`purchase-orders`, `suppliers`).
- **IDs:** UUID v4 strings; `id` is always the surrogate primary key.
- **Pagination:** `?page=1&page_size=20` (1-based). Responses wrap data: `{ data, page, page_size, total }`.
- **Sorting:** `?sort=field:asc|desc`. Multiple fields comma-separated.
- **Filtering:** dedicated query params (`?status=ACTIVE&country=IN`). Comma-separated for multi-value.
- **Timestamps:** ISO 8601 with timezone (`2026-05-12T10:30:00Z`).
- **Money:** `currency` (ISO 4217 3-letter) + numeric amount; never floats in DB (Decimal or NUMERIC).
- **Enums:** SCREAMING_SNAKE_CASE strings, not numeric codes.

## HTTP

- **Method semantics:**
  - `GET` — read, idempotent, cacheable.
  - `POST` — create / non-idempotent action (lifecycle transitions).
  - `PATCH` — partial update of fields.
  - `DELETE` — soft-delete (sets `deleted_at`) where applicable; suppliers use this.
- **Idempotency:** writes are not idempotent in v1. Clients must handle duplicate-submit via UI state.
- **Headers:**
  - Request: `Authorization: Bearer ...`, `X-Correlation-Id: <uuid>` (optional, echoed in responses).
  - Response: `X-Correlation-Id` always present.

## Validation

- IAM and PO service: **Zod** schemas at the route boundary.
- Supplier service: **Pydantic** models (FastAPI parses bodies and query params).
- Failures all map to `400 VALIDATION_FAILED` with a field-level `details` object.

## Logging

- Structured JSON to stdout. Each line includes `level`, `msg`, `correlation_id`, and request metadata.
- Sensitive fields (`password`, `password_hash`, `Authorization` header) are redacted.

## Code organisation

- **Node services** — `src/<feature>/` (routes + service + schema co-located).
- **Python service** — `app/routers/` for HTTP, `app/models.py` for schemas, `app/state_machine.py` for transitions, `app/errors.py` for the error envelope.
