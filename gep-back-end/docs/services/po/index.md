# PO Service — Overview

**Path:** `po-service/` · **Stack:** Node.js + Express + Prisma + Postgres · **Port:** `3003` · **Base URL:** `/api/v1`

## Responsibilities

- **Purchase order CRUD** with a strict lifecycle (`DRAFT → SUBMITTED → APPROVED → FULFILLED`, plus `REJECTED` / `CANCELLED`).
- **Approval routing** — POs above the configured threshold require an approver whose `approval_limit` ≥ the PO total.
- **Search & list** — paginated list with filters on status, supplier, buyer, date range.
- **Aggregations** — spend-by-category, spend-by-supplier, counts by status; see [Aggregations & Search](aggregations.md).

## Layout

| Path | Purpose |
|---|---|
| `po-service/src/main.js` | Express bootstrap, Swagger mount. |
| `po-service/src/purchase-orders/` | Routes + service logic for the PO lifecycle. |
| `po-service/src/aggregations/` | Spend rollups. |
| `po-service/src/search/` | List/search endpoint with filters. |
| `po-service/src/auth/` | JWT verification middleware + role guards. |
| `po-service/src/common/` | Error model, pagination, validation helpers. |
| `po-service/src/openapi.js` | Hand-written OpenAPI 3.0 spec. |
| `po-service/prisma/schema.prisma` | Postgres schema (PurchaseOrder, POLineItem, PoNumberSeq). |

## Dependencies on other services

- Calls `supplier-service` to verify a supplier is `ACTIVE` before allowing a draft to reference it.
- Reads `iam`-issued JWTs but never calls `iam` directly.

## PO numbering

POs receive a human-friendly `po_number` like `PO-2026-000001`, generated from the `PoNumberSeq` table (per-year counter).
