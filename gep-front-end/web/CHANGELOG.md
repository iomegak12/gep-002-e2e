# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phase 4 purchase orders & approvals: PO List (S20) with Grid / Card / Kanban views, "My POs / All POs" scope toggle, status / amount / date-range filters and KPI strip. PO Detail (S21/S31) is a single page with a role-switched action bar (Submit / Revise / Fulfill / Close / Cancel for buyers; Approve / Reject for approvers; both for admins) wired to `ConfirmDialog`, `ReasonDialog` and a custom fulfillment-date modal. Status timeline visualises DRAFT → SUBMITTED → APPROVED → FULFILLED → CLOSED with REJECTED / CANCELLED shown as a banner. Create PO Wizard (S22) — 4 steps with live subtotal / tax / grand total in the line-items editor and a final review summary. Edit PO (S23) — header-level update for DRAFT POs only. Approval Queue (S30) with checkbox bulk approve, single-row Approve / Reject actions, and approver-limit filtering.
- Reusable PO widgets: `SupplierTypeahead` (ACTIVE-only async combobox, hydrates from a supplier id), `LineItemsEditor` (dynamic table with per-row live totals using `useWatch`), `POStatusBadge`, `POStatusActions` (role-switched action bar with all transition modals), `POCard`, `usePOColumns`.

### Added
- Phase 3 suppliers: Supplier Directory (S10) with Grid / Card / Kanban views, filter chips, KPI strip, server-side pagination. Supplier Detail + Scorecard (S11) with admin status-action buttons (Approve / Deactivate / Reactivate / Blacklist) wired to `ReasonDialog` and `ConfirmDialog`. Create Supplier Wizard (S12) with 4 steps (Identity → Contact & address → Commercial → Compliance & review). Edit Supplier (S13) reuses the wizard with supplier_code locked. Pending Supplier Approvals worklist (S54). Supplier Aggregations (S41) with Recharts pie + bar charts for category / country / status / top rated.
- Reusable data components: `DataTable` (TanStack Table v8), `Pagination`, `EmptyState`, `ErrorState`, `FilterBar`, `KpiStrip`.
- Reusable view components: `ViewSwitcher`, `GridView`, `CardView`, `KanbanBoard`, and `useViewMode` hook (URL `?view=` wins, localStorage falls back).
- Reusable generic `Wizard` driven by react-hook-form with per-step field validation via Zod.
- Backend health indicator in the topbar with a per-service status modal (polls `/health` every 30 s).

### Added
- Phase 2 auth & shell: Login (S01) with RHF + Zod + axios mutation, Change password (S03), admin Reset password modal (S02). Role-specific dashboard scaffolds (Buyer / Approver / Admin) with hero + 4-up KPI strip + two-column layout. Shared widgets `MetricTile`, `HeroWidget`, and reusable `Brand` mark.

### Changed
- Tuned dark mode tokens to the warm canvas + amber accent palette from `gep-front-end/docs/mocks/tokens.css`. Light mode primary shifted to a warm amber to keep brand identity consistent across themes.

### Added
- Phase 1 foundation: Vite + React 18 + Tailwind scaffold with light/dark design tokens.
- App shell (icon-rail sidebar + topbar with theme toggle), primitive component library, and feedback components (ConfirmDialog, ReasonDialog, ReasonPicker, ToastProvider).
- API layer with three axios instances, JWT interceptor and TanStack Query client.
- Zustand stores for auth, theme and per-screen view preferences.
- React Router skeleton with `RequireAuth`, `RequireRole`, `LandingRedirect` and 403/404/500 error pages.
- Multi-stage slim nginx Dockerfile, docker-compose, and SPA-fallback nginx.conf.
- Standard project files: LICENSE (MIT), README, CHANGELOG, CONTRIBUTING, TROUBLESHOOTING, .gitignore, .dockerignore.
