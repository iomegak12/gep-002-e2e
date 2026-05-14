# Observability & RUM Rollout — GEP Platform

## Context

The GEP platform currently has **zero telemetry**: three backend microservices (`iam`, `po-service` on Node.js 20/Express; `supplier-service` on Python 3.12/FastAPI) and a React 18/Vite web app served by Nginx, all wired together via Docker Compose. Only a manual `x-correlation-id` middleware exists in the Python service. The goal is to add a full OTLP-based observability stack (metrics, traces, logs) plus browser RUM, using **Prometheus + Grafana + Loki + Jaeger + Tempo**, with minimal intrusion into application code and a single `docker compose up` experience.

User-confirmed choices:
- RUM: **Grafana Faro Web SDK**
- Logs: **Promtail scraping Docker stdout** (no SDK changes)
- Compose layout: **bundled into the existing root compose files**
- Traces: **Jaeger + Tempo** (Jaeger UI for deep-dive, Tempo for Grafana-native correlation with Loki/Prometheus)

---

## Architecture

```
 React (Faro Web SDK) ───────────────► Faro Collector endpoint
                                       (Grafana Alloy in OTLP mode)
                                                │
 iam (Node)     ─ OTel SDK ─┐                   │
 po-service     ─ OTel SDK ─┼──► OTel Collector ┤──► Prometheus (metrics, scrape)
 supplier-svc   ─ OTel SDK ─┘    (contrib)      ├──► Tempo + Jaeger (traces)
                                                └──► Loki (logs from RUM)

 Docker stdout ──► Promtail ──► Loki (container logs)
 cAdvisor + node-exporter ─► Prometheus (host/container metrics)
                                                │
                                         Grafana (dashboards, single pane)
```

---

## Component versions (Node 20 + Python 3.12 compatible)

| Component | Image / Package | Notes |
|---|---|---|
| OTel Collector | `otel/opentelemetry-collector-contrib:0.111.0` | OTLP gRPC :4317 / HTTP :4318; Prometheus exporter :8889; supports Tempo+Jaeger OTLP out |
| Prometheus | `prom/prometheus:v2.55.0` | scrapes collector, cAdvisor, node-exporter |
| Grafana | `grafana/grafana:11.3.0` | provisioned datasources + dashboards |
| Loki | `grafana/loki:3.2.0` | OTLP log ingest enabled |
| Promtail | `grafana/promtail:3.2.0` | tails `/var/lib/docker/containers` |
| Jaeger | `jaegertracing/all-in-one:1.62` | OTLP native (`COLLECTOR_OTLP_ENABLED=true`), UI :16686 |
| Tempo | `grafana/tempo:2.6.0` | OTLP receiver on :4317 (internal) |
| Grafana Alloy (Faro receiver) | `grafana/alloy:v1.4.2` | terminates Faro Web SDK posts → forwards to Loki/Tempo/Prometheus |
| cAdvisor | `gcr.io/cadvisor/cadvisor:v0.49.1` | container CPU/mem/net/io metrics |
| node-exporter | `prom/node-exporter:v1.8.2` | host CPU/mem/disk/net |

### Node.js instrumentation (Node 20 — both `iam` and `po-service`)

Add to `package.json`:
```
@opentelemetry/api                              ^1.9.0
@opentelemetry/sdk-node                         ^0.55.0
@opentelemetry/auto-instrumentations-node       ^0.52.0
@opentelemetry/exporter-trace-otlp-proto        ^0.55.0
@opentelemetry/exporter-metrics-otlp-proto      ^0.55.0
@opentelemetry/sdk-metrics                      ^1.28.0
@opentelemetry/resources                        ^1.28.0
@opentelemetry/semantic-conventions             ^1.28.0
```
Auto-instrumentations cover **http, express, pg, prisma, dns, net, fs** out of the box → captures HTTP latency, network, IO, and DB calls. Add `@opentelemetry/host-metrics` for CPU/mem.

### Python instrumentation (Python 3.12 — `supplier-service`)

Add to `requirements.txt`:
```
opentelemetry-distro==0.49b0
opentelemetry-exporter-otlp-proto-grpc==1.28.0
opentelemetry-instrumentation-fastapi==0.49b0
opentelemetry-instrumentation-httpx==0.49b0
opentelemetry-instrumentation-pymongo==0.49b0
opentelemetry-instrumentation-logging==0.49b0
opentelemetry-instrumentation-system-metrics==0.49b0
```
Run with `opentelemetry-instrument uvicorn app.main:app …` — zero-code auto-instrumentation for FastAPI, Mongo, httpx, logging, plus system metrics (CPU/mem/network/IO/threads).

---

## File-level change plan

### 1. New: `gep-back-end/observability/` directory
```
observability/
├── otel-collector-config.yaml
├── prometheus/prometheus.yml
├── loki/loki-config.yaml
├── promtail/promtail-config.yaml
├── tempo/tempo.yaml
├── alloy/config.alloy           # Faro receiver pipeline
└── grafana/
    ├── provisioning/datasources/datasources.yaml
    ├── provisioning/dashboards/dashboards.yaml
    └── dashboards/
        ├── node-service-overview.json   # RED + Node runtime
        ├── python-service-overview.json # RED + Py runtime
        ├── http-api-golden-signals.json # latency/error/throughput per route
        ├── container-host.json          # cAdvisor + node-exporter
        ├── database-postgres-mongo.json # pg / mongo client metrics
        ├── jaeger-trace-explorer.json   # links to Tempo+Jaeger
        └── frontend-rum.json            # Faro: web vitals, JS errors, sessions
```

