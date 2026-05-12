# GEP-Style SCM Platform — UI Design Specification

**Version:** 1.0
**Audience:** UI/UX Designer
**Target platform:** Web only (desktop-first responsive)
**Companion document:** `UI_Development_Specification.md`
**Backend source of truth:** `GEP_SCM_Platform_Technical_Specification.md` and the three OpenAPI files in this folder

---

## 1. How to Read This Document

This is a **functional, information-architecture-level** specification. It tells you **what the user must be able to do** on each screen — not how it should look. Layout, visual hierarchy, typography, palette, iconography, motion, and component library choices are intentionally **left to the designer**.

For each screen you will find:

- **Purpose** — one paragraph on why the screen exists.
- **Persona(s)** — who uses it.
- **Entry points** — where the user comes from.
- **Capabilities** — the verbs/actions the screen supports.
- **Inputs** — what the user can type, pick, or upload, with validation rules.
- **Outputs** — what data the screen displays.
- **State variants** — empty / loading / error / success / role-gated.
- **Error conditions** — what can go wrong, in user terms.
- **Exit points** — where the user can go next.

Numeric formats, currency formatting, date pickers, table affordances, etc. are designer choices unless the spec explicitly constrains them.

---

## 2. Product Overview

A web application for procurement teams to manage **suppliers** and **purchase orders (POs)** end-to-end, with **spend analytics** dashboards. The app is used by three personas:

| Persona | Primary responsibility |
|---|---|
| **Buyer** | Onboards suppliers, creates POs, tracks delivery, monitors own spend. |
| **Approver** | Reviews POs above auto-approval threshold; approves or rejects with reason. |
| **Admin** | Manages users, approves new suppliers, configures the platform. |

Tone: enterprise, data-dense, trustworthy, accessible (WCAG 2.1 AA). Designer is free to express that tone in any visual language.

---

## 3. Personas × Screen Matrix

Legend: ● = full access, ◐ = read-only access, ○ = no access.

| ID | Screen | Buyer | Approver | Admin |
|---|---|:---:|:---:|:---:|
| S01 | Login | ● | ● | ● |
| S02 | Reset Password (admin-triggered) | ○ | ○ | ● |
| S03 | Change My Password | ● | ● | ● |
| S04 | App Shell / Top Navigation | ● | ● | ● |
| S05 | Not-Found / Forbidden / Error | ● | ● | ● |
| S10 | Supplier Directory | ● | ◐ | ● |
| S11 | Supplier Detail + Scorecard | ● | ◐ | ● |
| S12 | Create Supplier | ● | ○ | ● |
| S13 | Edit Supplier | ● | ○ | ● |
| S14 | Supplier Status Actions | ○ | ○ | ● |
| S20 | PO List | ● | ◐ | ◐ |
| S21 | PO Detail | ● | ◐ | ◐ |
| S22 | Create PO Wizard | ● | ○ | ○ |
| S23 | Edit PO (DRAFT) | ● | ○ | ○ |
| S24 | PO Cancel / Revise actions | ● | ○ | ○ |
| S30 | Approval Queue | ○ | ● | ◐ |
| S31 | PO Detail (Approver view) | ○ | ● | ◐ |
| S32 | Reject PO modal | ○ | ● | ○ |
| S40 | Spend Analytics Dashboard | ● | ● | ● |
| S41 | Supplier Aggregations Dashboard | ● | ● | ● |
| S42 | Cycle-Time & Pending-Approval Widgets | ◐ | ● | ● |
| S50 | User Management List | ○ | ○ | ● |
| S51 | Create User | ○ | ○ | ● |
| S52 | Edit User | ○ | ○ | ● |
| S53 | Reset User Password (entry to S02) | ○ | ○ | ● |
| S54 | Pending Supplier Approvals | ○ | ○ | ● |

A user may carry multiple roles (e.g., Buyer + Approver). The most permissive role for a given screen applies.

---

## 4. Global UX Patterns

The designer is expected to define one consistent treatment for each of these patterns and reuse it across all screens.

### 4.1 Authentication boundary

- Logged-out users may only reach S01 (Login) and S05 (Not-Found / Forbidden / Error).
- Any other URL accessed while logged out redirects to S01 and, after successful login, returns the user to the original destination.
- Session expiry while the user is mid-task: surface a non-blocking notice and silently re-authenticate; if re-auth fails, redirect to S01 with a friendly explanatory message and preserve unsaved form state where reasonable.

### 4.2 Role-aware navigation

- The top navigation (S04) shows only the screens the current user's role grants. A Buyer never sees "Approval Queue"; an Approver never sees "Create PO".
- Action buttons inside a screen (e.g., "Approve Supplier" on S11) are hidden — not merely disabled — for users without permission, unless their absence would confuse the user. When in doubt, hide.

