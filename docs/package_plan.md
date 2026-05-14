# Unified Docker Compose + Build/Push/Run Pipeline

## Context

Today the GEP project ships two separate compose files: [gep-back-end/docker-compose.yml](gep-back-end/docker-compose.yml) (Postgres, Mongo, IAM, supplier-service, po-service, seed, CloudBeaver, mongo-express) and [gep-front-end/web/docker-compose.yml](gep-front-end/web/docker-compose.yml) (nginx-served SPA). Both depend on external `.env` files, use healthchecks, and the frontend is wired to backend services only via host-mapped ports baked into the build.

The goal is a single, self-contained dev compose at the repo root plus a registry-friendly prod compose, an `iomega/*:latest` image tagging scheme, and a PowerShell driver script for build/push/run automation.

## Deliverables (all at repo root)

1. [docker-compose.yml](docker-compose.yml) — unified dev stack with build contexts
2. [docker-compose-prod.yml](docker-compose-prod.yml) — image-only, registry pull
3. [build-push-run.ps1](build-push-run.ps1) — automation script
4. [gep-front-end/web/nginx.conf](gep-front-end/web/nginx.conf) — updated to reverse-proxy `/iam`, `/supplier`, `/po`

---

## 1. Unified `docker-compose.yml` (dev)

### Services (single user-defined network `gep-network`, driver `bridge`)

| Service | Image tag | Build context | Host port | Volume |
|---|---|---|---|---|
| postgres | `postgres:16-alpine` | — | 5432 | `pgdata` |
| mongo | `mongo:7` | — | 27017 | `mongodata` |
| iam | `iomega/gep-iam:latest` | `./gep-back-end/iam` | 3001 | — |
| supplier-service | `iomega/gep-supplier-service:latest` | `./gep-back-end/supplier-service` | 3002 | — |
| po-service | `iomega/gep-po-service:latest` | `./gep-back-end/po-service` | 3003 | — |
| seed | `iomega/gep-seed:latest` | `./gep-back-end/seed` | — | — |
| web | `iomega/gep-web:latest` | `./gep-front-end/web` | 8080:80 | — |
| cloudbeaver | `dbeaver/cloudbeaver:latest` | — | 8978 | `cloudbeaver_data` |
| mongo-express | `mongo-express:latest` | — | 8081 | — |

### Inlined environment defaults (no `.env` dependency)

Global / shared:
- `JWT_SECRET=dev-super-secret-change-me`
- `JWT_ISSUER=gep-iam`
- `ACCESS_TOKEN_TTL_SECONDS=3600`
- `CORS_ORIGINS=http://localhost:8080`
- `POSTGRES_USER=gep`, `POSTGRES_PASSWORD=gep`, `POSTGRES_DB=postgres`

Per-service:
- `iam`: `PORT=3001`, `DATABASE_URL=postgres://gep:gep@postgres:5432/iam`, `BOOTSTRAP_ADMIN_EMAIL=admin@demo.local`, `BOOTSTRAP_ADMIN_PASSWORD=Passw0rd!`
- `supplier-service`: `PORT=3002`, `MONGODB_URL=mongodb://mongo:27017`, `MONGODB_DB=gep_supplier`, `JWT_AUDIENCE=gep-supplier`
- `po-service`: `PORT=3003`, `DATABASE_URL=postgres://gep:gep@postgres:5432/po`, `JWT_AUDIENCE=gep-po`, `SUPPLIER_SERVICE_URL=http://supplier-service:3002`, `DEFAULT_APPROVAL_THRESHOLD=10000`
- `seed`: `AUTH_SERVICE_URL=http://iam:3001`, `SUPPLIER_SERVICE_URL=http://supplier-service:3002`, `PO_SERVICE_URL=http://po-service:3003`
- `mongo-express`: `ME_CONFIG_MONGODB_URL=mongodb://mongo:27017/`, `ME_CONFIG_BASICAUTH=false`

### `web` service build args (Vite bakes at build time)
Use **relative URLs** so nginx can reverse-proxy:
```yaml
build:
  context: ./gep-front-end/web
  args:
    VITE_AUTH_URL: /iam
    VITE_SUPPLIER_URL: /supplier
    VITE_PO_URL: /po
```
Frontend currently reads these via `import.meta.env.VITE_*_URL` in [gep-front-end/web/src/api/axios.js](gep-front-end/web/src/api/axios.js) and [gep-front-end/web/src/api/healthApi.js](gep-front-end/web/src/api/healthApi.js). Vite picks env vars from build env — Dockerfile must accept them as `ARG` and re-export as `ENV` before `npm run build`.

### Removed
- All `healthcheck:` blocks
- All `condition: service_healthy` on depends_on (replaced with plain list form)

### depends_on (start-order only)
- `iam` → `postgres`
- `supplier-service` → `mongo`
- `po-service` → `postgres`, `supplier-service`
- `seed` → `iam`, `supplier-service`, `po-service`
- `web` → `postgres`, `mongo`, `iam`, `supplier-service`, `po-service`
- `cloudbeaver` → `postgres`
- `mongo-express` → `mongo`

### Network
```yaml
networks:
  gep-network:
    driver: bridge
```
Every service joins `gep-network`.

### Volumes
```yaml
volumes:
  pgdata:
  mongodata:
  cloudbeaver_data:
```

