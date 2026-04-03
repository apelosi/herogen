# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

HeroGen is a React 19 SPA (no backend server to run). The only local service is the **Vite dev server**.

| Service | Command | Port | Notes |
|---|---|---|---|
| Vite dev server | `npm run dev` | 3000 | Primary dev command; serves the SPA with HMR |
| Netlify dev | `npm run dev:netlify` | 8889 | Only needed for `db:migrate` / `db:studio` |

### Development commands

Standard commands are documented in `CLAUDE.md` and `package.json` scripts. Key ones:

- **Dev server**: `npm run dev` (Vite on port 3000, host `0.0.0.0`)
- **Build**: `npm run build`
- **Type-check**: `npx tsc --noEmit`
- **No dedicated lint script** — the project does not include ESLint configuration.
- **No automated test suite** — the project has no test framework or test files.

### Environment variables

A `.env` file in the project root is required. See `CLAUDE.md` for the full list. At minimum:

- `GEMINI_API_KEY` — available as a VM secret; enables AI comic generation.
- `VITE_NEON_AUTH_URL` — Neon Auth endpoint (required for login).
- `VITE_NEON_DATA_API_URL` — Neon Data API endpoint (required for DB access).

Without the Neon URLs, the app still renders its landing page, themes, and sample comics — but login and data persistence won't work.

### Gotchas

- The app uses **HashRouter** (`/#/...` routes). Direct URL navigation must include the hash prefix.
- The `.env` file is gitignored. Cloud agents must create it on startup using available VM secrets.
- `npm run dev` runs Vite directly (not Netlify). Use `npm run dev:netlify` only for migration commands.
- There is no lockfile for pnpm/yarn — this project uses **npm** (`package-lock.json`).
