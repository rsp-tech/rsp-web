# HG Radheshyamdas Spiritual Discourses

Rebuild of [radheshyamdas.com](https://radheshyamdas.com). A web app for browsing and discovering spiritual discourses, recordings, and study materials by HG Radheshyamdas.

## Getting Started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Package manager:** Always use `pnpm.cmd` on Windows. Never use `npm` or `npx`.

## Purpose

The app delivers a searchable, offline-capable archive of spiritual content — lectures, audio recordings, and supporting materials — organized into a hierarchical category tree mirroring the original site.

## Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (Postgres + RLS) |
| Local cache | IndexedDB via `idb` |
| Search | `@orama/orama` (client-side full-text) |
| Styling | Tailwind CSS v4 + Shadcn UI |
| Auth | Supabase Auth (email + Google OAuth) |
| State | TanStack Query v5 |

### Data Flow

All Supabase tables are synced to IndexedDB on app load via a **Web Worker** (`src/workers/sync.ts`). This enables fully offline-capable browsing after the first visit.

- **Delta sync** — only rows changed since `updated_at` are fetched, keeping syncs fast.
- **Lazy load** — if a route's data is missing from IndexedDB (e.g. first visit to a deep URL), it fetches just that slice immediately, then syncs the rest in the background.
- **Search** — a separate Web Worker (`src/workers/search.ts`) builds an in-memory Orama index from IndexedDB. Searches never hit the network.
- **Cleanup** — on logout or role change, a cleanup Worker (`src/workers/cleanup.ts`) purges any restricted records from IndexedDB and terminates the search worker, which rebuilds clean on next use.

### Source Layout

```
src/
├── app/                  # Next.js App Router pages
│   ├── [...slug]/        # Dynamic category/recording pages
│   ├── layout.tsx
│   └── page.tsx          # Home — root categories
├── components/           # Shared UI components (dash-case)
│   └── ui/               # Shadcn primitives
├── hooks/                # React hooks (dash-case, use-* prefix)
├── lib/                  # Supabase client, IDB setup, utilities
├── workers/              # Web Workers: sync, search, cleanup
├── constants.ts          # Store names, index names, worker message types
├── types.ts              # Domain types derived from database.types.ts
└── database.types.ts     # Auto-generated — DO NOT edit manually
```

### Theming

Four runtime themes are supported via CSS class on `<html>`: `clean`, `monk`, `dark`. A fourth additive modifier `compact` can stack on top of any color theme. Theme is persisted via `next-themes` (localStorage).

### Conventions

- All filenames are **dash-case** (`use-search.ts`, `auth-modal.tsx`).
- No hardcoded color tokens — always use semantic CSS variables (`bg-background`, `text-destructive`).
- Route-specific components/hooks live inside the route directory under `_components/` or `_hooks/`.

## Regenerating Database Types

```bash
pnpm db-types
```

Requires a `.env` with `SUPABASE_PROJECT_ID` set. Runs `supabase gen types` then prunes to only the `prod` schema.
