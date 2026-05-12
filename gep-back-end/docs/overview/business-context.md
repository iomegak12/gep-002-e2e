# Business Context & Personas

> Distilled from the [full Technical Specification](../GEP_SCM_Platform_Technical_Specification.md). See that document for the authoritative source.

## Problem

Mid-market procurement teams typically juggle:

- **Supplier sprawl** — supplier records live in spreadsheets, ERPs and email; no single source of truth for status (active vs. pending approval) or category.
- **Opaque purchase-order workflow** — POs created in ERPs lack a lightweight, auditable approval path; approvers learn of requests via email.
- **No spend visibility** — leadership cannot answer "how much did we commit, by category, this quarter?" without manual extracts.

The GEP-SCM platform addresses the **operational core** of these three pain points: a curated supplier master, a PO lifecycle with role-based approvals, and built-in aggregations for spend analytics.

## Personas

| Persona | Goals | Primary touch-points |
|---|---|---|
| **Buyer** | Create purchase orders, find suppliers, track approvals on their POs. | `po-service`, `supplier-service` (read) |
| **Approver** | Review POs queued for their approval limit and approve / reject. | `po-service` |
| **Admin** | Onboard users, manage roles & approval limits, onboard / activate suppliers. | `iam`, `supplier-service` |

Roles are encoded in JWTs issued by `iam`. A user can hold multiple roles (e.g. ADMIN + BUYER).

## Scope (v1)

In scope:

- Email/password auth, HS256 JWT, role-based access.
- Supplier CRUD with a small lifecycle (`PENDING_APPROVAL` → `ACTIVE` → `INACTIVE`).
- PO CRUD with a draft → submitted → approved → fulfilled lifecycle and approval-limit routing.
- Aggregation endpoints for spend-by-category, spend-by-supplier, supplier counts by status/category.

Out of scope (deferred):

> Multi-tenancy, file attachments, event streams, M2M tokens, mTLS, supplier portal, audit tables, i18n.
