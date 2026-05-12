# Local Setup

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- Python 3.10+ (only for building the docs site)
- ~2 GB free disk space for the images and volumes

## Run the platform

```powershell
# from gep-back-end/
copy .env.example .env
docker compose up --build
```

When the `seed` container exits cleanly, the platform is ready. Healthchecks gate startup so all three services are healthy before `seed` runs.

| Service | URL |
|---|---|
| IAM | http://localhost:3001 |
| Supplier | http://localhost:3002 |
| PO | http://localhost:3003 |
| Swagger UI (Supplier) | http://localhost:3002/api/v1/docs |
| Swagger UI (PO) | http://localhost:3003/api/v1/docs |
| CloudBeaver (Postgres GUI) | http://localhost:8978 |
| mongo-express (Mongo GUI) | http://localhost:8081 |

## Run the docs site

The MkDocs site fetches each service's OpenAPI spec at build time, so the platform must be running first.

```powershell
# 1. Bring up the services
docker compose up -d

# 2. Install docs deps (one time, into a venv)
python -m venv .venv-docs
.\.venv-docs\Scripts\Activate.ps1
pip install -r requirements-docs.txt

# 3. Fetch the latest OpenAPI specs
./scripts/fetch-openapi.ps1

# 4. Serve docs with live reload
mkdocs serve
```

Then open <http://localhost:8000>.

To produce a static site (output in `site/`):

```powershell
mkdocs build --strict
```
