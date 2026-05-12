# GEP-SCM Web

React SPA for the GEP-SCM procurement platform. Consumes three backend services (Auth, Supplier, PO) and supports the BUYER, APPROVER and ADMIN personas.

## Stack

- React 18 + Vite (JavaScript)
- Tailwind CSS with semantic design tokens and runtime light/dark theme switching
- React Router v6 with role-based route guards
- TanStack Query v5 for server cache, Zustand for client state
- React Hook Form + Zod for form validation
- TanStack Table v8, Recharts (SVG), lucide-react icons, sonner toasts

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

The app starts on http://localhost:5173.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build production assets into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_AUTH_URL` | Base URL of the Auth service |
| `VITE_SUPPLIER_URL` | Base URL of the Supplier service |
| `VITE_PO_URL` | Base URL of the Purchase Order service |

## Project layout

See `docs/web_ui_impl_plan.md` for the full directory structure and reusable component catalog.

## Docker

```bash
docker build -t gep-scm-web .
docker compose up
```

The image is a multi-stage build that ends in a slim nginx serving the SPA on port 80 with deep-link fallback.

## License

MIT — see [LICENSE](LICENSE).
