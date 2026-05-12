# GEP-SCM Frontend Implementation Plan

## Context

Build the React web frontend for the GEP-SCM procurement platform, consuming three existing backend services (Auth, Supplier, PO) documented in OpenAPI specs at `gep-front-end/docs/`. The UI must implement the 26 mocked screens at `gep-front-end/docs/mocks/` across four feature areas (Suppliers, POs, Approvals, Analytics, User Admin) for three roles (BUYER, APPROVER, ADMIN). The dashboard reference is `docs/archives/stitch_order_oasis_ui_design/dashboard_dark_mode/code.html` — an icon-rail sidebar + topbar + hero/KPI/charts layout in dark mode with Material-Design-inspired tokens.

Goals:
- Deliver a single SPA with role-aware navigation, role-specific landing dashboards, and full coverage of the PO and supplier state machines.
- Use a modular, reusable component library so list views, forms, modals, and dashboard widgets are never duplicated.
- Ship a production-ready container image (slim multi-stage nginx).
- Support dark and light themes with a runtime toggle.
- Support Grid (default) / Card / Kanban views on the PO and Supplier directories.

## Tech Stack (locked)

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite + JavaScript (no TypeScript) |
| Styling | Tailwind CSS (`darkMode: "class"`), tokens ported from mocks |
| Routing | React Router v6, `<RequireRole>` wrapper guard |
| Server cache | TanStack Query v5 (one client, per-service axios instances) |
| Client state | Zustand (auth, theme, view-mode prefs) |
| Forms | React Hook Form + Zod resolver |
| HTTP | Axios — three instances (`authApi`, `supplierApi`, `poApi`) reading separate env vars |
| Charts | Recharts (SVG) |
| Icons | lucide-react (SVG-only); custom `favicon.svg` |
| Tables | TanStack Table v8 (headless, styled with Tailwind) |
| Drag/drop | Not used (Kanban is read-only; click a card to act) |
| Toasts | sonner |
| Date utils | date-fns |
| Body font size | 13px (set via Tailwind `body-base` and applied to `<body>`) |

## Project Structure

