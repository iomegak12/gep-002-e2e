# GEP-Style SCM Platform — UI Development Specification

**Version:** 1.0
**Audience:** UI developer building the web frontend
**Target stack:** React + JavaScript + Vite (no TypeScript)
**Companion document:** `UI_Design_Specification.md` (screen catalog, navigation flow, error UX)
**Backend source of truth:** `GEP_SCM_Platform_Technical_Specification.md` (this folder) and the three OpenAPI files:

- `auth-service-openapi.json`
- `supplier-service-openapi.json`
- `po-service-openapi.json`

When the OpenAPI files and the markdown disagree, treat the OpenAPI files as authoritative for runtime contracts (path, method, status codes, schema). The markdown is authoritative for business intent. Known divergences are catalogued in **Appendix B**.

---

## 1. How to Read This Document

This is a **wiring specification**. It tells you, for each screen named in the Design Spec, which backend endpoints to call, what to send, what to expect, what to do with the response, and how to handle every documented error. It does **not** prescribe a specific HTTP client, state-management library, router, or form library — those are developer choices. It does prescribe behaviours (e.g., "attach Bearer on every request", "rotate refresh tokens", "preserve form input across transient errors").

Where this document recommends a specific library, the recommendation is marked **(suggested)** and a reasonable alternative is described.

No HTML / CSS / JavaScript code appears in this document by design.

---

## 2. System Overview

The frontend talks to three backend services. None of the inter-service calls are made by the frontend; the frontend treats each service as an independent REST API.

