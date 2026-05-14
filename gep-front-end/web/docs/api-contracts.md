# API contracts — quick reference

> **Source of truth:** the Jest integration suite in
> `tests/api/src/tests/**/*.spec.js`. Before changing any request /
> response handling in the UI, open the relevant spec — it shows the exact
> wire shape and the error codes the backend returns.

## Where the helpers live

| File | What to look for |
|---|---|
| `tests/api/src/helpers/http.js` | Plain axios client per service (`iam`, `supplier`, `po`). |
| `tests/api/src/helpers/auth.js` | Token bootstrap and login flow used by every spec. |
| `tests/api/src/helpers/fixtures.js` | Canonical PO and Supplier payload shapes. |
| `tests/api/src/helpers/assert.js` | `expectErrorEnvelope` and `expectPaginated` — these define the envelopes. |
| `tests/api/src/helpers/env.js` | Base URLs and `approvalThreshold` (auto-approve cutoff). |

## Response envelopes

### Paginated list

```json
{ "data": [ ... ], "page": 1, "page_size": 20, "total": 87 }
```

Used by:
- `GET /api/v1/suppliers`
- `GET /api/v1/purchase-orders`
- `GET /api/v1/auth/users`

Defined by `expectPaginated()` in `assert.js`. The UI normalises this in
`useSuppliers.js` and `usePOs.js`.

### Error

```json
{
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "Supplier code already in use.",
    "correlation_id": "..."
  }
}
```

Defined by `expectErrorEnvelope()`. Parse with `src/lib/apiError.js` —
`getErrorCode(err)`, `getErrorMessage(err)`, `isErrorCode(err, ERR.X)`.

### Known error codes the UI explicitly handles

| Code | When | UI handler |
|---|---|---|
| `AUTH_REQUIRED` | 401, missing/invalid token | global axios interceptor redirects to `/login` |
| `AUTH_FAILED` | 401, wrong credentials | LoginPage, ChangePasswordPage |
| `VALIDATION_FAILED` | 400, bad payload | every form mutation toast |
| `DUPLICATE_RESOURCE` | 409, supplier_code or email already exists | CreateSupplierWizard, CreateUserPage |
| `INSUFFICIENT_ROLE` | 403, role denies the action | every mutation |
| `INVALID_STATUS_TRANSITION` | 409, transition not allowed | Supplier / PO status actions |
| `INVALID_STATE_FOR_EDIT` | 409, editing a non-DRAFT PO | EditPoPage, LineItems mutations |
| `APPROVAL_LIMIT_EXCEEDED` | 403, PO over approver's limit | POStatusActions (approve), ApprovalQueuePage |
| `PURCHASE_ORDER_NOT_FOUND` | 404 | PoDetailPage |
| `SUPPLIER_NOT_FOUND` | 404 | SupplierDetailPage |
| `USER_NOT_FOUND` | 404 | EditUserPage |

## Auth

### `POST /api/v1/auth/login`

**Request**

```json
{ "email": "...", "password": "..." }
```

**Response (200)**

```json
{
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "...",
    "email": "...",
    "full_name": "...",
    "roles": ["BUYER", "APPROVER", "ADMIN"],
    "approval_limit": 100000,
    "is_active": true
  }
}
```

Spec: `tests/src/tests/iam/login.spec.js`.

### Admin reset password

```
POST /api/v1/auth/users/{id}/reset-password
{ "password": "BrandNew1!" }
→ 204 No Content
```

Body key is **`password`**, not `new_password`. Spec:
`tests/src/tests/iam/users-admin.spec.js`.

## Suppliers

### Create

```
POST /api/v1/suppliers
→ 201, status="PENDING_APPROVAL"
```

Duplicate `supplier_code` → 409 `DUPLICATE_RESOURCE`. Spec:
`tests/src/tests/supplier/crud.spec.js`.

### Status transitions (admin only)

