---
title: GEP-SCM Backend — Documentation
---

# GEP-SCM Platform — Backend

A small, opinionated procurement (SCM) backend built as three microservices behind a single `docker compose up`.

| Service | Stack | Port | Responsibility |
|---|---|---|---|
| **iam** | Node + Express + Postgres | `3001` | Login, JWT issuance, user/role management |
| **supplier-service** | Python + FastAPI + Mongo | `3002` | Supplier master, status lifecycle, aggregations |
| **po-service** | Node + Express + Prisma + Postgres | `3003` | Purchase orders, approvals, spend analytics |

## Find your way in

=== "I am a developer"

    Start with **[Local Setup](getting-started/setup.md)**, then read **[System Architecture](overview/architecture.md)** and dive into each service.

=== "I am integrating with the API"

    Jump to the per-service **API Reference** pages: [IAM](services/iam/api.md) · [Supplier](services/supplier/api.md) · [PO](services/po/api.md). Authentication is covered in **[Auth & JWT](cross-cutting/auth.md)**.

=== "I am a business / product stakeholder"

    Start with **[Business Context & Personas](overview/business-context.md)** and **[User Journeys](overview/user-journeys.md)**.

## What's here

- **Overview** — why this platform exists, who uses it, and how the pieces fit together.
- **Getting Started** — run it locally, seeded users, env vars, tests.
- **Services** — one section per microservice: overview, data model, key flows, full API reference.
- **Cross-Cutting** — JWT/auth scheme, error model, conventions shared across services.
- **Reference** — docker-compose topology, glossary.
- **Specifications (full)** — the original long-form technical spec and impl plans, preserved verbatim.
