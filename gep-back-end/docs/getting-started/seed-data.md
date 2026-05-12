# Seed Data & Demo Users

The `seed` service runs once after all three services are healthy and populates demo data through their HTTP APIs (not by writing to the databases directly). Re-running `docker compose up` does not re-seed if the data already exists.

## Demo users

All passwords are `Passw0rd!`.

| Email | Roles | Approval limit |
|---|---|---|
| `admin@demo.local` | ADMIN | — |
| `buyer@demo.local` | BUYER | — |
| `approver-hi@demo.local` | APPROVER | 1,000,000 |
| `approver-lo@demo.local` | APPROVER | 50,000 |

`admin@demo.local` is bootstrapped by `iam` itself on first boot via `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` in docker-compose. The other users are created by the seeder.

## Suppliers

A handful of suppliers across categories (IT, MRO, Services, Logistics), some `ACTIVE` and some left in `PENDING_APPROVAL` to exercise the lifecycle.

## Purchase orders

A mix of POs in `DRAFT`, `SUBMITTED`, and `APPROVED` states, with line items spanning the seeded suppliers, sized to land both above and below the low approver's `50,000` limit.

## Re-seeding

To start fresh:

```powershell
docker compose down -v   # removes pgdata and mongodata volumes
docker compose up --build
```
