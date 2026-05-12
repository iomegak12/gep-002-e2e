# Environment Variables

Copy `.env.example` to `.env` before running `docker compose up`. All services read from the same file via docker-compose.

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `JWT_SECRET` | all | `dev-only-change-me-...` | HS256 signing secret. Min 32 chars. |
| `JWT_ISSUER` | all | `gep-auth` | `iss` claim issued by `iam`, validated by consumers. |
| `ACCESS_TOKEN_TTL_SECONDS` | iam | `86400` (24h) | Access-token lifetime. No refresh tokens in v1. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | postgres | `gep` / `gep` | Shared Postgres credentials. |
| `POSTGRES_HOST` / `POSTGRES_PORT` | iam, po | `postgres` / `5432` | Postgres host inside the compose network. |
| `AUTH_DATABASE_URL` | iam | `postgresql://gep:gep@postgres:5432/auth` | IAM's logical DB. |
| `PO_DATABASE_URL` | po | `postgresql://gep:gep@postgres:5432/po` | PO service's logical DB. |
| `MONGODB_URL` | supplier | `mongodb://mongo:27017` | Mongo connection string. |
| `MONGODB_DB` | supplier | `suppliers` | Mongo database name. |
| `AUTH_SERVICE_URL` | seed | `http://iam:3001/api/v1` | Inside-compose URL used by the seeder. |
| `SUPPLIER_SERVICE_URL` | seed, po | `http://supplier-service:3002/api/v1` | PO service uses this to validate suppliers. |
| `PO_SERVICE_URL` | seed | `http://po-service:3003/api/v1` | Used only by the seeder. |
| `DEFAULT_APPROVAL_THRESHOLD` | po | `100000` | Threshold above which a PO requires an approver. |
| `CORS_ORIGINS` | all | `http://localhost:3000,http://localhost:5173` | Comma-separated allow-list. |

Snippet of the example file as committed:

```env title=".env.example"
--8<-- ".env.example"
```
