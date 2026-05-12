# Docker Compose Topology

Source: `docker-compose.yml`

## Services & ports

| Service | Image / Build | Host port | Depends on (healthy) |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | `5432` | — |
| `mongo` | `mongo:7` | `27017` | — |
| `iam` | `./iam` | `3001` | `postgres` |
| `supplier-service` | `./supplier-service` | `3002` | `mongo` |
| `po-service` | `./po-service` | `3003` | `postgres`, `supplier-service` |
| `seed` | `./seed` | — (one-shot) | `iam`, `supplier-service`, `po-service` |
| `cloudbeaver` | `dbeaver/cloudbeaver:latest` | `8978` | `postgres` |
| `mongo-express` | `mongo-express:latest` | `8081` | `mongo` |

## Healthchecks

Every long-running service has a `healthcheck` that gates `depends_on: condition: service_healthy`, so:

1. `postgres` & `mongo` come up first.
2. `iam` and `supplier-service` start once their DB is healthy.
3. `po-service` waits for both `postgres` and a healthy `supplier-service`.
4. `seed` runs once all three services report healthy, then exits.

## Volumes

| Volume | Purpose |
|---|---|
| `pgdata` | Postgres datadir — preserves users, POs across restarts. |
| `mongodata` | Mongo datadir — preserves suppliers. |
| `cloudbeaver_data` | CloudBeaver workspace (saved connections, queries). |

To reset everything:

```powershell
docker compose down -v
```

## Admin GUIs

- **CloudBeaver** (`:8978`) — browse the `auth` and `po` Postgres DBs. First-visit setup wizard; pick "Test connection" with host `postgres`, user/password `gep`/`gep`.
- **mongo-express** (`:8081`) — browse the `suppliers` Mongo DB. Basic auth is disabled in dev.