### 2. Modify: `gep-back-end/docker-compose.yml` and `gep-002-e2e/docker-compose-prod.yml`
Append services: `otel-collector`, `prometheus`, `grafana`, `loki`, `promtail`, `jaeger`, `tempo`, `alloy`, `cadvisor`, `node-exporter`. Attach all to existing `gep-network` (create it in dev compose too, since dev currently uses default). Inject env vars on existing app services:
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318`
- `OTEL_SERVICE_NAME=iam|po-service|supplier-service`
- `OTEL_RESOURCE_ATTRIBUTES=deployment.environment=dev|prod`
- `OTEL_TRACES_SAMPLER=parentbased_traceidratio`, `OTEL_TRACES_SAMPLER_ARG=1.0` (dev) / `0.1` (prod)

### 3. Modify Node services — [gep-back-end/iam/](gep-back-end/iam/) and [gep-back-end/po-service/](gep-back-end/po-service/)
- New `src/tracing.js` — initializes `NodeSDK` with OTLP exporter + `getNodeAutoInstrumentations()` + `HostMetrics`. **Must be required before any other import.**
- Modify `Dockerfile` `CMD` → `node --require ./src/tracing.js src/server.js` (and `src/main.js` for po-service).
- Update `package.json` with deps above.
- Keep existing correlation-id pattern; OTel http instrumentation auto-propagates `traceparent`.

### 4. Modify Python service — [gep-back-end/supplier-service/](gep-back-end/supplier-service/)
- Append OTel deps to `requirements.txt`.
- Change Dockerfile `CMD` to `["opentelemetry-instrument", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002"]`.
- In `app/main.py` correlation-id middleware: attach the existing `x-correlation-id` to the active span as an attribute so Jaeger/Tempo can search by it.

### 5. Modify frontend — [gep-front-end/web/](gep-front-end/web/)
- Add deps: `@grafana/faro-web-sdk@^1.13`, `@grafana/faro-web-tracing@^1.13`.
- New `src/observability/faro.js` — initializes Faro with:
  - `url: import.meta.env.VITE_FARO_URL` (points to Alloy `/collect`)
  - app name/version, session tracking, web-vitals, console capture, error capture, `TracingInstrumentation` for fetch/xhr → propagates `traceparent` to backends.
- Import once at top of `src/main.jsx`.
- Modify [gep-front-end/web/nginx.conf](gep-front-end/web/nginx.conf): add `/collect/` proxy → `alloy:12347` so the browser stays same-origin (avoids CORS, lets you keep the Faro URL relative).
- Add `VITE_FARO_URL=/collect` to env defaults.

### 6. Modify Nginx config
Existing `/iam/`, `/supplier/`, `/po/` proxies stay. Add Faro upstream + a `/collect/` location. Keep gzip + add `add_header Server-Timing` passthrough so trace IDs surface in DevTools.

---

## Grafana dashboards delivered (pre-provisioned)

1. **HTTP API Golden Signals** — per-service & per-route RED (Rate, Errors, Duration p50/p95/p99), driven by `http.server.duration` histogram.
2. **Node Service Overview** — event-loop lag, GC pauses, heap, CPU, RSS, active handles (host-metrics + runtime instrumentation).
3. **Python Service Overview** — process CPU/RSS, thread count, GC, async task counts, FastAPI request metrics.
4. **Container & Host** — cAdvisor CPU/mem/net/IO per container + node-exporter host stats.
5. **Database Activity** — Postgres connections/latency from `pg` auto-instrumentation; Mongo op latency from `pymongo` instrumentation.
6. **Frontend RUM** — Core Web Vitals (LCP, FID/INP, CLS, TTFB), JS error rate, session count, page-load distribution, slowest routes, browser/OS breakdown.
7. **Traces Hub** — Tempo query panel + Jaeger external link + exemplar links from latency panels.

---

## Verification

1. `docker compose up -d` from `gep-back-end/` — all containers healthy.
2. Hit `http://localhost:3001/health`, `:3002/health`, `:3003/health` → in Grafana → Explore → Tempo, search by service name; spans visible. Same trace ID visible in Jaeger UI (`http://localhost:16686`).
3. Prometheus `http://localhost:9090/targets` — all scrape targets UP (collector, cAdvisor, node-exporter).
4. Load the web app (`http://localhost/`), perform a login + create-PO flow → Grafana "Frontend RUM" dashboard shows page-load, web vitals, session count > 0; trace from browser fetch links through to backend span in Tempo (trace context propagation).
5. `docker logs` of each app container → Loki `{container="iam"}` returns lines in Grafana → Explore.
6. Kill `po-service` briefly → "HTTP API Golden Signals" error-rate panel spikes; alert rule fires (optional Prometheus rule included).
7. Repeat steps 1–6 with `docker-compose-prod.yml` to confirm prod parity.

---

## Open items / nice-to-haves (not in scope unless requested)

- Alertmanager wiring (rules drafted but no receivers configured).
- Long-term storage (Mimir/Cortex) — Prometheus local TSDB used for now.
- mTLS between collector and apps — collector is on the internal `gep-network` only.
- Auth on Grafana — defaults to admin/admin; recommend changing via env on first prod boot.