| Action | Endpoint | Body | Result |
|---|---|---|---|
| Approve | `POST /api/v1/suppliers/{id}/approve` | `{}` | status `ACTIVE` |
| Deactivate | `POST /api/v1/suppliers/{id}/deactivate` | `{ reason }` | status `INACTIVE` |
| Reactivate | `POST /api/v1/suppliers/{id}/reactivate` | `{}` | status `ACTIVE` |
| Blacklist | `POST /api/v1/suppliers/{id}/blacklist` | `{ reason }` | status `BLACKLISTED`, `blacklist_reason` set |

Spec: `tests/src/tests/supplier/transitions.spec.js`.

### Scorecard

`GET /api/v1/suppliers/{id}/scorecard` — fields include `rating`,
`on_time_delivery_rate`, `total_orders_count`, and a trend stub. The list /
detail endpoints also flatten these fields onto the supplier object. Spec:
`tests/src/tests/supplier/scorecard.spec.js`.

## Purchase orders

### Create

```
POST /api/v1/purchase-orders
→ 201, status="DRAFT"
```

Response includes `po_number` (auto-generated, matches `/^PO-\d{4}-\d{5}$/`),
`supplier_id`, `supplier_snapshot`, `total_amount`. Empty `line_items` →
400 `VALIDATION_FAILED`. Spec: `tests/src/tests/po/create.spec.js`.

### State machine

| From | Action | Endpoint | Body | To |
|---|---|---|---|---|
| `DRAFT` | submit (low value) | `/submit` | `{}` | `APPROVED` with `auto_approved: true` |
| `DRAFT` | submit (high value) | `/submit` | `{}` | `SUBMITTED` |
| `DRAFT` | cancel | `/cancel` | `{ reason }` | `CANCELLED` |
| `SUBMITTED` | approve | `/approve` | `{}` | `APPROVED` |
| `SUBMITTED` | reject | `/reject` | `{ reason }` | `REJECTED` |
| `REJECTED` | revise | `/revise` | `{}` | `DRAFT` |
| `APPROVED` | fulfill | `/fulfill` | `{ actual_delivery_date }` | `FULFILLED` |
| `FULFILLED` | close | `/close` | `{}` | `CLOSED` |

Invalid transition → 409 `INVALID_STATUS_TRANSITION`. Auto-approval threshold is
`PO_APPROVAL_THRESHOLD` env (default 100000). Spec:
`tests/src/tests/po/state-machine.spec.js`.

### Approval limits

Approver with limit < PO total → 403 `APPROVAL_LIMIT_EXCEEDED`. Spec:
`tests/src/tests/po/approval-limits.spec.js`.

### Line items

```
POST /api/v1/purchase-orders/{id}/line-items   { line_number, item_description, quantity, unit_of_measure, unit_price, tax_rate?, sku?, notes? }
GET  /api/v1/purchase-orders/{id}/line-items
PATCH /api/v1/purchase-orders/{id}/line-items/{line_id}
DELETE /api/v1/purchase-orders/{id}/line-items/{line_id}  → 200 or 204
```

Operations on non-DRAFT POs → 409 `INVALID_STATE_FOR_EDIT`. Spec:
`tests/src/tests/po/line-items.spec.js`.

### Aggregations

All return `[]` or `{ data: [...] }` — be defensive. Spec:
`tests/src/tests/po/aggregations.spec.js`.

- `/aggregations/by-status`
- `/aggregations/spend-by-supplier` — params `period`, `limit`
- `/aggregations/spend-by-category` — params `period`
- `/aggregations/monthly-spend` — params `year`
- `/aggregations/pending-approvals` — **server-side enforces approver limit**
- `/aggregations/cycle-time`

## Workflow for the UI when adding a new endpoint

1. Find the matching spec under `tests/api/src/tests/`.
2. Mirror the request shape from `fixtures.js` (PO) or the spec itself
   (`makePoPayload`, `makeSupplierPayload`).
3. Add an entry to `src/api/<service>Api.js`.
4. In the React mutation, parse errors with `getErrorCode` / `getErrorMessage`
   from `src/lib/apiError.js`. Add a friendly mapping for any new code referenced
   by `expectErrorEnvelope` in the spec.
5. If it's a list endpoint, route the response through the normaliser
   (`useSuppliers.js` / `usePOs.js`) so envelope drift never breaks the UI.
