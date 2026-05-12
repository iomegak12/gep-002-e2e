# Order Oasis — Regeneration Prompts for Inconsistent Dark Screens

**Audience:** The design team (or whoever drives the AI design tool that produced the original mocks).
**Purpose:** Re-run the 10 existing dark-mode screens that don't match the chosen reference style. After regeneration, the visual language across all dark screens — both existing and newly-generated — will be coherent.
**Reference:** The chosen palette is captured in [mocks/tokens.css](mocks/tokens.css). The reference screenshot the product owner attached is the visual north star.

> **Status note (2026-05-12):** A complete consistent dark-mode mock set now exists at [mocks/](mocks/index.html) covering all 26 screens. As a result, regenerating the originals is **optional** — many teams will simply treat the `mocks/` folder as canonical and skip this work. This document is kept for completeness in case the originals are revived. The source folders referenced in each per-screen brief below have been moved to [archives/stitch_order_oasis_ui_design/](archives/stitch_order_oasis_ui_design/); replace `gep-front-end/docs/stitch_order_oasis_ui_design/` with `gep-front-end/docs/archives/stitch_order_oasis_ui_design/` if you proceed.

---

## 1. Project preamble (paste once, at the top of every session)

```
You are regenerating dark-mode UI screens for "Order Oasis", an enterprise
Supply Chain Management (SCM) web application. Your job is to produce mocks
that visually match a single, consistent design system across every screen.

DESIGN SYSTEM — DARK MODE

Canvas
- Background: very dark warm near-black, subtle radial gradient.
  Stops: #14171C (top-left) → #0F1115 (centre) → #0B0D11 (corners).
- Do NOT use cool blue-blacks (#09111a etc.) or pure black (#000).
- Do NOT use Material's #121212 charcoal; use the warm tones above.

Surfaces (cards, panels, modals)
- Card surface: #1A1D23.
- Card border: 1px solid #262A30 + a 1px top-edge highlight
  (linear-gradient transparent → rgba(255,255,255,0.06) → transparent).
- Card-elevated (modals, dropdowns): #1F232A.
- Card hover tint: #22262D (NOT a shadow increase).
- Card radius: 8px (rounded-lg). Buttons/inputs/small tags: 4px. Pills: full radius.

Accent (single canonical accent — gold/amber)
- Primary: #E8B14C  (use for primary actions, key data emphasis,
  status pills like "Pending"/"Warning", active nav item)
- Primary hover: #FFC36E
- Primary soft fill (pill bg, hover tint): rgba(232,177,76,0.18)
- "On accent" text/icon color (sat on amber): #1A1308 (dark, very readable)
- Do NOT use teal #00685f / #2dd4bf as primary anywhere.
- Do NOT use white (#FFFFFF) as primary.
- Do NOT introduce a second accent color.

Typography (Roboto + Roboto Mono)
- Base body 13px / 18px line-height (NOT 14px or 16px).
- Display: 32px / 700 / -0.02em letter-spacing (for big numbers).
- Headline: 20px / 600.
- Title: 15px / 600.
- Body: 13px / 400.
- Body-sm: 12px / 400.
- Label-caps: 11px / 700 / 0.05em / UPPERCASE (for section eyebrows, table headers).
- Mono: Roboto Mono 13px / 500 — use for tabular numbers, IDs, SKUs, codes, amounts.

Foreground colors
- Primary text: #F4F0E8 (warm off-white).
- Muted text (labels, secondary): #8E94A0.
- Subtle text (placeholders, captions): #5C6068.

Status colors (semantic — apply consistently across all screens)
- Success: #5CC689   soft: rgba(92,198,137,0.18)
- Error:   #EA5B5B   soft: rgba(234,91,91,0.18)
- Warning: #E8B14C   soft: rgba(232,177,76,0.18)   (same as accent)
- Info:    #6FA9F6   soft: rgba(111,169,246,0.18)
- Neutral: #8E94A0   soft: rgba(142,148,160,0.18)

Layout
- Fixed left sidebar at 240px (or 64px collapsed icon-only).
- Topbar 56px high, backdrop-blurred, with breadcrumbs, search, user chip.
- Content padding 24px. Widget gap 16px. Table cell padding 8/12px.
- 12-column fluid grid for dashboards.

Density
- Data tables are dense (8–12px vertical padding).
- No drop shadows on cards — use only soft ambient
  `0 4px 12px rgba(0,0,0,0.35)`.
- Modals use a stronger shadow `0 24px 48px rgba(0,0,0,0.55)`.

Components
- Status pills: 11px text, pill radius, soft-color background, full-color text,
  with a small leading dot. Six variants: success / error / warning / info /
  neutral / accent. Never invent a seventh color.
- Buttons: Primary = solid amber on dark text. Secondary = outlined ghost
  (1px var(--border-card-strong)). Tertiary/Ghost = text only.
  Destructive = red-soft fill with red border.
- Inputs: dark `#14171C` field, 1px border `#2E323A`, focus border = amber
  with a 2px amber-soft focus ring.
