# Authentication & JWT

A single auth scheme spans all three services.

## Scheme at a glance

| Property | Value |
|---|---|
| Algorithm | **HS256** (shared symmetric secret) |
| Secret | `JWT_SECRET` env var, ≥32 chars |
| Issuer (`iss`) | `gep-auth` |
| Audience (`aud`) | `gep-supplier` for supplier-service, `gep-po` for po-service. IAM accepts its own tokens without an `aud` requirement. |
| Token type | Access token only — **no refresh tokens** in v1 |
| TTL | `ACCESS_TOKEN_TTL_SECONDS` (default `86400` = 24h) |
| Header | `Authorization: Bearer <token>` |
| Login endpoint | `POST /api/v1/auth/login` on iam |

> Why HS256 not RS256? The spec deliberately trades JWKS / key rotation complexity for fewer moving parts at v1 scale. Rotation requires a coordinated restart with a new `JWT_SECRET`.

## Token shape

```json
{
  "iss": "gep-auth",
  "aud": "gep-po",
  "sub": "8e8e0e58-...-uuid",
  "email": "buyer@demo.local",
  "roles": ["BUYER"],
  "approval_limit": null,
  "iat": 1700000000,
  "exp": 1700086400
}
```

`roles` and `approval_limit` are **embedded** at login time and trusted by the downstream services without callback. A role change in `iam` only takes effect once the user logs in again (max 24h).

## Authorization model

- **Role guard** — endpoints declare a required role (`BUYER`, `APPROVER`, `ADMIN`). 401 if no/invalid token, 403 if the role is missing.
- **Ownership guard** — buyer-scoped writes (e.g. submit a draft PO) require `buyer_id == sub`.
- **Approval-limit guard** — `approve` on po-service checks `approval_limit ≥ total_amount`; otherwise `403 APPROVAL_LIMIT_EXCEEDED`.

## CORS

Each service reads `CORS_ORIGINS` (comma-separated) and applies the same allow-list. Default: `http://localhost:3000,http://localhost:5173`.
