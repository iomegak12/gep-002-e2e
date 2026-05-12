# System Architecture

## Service topology

```mermaid
graph LR
    subgraph Clients
      Web[Web / API consumer]
    end

    subgraph "gep-back-end (docker compose)"
      direction LR
      IAM["iam<br/>Node + Express<br/>:3001"]
      SUP["supplier-service<br/>Python + FastAPI<br/>:3002"]
      PO["po-service<br/>Node + Express + Prisma<br/>:3003"]
      PG[("Postgres :5432<br/>auth + po DBs")]
      MG[("MongoDB :27017<br/>suppliers DB")]
      SEED["seed (one-shot)"]
    end

    Web -->|JWT| IAM
    Web -->|JWT| SUP
    Web -->|JWT| PO

    IAM --> PG
    PO  --> PG
    SUP --> MG

    PO -->|GET /suppliers/:id| SUP

    SEED --> IAM
    SEED --> SUP
    SEED --> PO
```

## How the pieces fit

- **`iam`** is the only **token issuer**. The other two services are **token consumers** — they validate the HS256 signature with the shared `JWT_SECRET` and trust the embedded `sub`, `roles`, and `approval_limit` claims.
- **`po-service` → `supplier-service`** is the only cross-service synchronous call: when creating a PO, `po-service` calls `GET /api/v1/suppliers/{id}` to verify the supplier exists and is `ACTIVE`.
- **Postgres** hosts two logical databases (`auth`, `po`) inside a single instance, so `iam` and `po-service` share infra but not schema.
- **`seed`** is a one-shot container that runs after all three services are healthy, calling each service's HTTP API to insert demo users, suppliers, and POs.

## Why this shape

- Each service owns its **data store** and its **bounded context** — no cross-service joins, no shared tables.
- A **shared JWT secret** trades RS256/JWKS complexity for fewer moving parts at v1 scale; the cost (rotation requires a coordinated restart) is acceptable.
- Two languages (Node, Python) on purpose: the spec calls out a deliberately mixed stack to exercise cross-stack patterns (auth, error model, OpenAPI).