- Stepper: dots use accent-soft (done) → accent (active) → border-card (todo).

Charts
- Use a coordinated amber-to-bronze palette ONLY:
  #E8B14C, #C18338, #6E5025, #3B2C18, with optional cool accents
  #6FA9F6 / #5CC689 only when semantic.
- NEVER use teal/blue palettes from prior iterations.

Mock data
- Use realistic GEP-style procurement data: supplier codes like SUP-IN-00123,
  PO numbers like PO-2026-00042, INR currency by default, expected delivery
  in YYYY-MM-DD, tax rate like 18.00, etc. Names: Priya R. (Buyer),
  Suresh K. (Approver), Anil M. (Admin), Aarav M., Meera I., Karthik V.

What to OUTPUT
- A single HTML file per screen that imports tokens.css, shell.css,
  components.css from the repo's `gep-front-end/docs/mocks/` folder
  (relative path of your choosing). Stay consistent with patterns in those
  CSS files. No JavaScript.
- Include HTML comments calling out state variants
  (default / loading / empty / error / success / role-gated).

Wait for a per-screen brief before producing anything.
```

---

## 2. Per-screen briefs

Each brief below targets one of the **10 inconsistent dark folders** identified in the audit. Paste the preamble once, then feed the briefs one at a time. Reference the existing folder in the repo so the design tool understands the *content* it must preserve while changing the *style*.

### Brief 1 — `login_screen_dark_mode` (S01)

```
Screen: S01 Login
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/login_screen_dark_mode/

Layout
- Single centred card on the dark gradient canvas. No app shell.
- Card contains: small "O" brand mark (gold gradient), product name
  "Order Oasis" with eyebrow "SCM PLATFORM", form, and a footer line.

Fields
- Email (required, email format).
- Password (required, min 8).
- "Remember me for 30 days" checkbox.
- "Forgot password?" link (low-priority, ghost link colour).
- Primary button: "Sign in" full-width amber.

State variants to render (as HTML comments)
- default empty
- submitting (button disabled with spinner glyph)
- invalid credentials banner above the form
- account-inactive banner

Tone
- Quiet, confident, enterprise. No marketing copy. No image hero.
```

### Brief 2 — `my_profile_dark_mode` (S03 Change My Password)

```
Screen: S03 Change My Password
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/my_profile_dark_mode/

Layout
- Full app shell (sidebar + topbar + content), with "My profile"
  in the topbar breadcrumbs.
- Page header h1 "My profile", lede line "Your account details and
  password. Email and roles are managed by your administrator."
- 12-column grid. Left 8 columns: two cards.
  - Card 1: Account (full_name, email read-only, roles read-only chips,
    approval_limit read-only).
  - Card 2: Change password (current_password, new_password,
    confirm_password, "Save new password" primary).
- Right 4 columns: a small "Activity" card with last login, devices,
  and a "Sign out everywhere" ghost button.

State variants to render
- default
- new=current validation error
- wrong-current-password inline error
- success toast after save
```

### Brief 3 — `create_po_wizard_step_1_dark` (S22 step 1)

```
Screen: S22 Create PO — Step 1 of 4 (Supplier)
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/create_po_wizard_step_1_dark/
Style reference: mocks/s22-create-po-step-2.html (steps 2/3/4 are already on-brief).

Layout
- Full app shell. Page header: h1 "Create purchase order",
  lede "Step 1 of 4 — pick the supplier this PO is for."
- A wide stepper card (4 steps), step 1 active.
- 12-column grid. Left 8 columns:
  - Card "Supplier" with a typeahead input ("Search by name, code, or category").
  - Below the input, a dense table of search results (top 8) with columns:
    Supplier · Code · Category · Country · Status · Rating.
    Inactive/Pending rows are shown but disabled (selectable = false).
- Right 4 columns:
  - Card "Selected supplier" with display_name, code, category, country,
    status pill, on-time-delivery, total orders, total spend.
  - Card "Why supplier matters" alert info.
- Step footer card: "Cancel" ghost left, "Next: Line items →" primary right
  (disabled until a supplier is selected).

State variants
- default (no selection — Next disabled)
- selected supplier (Next enabled)
- selected supplier is inactive — block Next with inline error
- search empty state ("No suppliers match — try a broader query")
```

### Brief 4 — `po_detail_view_dark` (S21 PO Detail Buyer)

```
Screen: S21 PO Detail (Buyer view)
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/po_detail_view_dark/

