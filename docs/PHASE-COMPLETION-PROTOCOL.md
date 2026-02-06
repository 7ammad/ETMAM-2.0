# Phase Completion Protocol

**Purpose:** So agents (and humans) don’t miss steps, leave out files, or ship wrong/incomplete code. Every phase is “done” only when this protocol is satisfied.

---

## Rule: No phase is complete until checklist + hard review pass

Before saying “Phase X.Y is done”:

1. **Run the phase’s checklist** (see below for Phase 1.1; we add one per phase as we go).
2. **Run the phase’s Acceptance Test** from IMPLEMENTATION.md (e.g. “pnpm dev runs, /login works, /dashboard redirects to /login”).
3. **Fix any gap** found in the checklist or acceptance test.
4. **Hard Review** — A **different** agent (code-reviewer) runs **docs/HARD-REVIEW-CHECKLIST.md** and either signs off or returns a Blocked list. No sign-off → phase is not complete. See **docs/WORKFLOW.md**.

If you’re the implementer: output the phase checklist with ✅/❌ for each line and fix any ❌, then submit for Hard Review. If you’re the reviewer: run HARD-REVIEW-CHECKLIST and output Sign-off or Blocked.

---

## Phase 1.1 — Project Scaffolding (checklist)

Use this **every time** Phase 1.1 is (re)done or audited.

### 1. Project init

- [ ] Next.js project exists with TypeScript, Tailwind, ESLint, App Router, `src/`.
- [ ] `pnpm install` and `pnpm dev` run without errors.
- [ ] `pnpm build` succeeds.

### 2. Dependencies (from IMPLEMENTATION.md Phase 1.1)

- [ ] `@supabase/supabase-js`, `@supabase/ssr` installed.
- [ ] `zustand` installed.
- [ ] `zod`, `clsx`, `tailwind-merge` installed.
- [ ] `papaparse`, `xlsx` installed.
- [ ] `@google/generative-ai`, `groq-sdk` installed.
- [ ] Dev: `@types/papaparse`, `supabase` installed.

### 3. Folder structure (match FRONTEND.md / IMPLEMENTATION.md)

- [ ] `src/app/layout.tsx`, `src/app/page.tsx` exist.
- [ ] `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx` exist.
- [ ] `src/app/(dashboard)/layout.tsx`, `dashboard/page.tsx`, `tenders/page.tsx`, `tenders/upload/page.tsx`, `tenders/[id]/page.tsx`, `pipeline/page.tsx`, `settings/page.tsx` exist.
- [ ] `src/components/` has: `ui/`, `layout/`, `auth/`, `tender/`, `analysis/`, `pipeline/`, `dashboard/`, `settings/`. (Optional: `shared/` per FRONTEND.md.)
- [ ] `src/lib/supabase/` (client, server, middleware helpers), `src/lib/utils/`, `src/lib/ai/` exist.
- [ ] `src/stores/`, `src/types/`, `src/hooks/` exist.

### 4. Tailwind design tokens (FRONTEND.md)

- [ ] Custom colors: navy, gold, confidence, status (in `globals.css` and/or `lib/design-tokens.ts`).
- [ ] Typography: font-sans (Inter + Noto Sans Arabic or Cairo + Noto Kufi per TECH-STACK), font-arabic.
- [ ] Semantic tokens used for background, foreground, border, primary (e.g. `bg-background`, `text-foreground`).

### 5. Supabase

- [ ] `src/lib/supabase/client.ts` — browser client.
- [ ] `src/lib/supabase/server.ts` — server client (cookies).
- [ ] `src/lib/supabase/middleware.ts` (or equivalent) — session refresh helper used by proxy.

### 6. Route protection (proxy, not middleware in Next.js 16)

- [ ] `src/proxy.ts` (or root `proxy.ts`) exists and exports `proxy` + `config.matcher`.
- [ ] Unauthenticated users hitting protected routes redirect to `/login`.
- [ ] Authenticated users on `/login` or `/register` redirect to `/dashboard`.
- [ ] Session refresh (Supabase) runs in proxy and cookies are preserved on redirects.

### 7. Root page and layout

