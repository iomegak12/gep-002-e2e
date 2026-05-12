# Plan — MkDocs Documentation Site for `gep-back-end` Microservices

## Context

`gep-back-end/` is a 3-service procurement (SCM) platform: **iam** (Node/Express + Postgres), **po-service** (Node/Express + Prisma + Postgres), **supplier-service** (Python/FastAPI + Mongo), orchestrated via `docker-compose.yml`. A 36KB business + technical spec already exists at [gep-back-end/docs/GEP_SCM_Platform_Technical_Specification.md](gep-back-end/docs/GEP_SCM_Platform_Technical_Specification.md), plus impl-plan and test-impl-plan markdown files. Each service exposes a runtime OpenAPI spec (iam/po via `swagger-ui-express`, supplier via FastAPI auto-gen).

Today this knowledge is scattered — long markdown, runtime Swagger UIs only reachable when containers are up, no unified entry point. We will publish a **single MkDocs site** (Material theme) that:

- Onboards **internal developers** (architecture, setup, per-service deep dives).
- Serves **API consumers** with browsable, always-up-to-date OpenAPI references.
- Gives **business / product stakeholders** the persona, journey and workflow context from the existing spec, surfaced as readable pages instead of one mega-doc.

Diagrams (service topology, key flows, DB schemas) will live in the docs as Mermaid so they render natively in Material.

---

## Decisions (confirmed with user)

| Aspect | Choice |
|---|---|
| Site location | Reuse `gep-back-end/docs/` — `mkdocs.yml` lives at `gep-back-end/mkdocs.yml`, content under `gep-back-end/docs/` |
| Theme | Material for MkDocs |
| API reference | Render OpenAPI specs inside MkDocs (not external Swagger links) |
| OpenAPI source | **Fetch from running services at build time** (`:3001`, `:3002`, `:3003`) — `docker compose up` is a build prerequisite |
| Auto-gen | (a) ER diagrams from Prisma schema + Mongo Pydantic models, (b) hand-authored Mermaid architecture/sequence diagrams |
| Build / serve | `mkdocs serve` locally only — no Docker docs service, no gh-deploy |
| Audience | Internal devs + API consumers + business/product stakeholders |

---

## Site Information Architecture

`mkdocs.yml` nav (top-level matches the three audiences):

```
Home (index.md)
├── Overview
│   ├── Business Context & Personas
│   ├── User Journeys
│   └── System Architecture (Mermaid topology)
├── Getting Started (developers)
│   ├── Local Setup (docker compose)
│   ├── Environment Variables
│   ├── Seed Data & Demo Users
│   └── Running Tests
├── Services
│   ├── IAM (auth)
│   │   ├── Overview & Responsibilities
│   │   ├── Data Model (Postgres ER)
│   │   ├── Auth Flow (Mermaid sequence)
│   │   └── API Reference (rendered OpenAPI)
│   ├── Supplier Service
│   │   ├── Overview
│   │   ├── State Machine (PENDING_APPROVAL → ACTIVE)
│   │   ├── Data Model (Mongo collections)
│   │   └── API Reference (rendered OpenAPI)
│   └── PO Service
│       ├── Overview
│       ├── PO Lifecycle (draft → submitted → approved → fulfilled)
│       ├── Data Model (Prisma ER)
│       ├── Aggregations & Search
│       └── API Reference (rendered OpenAPI)
├── Cross-Cutting
│   ├── Authentication & JWT
│   ├── Error Model
│   └── Conventions
└── Reference
    ├── Docker Compose Topology
    └── Glossary
```

---

## Files to Create / Modify

**New — at `gep-back-end/`:**
- `mkdocs.yml` — site config (theme, nav, plugins, markdown_extensions).
- `requirements-docs.txt` — pinned Python deps for the docs toolchain (kept separate from `supplier-service/requirements.txt`).

**New — under `gep-back-end/docs/`:**
- `index.md` — landing page (project pitch, audience-routed quick links).
- `overview/business-context.md` — extracted from the existing spec (personas, problem statement).
- `overview/user-journeys.md` — buyer / approver / admin journeys.
- `overview/architecture.md` — Mermaid `graph LR` of services + DBs + ports.
- `getting-started/setup.md` — distilled from root [README.md](gep-back-end/README.md).
- `getting-started/env.md` — table sourced from `.env.example`.
- `getting-started/seed-data.md` — demo users / seeded suppliers / POs.
- `getting-started/testing.md` — points at `tests/` and its run instructions.
- `services/iam/index.md`, `data-model.md`, `auth-flow.md`, `api.md`.
- `services/supplier/index.md`, `state-machine.md`, `data-model.md`, `api.md`.
- `services/po/index.md`, `lifecycle.md`, `data-model.md`, `aggregations.md`, `api.md`.
- `cross-cutting/auth.md`, `errors.md`, `conventions.md`.
- `reference/docker-compose.md`, `glossary.md`.
- `docs/api/` — destination directory for fetched OpenAPI JSON (gitignored).
- `docs/assets/` — for any static images later.