```
gep-front-end/
├── .gitignore
├── .dockerignore
├── Dockerfile                    # multi-stage, slim nginx, no HEALTHCHECK
├── docker-compose.yml            # no version key
├── nginx.conf                    # SPA fallback + gzip + cache headers
├── LICENSE                       # MIT
├── README.md
├── CHANGELOG.md
├── TROUBLESHOOTING.md
├── CONTRIBUTING.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/
│   └── favicon.svg               # custom SVG (procurement glyph)
├── .env.example                  # VITE_AUTH_URL, VITE_SUPPLIER_URL, VITE_PO_URL
└── src/
    ├── main.jsx
    ├── App.jsx                   # Router + QueryClientProvider + ThemeProvider
    ├── routes/
    │   ├── index.jsx             # route table + lazy imports
    │   ├── RequireAuth.jsx
    │   └── RequireRole.jsx
    ├── api/
    │   ├── axios.js              # 3 instances, JWT interceptor, 401 handler
    │   ├── authApi.js
    │   ├── supplierApi.js
    │   ├── poApi.js
    │   └── queryKeys.js          # canonical TanStack Query keys
    ├── stores/
    │   ├── authStore.js          # JWT in memory + sessionStorage mirror
    │   ├── themeStore.js         # 'dark' | 'light' | 'system'
    │   └── viewPrefsStore.js     # per-screen grid/card/kanban (localStorage)
    ├── constants/
    │   ├── roles.js
    │   ├── poStatus.js           # status, allowed transitions, badge styles
    │   ├── supplierStatus.js
    │   └── reasons.js            # reject/deactivate/blacklist chip catalogs
    ├── lib/
    │   ├── schemas/              # Zod schemas (loginSchema, supplierSchema, poSchema...)
    │   ├── format.js             # currency, date, role label helpers
    │   └── permissions.js        # canCreatePO(user), canApproveSupplier(user)...
    ├── components/                       # REUSABLE — never duplicated
    │   ├── layout/
    │   │   ├── AppShell.jsx              # sidebar + topbar + outlet
    │   │   ├── Sidebar.jsx               # collapsed icon rail (64px) like reference
    │   │   ├── Topbar.jsx                # title, help, docs, notifications, theme toggle, avatar
    │   │   ├── ThemeToggle.jsx           # sun/moon/system tri-state
    │   │   └── Breadcrumbs.jsx
    │   ├── primitives/
    │   │   ├── Button.jsx                # primary/secondary/ghost, sm/md/lg, pill
    │   │   ├── Input.jsx, Select.jsx, Textarea.jsx, Checkbox.jsx, RadioGroup.jsx
    │   │   ├── Field.jsx                 # label + control + help + error
    │   │   ├── Card.jsx
    │   │   ├── Modal.jsx                 # focus trap, Esc dismiss
    │   │   ├── Drawer.jsx
    │   │   ├── Tabs.jsx
    │   │   ├── Tooltip.jsx
    │   │   ├── Badge.jsx                 # status-colored
    │   │   ├── Chip.jsx                  # selectable + removable variants
    │   │   ├── Pill.jsx
    │   │   └── Skeleton.jsx
    │   ├── data/
    │   │   ├── DataTable.jsx             # TanStack Table — sort, paginate, sticky header
    │   │   ├── Pagination.jsx
    │   │   ├── FilterBar.jsx             # chip-based applied filters + filter drawer
    │   │   ├── EmptyState.jsx
    │   │   └── ErrorState.jsx
    │   ├── views/                        # the multi-view switcher set
    │   │   ├── ViewSwitcher.jsx          # Grid | Card | Kanban
    │   │   ├── GridView.jsx              # DataTable wrapper
    │   │   ├── CardView.jsx              # responsive card grid
    │   │   └── KanbanBoard.jsx           # status columns, read-only
    │   ├── forms/
    │   │   ├── Wizard.jsx                # generic stepper-driven multi-step form
    │   │   ├── WizardStep.jsx
    │   │   └── ReasonPicker.jsx          # chip list + "Other" → textarea (REUSED everywhere)
    │   ├── feedback/
    │   │   ├── ConfirmDialog.jsx         # destructive confirmation
    │   │   ├── ReasonDialog.jsx          # confirm + ReasonPicker (reject/deactivate/blacklist)
    │   │   └── ToastProvider.jsx         # sonner wrapper
    │   ├── widgets/                      # dashboard widgets — composable across role dashboards
    │   │   ├── MetricTile.jsx
    │   │   ├── HeroWidget.jsx            # gradient hero like reference
    │   │   ├── ActivityFeed.jsx
    │   │   ├── PendingList.jsx           # generic "items awaiting action" list
    │   │   ├── TrendLineChart.jsx        # Recharts line
    │   │   ├── SpendBarChart.jsx
    │   │   ├── DonutChart.jsx
    │   │   └── StatusBreakdown.jsx
    │   └── icons/
    │       └── index.js                  # re-exports lucide icons used in app
    ├── features/                          # screen-level modules, thin
    │   ├── auth/
    │   │   ├── LoginPage.jsx              # S01
    │   │   ├── ChangePasswordPage.jsx     # S03
    │   │   └── ResetPasswordModal.jsx     # S02 (admin)
    │   ├── dashboards/
    │   │   ├── BuyerDashboard.jsx         # NEW — role-specific landing
    │   │   ├── ApproverDashboard.jsx      # NEW
    │   │   ├── AdminDashboard.jsx         # NEW
    │   │   └── SpendAnalyticsPage.jsx     # S40 (deep analytics)
    │   ├── suppliers/
    │   │   ├── SupplierDirectoryPage.jsx  # S10 — view switcher
    │   │   ├── SupplierDetailPage.jsx     # S11
    │   │   ├── CreateSupplierWizard.jsx   # S12 — multi-step
    │   │   ├── EditSupplierPage.jsx       # S13
    │   │   ├── SupplierStatusActions.jsx  # S14 modals via ReasonDialog
    │   │   ├── SupplierAggregationsPage.jsx # S41
    │   │   └── PendingSupplierApprovalsPage.jsx # S54
    │   ├── purchase-orders/
    │   │   ├── PoListPage.jsx             # S20 — view switcher
    │   │   ├── PoDetailBuyerPage.jsx      # S21
    │   │   ├── CreatePoWizard.jsx         # S22 — 4 steps
    │   │   ├── EditPoPage.jsx             # S23 (DRAFT only)
    │   │   └── PoActionModals.jsx         # S24
    │   ├── approvals/
    │   │   ├── ApprovalQueuePage.jsx      # S30 — view switcher
    │   │   ├── PoDetailApproverPage.jsx   # S31
    │   │   └── RejectPoModal.jsx          # S32 via ReasonDialog
    │   ├── analytics/
    │   │   └── OperationsPage.jsx         # S42
    │   ├── users/
    │   │   ├── UserListPage.jsx           # S50
    │   │   ├── CreateUserPage.jsx         # S51
    │   │   └── EditUserPage.jsx           # S52
    │   └── errors/
    │       ├── NotFoundPage.jsx           # S05 404
    │       ├── ForbiddenPage.jsx          # S05 403
    │       └── ErrorPage.jsx              # S05 generic
    └── styles/
        ├── tokens.css                     # CSS vars — light + dark variants
        └── index.css                      # Tailwind base + global resets
```

