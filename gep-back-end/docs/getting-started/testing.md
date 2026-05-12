# Running Tests

End-to-end tests live in `tests/` (at the repo root) and exercise all three services against a running `docker compose` stack.

```powershell
# from gep-back-end/
docker compose up -d
cd tests
npm install
npm test
```

The suite is **Jest-based** and uses HTTP only — no direct DB access. Each spec logs in through `iam`, then drives `supplier-service` and `po-service` via their public APIs.

## What the tests cover

- **Auth** — login, JWT validation, role enforcement, password change/reset.
- **Supplier lifecycle** — create → activate → deactivate → blacklist; invalid transitions return `409 INVALID_STATUS_TRANSITION`.
- **PO lifecycle** — draft → submit → approve → fulfill; approval-limit routing; supplier-must-be-active guard.
- **Aggregations** — spend-by-category and spend-by-supplier produce expected totals against seeded data.

## Resetting between runs

```powershell
docker compose down -v
docker compose up --build
```

Removing the volumes guarantees fresh seed data; otherwise the seeder will skip if data already exists.