**Existing — preserved, not moved:**
- `docs/GEP_SCM_Platform_Technical_Specification.md` and the two `_Impl_Plan.md` / `_Test_Impl_Plan.md` files stay in place; new pages **cite and excerpt** them rather than duplicating. They will be reachable via a "Specifications (full)" nav entry.

**Existing — modify:**
- `gep-back-end/README.md` — add a one-liner pointing developers to `mkdocs serve` for the full docs site.
- `gep-back-end/.gitignore` — add `site/` (MkDocs build output) and `docs/api/*.json` (fetched at build, not committed).

---

## Tooling — `mkdocs.yml` plugins & extensions

- **Theme:** `mkdocs-material`
- **OpenAPI rendering:** `mkdocs-render-swagger-plugin` (embeds Swagger UI inside an MkDocs page from a local JSON file).
- **Mermaid:** Material's built-in `pymdownx.superfences` custom fence for `mermaid` — no extra plugin needed.
- **Nice-to-haves:** `pymdownx.tabbed`, `pymdownx.admonition`, `pymdownx.snippets` (to embed snippets of `.env.example`, Prisma schema, etc., so docs don't drift).
- **ER diagrams:**
  - **PO (Prisma):** `prisma-erd-generator` added to `po-service/prisma/schema.prisma` as a generator block → emits `po-service/prisma/ERD.md` (Mermaid). Snippet-included from `services/po/data-model.md`.
  - **IAM (Postgres):** Hand-authored Mermaid `erDiagram` derived from [iam/migrations/001_init.sql](gep-back-end/iam/migrations/001_init.sql). One-time effort, low churn.
  - **Supplier (Mongo):** Hand-authored Mermaid `classDiagram` derived from [supplier-service/app/models.py](gep-back-end/supplier-service/app/models.py) Pydantic models.

`requirements-docs.txt` (illustrative):
```
mkdocs==1.6.*
mkdocs-material==9.5.*
mkdocs-render-swagger-plugin==0.1.*
pymdown-extensions==10.*
```

---

## OpenAPI Fetch Step (build prerequisite)

Per user choice, specs are fetched from live services at build time. A small `gep-back-end/scripts/fetch-openapi.sh` (and `.ps1` for Windows parity) will:

1. Check `docker compose ps` shows iam, po-service, supplier-service as healthy; bail with a clear message otherwise.
2. `curl http://localhost:3001/api/v1/openapi.json > docs/api/iam.json`
3. `curl http://localhost:3003/api/v1/openapi.json > docs/api/po.json`
4. `curl http://localhost:3002/api/v1/openapi.json > docs/api/supplier.json`

Exact endpoint paths verified against [iam/src/openapi.js](gep-back-end/iam/src/openapi.js), [po-service/src/openapi.js](gep-back-end/po-service/src/openapi.js), and FastAPI's default `/openapi.json` for supplier.

Each `services/*/api.md` then contains a single directive:
```
!!swagger api/iam.json!!
```
(plugin syntax for `mkdocs-render-swagger-plugin`.)

Documented workflow for contributors (in `getting-started/setup.md`):
```
docker compose up -d
./scripts/fetch-openapi.sh
mkdocs serve
```

---

## Phased Execution Order

1. **Scaffold** — create `mkdocs.yml`, `requirements-docs.txt`, empty page tree, verify `mkdocs serve` renders empty nav.
2. **Wire OpenAPI fetch** — write fetch script, add render-swagger plugin, verify all three API reference pages render.
3. **Architecture & overview** — author `architecture.md` Mermaid topology + extract business-context / personas / journeys from the existing spec.
4. **Per-service pages** — overview, lifecycle/state-machine, data-model (with ER diagrams).
5. **Cross-cutting & reference** — auth, errors, conventions, docker-compose topology, glossary.
6. **Polish** — landing page audience routing, internal links, search check, dark-mode check.

---

## Verification

- `pip install -r requirements-docs.txt` succeeds.
- `docker compose up -d` then `./scripts/fetch-openapi.sh` writes three non-empty JSON files into `docs/api/`.
- `mkdocs serve` starts on `:8000` with no warnings; all nav entries resolve (no 404s).
- `mkdocs build --strict` exits 0 (catches broken internal links / missing files).
- Spot-check each service's API page: Swagger UI renders, endpoints are listed, "Try it out" works against the running container.
- Mermaid blocks render as diagrams (not raw code) on architecture, lifecycle, ER, and auth-flow pages.
- Open the site in dark mode and on a narrow viewport — Material handles both, just confirm.
- Have one stakeholder open the **Overview** section cold and confirm they can navigate to the right context without reading the original 36KB spec.