---

## 2. `docker-compose-prod.yml`

Identical service list, environment, ports, depends_on, network, and volumes as dev — **but**:
- No `build:` blocks anywhere
- `iam`, `supplier-service`, `po-service`, `seed`, `web` use `image: iomega/gep-*:latest` only
- DB and admin-UI services unchanged (already image-based)

---

## 3. Frontend Dockerfile + nginx.conf changes

### [gep-front-end/web/Dockerfile](gep-front-end/web/Dockerfile)
Add build args before `npm run build`:
```dockerfile
ARG VITE_AUTH_URL=/iam
ARG VITE_SUPPLIER_URL=/supplier
ARG VITE_PO_URL=/po
ENV VITE_AUTH_URL=$VITE_AUTH_URL \
    VITE_SUPPLIER_URL=$VITE_SUPPLIER_URL \
    VITE_PO_URL=$VITE_PO_URL
```

### [gep-front-end/web/nginx.conf](gep-front-end/web/nginx.conf)
Add three `location` blocks before `location /`:
```nginx
location /iam/      { proxy_pass http://iam:3001/; }
location /supplier/ { proxy_pass http://supplier-service:3002/; }
location /po/       { proxy_pass http://po-service:3003/; }
```
With standard `proxy_set_header Host`, `X-Forwarded-For`, `X-Forwarded-Proto`. The trailing `/` strips the prefix so backends see clean paths.

---

## 4. `build-push-run.ps1`

### Parameters
```powershell
param(
  [string]$DockerHubPAT = $env:DOCKERHUB_PAT,
  [string]$DockerHubUser = "iomega",
  [switch]$SkipBuild,
  [switch]$SkipPush
)
```

### Behavior
1. **Validate PAT**: If `$DockerHubPAT` empty AND neither `-SkipBuild` nor `-SkipPush` (i.e., push is needed), error with usage hint. If only running (`-SkipBuild -SkipPush`), PAT not required.
2. **Login** (only if pushing): `$DockerHubPAT | docker login -u $DockerHubUser --password-stdin`
3. **Build** (unless `-SkipBuild`): `docker compose -f docker-compose.yml build`
4. **Push** (unless `-SkipPush`): push each of the 5 app images:
   - `iomega/gep-iam:latest`
   - `iomega/gep-supplier-service:latest`
   - `iomega/gep-po-service:latest`
   - `iomega/gep-seed:latest`
   - `iomega/gep-web:latest`
5. **Run prod**: `docker compose -f docker-compose-prod.yml down` then `docker compose -f docker-compose-prod.yml up -d`
6. **Logout** if logged in.

### Usage examples
```powershell
# Full build + push + run prod (PAT from env)
$env:DOCKERHUB_PAT = "dckr_pat_xxx"; ./build-push-run.ps1

# Pass PAT as arg
./build-push-run.ps1 -DockerHubPAT "dckr_pat_xxx"

# Just run prod (skip build & push) — pulls from Docker Hub
./build-push-run.ps1 -SkipBuild -SkipPush

# Build locally then run, no push
./build-push-run.ps1 -SkipPush
```

Use `$ErrorActionPreference = 'Stop'` and check `$LASTEXITCODE` after each `docker` call.

---

## Critical files to create/modify

| Path | Action |
|---|---|
| [docker-compose.yml](docker-compose.yml) (root) | Create |
| [docker-compose-prod.yml](docker-compose-prod.yml) (root) | Create |
| [build-push-run.ps1](build-push-run.ps1) (root) | Create |
| [gep-front-end/web/Dockerfile](gep-front-end/web/Dockerfile) | Modify — add ARG/ENV for VITE vars |
| [gep-front-end/web/nginx.conf](gep-front-end/web/nginx.conf) | Modify — add 3 proxy `location` blocks |

Existing per-service Dockerfiles ([iam](gep-back-end/iam/Dockerfile), [supplier-service](gep-back-end/supplier-service/Dockerfile), [po-service](gep-back-end/po-service/Dockerfile), [seed](gep-back-end/seed/Dockerfile)) need **no changes** — the `image:` field on each service in the unified compose handles tagging at build time.

The existing per-folder compose files are left untouched (can be deleted later if you confirm).

---

## Verification

1. **Local build + run from scratch**
   ```powershell
   ./build-push-run.ps1 -SkipPush
   ```
   - Expect: all 5 `iomega/gep-*:latest` images built, prod stack up.
2. **UI smoke**: open `http://localhost:8080`, log in with `admin@demo.local` / `Passw0rd!`. Browser DevTools network tab should show requests going to `/iam/...`, `/supplier/...`, `/po/...` on origin `localhost:8080` (proxied internally).
3. **Backend direct check**: `curl http://localhost:3001/health`, `:3002/health`, `:3003/health` return 200.
4. **Admin UIs**: `http://localhost:8978` (CloudBeaver) and `http://localhost:8081` (mongo-express) both reachable.
5. **Push path**: `./build-push-run.ps1 -DockerHubPAT <token>` — verify images appear under `hub.docker.com/u/iomega`.
6. **Pull-only path**: on a clean machine, `./build-push-run.ps1 -SkipBuild -SkipPush` should pull from Docker Hub and bring up the prod stack.
7. **Seed verification**: `docker compose logs seed` shows successful demo-data load, then container exits 0.
