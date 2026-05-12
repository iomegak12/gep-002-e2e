# PO — Aggregations & Search

## List & search

`GET /api/v1/purchase-orders` returns a paginated list with filters:

| Param | Type | Notes |
|---|---|---|
| `status` | enum | One or more comma-separated values. |
| `supplier_id` | uuid | Exact match. |
| `buyer_id` | uuid | Exact match — used for "my POs". |
| `created_from` / `created_to` | date | ISO date range on `created_at`. |
| `q` | string | Free-text on `po_number` and line `item_description`. |
| `page`, `page_size` | int | 1-based; `page_size` max 100. |
| `sort` | string | `created_at:desc` (default), `total_amount:desc`, etc. |

Backed by indexes on `status`, `supplier_id`, `buyer_id`, `created_at` (see [Data Model](data-model.md)).

## Aggregations

All aggregation endpoints accept a `period` query parameter (`mtd`, `qtd`, `ytd`, or `from=YYYY-MM-DD&to=YYYY-MM-DD`).

| Endpoint | Returns |
|---|---|
| `GET /purchase-orders/aggregations/spend-by-category?period=ytd` | `{ category: total_amount }` over approved+fulfilled POs, joining supplier categories via `supplier_snapshot`. |
| `GET /purchase-orders/aggregations/spend-by-supplier?period=ytd` | `{ supplier_id, supplier_name, total }[]` sorted by total desc. |
| `GET /purchase-orders/aggregations/counts-by-status` | `{ status: count }` over all POs. |

The category aggregation reads from the `supplier_snapshot` JSON column rather than calling `supplier-service`, so it works for historical POs even after a supplier is renamed or recategorised.

Full request/response shapes are in the [API Reference](api.md).