| Service | Base URL (configurable) | Auth model | Owns |
|---|---|---|---|
| Auth | `http://localhost:3001/api/v1` | None for `/auth/login`; Bearer for the rest | Users, roles, JWT issuance, refresh |
| Supplier | `http://localhost:3002/api/v1` | Bearer (validates Auth's public key) | Supplier master, lifecycle, search, aggregations |
| Purchase Order | `http://localhost:3003/api/v1` *(see Appendix B)* | Bearer (validates Auth's public key) | POs, line items, transitions, spend analytics |

JWT model:

- Access token: RS256-signed, ~15 minute lifetime, sent as `Authorization: Bearer <token>` to every protected endpoint.
- Refresh token: opaque to the frontend; lifetime ~7 days; single-use (rotated on each refresh).
- Claims of interest to the frontend: `sub` (user id), `email`, `name`, `roles`, `approval_limit`, `exp`.

The OpenAPI files are the contract source. Schemas (`UserPublic`, `SupplierResponse`, `PurchaseOrderResponse`, etc.) are referenced by name throughout this document; the developer should refer to the JSON files for full field lists and types.

---

## 3. Cross-Cutting Infrastructure

### 3.1 Configuration

Configuration loads from Vite environment variables (`VITE_*`) at build time:

| Variable | Purpose | Example |
|---|---|---|
| `VITE_AUTH_BASE_URL` | Auth service base | `http://localhost:3001/api/v1` |
| `VITE_SUPPLIER_BASE_URL` | Supplier service base | `http://localhost:3002/api/v1` |
| `VITE_PO_BASE_URL` | PO service base | `http://localhost:3003` *(see Appendix B for path prefix)* |
| `VITE_APP_DEFAULT_CURRENCY` | Display default | `INR` |
| `VITE_APP_PAGE_SIZE` | Default page size | `20` |

### 3.2 HTTP client

**Suggested:** a single shared HTTP client (axios or fetch wrapper) instantiated once with:

- A request interceptor that attaches `Authorization: Bearer <access_token>` to every request except `POST /auth/login` and `POST /auth/refresh`.
- A request interceptor that attaches `X-Correlation-Id: <uuid>` to every outbound request. Generate one fresh per top-level user action (page load, button click). Log it client-side so support can correlate.
- A response interceptor that:
  - On `2xx`: pass through.
  - On `401` with `error.code === "TOKEN_EXPIRED"`: attempt one transparent refresh, then retry the original request once.
  - On `401` with any other code: clear session, redirect to S01 Login, preserve the intended destination URL.
  - On `403`: surface the canonical error envelope to the caller; UI shows S05 forbidden block.
  - On `409`: surface to caller; UI shows the conflict UX from §4.5.
  - On `5xx`: surface to caller; UI shows the service-unavailable banner.
- A timeout of 10 seconds (configurable). On timeout, treat as transient network failure.

There is **one HTTP client instance per process**, configured with the correct base URL per request via either the `service:` selector (a small helper) or three pre-configured client instances (`authClient`, `supplierClient`, `poClient`). Either approach is fine; pick one and apply consistently.

### 3.3 Data fetching

**Suggested:** TanStack Query (React Query) for server state. It gives loading/error/success states out of the box, query-key-based caching, request deduplication, and easy refetch after mutations — all of which the UI relies on (per the Design Spec's state-variant requirements).

**Alternative:** SWR with comparable patterns, or hand-rolled hooks using `useReducer`.

Conventions:

- Query keys are stable arrays describing the resource: `['suppliers','list', filters]`, `['supplier', id]`, `['supplier', id, 'scorecard']`, `['po','list', filters]`, `['po', id]`, `['po','aggregations','monthly-spend', year]`.
- Lists invalidate on mutation: e.g., approving a supplier invalidates `['suppliers','list']` and `['supplier', id]`.
- Aggregation queries have `staleTime` of 60 seconds (dashboards refetch less aggressively).
- Type-ahead searches debounce 250 ms at the input layer (not in React Query).

### 3.4 Standard request/response shapes

**Pagination response envelope** (Supplier and PO list endpoints):

```
{
  "data": [...],
  "page": 1,
  "page_size": 20,
  "total": 134
}
```

The frontend reads `page`, `page_size`, `total` to drive pagination UI.

**Single resource responses:** raw object (e.g., a Supplier or PurchaseOrder document). No envelope.

**Aggregation responses:** wrapped in `{ "data": [...], "generated_at": "<iso8601>" }` and sometimes additional fields like `period` or `currency`.

**Error envelope** (all services, all error responses):

```
{
  "error": {
    "code": "<UPPER_SNAKE>",
    "message": "<human-readable>",
    "details": { ... },
    "correlation_id": "<uuid>"
  }
}
```

The frontend never displays `error.message` verbatim except for benign validation messages — it maps `error.code` to a UX category (see §3.7).

### 3.5 Pagination, sorting, filtering — query-string conventions

| Concept | Format | Example |
|---|---|---|
| Page | `page=<n>` (1-based) | `page=2` |
| Page size | `page_size=<n>` (max 100) | `page_size=20` |
| Sort | `sort=<field>,-<other>` (prefix `-` for desc) | `sort=-rating,display_name` |
| Filter | repeat or comma-separate by field | `status=ACTIVE,INACTIVE` |
| Search | `q=<text>` | `q=acme` |
| Date range | `<event>_after=<iso>` and `<event>_before=<iso>` | `created_after=2026-01-01` |
| Amount range | `min_<field>=<n>` / `max_<field>=<n>` | `min_amount=10000` |

The UI keeps applied filters in the URL query string so the screen is shareable/bookmarkable. The data-fetching layer derives the query key from the URL state.

### 3.6 Authentication & authorisation flow

#### 3.6.1 Login

1. User submits S01 form.
2. Frontend calls `POST /auth/login` with `{ email, password }`.
3. On `200`: response body is `LoginResponse` containing `access_token`, `refresh_token`, `token_type`, `expires_in`, and `user`.
4. Frontend stores:
   - **`access_token`**: in memory only (e.g., a React context or Zustand store). Never `localStorage` or `sessionStorage`.
   - **`refresh_token`**: see §3.6.4 (open consideration).
   - **`user`**: in the same in-memory session store.
5. Frontend decodes the access token payload (no verification — the server does that) and stores `roles`, `approval_limit`, and `exp` to drive UI gating.
6. Redirect to the saved post-login destination or S40 (default).

#### 3.6.2 Authorized request

For every request to a protected endpoint:

1. Read `access_token` from the in-memory store.
2. If absent, redirect to S01.
3. If `exp` is past, proactively refresh (§3.6.3) before issuing the request.
4. Attach `Authorization: Bearer <access_token>` and `X-Correlation-Id`.
5. Send.

#### 3.6.3 Token expiry — transparent refresh

1. Either proactively (when `exp` is within the next 30 s) or reactively (on a `401 TOKEN_EXPIRED`), call `POST /auth/refresh` with `{ refresh_token }`.

   > **Note:** the Auth OpenAPI file currently omits this endpoint; the markdown specifies it. Treat this as a server-side gap to be confirmed. See Appendix B.

2. On `200`: replace the in-memory `access_token`; replace the stored `refresh_token` (refresh tokens are single-use); retry the original request once.
3. On non-`200`: clear session, redirect to S01 with a friendly toast: "Your session expired — please log in again."
4. Refresh must be **serialized** — if multiple in-flight requests all see 401 simultaneously, only one refresh call is sent and the others await its result. (TanStack Query's `onError` + a singleton refresh promise handles this; a simple `pendingRefresh` promise in the auth store works too.)

#### 3.6.4 Refresh token storage — open consideration

The markdown's §7.1 suggests storing the refresh token in an `httpOnly` cookie. This is **not feasible from a pure SPA** (the Auth service would have to set the cookie itself, and the SPA's origin must match — and even then the SPA must accept that the cookie cannot be read by JS). Two acceptable options for v1:

- **(A) — keep refresh token in memory** alongside the access token. Pro: simplest; no XSS-readable storage. Con: full re-login required on every page reload.
- **(B) — keep refresh token in `sessionStorage`**. Pro: survives reloads in the same tab. Con: XSS-readable; mitigated by strict CSP.

**Default for v1: (A)** unless the user explicitly accepts the XSS trade-off. Either choice is a one-line swap in the auth store; do **not** invent a third storage scheme without product approval.

#### 3.6.5 Logout

1. Frontend calls `POST /auth/logout` (Bearer required).
2. Regardless of the response, clear the in-memory access & refresh tokens and the user object.
3. Redirect to S01.

#### 3.6.6 Role gating

- The auth store exposes `currentUser.roles` and `currentUser.approval_limit`, sourced from the JWT claims and the `user` block returned by login/refresh.
- A small `hasRole(role)` helper drives route guards and conditional UI visibility.
- Route guards live at the router level: each route declares `requiredRoles: ['ADMIN']` (or omitted for "any authenticated"). The guard reads `hasRole` and either renders the route or redirects to S05 Forbidden.
- Inside a screen, role checks gate the rendering of action buttons (per §4.2 of the Design Spec).

### 3.7 Error envelope handling

The HTTP response interceptor surfaces a normalized error object to the caller:

```
{ status, code, message, details, correlationId }
```

The UI maps `code` to a UX category. Suggested mapping table (extend as needed):

| `error.code` | HTTP | UX category | Behaviour |
|---|---|---|---|
| `AUTH_REQUIRED` | 401 | session-expired | Redirect to S01 |
| `TOKEN_INVALID` | 401 | session-expired | Redirect to S01 |
| `TOKEN_EXPIRED` | 401 | refresh-and-retry | Transparent refresh; on failure, S01 |
| `INSUFFICIENT_ROLE` | 403 | forbidden | S05 Forbidden block |
| `APPROVAL_LIMIT_EXCEEDED` | 403 | business-block | Friendly inline message on S31; do not retry |
| `VALIDATION_FAILED` | 400 | inline-validation | Map `details` to specific form fields |
| `SUPPLIER_NOT_FOUND` | 404 | not-found | S05 Not-Found (or inline on S22 step 1) |
| `PURCHASE_ORDER_NOT_FOUND` | 404 | not-found | S05 Not-Found |
| `USER_NOT_FOUND` | 404 | not-found | S05 Not-Found |
| `INVALID_STATUS_TRANSITION` | 409 | conflict-refetch | Toast + invalidate the entity query + refetch |
| `DUPLICATE_RESOURCE` | 409 | inline-validation | Inline field error on the duplicated field |
| `SUPPLIER_NOT_ACTIVE` | 422 | business-block | Inline error on S22 step 1; force re-pick |
| `BUSINESS_RULE_VIOLATION` | 422 | business-block | Friendly message; no auto-retry |
| `INTERNAL_ERROR` | 500 | service-unavailable | Banner; show retry control |
| (any unknown) | any | generic | S05 generic; include `correlation_id` |

### 3.8 Loading & retry semantics

- **Queries (GET):** the data-fetching layer automatically retries idempotent GETs up to twice on transient network failures (no response, or `5xx`), with exponential backoff (300 ms, 1.2 s). On final failure, surface to the screen.
- **Mutations (POST/PATCH/DELETE):** **never auto-retry**. The user explicitly re-submits.
- **Optimistic UI:** status transitions optimistically flip the status badge and invalidate the entity query on settle. On error, the previous status is restored and a toast explains why.

### 3.9 Status transition pattern (generic)

Every status-change endpoint is a `POST` to a verb-named sub-resource (e.g., `/suppliers/{id}/approve`, `/purchase-orders/{id}/reject`). The frontend pattern:

1. Optimistically set the new status on the affected entity.
2. POST the action (with reason body where required).
3. On `2xx`: invalidate `[<entity>, id]` and `[<entity>, 'list']`; show success toast; replace optimistic state with server response.
4. On `409 INVALID_STATUS_TRANSITION`: revert optimistic state; refetch the entity; toast: "This {entity} has changed — refreshed."
5. On `403 INSUFFICIENT_ROLE` or `APPROVAL_LIMIT_EXCEEDED`: revert; show the appropriate inline message.
6. On `5xx` / network: revert; allow user to retry.

---

## 4. Screen-to-Endpoint Mapping

Each subsection mirrors a screen from the Design Spec. The table format is:

| Action | Method + path | Request | Response | Success UI effect | Error codes |

For brevity, common error codes (`AUTH_REQUIRED`, `TOKEN_EXPIRED`, `INTERNAL_ERROR`) are not repeated below — they are handled globally by the HTTP client (§3.2) and the error mapping (§3.7).

Paths below use the Auth/Supplier `/api/v1` prefix convention. For the PO service, see Appendix B.

---

### S01 — Login

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Submit credentials | `POST /auth/login` | `{ email, password }` | `LoginResponse` (200) | Store tokens + user; decode JWT for roles & `approval_limit`; redirect to saved destination or S40 | `VALIDATION_FAILED` (inline), `AUTH_REQUIRED`/`TOKEN_INVALID` from server message → "Email or password is incorrect" |

The login endpoint returns user-specific 401 messages without leaking which of email/password is wrong; map all such failures to the same generic message.

### S02 — Reset User Password (admin-triggered)

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Set new password for user | `POST /auth/users/{id}/reset-password` | `{ new_password }` | `204` | Toast "Password reset"; return to S52 | `VALIDATION_FAILED`, `USER_NOT_FOUND`, `INSUFFICIENT_ROLE` |

### S03 — Change My Password

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Change own password | `PATCH /auth/me/password` | `{ current_password, new_password }` | `204` | Toast; return to previous screen; **do not** invalidate the access token | `VALIDATION_FAILED` (inline), 401 mapped to "Current password is incorrect" |

### S04 — App Shell

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Bootstrap user (after page reload, if refresh succeeded) | `GET /auth/me` | — | `UserPublic` | Populate auth store with roles & approval_limit | Standard |
| Pending-approvals badge (Approver only) | `GET /purchase-orders/aggregations/pending-approvals` | — | `{ count, total_value }` | Show count in nav | Standard |
| Log out | `POST /auth/logout` | — | `204` | Clear auth store; redirect to S01 | Even on error, clear local state |

`GET /auth/me` is the only way to recover the user object on a hard refresh when (A) refresh-token-in-memory was chosen: there is no recovery — user must re-login. When (B) refresh-token-in-sessionStorage was chosen: silent refresh + me on app boot.

### S05 — Not-Found / Forbidden / Generic Error

No endpoint calls. Reads any `correlation_id` from the navigation state and displays it.

---

### S10 — Supplier Directory

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Load list | `GET /suppliers?status=&category=&country=&min_rating=&tag=&q=&sort=&page=&page_size=` | query string from URL state | paginated `{ data:[Supplier], page, page_size, total }` | Render rows; update pagination footer | `VALIDATION_FAILED` (bad filter values) → reset offending filter |
| Type-ahead suggestions | `GET /suppliers/search?q=&limit=10` | query string | `[ { id, display_name, supplier_code, category, status } ]` | Populate dropdown | Standard (silently fail; keep filter input usable) |
| Click row | (none — navigate to S11 with `id`) | | | | |
| Click "New supplier" | (none — navigate to S12) | | | | |

Filter changes update the URL; the query key derives from the URL. Debounce only the typeahead input.

### S11 — Supplier Detail + Scorecard

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Load supplier | `GET /suppliers/{id}` | — | `Supplier` | Populate detail panel | `SUPPLIER_NOT_FOUND` → S05 |
| Load scorecard | `GET /suppliers/{id}/scorecard` | — | scorecard schema | Populate scorecard panel; parallel to load supplier | Soft-fail: show scorecard error placeholder; rest of screen still works |
| Edit (navigate) | (S13) | | | | |
| Status action (Admin) | see S14 below | | | | |

### S12 — Create Supplier

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Submit | `POST /suppliers` | `SupplierCreate` (full body per markdown §5.7) | `201 Supplier` | Invalidate `['suppliers','list']`; navigate to S11 of new id | `VALIDATION_FAILED` (inline), `DUPLICATE_RESOURCE` (on `supplier_code`) |

### S13 — Edit Supplier

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Submit | `PATCH /suppliers/{id}` | partial body (omit `supplier_code`) | `200 Supplier` | Invalidate `['supplier', id]` & `['suppliers','list']`; navigate back to S11 | `VALIDATION_FAILED`, `SUPPLIER_NOT_FOUND` |

### S14 — Supplier Status Actions

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Approve | `POST /suppliers/{id}/approve` | — | `200 Supplier` | Optimistic + invalidate; toast | `INVALID_STATUS_TRANSITION`, `INSUFFICIENT_ROLE` |
| Deactivate | `POST /suppliers/{id}/deactivate` | `{ reason }` | `200 Supplier` | Same | Same + `VALIDATION_FAILED` if reason missing |
| Reactivate | `POST /suppliers/{id}/reactivate` | — | `200 Supplier` | Same | Same |
| Blacklist | `POST /suppliers/{id}/blacklist` | `{ reason }` | `200 Supplier` | Same | Same + `VALIDATION_FAILED` |
| Soft-delete (Admin only, from row) | `DELETE /suppliers/{id}` | — | `204` | Invalidate `['suppliers','list']`; row falls off active list | `SUPPLIER_NOT_FOUND`, `INSUFFICIENT_ROLE` |

---

### S20 — PO List

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Load list | `GET /purchase-orders?status=&supplier_id=&buyer_id=&created_after=&created_before=&min_amount=&max_amount=&currency=&q=&sort=&page=&page_size=` | query string | paginated `{ data:[PO], page, page_size, total }` | Render rows | `VALIDATION_FAILED` |
| Type-ahead | `GET /purchase-orders/search?q=` | | `[ { id, po_number, supplier_display_name, status, total_amount } ]` | Populate dropdown | Standard |
| Supplier filter typeahead | `GET /suppliers/search?q=` | | as S10 | Populate supplier picker | Standard |
| Click row | (none — navigate to S21) | | | | |
| Click "New PO" (Buyer) | (none — navigate to S22) | | | | |

### S21 — PO Detail

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Load PO (header + line items) | `GET /purchase-orders/{id}` | — | `PurchaseOrder` | Populate detail; derive timeline from timestamps | `PURCHASE_ORDER_NOT_FOUND` → S05 |
| Load line items (if not embedded) | `GET /purchase-orders/{id}/line-items` | — | `[LineItem]` | Populate table | Soft-fail |
| Buyer: Submit | `POST /purchase-orders/{id}/submit` | — | `200 PO` (status SUBMITTED **or** auto-approved APPROVED with `auto_approved:true`) | Invalidate `['po', id]`; toast tailored to auto-approval | `INVALID_STATUS_TRANSITION`, `SUPPLIER_NOT_ACTIVE`, `VALIDATION_FAILED` (e.g., no line items) |
| Buyer: Cancel | `POST /purchase-orders/{id}/cancel` | `{ reason? }` | `200 PO` | Invalidate; toast | `INVALID_STATUS_TRANSITION` |
| Buyer: Fulfill | `POST /purchase-orders/{id}/fulfill` | `{ actual_delivery_date }` | `200 PO` | Invalidate; toast | `INVALID_STATUS_TRANSITION`, `VALIDATION_FAILED` |
| Buyer: Revise (REJECTED → DRAFT) | `POST /purchase-orders/{id}/revise` | — | `200 PO` | Invalidate; navigate to S23 | `INVALID_STATUS_TRANSITION` |
| Buyer/Approver: Close | `POST /purchase-orders/{id}/close` | — | `200 PO` | Invalidate; toast | `INVALID_STATUS_TRANSITION` |
| Approver: Approve | `POST /purchase-orders/{id}/approve` | — | `200 PO` | Invalidate; toast | `INVALID_STATUS_TRANSITION`, `APPROVAL_LIMIT_EXCEEDED` |
| Approver: Reject | `POST /purchase-orders/{id}/reject` | `{ reason }` | `200 PO` | Invalidate; toast | `INVALID_STATUS_TRANSITION`, `VALIDATION_FAILED` |
| Admin: Delete (DRAFT/CANCELLED only) | `DELETE /purchase-orders/{id}` | — | `204` | Invalidate list; navigate to S20 | `INVALID_STATUS_TRANSITION`, `INSUFFICIENT_ROLE` |

The approver's `approval_limit` from the JWT is checked client-side **before** issuing `POST .../approve` for a better UX. The server enforces the limit authoritatively; if the limit was changed since login, the server's `APPROVAL_LIMIT_EXCEEDED` is the canonical answer.

### S22 — Create PO Wizard

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Step 1: pick supplier (typeahead) | `GET /suppliers/search?q=` | | as S10 | Populate dropdown | Soft-fail |
| Step 1: load chosen supplier for inline preview | `GET /suppliers/{id}` | | `Supplier` | Show category + status; block "Next" if status != ACTIVE | `SUPPLIER_NOT_FOUND` → re-pick |
| Final: save as draft | `POST /purchase-orders` | full body (markdown §6.8) | `201 PO` (status DRAFT) | Invalidate `['po','list']`; navigate to S21 of new id | `VALIDATION_FAILED`, `SUPPLIER_NOT_FOUND`, `SUPPLIER_NOT_ACTIVE` |
| Final: submit for approval | (above) **then** `POST /purchase-orders/{id}/submit` | — | `200 PO` (SUBMITTED or APPROVED if auto) | Invalidate; navigate to S21; toast reflecting auto-approval if applicable | `INVALID_STATUS_TRANSITION`, `VALIDATION_FAILED` |

Line items are part of the create body. The wizard does not call `/line-items` endpoints — those are for editing post-create. Subtotal/tax/total are computed client-side for display but the server recomputes and returns the canonical totals; trust the server response.

### S23 — Edit PO (DRAFT only)

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Update PO header | `PATCH /purchase-orders/{id}` | partial body | `200 PO` | Invalidate `['po', id]` | `INVALID_STATUS_TRANSITION` (if no longer DRAFT), `VALIDATION_FAILED` |
| Add line item | `POST /purchase-orders/{id}/line-items` | `LineItemCreate` | `201 LineItem` | Append to local list; invalidate `['po', id]` | `VALIDATION_FAILED`, `INVALID_STATUS_TRANSITION` |
| Update line item | `PATCH /purchase-orders/{id}/line-items/{line_id}` | partial body | `200 LineItem` | Replace in local list | Same |
| Delete line item | `DELETE /purchase-orders/{id}/line-items/{line_id}` | — | `204` | Remove from local list; invalidate `['po', id]` | `INVALID_STATUS_TRANSITION` |

After any line-item mutation, the PO totals on the server change; refetch `['po', id]` so the header reflects new subtotal/tax/total.

---

### S30 — Approval Queue

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Load queue | `GET /purchase-orders?status=SUBMITTED&max_amount=<approver_limit>&sort=-submitted_at&page=&page_size=` | (`max_amount` from JWT claim) | paginated POs | Render rows | Standard |
| Bulk approve | repeat `POST /purchase-orders/{id}/approve` per selected id, in parallel (cap concurrency at e.g. 5) | — | `200 PO` per call | Update each row in place; rows that 4xx remain in queue and show a per-row error chip | `APPROVAL_LIMIT_EXCEEDED`, `INVALID_STATUS_TRANSITION` |
| Open row | (navigate to S31) | | | | |

The server filters by Approver's authority where supported; the client filters by `max_amount` defensively in case the server doesn't.

### S31 — PO Detail (Approver view)

Same endpoints as S21 but the visible actions are restricted to Approve and Reject (and Close after fulfillment).

### S32 — Reject PO modal

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Submit rejection | `POST /purchase-orders/{id}/reject` | `{ reason }` (10–500 chars client-side) | `200 PO` | Close modal; invalidate; toast | `VALIDATION_FAILED`, `INVALID_STATUS_TRANSITION` |

---

### S40 — Spend Analytics Dashboard

Three queries fire in parallel on mount. The screen renders each widget independently so a single failure doesn't break the page.

| Widget | Method + path | Query | Response | Success effect | Error codes |
|---|---|---|---|---|---|
| Monthly spend | `GET /purchase-orders/aggregations/monthly-spend` | `year=<n>` | `{ year, currency, data:[{ month, total_spend, po_count }] }` | Render chart | Per-widget retry on failure |
| Top suppliers | `GET /purchase-orders/aggregations/spend-by-supplier` | `period=last_90_days&limit=10` | `{ period, currency, data:[{ supplier_id, supplier_display_name, total_spend, po_count }] }` | Render donut/list; rows link to S11 | Same |
| Category breakdown | `GET /purchase-orders/aggregations/spend-by-category` | `period=ytd` | `{ period, currency, data:[{ category, total_spend, po_count }] }` | Render bar chart; bars link to S20 filtered | Same |

The PO service computes spend-by-category by calling Supplier service internally — the frontend does **not** stitch this; it just consumes the response.

### S41 — Supplier Aggregations Dashboard

| Widget | Method + path | Query | Response |
|---|---|---|---|
| By category | `GET /suppliers/aggregations/by-category` | — | `{ data:[{ category, count, active_count }], generated_at }` |
| By country | `GET /suppliers/aggregations/by-country` | — | `{ data:[{ country, count }], generated_at }` |
| By status | `GET /suppliers/aggregations/by-status` | — | `{ data:[{ status, count }], generated_at }` |
| Top rated | `GET /suppliers/aggregations/top-rated` | `limit=10&min_orders=20` | `{ data:[Supplier-subset], generated_at }` |

Drill-through clicks navigate to S10 with the relevant filter applied via URL params.

### S42 — Cycle-Time & Pending-Approval Widgets

| Widget | Method + path | Query | Response |
|---|---|---|---|
| Pending approvals (current Approver) | `GET /purchase-orders/aggregations/pending-approvals` | — | `{ count, total_value, currency }` |
| Cycle time by category | `GET /purchase-orders/aggregations/cycle-time` | — | `{ data:[{ category, avg_days }], generated_at }` |

---

### S50 — User Management List

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Load users | `GET /auth/users?page=&page_size=&q=&role=&is_active=` | query string | paginated `{ data:[UserPublic], page, page_size, total }` | Render rows | `INSUFFICIENT_ROLE` |

### S51 — Create User

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Submit | `POST /auth/users` | `{ full_name, email, password, roles, is_active, approval_limit? }` | `201 UserPublic` | Invalidate `['users','list']`; navigate to S50 | `VALIDATION_FAILED`, `DUPLICATE_RESOURCE` (email) |

`approval_limit` is required if `roles` contains `APPROVER`; the form enforces this client-side and the server enforces authoritatively.

### S52 — Edit User

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Load user | `GET /auth/users/{id}` | — | `UserPublic` | Populate form | `USER_NOT_FOUND` |
| Update user | `PATCH /auth/users/{id}` | partial: `{ roles?, is_active?, approval_limit? }` | `200 UserPublic` | Invalidate `['user', id]` & `['users','list']`; toast | `VALIDATION_FAILED`, `USER_NOT_FOUND` |
| Reset password (enter S02) | (navigation only) | | | | |

### S53 — Reset User Password

Entry to S02; same endpoint as documented there.

### S54 — Pending Supplier Approvals

| Action | Method + path | Request | Response | Success UI effect | Error codes |
|---|---|---|---|---|---|
| Load list | `GET /suppliers?status=PENDING_APPROVAL&sort=-created_at&page=&page_size=` | query string | paginated suppliers | Render rows | Standard |
| Inline Approve | `POST /suppliers/{id}/approve` | — | `200 Supplier` | Remove row from list (optimistic); invalidate | `INVALID_STATUS_TRANSITION` |
| Inline Blacklist | `POST /suppliers/{id}/blacklist` | `{ reason }` | `200 Supplier` | Remove row; invalidate | `INVALID_STATUS_TRANSITION`, `VALIDATION_FAILED` |

---

## 5. Inter-Screen Navigation Map (with data passed)

| From | To | Trigger | Data passed |
|---|---|---|---|
| (any unauthenticated) | S01 | auth required | original URL (for post-login redirect) |
| S01 | S40 | login success | none |
| S04 nav | S10 / S20 / S30 / S40 / S50 / S54 | menu click | none |
| S10 | S11 | row click | supplier `id` (URL param) |
| S10 | S12 | "New supplier" | none |
| S11 | S13 | "Edit" | supplier `id` |
| S12 | S11 | create success | new supplier `id` |
| S13 | S11 | save | supplier `id` |
| S20 | S21 | row click | po `id` |
| S20 | S22 | "New PO" | none |
| S22 step N | step N±1 | next/back | wizard state (kept in component or URL) |
| S22 | S21 | create success | new po `id` |
| S21 | S23 | "Edit" (DRAFT) | po `id` |
| S21 | S22 | "Revise" (REJECTED → DRAFT) | po `id` |
| S23 | S21 | save | po `id` |
| S30 | S31 | row click | po `id` |
| S31 | S32 | "Reject" | po `id` |
| S32 | S31 | submit | po `id` |
| S40 widget | S11 / S20 / S41 | drill | supplier id / filter params |
| S41 widget | S10 | drill | filter params |
| S42 widget | S30 | "Pending approvals" | none |
| S50 | S51 | "New user" | none |
| S50 | S52 | row click | user `id` |
| S52 | S02 | "Reset password" | user `id` |
| (any error) | S05 | unhandled error or 404/403 | error envelope (correlation_id) |

---

## 6. Authentication & Token Lifecycle (Deep Dive)

**Login (S01):**

```
UI         →  POST /auth/login                  Auth Service
UI         ←  200 { access_token, refresh_token, expires_in, user }
UI         :  store access_token, refresh_token, user (all in-memory)
UI         :  decode access_token claims; cache roles, approval_limit, exp
UI         →  navigate(saved destination || /dashboard)
```

**Authorized request (steady state):**

```
UI         :  read access_token from store
UI         :  if exp - now < 30s -> trigger §"Refresh"
UI         →  GET/POST <protected endpoint>     [Authorization: Bearer <token>, X-Correlation-Id]
UI         ←  2xx response                       → success path
UI         ←  401 TOKEN_EXPIRED                  → §"Refresh", then retry once
UI         ←  401 other                          → clear session, navigate(/login)
UI         ←  403                                → S05 Forbidden
UI         ←  409 INVALID_STATUS_TRANSITION      → conflict toast + refetch
UI         ←  4xx other                          → surface to caller (form validation, etc.)
UI         ←  5xx / no response                  → service-unavailable banner
```

**Refresh (transparent):**

```
UI         :  acquire singleton refresh-lock; if a refresh is in flight, await it
UI         →  POST /auth/refresh { refresh_token }
UI         ←  200 { access_token, refresh_token, ... } (refresh token rotated)
UI         :  replace tokens in store
UI         :  release refresh-lock
UI         :  resume queued requests
```

If `/auth/refresh` returns non-2xx → clear session, redirect to S01.

**Logout (S04 user menu):**

```
UI         →  POST /auth/logout                 [Authorization: Bearer <token>]
UI         :  regardless of response, clear in-memory tokens & user
UI         →  navigate(/login)
```

**Role-denied response (server side):**

```
UI         →  POST /suppliers/{id}/approve (user is a BUYER)
UI         ←  403 { error: { code: "INSUFFICIENT_ROLE" } }
UI         :  show S05 Forbidden block (or, if action-triggered, inline toast)
```

---

## 7. Error Handling Playbook

For each `error.code` from §3.7 and Appendix B of the tech spec:

| Code | Recommended behaviour |
|---|---|
| `AUTH_REQUIRED` / `TOKEN_INVALID` | Clear session, redirect to S01. Do not retry. Log to client console with correlation id. |
| `TOKEN_EXPIRED` | Run refresh flow once; retry the original request once; on second failure, treat as `AUTH_REQUIRED`. |
| `INSUFFICIENT_ROLE` | Show S05 Forbidden if the entire screen is denied; otherwise inline toast: "You don't have permission to perform this action." Do not retry. |
| `APPROVAL_LIMIT_EXCEEDED` | Show inline message in the action site (S31): "This PO exceeds your approval limit of {limit}. It must be approved by a senior approver." Do not retry. Do not hide the row from the queue. |
| `VALIDATION_FAILED` | Read `error.details`; map fields to form inputs; show inline errors. Focus the first invalid field. Do not retry without user input. |
| `SUPPLIER_NOT_FOUND` | If during S22 step 1: inline error, force user to re-pick. Otherwise: S05 Not-Found. |
| `PURCHASE_ORDER_NOT_FOUND` / `USER_NOT_FOUND` | S05 Not-Found with back-link to the relevant list. |
| `INVALID_STATUS_TRANSITION` | Toast: "This {entity} has changed — refreshing." Invalidate & refetch the entity. Allow the user to re-attempt. |
| `DUPLICATE_RESOURCE` | Inline field-level error on the unique field (e.g., `supplier_code`, `email`). |
| `SUPPLIER_NOT_ACTIVE` | Inline error on S22 step 1: "This supplier is not currently active and cannot receive POs." Force re-pick. |
| `BUSINESS_RULE_VIOLATION` | Render `error.message` in a non-dismissible inline block at the action site; the message is server-authored and user-friendly. |
| `INTERNAL_ERROR` / any 5xx | Top-of-screen banner naming the service: "Supplier service is unavailable. Try again." Show retry control. Auto-retry only idempotent GETs. |
| Network / timeout | Same as `INTERNAL_ERROR` but with a "Check your connection" framing. |
| Unknown / unmapped | Friendly generic with correlation id visible. Log full envelope to client console. |

---

## 8. Inter-Service Call Considerations

The frontend **never** stitches calls between Supplier and PO services. The PO service performs its supplier lookups internally and returns the result, including:

- During `POST /purchase-orders`: the PO service validates supplier exists + is ACTIVE. The frontend will receive `422 SUPPLIER_NOT_FOUND` or `422 SUPPLIER_NOT_ACTIVE` and handle per §7.
- During `GET /purchase-orders/aggregations/spend-by-category`: the PO service enriches with supplier category. The frontend just renders the response.

The frontend's defensive responsibility is to verify supplier ACTIVE status client-side on S22 step 1 (a UX improvement to fail fast) — but the server is always authoritative on submit.

---

## 9. Open Considerations / Decisions Deferred

| Topic | Decision needed | Suggested default for v1 |
|---|---|---|
| Refresh token storage | (A) in-memory, requires re-login on reload; or (B) sessionStorage, survives reload but XSS-readable. The markdown's httpOnly-cookie option isn't feasible from a pure SPA. | (A). Revisit when a backend-for-frontend (BFF) layer is introduced. |
| Approval threshold display | Should the threshold value be exposed to Buyers in S22 step 4? It influences whether they expect auto-approval. | Yes — read from the user's session if the server exposes it; otherwise hide and let the server's response on submit tell the user. |
| PO detail supplier info | Re-fetch supplier on S21 load (always fresh) vs. trust `supplier_snapshot` denormalised on the PO (audit-correct). | Use `supplier_snapshot` for the audit fields (name, category at PO creation); offer a "View current supplier" link that fetches live. |
| Optimistic UI scope | Do all status transitions get optimistic UI? | Yes for approve/reject/cancel/close where the response is fast; no for fulfill/submit where the server may auto-approve and the response shape may differ from the optimistic guess. |
| Bulk-approve concurrency cap | How many parallel `POST .../approve` calls during bulk approve? | 5 in-flight, queue the rest. Tune after measuring. |
| Currency conversion | Aggregations span POs in different currencies. Display per-currency or convert? | Per-currency for v1 (group totals by currency). Cross-currency conversion is out of scope. |

---

## Appendix A — Endpoint Catalog (cross-check)

This catalog is derived from the three OpenAPI files. Use it to verify your code maps to existing routes.

**Auth (`http://localhost:3001`, base `/api/v1`):**

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/me/password`
- `GET /auth/users`
- `POST /auth/users`
- `GET /auth/users/{id}`
- `PATCH /auth/users/{id}`
- `POST /auth/users/{id}/reset-password`
- `GET /health`
- *(`POST /auth/refresh` — see Appendix B)*

**Supplier (`http://localhost:3002`, base `/api/v1`):**

- `GET /suppliers`
- `POST /suppliers`
- `GET /suppliers/{sid}`
- `PATCH /suppliers/{sid}`
- `DELETE /suppliers/{sid}`
- `POST /suppliers/{sid}/approve`
- `POST /suppliers/{sid}/deactivate`
- `POST /suppliers/{sid}/reactivate`
- `POST /suppliers/{sid}/blacklist`
- `GET /suppliers/{sid}/scorecard`
- `GET /suppliers/search`
- `GET /suppliers/aggregations/by-category`
- `GET /suppliers/aggregations/by-country`
- `GET /suppliers/aggregations/by-status`
- `GET /suppliers/aggregations/top-rated`
- `GET /health`

**Purchase Order (`http://localhost:3003`, base `/` — see Appendix B):**

- `GET /purchase-orders`
- `POST /purchase-orders`
- `GET /purchase-orders/{id}`
- `PATCH /purchase-orders/{id}`
- `DELETE /purchase-orders/{id}`
- `POST /purchase-orders/{id}/submit`
- `POST /purchase-orders/{id}/approve`
- `POST /purchase-orders/{id}/reject`
- `POST /purchase-orders/{id}/fulfill`
- `POST /purchase-orders/{id}/cancel`
- `POST /purchase-orders/{id}/revise`
- `POST /purchase-orders/{id}/close`
- `GET /purchase-orders/{id}/line-items`
- `POST /purchase-orders/{id}/line-items`
- `PATCH /purchase-orders/{id}/line-items/{line_id}`
- `DELETE /purchase-orders/{id}/line-items/{line_id}`
- `GET /purchase-orders/search`
- `GET /purchase-orders/aggregations/by-status`
- `GET /purchase-orders/aggregations/spend-by-supplier`
- `GET /purchase-orders/aggregations/spend-by-category`
- `GET /purchase-orders/aggregations/monthly-spend`
- `GET /purchase-orders/aggregations/pending-approvals`
- `GET /purchase-orders/aggregations/cycle-time`

---

## Appendix B — Known Divergences Between Tech Spec and OpenAPI

These items are inconsistencies the developer should be aware of and the platform team should resolve. The recommendation is to treat the OpenAPI file as authoritative for runtime path/method shapes and **flag these back to the backend owners**.

### B.1 Auth: `POST /auth/refresh` is missing from the OpenAPI file

- **Markdown:** §4.4 documents `POST /auth/refresh` for token refresh, and §4.5 includes a request/response sample.
- **OpenAPI (`auth-service-openapi.json`):** the `paths` object does not include `/auth/refresh`.
- **Action:** confirm with the Auth service owner whether the endpoint exists at runtime. If yes, request that the OpenAPI be updated. If no, plan to default to **refresh-token-storage option (A)** (in-memory, re-login on reload) until the endpoint ships.

### B.2 PO Service: paths do not include the `/api/v1` prefix

- **Markdown:** §3.3 says all services use base path `/api/v1`.
- **OpenAPI (`po-service-openapi.json`):** paths are declared as `/purchase-orders/...` (no `/api/v1` prefix). The Auth and Supplier OpenAPI files both include the `/api/v1` prefix in their path keys.
- **Action:** confirm with the PO service owner whether the actual runtime route is `/purchase-orders/...` or `/api/v1/purchase-orders/...`. Set `VITE_PO_BASE_URL` accordingly. Until clarified, treat the OpenAPI file as authoritative and configure the base URL **without** the `/api/v1` segment for the PO service (i.e., `http://localhost:3003`).

### B.3 Document this in the env file

Make the difference explicit in `.env.example`:

```
VITE_AUTH_BASE_URL=http://localhost:3001/api/v1
VITE_SUPPLIER_BASE_URL=http://localhost:3002/api/v1
VITE_PO_BASE_URL=http://localhost:3003          # NOTE: no /api/v1 per current OpenAPI; revisit
```

---

End of UI Development Specification.
