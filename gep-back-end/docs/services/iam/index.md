# IAM Service — Overview

**Path:** `iam/` · **Stack:** Node.js + Express + Postgres · **Port:** `3001` · **Base URL:** `/api/v1`

## Responsibilities

- **Authentication** — verify email/password, issue HS256 JWT access tokens (24h, no refresh).
- **User management (Admin)** — create users, assign roles, set approval limits, reset passwords.
- **Self-service** — change own password, fetch own profile (`/auth/me`).

It is the **only token issuer** in the platform; `supplier-service` and `po-service` validate tokens locally using the shared `JWT_SECRET`.

## Layout

| Path | Purpose |
|---|---|
| `iam/src/server.js` | Express bootstrap, middleware wiring, Swagger UI mount. |
| `iam/src/routes.js` | All HTTP route handlers (auth + admin users). |
| `iam/src/jwt.js` | Sign / verify HS256 tokens. |
| `iam/src/middleware.js` | Bearer-token auth, role guard, error mapper. |
| `iam/src/db.js` | `pg` pool + bootstrap admin on first boot. |
| `iam/src/openapi.js` | Hand-written OpenAPI 3.0 spec. |
| `iam/migrations/001_init.sql` | Single `users` table. |

## Roles

- `BUYER` — can create POs.
- `APPROVER` — can approve POs up to their `approval_limit`.
- `ADMIN` — full user / supplier admin.

A user can hold any combination.

## Bootstrap admin

On first boot, `iam` reads `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` from the environment and creates the first ADMIN user if no users exist. After that, further admins are created via the API.
