# Global Agent Instructions

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## 1. Project Identity & Architecture

- **Purpose**: Rebuild of `https://radheshyamdas.com/`. Delivers spiritual discourses by HG Radheshyamdas.
- **Stack**: Next.js (App Router), Supabase (Postgres + RLS), IndexedDB (`idb`), Orama Search, Tailwind CSS, Shadcn UI.
- **Package Manager**: **CRITICAL:** Never use `npm` or `npx`. Always use Windows-safe `pnpm.cmd` (e.g., `pnpm.cmd add`, `pnpm.cmd shadcn add <component>`).
- **Icons**: Use lucide icons. For brand icons use `react-icons/si`
- **Auth & Security**: Public access by default. Enforce Supabase RLS. On logout/role change, **immediately purge** all restricted data from IndexedDB, Orama, and local caches (already implemented).

## 2. Coding Standards & Component Design

- **Style**: Functional TypeScript using arrow functions (`() => {}`). Write clean, maintainable, testable code with `vitest` unit tests. Avoid `process.exit`.
- **File Naming**: **CRITICAL:** All files must use `dash-case` (kebab-case). No PascalCase or camelCase filenames. Examples: `auth-modal.tsx`, `use-search.ts`, `notification-center.tsx`.
- **Structure**: Keep components small and single-responsibility. Use `.map()` for lists.
- **Colocation**: Place route-specific components/hooks inside that route's directory (e.g., `_components/`, `_hooks/`). Place shared assets in `src/components/`, `src/hooks/`, or `src/components/ui/` for Shadcn.
- **Database Types**: Do not manually edit `src/database.types.ts`. Cast `ltree` fields (`path`, `url_path`) from `unknown` to `string` (already done, see types.ts).

## 3. Data Sync & Search Engine

- **Lean Sync**: Sync Supabase tables to IndexedDB (`idb`) using delta sync (`updated_at`). **Omit** heavy JSON `metadata` columns to save local memory - implemented already.
- **Lazy Load Strategy**: If route data is missing from IndexedDB on load, fetch _only_ that slice from Supabase immediately, then trigger a background sync for the rest - implemented already.
- **Search & Filters**: Run client-side full-text search via `@orama/orama`. Index metadata fields (`title`, `speaker`, `language`, `date`) inside Orama for multi-criteria filtering. Utilize IndexedDB indexes for rapid relational queries.

## 4. UI, Themes & UX Expectations

- **Design**: Mobile-first layouts. Use adaptive UX components (e.g., bottom sheets/drawers on mobile, standard dialogs on desktop).
- **Styling**: **Never hardcode color tokens** (e.g., `bg-zinc-50`). Use semantic CSS variables (`bg-background`, `text-destructive`).
- **Theming**: Support dynamic runtime theme-swapping (`monk`, `clean`, `dark`, `compact`) via `globals.css` variable updates.
- **Shadcn & CSS Variables**: When adding a new Shadcn component (or when appropriate), check whether all corresponding CSS variables it relies on are defined in `globals.css` across all themes. If a required variable is missing or has been consolidated/eliminated, prompt the user for which class to use instead, e.g., card instead of popover.
- **Feedback**: Implement robust loading feedback. Use `sonner` toasts for background sync progress, and skeletons/shimmers for content hydration states.
- **Performance**: Ensure best coding practices and performance. e.g., prefer utility functions out side the render function, do not use huge context, use react query effectively, etc.