## Design System & Theming

### Token strategy

The mocks supply `tokens.css` (dark) and the dashboard reference supplies a richer Material-3 palette. Approach:

- Define CSS custom properties in `src/styles/tokens.css` under two scopes: `:root` (light) and `.dark` (dark).
- `tailwind.config.js` maps semantic color names to `var(--…)` so every utility (`bg-surface`, `text-on-surface`, `border-outline-variant`, …) auto-switches when `.dark` is toggled on `<html>`.
- Token names mirror the dashboard reference: `background`, `surface`, `surface-container-{lowest,low,…,highest}`, `surface-variant`, `on-background`, `on-surface`, `on-surface-variant`, `outline`, `outline-variant`, `primary`, `on-primary`, `primary-container`, `on-primary-container`, `secondary`, `tertiary`, `error`, `error-container`, etc.
- Type scale ported verbatim from the reference: `display-lg`, `headline-md`, `title-sm`, `body-base` (13px — the global default), `body-sm`, `label-caps`, `data-mono`.
- Spacing tokens: `container-padding (24px)`, `widget-gap (16px)`, `sidebar-width (240px)`, `sidebar-collapsed (64px)`, `base (4px)`.
- Body font-size pinned to 13px globally via `body { @apply text-body-base; }`.

### Theme toggle (new requirement)

- `themeStore` (Zustand) holds `theme: 'light' | 'dark' | 'system'`, persisted to `localStorage`.
- `<ThemeToggle>` in the topbar is a tri-state segmented control (Sun / Monitor / Moon icons from lucide-react). Clicking cycles or shows a small popover.
- A `useTheme` hook applies the effective theme (`system` → resolves via `matchMedia('(prefers-color-scheme: dark)')`) by toggling the `dark` class on `<html>`. A `matchMedia` change listener updates when in `system` mode.
- Default on first visit: `system`.
- All components must be authored using semantic Tailwind classes (`bg-surface`, never `bg-[#1e1e1e]`) so light/dark switches cleanly.

### Iconography & favicon

- All icons via `lucide-react` (SVG). Convention: `import { ShoppingCart, Users, … } from 'lucide-react'`.
- No emojis anywhere in the UI copy or code.
- `public/favicon.svg`: a procurement glyph — a stylized clipboard with a checkmark inside, sized to render crisply at 16/32/180px, themed to use the primary accent.

## Reusable Components — How They Compose

| Reused by | Component |
|---|---|
| All directories (S10, S20, S30, S50, S54) | `DataTable`, `FilterBar`, `Pagination`, `EmptyState`, `ViewSwitcher`, `GridView`/`CardView`/`KanbanBoard` |
| Create Supplier (S12), Create PO (S22) | `Wizard`, `WizardStep`, `Field`, `Input`, `Select` |
| All reject/deactivate/blacklist flows (S14, S24, S32) | `ReasonDialog` → `ReasonPicker` (chips + "Other" textarea) |
| All destructive transitions (cancel, close, fulfill, delete) | `ConfirmDialog` |
| Dashboards (Buyer/Approver/Admin), S40, S42 | `HeroWidget`, `MetricTile`, `TrendLineChart`, `SpendBarChart`, `DonutChart`, `StatusBreakdown`, `ActivityFeed`, `PendingList` |
| Status display anywhere | `Badge` (driven by `poStatus.js` / `supplierStatus.js` constants) |
| All forms | `Field`, `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup`, RHF + Zod |

