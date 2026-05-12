# Contributing

Thanks for considering a contribution. The project follows a simple workflow:

## Branches & commits

- `main` is always deployable.
- Feature branches: `feat/<short-name>` or `fix/<short-name>`.
- Conventional commits are encouraged (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

## Code conventions

- Plain JavaScript (no TypeScript).
- Tailwind utility classes with **semantic token names only** (e.g. `bg-surface`, `text-on-surface`). Never hardcode hex colors in JSX.
- All icons must be SVG (use `lucide-react`). No emojis in UI copy or source.
- Reusable UI lives in `src/components/`. Feature screens compose components, they do not redefine them.
- Forms: `react-hook-form` + Zod resolvers under `src/lib/schemas/`.
- Server state: TanStack Query. Local state: Zustand. Do not mix concerns.

## Pull requests

1. Update `CHANGELOG.md` under `[Unreleased]`.
2. Verify `npm run build` succeeds.
3. Include a brief description and any screenshots for visible changes.

## Reporting issues

Open a GitHub issue with reproduction steps, expected vs. actual behavior, and environment (browser, OS).