### 4.3 Empty / loading / error / success states

Define one treatment per category and reuse:

| State | When | Expected UX |
|---|---|---|
| Loading (initial) | First fetch on a screen | Skeleton placeholders mirroring the eventual content |
| Loading (action) | User-triggered mutation in progress | Inline spinner on the triggering control; control remains visible but non-interactive |
| Empty (no data) | Query returned zero rows | Illustration or icon + one-line "why empty" + (where applicable) a primary action to seed data |
| Error (recoverable) | Network failure, server 5xx | Inline error block with a retry control; preserve any form input |
| Error (permission) | 403 from server | Friendly "you don't have access" block; no retry control; offer link back to a screen they can use |
| Success (mutation) | After successful create/update/transition | Toast confirmation + the affected entity visibly updated in place |

### 4.4 Pagination, sorting, filtering

- Lists use **server-side pagination**. Show the current page, total pages (or total record count), and per-page selector with values 10 / 20 / 50 / 100.
- Sorting is **column-based** with a clear visual indicator of active sort and direction. Multi-column sort is not required for v1.
- Filtering uses a persistent **filter region** (designer's choice: sidebar, top bar, or pill row). Applied filters are visible as removable chips. Filter state should be reflected in the URL so users can share/bookmark a filtered view.
- Free-text search uses a debounced input feeding type-ahead suggestions (where applicable) and a full search on submit.

### 4.5 Status transitions

- Status-changing actions (approve, reject, deactivate, blacklist, cancel, fulfill, close, etc.) are presented as **explicit named buttons**, not as a generic "change status" dropdown.
- Destructive or irreversible transitions (blacklist, cancel, reject, close) require a **confirmation modal**. Confirmations that require a reason (reject, blacklist, deactivate, cancel) embed a required-text field inside the modal.
- After a successful transition, the entity's status badge updates in place and a toast confirms the action.

### 4.6 Toast and inline feedback

- **Toasts** for non-blocking confirmations and recoverable errors (auto-dismiss).
- **Inline error messages** at the field level for validation errors.
- **Banners** at the top of a screen for screen-wide issues (e.g., "Supplier service unreachable — directory may be stale").

### 4.7 Confirmation pattern for destructive actions

| Action class | Confirmation? | Reason field? |
|---|---|---|
| Delete user | Yes (modal) | Optional |
| Soft-delete supplier | Yes (modal) | Optional |
| Blacklist supplier | Yes (modal) | **Required** |
| Deactivate supplier | Yes (modal) | **Required** |
| Reject PO | Yes (modal) | **Required** |
| Cancel PO | Yes (modal) | Optional |
| Close PO | Yes (modal) | No |
| Log out | Optional (toast or modal) | No |

### 4.8 Accessibility baseline

- Keyboard-navigable for all controls.
- Color is never the only signal for status (pair with text/icons).
- Form fields have labels and visible focus indicators.
- Modals trap focus and dismiss on Escape.

### 4.9 Date, number, and currency display

- Dates display in the user's locale, but the underlying values are ISO 8601 UTC.
- Currency is always shown with an explicit 3-letter code (`INR 12,345.67`), since the platform is multi-currency.
- Percentages (tax rates, on-time delivery rate) show one decimal place.

---

## 5. Screen-by-Screen Specifications

### S01 — Login

- **Purpose:** Authenticate the user and start a session.
- **Persona(s):** All.
- **Entry points:** Direct URL, redirect from any protected screen when unauthenticated.
- **Capabilities:**
  - Enter email and password.
  - Submit credentials.
  - Navigate to "Change my password" once logged in (not from here).
- **Inputs:**
  - `email` — required, must be a valid email format.
  - `password` — required, minimum 8 characters (client-side rule; server is authoritative).
- **Outputs:** None until success; on success, redirect to the user's default landing screen (S40 Spend Analytics for all roles in v1).
- **State variants:**
  - Default empty form.
  - Submitting (button disabled, spinner inline).
  - Invalid credentials.
  - Account inactive.
  - Service unavailable.
- **Error conditions:**
  - Wrong email/password → "Email or password is incorrect."
  - Inactive account → "Your account is inactive. Contact your administrator."
  - Network/server error → "We can't reach the service right now. Try again."
- **Exit points:** S40 (default landing) on success; stays on S01 on failure.

### S02 — Reset Password (admin-triggered)

- **Purpose:** Allow an admin to set a new password on behalf of another user (after the user has e.g. forgotten theirs).
- **Persona(s):** Admin only.
- **Entry points:** Action button on S52 Edit User.
- **Capabilities:**
  - Type a new password for the selected user.
  - Confirm by re-typing.
  - Submit.
- **Inputs:**
  - `new_password` — required, minimum 8 characters.
  - `confirm_password` — required, must match.
- **Outputs:** Confirmation that the password was reset; the user must be informed by the admin out-of-band.
- **State variants:** default, submitting, success, error.
- **Error conditions:**
  - User no longer exists → friendly block, return to S50.
  - Password fails policy → inline field error.
- **Exit points:** Back to S52 on success or cancel.

### S03 — Change My Password

- **Purpose:** Let any logged-in user change their own password.
- **Persona(s):** All.
- **Entry points:** User menu in S04.
- **Capabilities:** Provide current password, new password, confirm new password.
- **Inputs:**
  - `current_password` — required.
  - `new_password` — required, minimum 8 characters, must differ from current.
  - `confirm_password` — required, must match new.
- **Outputs:** Success confirmation; user remains logged in.
- **Error conditions:**
  - Wrong current password → inline error.
  - New equals current → inline error.
  - Network/server error → top-of-form error.
- **Exit points:** Back to previous screen on success or cancel.

### S04 — App Shell / Top Navigation

- **Purpose:** Persistent chrome around every authenticated screen.
- **Persona(s):** All.
- **Capabilities:**
  - Navigate to top-level sections: Dashboard (S40), Suppliers (S10), POs (S20), Approvals (S30 — Approvers only), Admin (S50/S54 — Admins only).
  - Open user menu: see name + roles, go to S03 Change Password, log out.
  - See a global notification indicator (badge count) for pending approvals if the user is an Approver.
- **Outputs:** Current user's name and role(s); active section indicator.
- **State variants:**
  - Different menu set per role.
  - "Acting as Approver + Buyer" — when a user has multiple roles, both menu sets are unified.
- **Error conditions:** Token expired → silent re-auth or redirect to S01 (handled globally).
- **Exit points:** Any top-level section + logout.

### S05 — Not-Found / Forbidden / Generic Error

- **Purpose:** Friendly fallback for invalid URLs, permission-denied attempts, and unexpected client/server errors.
- **Capabilities:** Read the message; navigate home; if a correlation ID is present, copy it for support.
- **Outputs:** Short message, illustration/icon, "Go home" button, optional correlation ID badge.

---

### S10 — Supplier Directory

- **Purpose:** Discover and filter the supplier master.
- **Persona(s):** Buyer (●), Admin (●), Approver (◐ read-only).
- **Entry points:** Top nav.
- **Capabilities:**
  - Browse a paginated list of suppliers.
  - Filter by status (multi), category, country, minimum rating, tag.
  - Free-text search across legal name, display name, supplier code; with type-ahead suggestions.
  - Sort by display name, supplier code, rating, on-time delivery rate, total orders, total spend, created date.
  - Open a supplier's detail page (S11).
  - Initiate "Create Supplier" (S12) — Buyer/Admin only.
- **Inputs (filters):**
  - `status` ∈ {PENDING_APPROVAL, ACTIVE, INACTIVE, BLACKLISTED} (multi).
  - `category` ∈ {RAW_MATERIALS, PACKAGING, LOGISTICS, IT_SERVICES, PROFESSIONAL_SERVICES, MRO, CAPEX, OTHER}.
  - `country` — ISO 3166-1 alpha-2 (designer can present as country picker).
  - `min_rating` — numeric 0.0–5.0.
  - `tag` — free text or chip picker.
  - `q` — free text.
- **Outputs (per row):** supplier code, display name, category, country, status badge, rating, total orders, total spend (with currency).
- **State variants:** empty (no filters yielded results), loading skeleton, error block with retry.
- **Error conditions:**
  - Service unreachable → top-of-screen banner; preserve filter state.
- **Exit points:** S11 (row click); S12 ("New supplier" button).

### S11 — Supplier Detail + Scorecard

- **Purpose:** Full view of one supplier, including performance scorecard, with status-management actions for admins.
- **Persona(s):** Buyer (●), Admin (●), Approver (◐).
- **Entry points:** S10 row, S54 pending list, deep link.
- **Capabilities:**
  - Read all supplier fields (identity, contact, address, payment terms, certifications, tags, ratings, totals).
  - Edit non-status fields (S13) — Buyer/Admin only.
  - Perform status actions (S14) — Admin only and only for allowed transitions.
  - View scorecard: rating, on-time delivery rate, total orders, total spend, six-month trend.
- **Outputs:** All fields above + scorecard panel.
- **State variants:**
  - Supplier not found → S05.
  - Status-dependent action visibility (see S14).
  - Soft-deleted supplier → render with a "deactivated" indicator; no edit allowed.
- **Error conditions:**
  - Not found → friendly fallback.
  - Permission denied → S05.
- **Exit points:** S10 (back), S13 (edit), action modals (S14).

### S12 — Create Supplier

- **Purpose:** Onboard a new supplier; lands in PENDING_APPROVAL.
- **Persona(s):** Buyer, Admin.
- **Entry points:** S10 "New supplier" button.
- **Capabilities:** Fill a single multi-section form and submit.
- **Inputs (required ★):**
  - ★ supplier_code (max 20 chars, must be unique).
  - ★ legal_name (max 200).
  - ★ display_name (max 100).
  - ★ category (enum).
  - sub_category (free text).
  - ★ country (ISO alpha-2).
  - region (free text).
  - tax_id (free text).
  - Contact: ★ primary_name, ★ email (valid), ★ phone.
  - Address: ★ street, ★ city, ★ state, ★ country, ★ postal_code.
  - ★ payment_terms (enum).
  - ★ currency (ISO 4217).
  - certifications (repeatable group: name, issued_by, valid_until date).
  - tags (multi-value chip input).
- **Outputs:** On success, navigate to the newly created S11 (status PENDING_APPROVAL).
- **State variants:** validating (inline), submitting (button), success.
- **Error conditions:**
  - Validation failure → inline field errors.
  - Duplicate supplier code → field-level error.
  - Server unavailable → top-of-form banner; preserve input.
- **Exit points:** S11 (new supplier) on success; S10 on cancel.

### S13 — Edit Supplier

- **Purpose:** Update editable fields on an existing supplier (status is NOT editable here).
- **Persona(s):** Buyer, Admin.
- **Entry points:** "Edit" action on S11.
- **Capabilities:** Same form as S12 minus `supplier_code` (immutable post-create); status is read-only.
- **Inputs:** Same as S12 minus supplier_code.
- **Outputs:** Updated supplier visible on S11.
- **Error conditions:** Validation, not-found, server unavailable.
- **Exit points:** S11 on save or cancel.

### S14 — Supplier Status Actions

- **Purpose:** Execute the supplier state-machine transitions.
- **Persona(s):** Admin only.
- **Entry points:** Action buttons on S11 (and the bulk action affordance on S54 for "Approve").
- **Capabilities:** Trigger one of:
  - **Approve** (from PENDING_APPROVAL → ACTIVE) — no reason required.
  - **Deactivate** (from ACTIVE → INACTIVE) — reason **required**.
  - **Reactivate** (from INACTIVE → ACTIVE) — no reason required.
  - **Blacklist** (from PENDING_APPROVAL / ACTIVE / INACTIVE → BLACKLISTED) — reason **required**, terminal.
- **Inputs:** Reason text (where required, max 500 chars).
- **Outputs:** Confirmation toast; status badge on S11 updates.
- **State variants:**
  - Buttons shown for legal transitions only. Other buttons are hidden, not disabled.
- **Error conditions:**
  - Invalid state transition (e.g., race condition where another admin changed status) → friendly conflict message; refresh and retry.
  - Permission denied → S05.
- **Exit points:** Stay on S11 after action.

---

### S20 — PO List

- **Purpose:** Browse purchase orders relevant to the current user.
- **Persona(s):** Buyer (●, defaults to "My POs"), Approver and Admin (◐ across all).
- **Entry points:** Top nav.
- **Capabilities:**
  - View paginated list of POs.
  - Toggle scope (Buyer): "My POs" vs "All POs" (if role permits).
  - Filter by status (multi), supplier, buyer, created date range, amount range, currency.
  - Free-text search across PO number, notes, line-item descriptions.
  - Sort by created date, status, total amount, expected delivery date.
  - Open a PO's detail page (S21).
  - Initiate "Create PO" (S22) — Buyer only.
- **Inputs (filters):** `status` (multi), `supplier_id` (typeahead from Supplier search), `buyer_id` (admin/approver only), `created_after`, `created_before`, `min_amount`, `max_amount`, `currency`, `q`.
- **Outputs (per row):** PO number, supplier display name, status badge, total amount + currency, expected delivery date, buyer name, created date.
- **State variants:** empty, loading skeleton, error with retry.
- **Exit points:** S21 (row click); S22 ("New PO" button — Buyer only).

### S21 — PO Detail

- **Purpose:** Full view of one PO including line items and status history.
- **Persona(s):** Buyer (●, own POs and any if scope allows), Approver (◐, with approve/reject when SUBMITTED), Admin (◐).
- **Entry points:** S20 row, S30 row, deep link.
- **Capabilities:**
  - Read header (PO number, supplier, buyer, approver, status, currency, subtotal, tax, total, threshold flags, expected/actual delivery, payment terms, delivery address, notes, rejection reason).
  - Read all line items (line number, description, SKU, qty, UoM, unit price, tax rate, line total).
  - See a status timeline / audit (created → submitted → approved/rejected → fulfilled → closed, or → cancelled, or → revise → DRAFT).
  - Trigger status actions appropriate to the current status and the user's role.
- **Status-action visibility matrix:**

  | Current status | Buyer sees | Approver sees | Admin sees |
  |---|---|---|---|
  | DRAFT | Submit, Edit, Cancel | — | — |
  | SUBMITTED | Cancel (own) | Approve, Reject | — |
  | APPROVED | Fulfill, Cancel | — | — |
  | REJECTED | Revise (→ DRAFT) | — | — |
  | FULFILLED | Close | Close | Close |
  | CANCELLED | — | — | Delete (if also DRAFT-eligible) |
  | CLOSED | — | — | — |

- **Inputs (when triggering actions):**
  - **Fulfill** — `actual_delivery_date` (date, ≤ today).
  - **Reject** — `reason` (required, max 500).
  - **Cancel** — `reason` (optional, max 500).
- **Outputs:** Header + line items + timeline; success toast on transitions.
- **Error conditions:**
  - Invalid state transition (race) → conflict toast, refresh.
  - Approval limit exceeded (Approver clicks Approve but their JWT `approval_limit` < PO total) → friendly explanation and link to escalate. Note for designer: this can happen even when the PO is shown in the Approver's queue if approval thresholds were changed mid-flight.
  - Supplier no longer active (when fulfilling against a deactivated supplier — rare but possible) → warning banner.
- **Exit points:** S20 / S30 (back); S22/S23 (revise → edit DRAFT); S32 (reject modal).

### S22 — Create PO Wizard (4 steps)

- **Purpose:** Guide a Buyer through creating a PO in DRAFT and optionally submitting it.
- **Persona(s):** Buyer only.
- **Entry points:** S20 "New PO".
- **Steps:**
  1. **Supplier** — typeahead-search and select one ACTIVE supplier. Show its category and a quick scorecard preview.
  2. **Line items** — add 1..N line items: description, SKU (optional), quantity (>0, up to 3 decimals), unit of measure (enum: EA, KG, L, M, HR, ...), unit price (>0), tax rate % (0–100). Subtotal, tax, total computed live and displayed.
  3. **Delivery & terms** — currency, payment terms, expected delivery date (≥ today), delivery address (street, city, state, country, postal_code), notes.
  4. **Review & submit** — read-only summary of all entries; primary actions: "Save as draft" and "Submit for approval". An informational note tells the user whether the PO will auto-approve based on threshold (driven by `total_amount` vs the approval threshold the server reports back; the wizard can also display the threshold from the user's session if exposed).
- **Capabilities:** forward/back navigation between steps without losing data; client-side validation per step; final submit creates the PO and optionally transitions it.
- **Inputs:** see fields above.
- **Outputs:** The created PO (S21).
- **State variants:** validating, submitting, success.
- **Error conditions:**
  - Selected supplier not active by the time of submission → step 1 surfaces a blocking error; user must pick another supplier.
  - Validation errors → field-level on the relevant step; step indicator marks errors.
  - Server unavailable → preserve full wizard state; allow retry.
- **Exit points:** S21 on success; S20 on cancel.

### S23 — Edit PO (DRAFT only)

- **Purpose:** Allow a Buyer to modify a DRAFT PO before submitting (or after revising a REJECTED PO).
- **Persona(s):** Buyer only.
- **Entry points:** "Edit" action on S21 when status is DRAFT.
- **Capabilities:** Re-enters the S22 wizard pre-populated with the PO's current data.
- **Inputs / Outputs:** Same as S22.
- **State variants:** Same as S22.
- **Error conditions:** Trying to edit a non-DRAFT PO (e.g., browser back) → conflict banner; redirect to S21.

### S24 — PO Cancel / Revise / Fulfill / Close / Submit / Approve / Reject confirmations

These are **modals**, not full screens, but listed here for designer awareness. Patterns established in §4.7. Inputs as enumerated in S21.

---

### S30 — Approval Queue

- **Purpose:** Show every PO awaiting the current Approver's decision.
- **Persona(s):** Approver (●); Admin (◐ read-only view of all submitted POs).
- **Entry points:** Top nav, notification badge on S04.
- **Capabilities:**
  - List of POs in SUBMITTED status that fall within the Approver's `approval_limit`.
  - Filter by supplier, amount range, expected delivery date, age (time since submitted).
  - Sort by amount, age, supplier name.
  - Select one or more POs for bulk approval (Approve all selected). Reject is single-PO only (because reason is required).
  - Open any row to S31 PO Detail (Approver view).
- **Outputs (per row):** PO number, supplier display name, total amount + currency, time since submitted, buyer name, expected delivery date.
- **State variants:**
  - Empty → "All caught up — no pending approvals" with a checkmark illustration.
  - Bulk action progress → per-row indicator; partial failures listed.
- **Error conditions:**
  - Approval limit exceeded for selected row(s) → row remains in queue, banner indicates which rows failed and why.
- **Exit points:** S31 (row click).

### S31 — PO Detail (Approver View)

Same content as S21 but with **Approve** and **Reject** as primary actions for SUBMITTED POs.

### S32 — Reject PO Modal

- **Purpose:** Capture rejection reason.
- **Inputs:** `reason` — required, 10–500 chars.
- **Outputs:** On submit, PO transitions to REJECTED, returns user to S31 with status updated; toast confirms.
- **Error conditions:** missing/short reason → inline error; race-condition state change → conflict toast and refresh.

---

### S40 — Spend Analytics Dashboard

- **Purpose:** Give every persona a snapshot of recent spend.
- **Persona(s):** All.
- **Entry points:** Default landing after login; top nav.
- **Capabilities:** Toggle period (last 30 / 90 / 180 days / YTD / custom range). Three widgets refresh in parallel:
  - **Monthly spend trend** — bar or line chart showing total spend per month for the selected window.
  - **Top suppliers by spend** — donut or ranked-list, top 10, for the selected window.
  - **Spend by category** — bar chart grouped by supplier category for the selected window.
- **Outputs:** Charts + a small "generated at" timestamp per widget.
- **State variants:**
  - Loading per widget (skeleton chart).
  - Empty per widget (no spend in window).
  - Error per widget — others continue rendering; failed widget shows retry.
- **Exit points:** Each widget supports drill-through: clicking a supplier in "Top suppliers" → S11; clicking a category bar → S20 filtered by that category (server permitting) or S41.

### S41 — Supplier Aggregations Dashboard

- **Purpose:** Supplier-side aggregations for procurement leadership.
- **Persona(s):** All (Admin most relevant).
- **Capabilities:** Four panels rendered in parallel:
  - **By category** — count and active-count per category.
  - **By country** — count per country (consider a map visualisation, designer's choice).
  - **By status** — count per status.
  - **Top-rated** — top N suppliers by rating, with minimum-order threshold filter (default 20 orders, limit 10).
- **State variants:** per-panel loading / error / empty.
- **Exit points:** Click a category / country / status → S10 with that filter applied.

### S42 — Cycle-Time & Pending-Approval Widgets

- **Purpose:** Operational metrics for Approvers and Admins.
- **Persona(s):** Approver (●), Admin (●), Buyer (◐).
- **Capabilities:** Show two widgets:
  - **Pending approvals** — total count and total value of POs awaiting the current Approver (for Approvers) or all POs across the org (for Admins).
  - **Cycle time** — average days from DRAFT to FULFILLED, broken down by category.
- **State variants:** loading, empty, error.
- **Exit points:** Pending-approvals widget → S30.

---

### S50 — User Management List

- **Purpose:** Admin's directory of platform users.
- **Persona(s):** Admin only.
- **Entry points:** Admin section in top nav.
- **Capabilities:**
  - Paginated list of users; filter by role, active flag; search by name/email.
  - Open a user (S52); create a new one (S51).
- **Outputs (per row):** full name, email, roles, active flag, approval_limit (if set), created date.
- **Exit points:** S51 (new), S52 (row click).

### S51 — Create User

- **Persona(s):** Admin.
- **Inputs:** ★ full_name, ★ email (must be unique), ★ initial_password (min 8), ★ roles (multi from BUYER, APPROVER, ADMIN), is_active (default true), approval_limit (required if roles includes APPROVER, else hidden).
- **Outputs:** New user listed in S50; admin tells user the initial password out-of-band.
- **Error conditions:** duplicate email, validation errors, server error.
- **Exit points:** S50 on success or cancel.

### S52 — Edit User

- **Persona(s):** Admin.
- **Entry points:** S50 row click.
- **Capabilities:** Edit roles, is_active, approval_limit. Trigger S02 reset-password flow. Cannot edit email (immutable).
- **Inputs:** roles (multi), is_active (toggle), approval_limit (numeric or blank).
- **Outputs:** Updated user reflected in S50.
- **Exit points:** S50 on save or cancel; S02 on "Reset password".

### S53 — Reset User Password

Entry point that triggers the S02 modal/screen (already specified).

### S54 — Pending Supplier Approvals

- **Purpose:** Admin's worklist of suppliers awaiting initial approval.
- **Persona(s):** Admin only.
- **Capabilities:** Same as S10 but pre-filtered to `status=PENDING_APPROVAL`; row-level "Approve" and "Blacklist" actions available without leaving the list.
- **Outputs:** Same row fields as S10 plus the originating creator's name (if available) and time-since-created.
- **Exit points:** S11 (row click); inline action modals.

---

## 6. Navigation Flow

Framework-agnostic. Format: **From [Screen ID] → [Screen ID] on [event]**.

### 6.1 Login & shell

- (unauthenticated, any screen) → S01 on auth-required
- S01 → S40 on successful login
- S04 user menu → S03 on "Change password"
- S04 user menu → S01 on "Log out"
- (any error) → S05 on 404, 403, or unhandled error

### 6.2 Supplier flows

- S04 → S10 on click "Suppliers"
- S10 → S11 on row click
- S10 → S12 on click "New supplier" (Buyer/Admin)
- S11 → S13 on click "Edit" (Buyer/Admin)
- S11 → S14 modal on click any status action (Admin)
- S11 → S10 on click "Back"
- S12 → S11 on successful create (new id)
- S13 → S11 on save / cancel
- S14 modal closes → stays on S11; status reflects new value

### 6.3 PO flows (Buyer)

- S04 → S20 on click "Purchase Orders"
- S20 → S22 on click "New PO"
- S20 → S21 on row click
- S22 step 1 → step 2 → step 3 → step 4 on "Next"; reverse on "Back"
- S22 → S21 on successful "Save as draft" or "Submit for approval"
- S21 (DRAFT) → S23 on "Edit"
- S23 → S21 on save / cancel
- S21 → S24 modal on "Cancel" / "Submit" / "Fulfill" / "Close" / "Revise"
- S21 (REJECTED) → S23 on "Revise" (status returns to DRAFT)

### 6.4 PO flows (Approver)

- S04 → S30 on click "Approvals"
- S30 → S31 on row click
- S31 → S30 on "Approve" success
- S31 → S32 on "Reject"
- S32 → S31 on submit (status now REJECTED)
- S30 bulk-approve → in-place updates; rows that fail (e.g., limit exceeded) remain.

### 6.5 Analytics

- S04 → S40 on click "Dashboard"
- S40 top-supplier click → S11 (drill)
- S40 category-bar click → S20 filtered by category (or S41 if drill-through unsupported in v1)
- S41 category/country/status click → S10 with filter applied
- S42 pending-approvals click → S30

### 6.6 Admin

- S04 → S50 on click "Users"
- S50 → S51 on click "New user"
- S50 → S52 on row click
- S52 → S02 on click "Reset password"
- S04 → S54 on click "Pending supplier approvals" (notification or admin menu)
- S54 → S11 on row click

---

## 7. Error & Feedback Catalog

Translates backend error semantics into UX responses. Designer expresses each consistently.

| Error category | When it happens (user-facing) | Expected UX response |
|---|---|---|
| **Validation** | Form input fails rules | Inline field-level message in plain language; prevent submit until corrected |
| **Required field missing** | User submits incomplete form | Inline message + focus moves to first invalid field |
| **Unauthenticated / session expired** | Token expired or missing | Silent re-authenticate behind the scenes; if re-auth fails, return to S01 with friendly message and preserved destination |
| **Forbidden** | User tries an action their role doesn't allow | Friendly "you don't have access" block; offer a link to a screen they can use; never silently fail |
| **Not found** | Resource id doesn't exist (deep link to deleted) | S05 Not-Found variant with a back-to-list link |
| **Invalid state transition** | Race condition: another user moved the entity meanwhile | Non-blocking conflict toast: "This {supplier|PO} has changed — refreshing." Auto-refresh the screen; user re-attempts |
| **Approval limit exceeded** | Approver attempts to approve a PO above their limit | Friendly message: "This PO exceeds your approval limit of {amount}. Forward to a senior approver." No retry; offer escalation path |
| **Supplier not active** | Buyer submits PO referencing a deactivated/blacklisted supplier | Block submission; show inline error on step 1 of S22 with a "pick another supplier" CTA |
| **Duplicate resource** | Unique constraint (supplier_code, user email) | Inline field-level error: "{value} is already in use." |
| **Transient network** | One-off fetch failure | Inline retry button; on second failure, show banner; don't auto-retry mutations |
| **Service unavailable (5xx)** | Backend down or overloaded | Top-of-screen banner; reads naming the affected service; preserve user input; offer retry |
| **Generic unexpected** | Anything else | S05 generic-error variant with correlation-id badge to copy |

No HTTP status codes or error codes are exposed to the end-user; correlation IDs **are** exposed (small chip, copyable) so users can reference them when contacting support.

---

## 8. Appendix A — AI Design Tool Prompt

Paste the block below into an AI design tool (v0, Figma Make, Lovable, Galileo, or similar). The prompt is split into **one project preamble** and a **per-screen template** the designer iterates with.

### A.1 Project preamble (paste once)

```
You are designing the web UI for an enterprise procurement (supplier & purchase
order management) platform. The product is used by three personas — Buyer,
Approver, and Admin — to manage suppliers and the purchase-order lifecycle and
to view spend analytics.

Constraints and tone:
- Web only, desktop-first, responsive down to ~1024 px wide.
- Enterprise tone: trustworthy, data-dense, professional, calm.
- Accessibility: WCAG 2.1 AA. Color is never the only signal. All interactive
  controls are keyboard reachable with visible focus states.
- Multi-currency: always show explicit currency codes alongside amounts.
- Dates display in the user's locale.
- No hard-coded brand identity. Choose a neutral, modern visual language.
- Components I expect to recur: app shell with top navigation, data tables with
  filter region, detail pages with side panel, multi-step wizard, confirmation
  modals with required reason fields, dashboard cards, status badges, toasts.
- Status badges must be visually distinct per state but follow one consistent
  treatment per entity (supplier statuses share a system; PO statuses share a
  system; the two systems can share or differ — your call).
- Do not invent features that are not in my screen brief. If a screen brief is
  ambiguous, choose the simplest interpretation and call out the assumption.

Deliverable per screen:
- A static screen mock at 1440 px width.
- A short rationale: what is the primary action, what is the secondary action,
  why the chosen layout supports the persona's task.
- Specify states: default, empty, loading, error, success.

I will give you one screen brief at a time. Wait for it before producing
anything.
```

### A.2 Per-screen template (paste once per screen, fill the blanks)

```
Screen: <ID> <Name>
Persona(s): <Buyer | Approver | Admin | All>
Entry points: <where the user comes from>
Purpose (one line): <why this screen exists>

Capabilities (what the user must be able to do):
- <bullet>
- <bullet>

Inputs accepted:
- <field>: <type, validation, required?>
...

Outputs displayed:
- <data point>
...

State variants to design:
- default
- empty
- loading
- error (recoverable)
- error (permission)
- success after primary action

Error conditions worth showing:
- <condition>: <user-facing message in plain language>
...

Out of scope (do not design):
- <e.g., file attachments, push notifications, mobile-specific patterns>

Produce the screen with the constraints from the project preamble.
```

### A.3 Worked example

```
Screen: S11 Supplier Detail + Scorecard
Persona(s): Buyer, Admin (full); Approver (read-only)
Entry points: Supplier Directory row click; Pending Supplier Approvals row click; deep link.
Purpose: Show a single supplier's full record alongside a performance scorecard,
with status-change actions available to Admins only.

Capabilities:
- Read all supplier fields (identity, contact, address, payment terms,
  certifications, tags, ratings, totals).
- Edit non-status fields (Buyer/Admin).
- Trigger status transitions: Approve / Deactivate / Reactivate / Blacklist
  (Admin only, only for allowed transitions based on current status).
- View scorecard: rating, on-time delivery rate, total orders, total spend,
  six-month spend or order trend.

Inputs accepted:
- Reason text inside Deactivate and Blacklist confirmation modals (max 500).

Outputs displayed:
- Supplier code, legal name, display name, category, sub-category, country,
  region, tax id, contact (name/email/phone), address, payment terms, currency,
  status badge, blacklist reason (if applicable), certifications (list),
  tags (chips), rating, on-time delivery rate, total orders, total spend,
  created/updated timestamps.
- Scorecard panel: numeric summary + trend visualisation for the last 6 months.

State variants to design:
- default (status = ACTIVE)
- status = PENDING_APPROVAL (highlight Approve / Blacklist actions)
- status = INACTIVE (highlight Reactivate / Blacklist)
- status = BLACKLISTED (terminal; no status actions)
- read-only Approver view (no edit, no status actions)
- loading
- error (not found, network)

Error conditions worth showing:
- Invalid state transition (race condition): "This supplier has changed —
  refreshing."
- Permission denied: friendly block with a link back to the directory.

Out of scope:
- File attachments, multi-tenant scoping, audit trails.
```

---

End of UI Design Specification.