### Reason chip catalogs (`constants/reasons.js`)

```js
export const REASONS = {
  PO_REJECT: ['Insufficient justification', 'Over budget', 'Wrong supplier', 'Specifications unclear', 'Duplicate order'],
  SUPPLIER_DEACTIVATE: ['Quality concerns', 'Compliance gap', 'Inactive partnership', 'Pricing dispute'],
  SUPPLIER_BLACKLIST: ['Legal/compliance breach', 'Repeated quality failures', 'Fraud suspicion', 'Sanctions match'],
  PO_CANCEL: ['Requirement changed', 'Budget pulled', 'Duplicate order', 'Supplier unavailable'],
};
```

`<ReasonPicker>` renders these as `<Chip selectable>` items. Selecting "Other" reveals a `<Textarea>` whose value is submitted in place of the chip. Required-reason flag is per usage.

## Multi-view Switcher (Grid / Card / Kanban)

Used by Supplier Directory (S10), PO List (S20), Approval Queue (S30):

- `<ViewSwitcher value onChange>` — segmented control with Grid (default), Card, Kanban icons.
- View choice is persisted by screen key in `viewPrefsStore` (localStorage) and overridable via `?view=card` query param (URL wins for shareability).
- `GridView` uses `DataTable` (TanStack Table).
- `CardView` renders a responsive `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3` of `Card` components with the same items.
- `KanbanBoard` groups by status (read-only): PO columns = DRAFT / SUBMITTED / APPROVED / FULFILLED / CLOSED; Supplier columns = PENDING_APPROVAL / ACTIVE / INACTIVE / BLACKLISTED. Clicking a card opens its detail page where transitions occur via existing modals — no drag-to-transition.

## Role-Aware Dashboards (new requirement)

Each dashboard reuses the reference layout pattern: optional hero/banner → 4-up KPI strip → two-column list/feed → charts row. All widgets come from `components/widgets/`.

### `BuyerDashboard.jsx`
Hero: "Create a Purchase Order" CTA → S22.
KPIs: My Drafts · Awaiting Approval · Approved (open) · YTD Spend (mine).
Left column: My Recent POs (`PendingList` of latest 8, click → S21).
Right column: My Rejected POs needing revision (`PendingList` filtered REJECTED).
Charts: My monthly spend trend (`TrendLineChart`), My spend by category (`SpendBarChart`).
Data source: `poApi` list with `buyer_id=me` + aggregations filtered to current user.

### `ApproverDashboard.jsx`
Hero: "You have N POs awaiting your approval" → S30. Hero hidden if N=0.
KPIs: Pending Approvals · Approved this week · Avg approval cycle time · Approval limit headroom.
Left column: Top of Approval Queue (`PendingList` of next 8 within approval_limit, click → S31).
Right column: Recently approved by me (`ActivityFeed`).
Charts: Pending approvals by supplier (`DonutChart`), weekly throughput (`TrendLineChart`).
Data source: `poApi` `/aggregations/pending-approvals` + `/aggregations/cycle-time`.

### `AdminDashboard.jsx`
Hero: System health snapshot — Pending supplier approvals + Active users + Open POs.
KPIs: Total spend YTD · Active suppliers · Pending supplier approvals · Active users.
Left column: Pending supplier approvals (`PendingList`, click → S11 with admin actions).
Right column: System activity (`ActivityFeed` — recent user creations, status changes).
Charts: Spend by category (`SpendBarChart`), supplier status breakdown (`StatusBreakdown`), monthly spend (`TrendLineChart`).
Data source: cross-service aggregations.

### Landing routing

`<LandingRedirect>` reads `authStore.user.roles` and chooses:
- ADMIN → `/dashboard/admin`
- APPROVER (no admin) → `/dashboard/approver`
- BUYER (no approver/admin) → `/dashboard/buyer`

Multi-role users land on the highest-privilege dashboard but can navigate to others via the sidebar (each is a real route).

## Routing & Permissions

