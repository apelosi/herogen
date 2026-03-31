# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 Working with This Project

**IMPORTANT**: Whenever you make changes to the codebase, new requirements are added, or existing requirements change, you MUST update this CLAUDE.md file to reflect those changes. This ensures continuity across different Claude Code sessions and agents.

## Project Overview

HeroGen is a React 19 web application that transforms user selfies into personalized 6-panel superhero/villain comic strips using Google's Gemini 3 AI models. Users authenticate via Google, upload a photo as their "hero face", select a theme and alignment (hero/villain), and the app generates a complete comic with consistent character rendering across all panels.

## Development Commands

### Setup and Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start Vite dev server on port 3000
npm run dev:netlify            # Start Netlify dev (only needed for db:migrate commands)
npm run build                  # Build for production
npm run preview                # Preview production build
```

**Development Server**: Use `npm run dev` which runs Vite directly. Access the app at **http://localhost:3000**.

**Database Context**: The app uses **Neon Data API (PostgREST)** from the browser via `@neondatabase/neon-js`, authenticated with **Neon Auth (Better Auth)** JWTs. No Postgres connection strings should ever be shipped to the browser bundle.

### Database Commands (Drizzle ORM + Neon PostgreSQL)
```bash
npm run db:generate            # Generate migration files from schema changes
npm run db:migrate             # Run migrations (via Netlify dev context)
npm run db:studio              # Open Drizzle Studio database GUI (via Netlify dev context)
```

**IMPORTANT**: Database migrations must NEVER be edited manually. Always use `drizzle-kit generate` and `drizzle-kit migrate`. See comment in [drizzle.config.ts:10-12](drizzle.config.ts#L10-L12).

## Architecture Overview

### Three-Tier AI Pipeline (Gemini)

The app uses a sophisticated multi-model Gemini workflow defined in [services/geminiService.ts](services/geminiService.ts):

1. **Analysis Phase** (`analyzeImage`): Uses `gemini-3-flash-preview` to extract biometric features from the user's selfie for character consistency (8s timeout with fallback)
2. **Scripting Phase** (`generateStoryScript`): Uses `gemini-3-flash-preview` with structured JSON schema to generate a 6-panel narrative with title, captions, and visual prompts (15s timeout with fallback template)
3. **Manifestation Phase** (`generatePanelImage`): Uses `gemini-3-pro-image-preview` for character-consistent image generation at 1K resolution with 1:1 aspect ratio, passing the user's reference photo with each panel prompt

All Gemini API calls use `process.env.API_KEY` (mapped from `GEMINI_API_KEY` in .env via [vite.config.ts:15-16](vite.config.ts#L15-L16)). Each function creates a fresh `GoogleGenAI` instance immediately before the API call.

### Database Architecture (Neon Data API + RLS)

The app was migrated from IndexedDB to PostgreSQL (Netlify/Neon) on 2026-01-04. The database uses Drizzle ORM with Neon PostgreSQL accessed via HTTP (not WebSockets). Schema is in [db/schema.ts](db/schema.ts):

- **users table**: Stores Google OAuth user data plus `photoUrl` (base64-encoded "hero face" selfie)
- **comics table**: Stores comic metadata with `panels` as JSONB array, `themeId` reference, `alignment` enum, `isPublic` flag for sharing, and Unix `createdAt` timestamp

Database access from the client goes through the Neon Data API (PostgREST). The client uses `@neondatabase/neon-js` (`services/neonClient.ts`) and reads:

- `VITE_NEON_AUTH_URL`
- `VITE_NEON_DATA_API_URL`

**Security**: Postgres connection strings (`DATABASE_URL`, `NETLIFY_DATABASE_URL`) must never be exposed to the browser bundle.

**Migration Details**:
- Initial migration: [migrations/0000_volatile_hellfire_club.sql](migrations/0000_volatile_hellfire_club.sql)
- Database config: [drizzle.config.ts](drizzle.config.ts)
- Migrations are managed via `npm run db:generate` and `npm run db:migrate` (see Development Commands above)
- NEVER edit migration files manually - always use drizzle-kit commands

### Authentication Flow (Neon Auth / Better Auth)

Authentication is handled by Neon Auth (Better Auth). The app uses `@neondatabase/neon-js` to initiate Google OAuth and obtain a session. After redirect back to `#/auth/callback`, the app loads the session and ensures an app-level profile row exists in `public.users`.

### Route Structure (React Router v6)

Main routing in [App.tsx](App.tsx):

- `/` - Landing page with hero animation, theme showcase, sample comics
- `/dashboard` - User command center; prompts for hero face upload if missing
- `/create` - Two-step wizard (theme selection → alignment selection)
- `/comic/:id` - Owner view with edit controls (rating, public toggle, delete, PDF export)
- `/share/:id` - Public view for shared comics (only visible if `isPublic: true`)

Navigation uses HashRouter for static deployment compatibility.

### Component Organization

Key components in [components/](components/):

