# GEP-SCM UI Test Suite (Playwright)

Playwright + Chromium end-to-end tests for the GEP-SCM web app at `http://localhost:8080`.

## What it covers

Three functional flows, each with a 200-300 ms random pause between every user action:

1. **login -> logout**
2. **login -> Suppliers -> select supplier (by `supplier_code`) -> view detail -> logout**
3. **login -> Purchase Orders -> select PO (by `po_number`) -> view detail -> logout**

Flows 2 and 3 are **data-driven**: one test case is generated per non-empty, non-comment line in:

- [data/suppliers.txt](data/suppliers.txt) - one supplier_code per line
- [data/pos.txt](data/pos.txt) - one PO number per line (e.g. `PO-2024-00001`)

## Prerequisites

- The full stack is running (`docker compose up -d` from repo root). The web app must answer 200 on http://localhost:8080.
- Node 20+.

## Run

The easiest way is via the repo-root menu:

```powershell
.\devops.ps1     # pick option 3 "Run UI Tests"
```

Or directly:

```powershell
cd tests\ui
npm install                # first run only
npm run install:browsers   # first run only -- installs Chromium binary
npm test                   # all flows
npm run test:login         # flow 1
npm run test:suppliers     # flow 2
npm run test:pos           # flow 3
npm run test:headed        # visible browser
npm run report             # open last HTML report
```

Or via the wrapper script:

```powershell
pwsh scripts\test-ui.ps1 -Suite all -OpenReport
pwsh scripts\test-ui.ps1 -Suite suppliers -Headed
pwsh scripts\test-ui.ps1 -Help
```

## Configuration

Copy `.env.example` to `.env` and adjust:

| Key | Default | Notes |
|---|---|---|
| `WEB_URL` | `http://localhost:8080` | Base URL the tests navigate to |
| `USER_EMAIL` | `admin@demo.local` | Seeded admin |
| `USER_PASSWORD` | `Passw0rd!` | Seeded admin password |
| `STEP_DELAY_MIN_MS` | `200` | Lower bound of inter-step pause |
| `STEP_DELAY_MAX_MS` | `300` | Upper bound of inter-step pause |

## Data files

```
data/
  suppliers.txt   # one supplier_code per line, e.g. SUP-001
  pos.txt         # one PO number per line, e.g. PO-2024-00001
```

Rules:
- Blank lines are ignored.
- Lines beginning with `#` are comments.
- One test case is generated per entry.
- If a file is empty (or has only comments) the corresponding suite is skipped (with a clear message), not failed.

## Layout

```
tests/ui/
  package.json
  playwright.config.js     # chromium only, html + list reporters
  .env / .env.example
  data/
    suppliers.txt
    pos.txt
  helpers/
    env.js                 # dotenv loader
    auth.js                # login() / logout()
    wait.js                # pause(page) -- random 200-300 ms
    data.js                # readLines(file) -- skips comments + blanks
  tests/
    01-login-logout.spec.js
    02-suppliers.spec.js
    03-purchase-orders.spec.js
```

## Reports

After every run an HTML report is written to `playwright-report/`. Open it with:

```powershell
npm run report
```

or pass `-OpenReport` to `test-ui.ps1`.

## Conventions

- **Selectors prefer accessible roles and stable placeholders.** No CSS class names from Tailwind utility soup.
- **Every action is preceded by `pause(page)`** for the configurable 200-300 ms pacing the brief calls for.
- **No DB protection.** UI tests only read; they don't mutate data. If you write tests that mutate, run them via `test-safe.ps1` first to take a backup, then point Playwright at the same stack.