Layout
- Full app shell. Breadcrumbs: Purchase orders › PO-2026-00042.
- Page header: h1 = PO number, lede = supplier · total · current status pill.
  Actions vary by status (see matrix below).
- Below header, status timeline as a horizontal stepper:
  Draft → Submitted → Approved → Fulfilled → Closed (with optional Rejected
  and Cancelled branches shown as off-path chips).
- 12-column grid:
  - Left 8 cols: cards in order — Header (supplier, buyer, approver,
    currency, expected delivery, payment terms, delivery address, notes,
    rejection_reason if present), Line items (dense table).
  - Right 4 cols: cards — Totals (subtotal/tax/total), Audit timeline
    (vertical timeline with created → submitted → approved/fulfilled
    timestamps and actors), Documents (placeholder out-of-scope).

Buyer status-action matrix (render the actions appropriate to each demo state)
- DRAFT: Submit, Edit, Cancel
- SUBMITTED: Cancel (own)
- APPROVED: Fulfill, Cancel
- REJECTED: Revise (returns to DRAFT)
- FULFILLED: Close
- CANCELLED / CLOSED: read-only

State variants (render in comments)
- one for each PO status above
- supplier-no-longer-active warning banner variant
```

### Brief 5 — `po_detail_approver_view_dark_mode` (S31 PO Detail Approver)

```
Screen: S31 PO Detail (Approver view)
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/po_detail_approver_view_dark_mode/

Same content/layout as S21 but the persona-driven actions become:
- For SUBMITTED: "Approve" primary, "Reject" danger (opens S32 modal).
- Add a small "Within your limit" or "Exceeds your limit" pill near the total,
  computed against the approver's approval_limit.
- For other statuses: read-only.

State variants
- SUBMITTED, within limit (Approve enabled)
- SUBMITTED, exceeds limit (Approve disabled with inline message:
  "This PO exceeds your approval limit of INR X. Forward to a senior approver.")
- APPROVED — read-only Approver view (no actions)
```

### Brief 6 — `supplier_detail_dark_mode` (S11)

```
Screen: S11 Supplier Detail + Scorecard
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/supplier_detail_dark_mode/

Layout
- Full app shell. Breadcrumbs: Suppliers › Acme Industrial.
- Page header: h1 = supplier display_name, lede = code + category + country +
  status pill. Actions: "Edit" (Buyer/Admin), status actions for Admin only
  (depending on status — see S14 matrix).
- 12-col grid:
  - Left 8 cols: cards — Identity (legal_name, code, tax_id, category,
    sub_category, region, country), Contact (primary name/email/phone),
    Address, Commercial terms (payment_terms, currency, tags),
    Certifications (table).
  - Right 4 cols: Scorecard card with display-lg rating (4.7) + pills
    (OTD 94.1%, Total orders 187, Total spend INR 14.8M), then a small
    6-month trend bar chart in amber.

State variants
- status = ACTIVE / PENDING_APPROVAL / INACTIVE / BLACKLISTED
- read-only Approver view
- soft-deleted indicator
- scorecard error fallback (rest of screen still works)
```

### Brief 7 — `efficiency_analytics_dark` (S42 Cycle / Pending widgets)

```
Screen: S42 Cycle-Time & Pending-Approval Widgets
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/efficiency_analytics_dark/

Layout
- Full app shell. Breadcrumbs: Dashboard › Operations.
- Page header: h1 "Operations", lede "Cycle time and approval backlog."
- 12-col grid:
  - Hero card spanning 12: warm amber gradient with title
    "Keep approvals moving" and a CTA "Go to approvals →".
  - 4 metric tiles: Pending approvals count, Pending approvals total value,
    Avg cycle time (DRAFT→FULFILLED), Auto-approval rate.
  - Card span-12 "Cycle time by category": horizontal bar chart in amber,
    one bar per category with average days.
  - Card span-6 "Pending POs (oldest first)": small dense table.
  - Card span-6 "Throughput trend": area-line chart, amber.

State variants
- empty state for "Pending POs" if no rows
- "Last refreshed" timestamp on each chart
```

### Brief 8 — `user_form_dark` (S51 Create User; doubles as S52)

```
Screen: S51 Create User (and S52 Edit User uses the same form)
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/user_form_dark/

Layout
- Full app shell. Breadcrumbs: Admin › Users › New user.
- Page header: h1 "New user", lede "Create a new login. The user must change
  the initial password the first time they sign in."
- 12-col grid:
  - Left 8 cols: card "Profile" with full_name, email (must be unique),
    initial_password + show/hide eye, is_active toggle (default on).
  - Card "Roles": three large selectable chips (Buyer / Approver / Admin),
    multi-select. When Approver is selected, an "approval_limit" numeric
    input appears with currency selector.
  - Right 4 cols: card "What this controls" (one-line per role explaining
    what they get to see/do).
  - Right 4 cols: card "Notification" alert info — "No email is sent.
    Share the initial password with the user out-of-band."