- **PhotoCapture.tsx**: Camera/upload interface for capturing hero face (lazy-loaded for performance)
- **ThemeSelector.tsx**: Grid of 12 themes from [constants.ts](constants.ts) with lucide-react icons
- **AlignmentSelector.tsx**: Hero vs Villain choice
- **ComicDisplay.tsx**: Displays 6-panel comic grid with owner/public modes, handles PDF generation via jspdf
- **LoadingScreen.tsx**: Full-screen loading states during AI generation

### Theme System

12 predefined themes in [constants.ts](constants.ts) with Tailwind gradient colors and lucide-react icons. Each theme influences the AI prompt style for image generation. Themes include: Cyberpunk Neon, Ancient Mystic, Space Opera, Steampunk Gear, Ninja Shadow, Elemental Nature, Noir Detective, Galactic Guardian, Medieval Knight, Urban Vigilante, Mutant X, Tech Mecha.

### Static Assets

Sample comic images stored in `public/sample-1/` and `public/sample-2/` for landing page demonstration. Asset paths resolved via `resolveAssetPath` helper in [App.tsx:58-62](App.tsx#L58-L62) to handle different base URLs.

## Environment Variables

Required variables in `.env`:

- `GEMINI_API_KEY`: Google AI API key (billing must be enabled for image generation)
- `VITE_NEON_AUTH_URL`: Neon Auth base URL (Better Auth)
- `VITE_NEON_DATA_API_URL`: Neon Data API base URL (PostgREST)

The app exposes these to the client via Vite's `define` config ([vite.config.ts:14-18](vite.config.ts#L14-L18)).

**Security**: The `.env` file is excluded from git via [.gitignore](.gitignore#L15-18). Environment variables for production are managed through Netlify's environment settings and can be listed with `npx netlify env:list`.

## Key Technical Constraints

1. **Gemini API Key Management**: The app supports both environment variable (`process.env.API_KEY`) and AI Studio key selector widget (`window.aistudio.openSelectKey()`). If image generation fails with "entity not found", it triggers key re-selection flow ([App.tsx:588-592](App.tsx#L588-L592)).

2. **Character Consistency**: User's selfie is passed with EVERY panel generation request to maintain consistent character appearance across all 6 panels.

3. **Progressive Saving**: Each generated panel is immediately saved to the database to prevent data loss if generation fails mid-sequence ([App.tsx:579-595](App.tsx#L579-L595)).

4. **Base64 Image Storage**: All images (user photos and generated panels) are stored as base64 data URLs directly in the database to avoid separate file storage infrastructure.

5. **Fallback Mechanisms**: Both image analysis and script generation have timeout + fallback logic to ensure the app never hangs if AI models are slow or fail.

## Styling Approach

- Tailwind CSS with custom utility classes
- "Comic book" aesthetic with halftone dot patterns (`.halftone-bg`)
- Bold borders, shadow effects (`shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`)
- Uppercase tracking, heavy font weights for "superhero" branding
- Mobile-first responsive grid (uses `aspect-[4/3]` for consistent panel sizing)

## Type Safety

TypeScript types defined in [types.ts](types.ts):

- `Theme`: Theme metadata structure
- `Alignment`: Literal type `'HERO' | 'VILLAIN'`
- `ComicPanel`: Single panel with id, imageUrl, caption
- `SavedComic`: Complete comic with metadata (userId, themeId, alignment, isPublic, rating, createdAt)
- `User`: Google user + photoUrl for hero face

Path alias `@/*` maps to project root ([tsconfig.json:22-25](tsconfig.json#L22-L25), [vite.config.ts:20-23](vite.config.ts#L20-L23)).

## Recent Changes & Migration History

### 2026-01-04: Database Migration (IndexedDB → PostgreSQL)
- **What Changed**: Migrated from browser-based IndexedDB to server-side Neon PostgreSQL via Netlify
- **Why**: Enable persistent storage across devices, better data integrity, and support for future features like admin dashboards
- **Key Files Modified**:
  - Added [db/](db/) directory with schema and connection config
  - Added [drizzle.config.ts](drizzle.config.ts) for migration management
  - Added [netlify.toml](netlify.toml) for Netlify dev server configuration
  - Updated [services/db.ts](services/db.ts) to use Drizzle ORM instead of IndexedDB
  - Updated [package.json](package.json) to use `netlify dev` instead of plain `vite`
  - Updated [vite.config.ts](vite.config.ts) to expose DATABASE_URL
  - Updated [.gitignore](.gitignore) to exclude `.env` files
  - Fixed [db/index.ts](db/index.ts) to properly pass connection string to Neon client
  - Changed `DATABASE_URL` to `NETLIFY_DATABASE_URL` pointing to dev branch database
- **New Dependencies**: `@netlify/neon`, `drizzle-orm`, `drizzle-kit`, `netlify-cli`
- **Dev Server**: Now runs via `npm run dev` (Netlify dev on port 8889), NOT plain Vite
- **Database Branches**: Using separate dev branch (`ep-soft-hill`) for local development vs production
- **Testing Status**: Netlify dev server running successfully, environment variables injected properly
- **Next Steps**: Manual testing of create/read/delete operations in browser at `http://localhost:8889`