```
/login                                       public
/                                            → <LandingRedirect>
/dashboard/buyer                             BUYER | APPROVER | ADMIN
/dashboard/approver                          APPROVER | ADMIN
/dashboard/admin                             ADMIN
/analytics/spend                             all roles  (S40)
/analytics/operations                        APPROVER | ADMIN  (S42)
/suppliers                                   all roles  (S10)
/suppliers/new                               BUYER | ADMIN  (S12 wizard)
/suppliers/:id                               all roles  (S11; admin sees S14 actions)
/suppliers/:id/edit                          BUYER | ADMIN  (S13)
/suppliers/aggregations                      all roles  (S41)
/suppliers/pending-approval                  ADMIN  (S54)
/purchase-orders                             all roles  (S20)
/purchase-orders/new                         BUYER  (S22)
/purchase-orders/:id                         all roles  (role-switched detail S21/S31)
/purchase-orders/:id/edit                    BUYER  (S23, DRAFT only)
/approvals                                   APPROVER | ADMIN  (S30)
/users                                       ADMIN  (S50)
/users/new                                   ADMIN  (S51)
/users/:id/edit                              ADMIN  (S52)
/account/change-password                     all auth
/403, /404, /500                             public error routes
```

`<RequireAuth>` wraps the entire authed tree, `<RequireRole roles={[…]}>` guards specific subtrees. Failure → `/403`.

## Auth & API

- Login (`POST /api/v1/auth/login`) returns JWT + user. `authStore` keeps token in memory; mirrored into `sessionStorage` under `gep.token` so tab refresh preserves session. `authStore.user` is derived from `GET /auth/me` on bootstrap.
- Axios request interceptor injects `Authorization: Bearer <token>` on all three instances.
- Axios response interceptor: on 401, clear store, redirect to `/login?from=…`; on 403, redirect to `/403`; on 5xx, surface a sonner toast and let TanStack Query show inline error states.
- TanStack Query defaults: `staleTime: 30s`, `gcTime: 5min`, `retry: 1`. Mutations invalidate canonical query keys defined in `api/queryKeys.js`.

## Wizards

`<Wizard>` is a generic stepper that takes `{ steps: [{ id, label, schema, render }], onComplete }`. Each step has its own Zod schema; aggregate form state is held in RHF. Used by:

- **Create Supplier (S12)** — 4 steps: Identity (codes, names, category) → Contact & Address → Commercial (tax, payment terms, currency) → Compliance & Review (certifications, tags, submit).
- **Create PO (S22)** — 4 steps: Supplier (typeahead, ACTIVE only) → Line Items → Delivery & Terms → Review & Submit.

Step navigation Back/Next; final step shows a read-only summary; Submit triggers the create mutation.

## Phased Delivery

### Phase 1 — Foundation (project scaffold + design system)
- Vite + React + Tailwind scaffold with the directory structure above.
- Standard files: `.gitignore`, `.dockerignore`, MIT `LICENSE`, `README.md` (stack, setup, env vars, scripts), `CHANGELOG.md` (Keep-a-Changelog), `CONTRIBUTING.md`, `TROUBLESHOOTING.md`.
- `Dockerfile` (multi-stage: `node:20-alpine` build → `nginx:1.27-alpine` runtime, no HEALTHCHECK, copies `dist/` to `/usr/share/nginx/html`, custom `nginx.conf` for SPA fallback + gzip).
- `docker-compose.yml` (no `version:` key, single service, port mapping, env file).
- `tailwind.config.js` with token mapping + `darkMode: "class"` + body-base 13px default.
- `src/styles/tokens.css` (light + dark CSS variables).
- `public/favicon.svg` (custom clipboard-check glyph).
- `<AppShell>`, `<Sidebar>` (collapsed 64px icon rail mirroring reference), `<Topbar>` with `<ThemeToggle>`.
- All primitive components (Button, Input, Field, Card, Modal, Badge, Chip, Tabs, Tooltip, Skeleton).
- `<ToastProvider>` (sonner), `<ConfirmDialog>`, `<ReasonDialog>`, `<ReasonPicker>`.
- Axios instances + JWT interceptor + TanStack Query setup.
- Zustand stores: `authStore`, `themeStore`, `viewPrefsStore`.
- React Router skeleton with `RequireAuth`, `RequireRole`, error pages, `<LandingRedirect>`.