State variants
- default
- duplicate email validation error
- Approver selected but approval_limit empty -> inline error
- success toast after save
```

### Brief 9 — `approval_queue_dark_mode` (S30)

```
Screen: S30 Approval Queue
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/approval_queue_dark_mode/
Style reference: existing on-brief mocks
  gep-front-end/docs/stitch_order_oasis_ui_design/suppliers_dark_mode/
  gep-front-end/docs/stitch_order_oasis_ui_design/purchase_orders_dark_mode/

Layout
- Full app shell. Sidebar: "Approvals" is the active item with the badge
  showing pending count.
- Page header: h1 "Approval queue", lede "POs within your approval limit
  awaiting your decision."
- 4 metric tiles: Pending count, Pending total value, Oldest age, Avg time-to-approve.
- Toolbar with filter chips (Status: Submitted, Within limit) and
  bulk-select checkbox.
- Dense table: select checkbox · PO number · Supplier · Total · Submitted
  by · Submitted (relative time) · Expected delivery · row actions
  (Approve primary, Reject danger).
- Row hover: subtle tint. Row click: open S31 PO Detail (Approver).

Bulk action
- When ≥1 rows selected, show a sticky bottom action bar:
  "{n} selected — Approve all" primary, "Clear" ghost.

State variants
- default with 12 rows
- some rows exceed approver limit (greyed Approve, inline reason)
- empty state "You're all caught up"
- bulk partial-success result: 3 approved, 1 failed with reason
```

### Brief 10 — `dashboard_dark_mode` (S40 Spend Analytics)

```
Screen: S40 Spend Analytics Dashboard
Source-of-truth content reference: existing folder
  gep-front-end/docs/stitch_order_oasis_ui_design/dashboard_dark_mode/

Layout
- Full app shell. Breadcrumbs: Dashboard.
- Hero card (span 12): warm amber gradient panel with title
  "Spend, suppliers and approvals at a glance" + CTA "Open analytics".
- 4 metric tiles: Total spend (YTD), Active POs, Top supplier (name + amount),
  Auto-approval rate.
- 12-col grid:
  - Card span-12 "Monthly spend trend": amber bar chart, 12 bars,
    Roboto Mono y-axis labels.
  - Card span-6 "Top suppliers (last 90d)": donut + ranked list of 10
    rows (supplier name on left, mono spend on right). Donut uses the
    amber-to-bronze palette only.
  - Card span-6 "Spend by category (YTD)": horizontal bar chart, one bar
    per category, amber.
  - Card span-6 "Recent activity": vertical timeline of last 5 PO events.
  - Card span-6 "Upcoming deliveries": dense table (PO · Supplier · Date · Days to go).

Tone: data-dense, calm, executive. No marketing copy.

State variants
- per-widget loading skeleton
- per-widget empty
- per-widget error with retry pill
```

---

## 3. After regeneration — what to do with the output

For each regenerated screen the design tool produces, replace the contents of the corresponding `code.html` and `screen.png` inside its existing folder under `gep-front-end/docs/stitch_order_oasis_ui_design/`. Keep the folder name; the contents are what we're updating.

When all 10 are re-generated, the entire dark-mode surface (existing + the 14 mocks in `gep-front-end/docs/mocks/`) will share one visual language. At that point the four light-only folders (S32, S41, S50, S54) can also be archived to `gep-front-end/docs/archives/light-mode-duplicates/`.

---

## 4. Visual quality checklist

Use this on every regenerated screen before accepting it. If a screen fails any item, regenerate.

- [ ] Canvas is warm dark gradient (no cool blue-black, no Material `#121212`, no pure black).
- [ ] Primary accent is `#E8B14C` (amber). No teal, no white-as-primary.
- [ ] Status pills use the six canonical variants only.
- [ ] Card surface is `#1A1D23` with `1px solid #262A30` border and a top-edge highlight.
- [ ] Body text is `#F4F0E8`, muted is `#8E94A0`.
- [ ] Numbers and IDs render in Roboto Mono.
- [ ] Base body font-size is 13px (not 14 or 16).
- [ ] Sidebar is 240 px and "active" nav item uses accent-soft + accent text.
- [ ] No drop shadows other than the soft ambient + modal-shadow tokens.
- [ ] Buttons follow the four-variant system (Primary / Secondary / Ghost / Danger).
- [ ] Charts use the amber-to-bronze palette only.
- [ ] State variants are present as inline HTML comments.

---

End of regeneration-prompt pack.