- [ ] `src/app/page.tsx` redirects to `/dashboard` if logged in, else `/login`.
- [ ] `src/app/layout.tsx` sets `lang="ar"`, `dir="rtl"`, loads fonts, uses design tokens for body (e.g. `bg-background`, `text-foreground`).

### 8. Environment and docs

- [ ] `.env.example` exists with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`, `GEMINI_API_KEY`, optional `GROQ_API_KEY`, optional Odoo vars, `NEXT_PUBLIC_APP_URL`.
- [ ] `.env.example` is committed; `.env.local` is in `.gitignore`.
- [ ] If `.env.example` references `docs/setup-guide.md`, that file exists or the reference is removed/updated.

### 9. Acceptance test (IMPLEMENTATION.md)

- [ ] `pnpm dev` runs without errors.
- [ ] Visiting `/login` shows a page (even if minimal).
- [ ] Visiting `/dashboard` while logged out redirects to `/login`.
- [ ] Tailwind custom colors work (e.g. a page or component uses `bg-navy-900` or `bg-background` and it looks correct).

---

## Phase 1.2 — Database Schema (checklist)

Use this when Phase 1.2 is (re)done or audited. **Schema source of truth: BACKEND.md** (see doc conflict note in PHASE-1.2-CHECKLIST-RESULT.md if present).

### 1. Migration and tables

- [ ] `supabase/` folder exists with `config.toml` and `migrations/`.
- [ ] Migration file creates all 8 tables from BACKEND.md in FK order: `profiles`, `evaluation_presets`, `tenders`, `evaluations`, `rate_cards`, `rate_card_items`, `cost_items`, `extraction_cache`.
- [ ] No tables from IMPLEMENTATION.md task 2 that conflict with BACKEND (scoring_configs, tender_analyses, etc.) — use BACKEND.md only; log conflict.

### 2. Triggers and indexes

- [ ] Trigger `on_auth_user_created` → `handle_new_user()` (profile on signup).
- [ ] Trigger `on_evaluation_change` → `update_tender_evaluation()`.
- [ ] Trigger `on_cost_item_change` → `update_tender_costs()`.
- [ ] Trigger `on_rate_card_item_change` → `update_rate_card_count()`.
- [ ] Indexes per BACKEND.md on foreign keys and common filters.

### 3. RLS and storage

- [ ] RLS enabled on all 8 tables.
- [ ] Policies: own-row SELECT/INSERT/UPDATE/DELETE for user-owned tables; extraction_cache: SELECT all, INSERT authenticated.
- [ ] Storage buckets `tender-pdfs` and `rate-card-files` with RLS (user-scoped by folder).

### 4. TypeScript types

- [ ] `src/types/database.ts` has types for all 8 tables (Row/Insert/Update or equivalent).

### 5. Acceptance (when DB is available)

- [ ] Migration runs (`supabase db push` or `supabase start` + `db reset`) without errors.
- [ ] All 8 tables visible in Supabase dashboard; RLS on each; test row insertable.

---

## How to use this with an agent

**Prompt to give before Phase 1.1 (or re-do of scaffolding):**

```
You are implementing Etmam 2.0 Phase 1.1 — Project Scaffolding.

1. Read these documents first (no coding until you've read them):
   - IMPLEMENTATION.md (Phase 1.1 section)
   - TECH-STACK.md (stack and package list)
   - FRONTEND.md (folder structure and design tokens)

2. Implement every item in Phase 1.1 exactly. Use Next.js 16 proxy (proxy.ts), not middleware.

3. Before you say "done", run the Phase 1.1 checklist in docs/PHASE-COMPLETION-PROTOCOL.md.
   Output the checklist with ✅ or ❌ for each line. Fix any ❌.

4. Run the Acceptance Test from IMPLEMENTATION.md and confirm all four points pass.
```

For **any other phase**, we add a corresponding checklist block in this file and the same pattern: “Read X, implement Phase Y, run checklist, run acceptance test, then done.”

---

## Adding checklists for later phases

When starting Phase 1.2, 1.3, etc., the project-lead (or you) adds a new section:

```markdown
## Phase 1.2 — Database Schema (checklist)
- [ ] ...
- [ ] ...
```

Copy the task list from IMPLEMENTATION.md into checklist form so nothing is left to “remember.” That way the implementation stays solid and agents don’t skip steps.
