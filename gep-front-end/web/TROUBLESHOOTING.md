# Troubleshooting

## The dev server starts but the page is blank

- Open DevTools and check the console.
- Verify `.env` exists and contains `VITE_AUTH_URL`, `VITE_SUPPLIER_URL`, `VITE_PO_URL`.
- Hard-reload (Ctrl+Shift+R) to bust the Vite cache.

## Theme does not switch

- Theme preference is stored under `localStorage` key `gep.theme` (values: `light` | `dark` | `system`).
- Clear the key from DevTools > Application > Local Storage and reload to reset to `system`.
- If the system theme appears stuck, confirm the OS theme via `matchMedia('(prefers-color-scheme: dark)').matches` in the console.

## 401 Unauthorized after login

- The JWT lives in memory and is mirrored to `sessionStorage` under `gep.token`.
- Check that the backend issued a token (Network tab → `/api/v1/auth/login` response).
- Tokens are valid for 24h; if expired, you will be redirected to `/login`.

## CORS errors against the backend services

- Each service must allow the Vite dev origin (default `http://localhost:5173`).
- For local development you may instead front the three services with a reverse proxy and point all three `VITE_*_URL` vars at it.

## Tailwind classes don't apply

- Confirm `src/styles/index.css` is imported in `src/main.jsx`.
- Confirm the file you're editing matches a `content` glob in `tailwind.config.js`.

## Docker image build fails

- Delete the local `node_modules` and rebuild — Vite occasionally caches platform-specific binaries.
- Confirm `dist/` is not committed; the multi-stage build creates it inside the image.

## Build succeeds but routes 404 in production

- The SPA needs a fallback to `index.html`. The bundled `nginx.conf` already does this; make sure your reverse proxy preserves it.