### Phase 2 — Auth & Shell
- `LoginPage` (S01) wired to `POST /auth/login`.
- Auth bootstrap (`/auth/me` on load) and token refresh path.
- `ChangePasswordPage` (S03), `ResetPasswordModal` (S02 — admin).
- Sidebar items hidden by role; theme toggle live; error routes (S05).
- Three empty role dashboards routable and landing redirect working.

### Phase 3 — Suppliers
- `DataTable`, `FilterBar`, `Pagination`, `EmptyState` complete.
- `ViewSwitcher` + `GridView` + `CardView` + `KanbanBoard` complete.
- Supplier directory (S10) with all three views, filters, search.
- Supplier detail + scorecard (S11) with admin action buttons → `ReasonDialog` (S14).
- Create Supplier wizard (S12) using `<Wizard>`.
- Edit Supplier (S13).
- Supplier Aggregations (S41).
- Pending Supplier Approvals (S54).

### Phase 4 — Purchase Orders & Approvals
- PO List (S20) — all three views, "My POs" vs "All POs" toggle.
- PO Detail (S21 buyer, S31 approver — same page component, action set switches by role).
- Create PO wizard (S22) with live totals on line-items step, supplier typeahead, threshold preview on review step.
- Edit PO (S23, DRAFT only).
- PO Action Modals (S24 — Submit/Cancel/Fulfill/Close/Revise via `ConfirmDialog` and `ReasonDialog`).
- Approval Queue (S30) with bulk approve, all three views.
- Reject PO modal (S32) via `ReasonDialog`.

### Phase 5 — Analytics, Admin & Role Dashboards
- Spend Analytics (S40) — full set of widgets, time-range selector, drill-through.
- Operations (S42) — pending approvals + cycle time.
- User Management (S50/S51/S52).
- Role-aware dashboards complete (Buyer / Approver / Admin), wired to real aggregation endpoints.
- Polish pass: empty states, error boundaries, loading skeletons everywhere, accessibility audit (focus rings, keyboard nav, ARIA roles).
- Final container image + deployment docs.

## Critical Files to Create or Modify

- `tailwind.config.js` — `darkMode: "class"`, semantic colors from CSS vars, custom spacing/typography from reference.
- `src/styles/tokens.css` — `:root` (light) + `.dark` (dark) variants of every token.
- `src/components/layout/AppShell.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `ThemeToggle.jsx` — shell mirroring the reference HTML.
- `src/components/forms/Wizard.jsx`, `WizardStep.jsx`, `ReasonPicker.jsx` — used by both supplier and PO flows plus all status transition modals.
- `src/components/views/{ViewSwitcher,GridView,CardView,KanbanBoard}.jsx` — used by S10, S20, S30.
- `src/components/widgets/*` — used by all four dashboards (Buyer/Approver/Admin/S40).
- `src/constants/{poStatus,supplierStatus,reasons,roles}.js` — single source of truth for status metadata, transitions, badge colors, reason chips.
- `src/api/{authApi,supplierApi,poApi}.js` — strictly mirror the three OpenAPI specs.
- `src/routes/index.jsx` — full route table with `RequireRole` guards.
- `src/features/dashboards/{BuyerDashboard,ApproverDashboard,AdminDashboard}.jsx` — three new dashboards composing widgets.
- `Dockerfile`, `docker-compose.yml`, `nginx.conf` — multi-stage slim nginx image, no HEALTHCHECK, no compose `version:` key.
- `public/favicon.svg` — custom SVG.

## Verification

End-to-end checks per phase:
1. `npm run dev` boots; theme toggle flips entire UI between light/dark with no flashes; body text is 13px.
2. Log in as each role → lands on its role-specific dashboard; sidebar shows only permitted items.
3. Supplier directory: Grid → Card → Kanban toggle works, preference persists across reload, `?view=` URL override wins.
4. Create Supplier wizard: validation on each step; submission lands supplier in PENDING_APPROVAL; admin sees it in S54.
5. Create PO wizard: line-item totals update live; submit moves PO to SUBMITTED; approver sees it in S30.
6. Approve / Reject / Deactivate / Blacklist: `ReasonDialog` shows predefined chips + "Other" textarea; reason submitted server-side; status updates and badge changes.
7. `npm run build && docker build .` produces an image < 60 MB; `docker compose up` serves the SPA with deep-link refresh working (nginx SPA fallback).
8. No emojis present in source; all icons render as SVG; favicon visible in browser tab in both themes.
