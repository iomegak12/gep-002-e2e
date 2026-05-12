# Supplier Service — Overview

**Path:** `supplier-service/` · **Stack:** Python 3 + FastAPI + MongoDB · **Port:** `3002` · **Base URL:** `/api/v1`

## Responsibilities

- **Supplier master** — CRUD over the supplier collection, soft-deletion via `deleted_at`.
- **Status lifecycle** — `PENDING_APPROVAL → ACTIVE → INACTIVE` (plus `BLACKLISTED`) with role-guarded transitions; see [State Machine](state-machine.md).
- **Aggregations** — counts and rollups by status, country, category for analytics dashboards.

## Layout

| Path | Purpose |
|---|---|
| `supplier-service/app/main.py` | FastAPI app, CORS, health, OpenAPI mount. |
| `supplier-service/app/routers/suppliers.py` | All `/suppliers/*` endpoints. |
| `supplier-service/app/models.py` | Pydantic schemas (`Supplier`, `SupplierCreate`, …). |
| `supplier-service/app/state_machine.py` | Allowed status transitions table. |
| `supplier-service/app/auth.py` | JWT verification & role guard. |
| `supplier-service/app/db.py` | Motor (async MongoDB) client + index setup. |

## Consumers

- `po-service` calls `GET /api/v1/suppliers/{id}` synchronously when creating a PO to verify the supplier is `ACTIVE`.
- All other reads/writes are driven by buyers/admins via the front-end.

## OpenAPI

FastAPI auto-generates the spec; available live at <http://localhost:3002/api/v1/openapi.json> and rendered in this site at [API Reference](api.md).
