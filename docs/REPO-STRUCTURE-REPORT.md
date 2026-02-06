# Current Repo Structure Report (Explorer)

**Generated:** 2026-02-06  
**Purpose:** Snapshot of what exists in the repo for alignment with plan and docs. To be verified by code-reviewer.

---

## 1. Root and config

| Item | Path | Status |
|------|------|--------|
| Package manager | pnpm (pnpm-lock.yaml, pnpm-workspace.yaml) | Present |
| Next.js config | next.config.ts | Present |
| TypeScript | tsconfig.json | Present |
| ESLint | eslint.config.mjs | Present |
| PostCSS / Tailwind | postcss.config.mjs | Present |
| Git ignore | .gitignore | Present |
| README | README.md | Present |
| **middleware.ts at root** | — | **Absent** (correct for Next.js 16) |
| **proxy.ts** | **src/proxy.ts** | **Present** (route protection) |

---

## 2. Package.json (key facts)

- **name:** etmam-2.0  
- **next:** 16.1.6  
- **Scripts:** dev, build, start, lint  
- **Dependencies:** @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.95.2, next 16.1.6, react 19.2.3, zustand, zod, papaparse, xlsx, @google/generative-ai, groq-sdk, clsx, tailwind-merge, xlsx  
- **DevDependencies:** supabase ^2.75.5, tailwindcss ^4, typescript ^5, eslint, eslint-config-next 16.1.6  
- **No** @supabase/auth-helpers-nextjs in dependencies  

---

## 3. App Router (src/app)

| Route / file | Exists | Notes |
|--------------|--------|--------|
| layout.tsx (root) | Yes | |
| page.tsx (root) | Yes | |
| loading.tsx (root) | Yes | |
| error.tsx (root) | Yes | |
| not-found.tsx | Yes | |
| globals.css | Yes | |
| favicon.ico | Yes | |
| (auth)/login/page.tsx | Yes | |
| (auth)/register/page.tsx | Yes | |
| (dashboard)/layout.tsx | Yes | |
| (dashboard)/dashboard/page.tsx | Yes | |
| (dashboard)/tenders/page.tsx | Yes | |
| (dashboard)/tenders/upload/page.tsx | Yes | |
| (dashboard)/tenders/[id]/page.tsx | Yes | |
| (dashboard)/pipeline/page.tsx | Yes | |
| (dashboard)/settings/page.tsx | Yes | |
| (dashboard)/loading.tsx | Yes | |
| (dashboard)/error.tsx | Yes | |

No reports route (reports/page.tsx absent; per docs, removed).

---

## 4. Route protection (proxy)

| Item | Location | Verified |
|------|----------|----------|
| Proxy entry point | src/proxy.ts | Exports `proxy(request)` and `config.matcher` |
| Session refresh helper | src/lib/supabase/middleware.ts | Uses createServerClient from @supabase/ssr; used by proxy only |
| Root middleware.ts | — | Does not exist |
| Browser client | src/lib/supabase/client.ts | createBrowserClient from @supabase/ssr |
| Server client | src/lib/supabase/server.ts | createServerClient from @supabase/ssr |

---

## 5. Components (src/components)

All are **directories with .gitkeep** only (no built components yet); structure matches FRONTEND/IMPLEMENTATION:

- analysis/, auth/, dashboard/, layout/, pipeline/, settings/, shared/, tender/, ui/

---

## 6. Lib (src/lib)

| Path | Purpose |
|------|---------|
| lib/ai/gemini.ts, groq.ts, mock-provider.ts, parser.ts, prompts.ts, provider.ts | AI provider layer |
| lib/constants.ts | App constants |
| lib/design-tokens.ts | Design tokens |
| lib/rtl.ts | RTL/direction helper |
| lib/supabase/client.ts, server.ts, middleware.ts | Supabase clients (SSR) |
| lib/utils/csv-parser.ts, format.ts, index.ts, validation.ts | Utilities |

---

## 7. Hooks, stores, types (src/)

- **hooks:** use-analysis.ts, use-auth.ts, use-pipeline.ts, use-tenders.ts, use-toast.ts  
- **stores:** analysis-store, app-store, pipeline-store, settings-store, tender-store, ui-store  
- **types:** ai.ts, api.ts, database.ts, ui.ts  

**database.ts:** Contains types for all 8 BACKEND tables (profiles, tenders, evaluations, cost_items, rate_cards, rate_card_items, evaluation_presets, extraction_cache). No pipeline_stages / pipeline_entries types yet (migration does not include those tables).

---

## 8. Supabase

| Item | Path | Status |
|------|------|--------|
| Config | supabase/config.toml | Present |
| Initial migration | supabase/migrations/20260206120000_initial_schema.sql | Present |
| Tables in migration | 8: profiles, evaluation_presets, tenders, evaluations, rate_cards, rate_card_items, cost_items, extraction_cache | Verified (grep CREATE TABLE) |
| pipeline_stages / pipeline_entries in migration | — | Not present (to be added per plan for Phase 2.3) |

---

## 9. Docs (docs/)

Present: AGENT-ASSIGNMENTS.md, ARCHITECTURE.md, GOTCHA-TECH-STACK-VERIFICATION.md, HARD-REVIEW-CHECKLIST.md, PHASE-1.1-CHECKLIST-RESULT.md, PHASE-1.1-GAP-AUDIT.md, PHASE-1.2-CHECKLIST-RESULT.md, PHASE-COMPLETION-PROTOCOL.md, PROJECT-LEAD-GUIDE.md, PROJECT-LEAD-ROLE.md, SCAFFOLDING-DECISIONS.md, setup-guide.md, WORKFLOW.md.  
docs/context/ has README.md only (no copy of full context docs in repo).

---

## 10. Public assets

public/: file.svg, globe.svg, next.svg, vercel.svg, window.svg (default Next assets).

---

## 11. Alignment summary

- **Phase 1.1:** Scaffolding complete (routes, proxy, Supabase clients, design tokens, loading/error/not-found, docs).  
- **Phase 1.2:** Migration has 8 tables; RLS and storage in migration; database.ts has 8 table types. pipeline_stages / pipeline_entries not in migration (plan: add migration for Phase 2.3).  
- **Next.js 16 / auth:** proxy.ts only; no root middleware; @supabase/ssr only.  
- **Next phase:** 1.3 Authentication (LoginForm, RegisterForm, Server Actions, wire proxy, Header).

---

**End of Explorer report.** This report is to be reviewed by code-reviewer for factual accuracy and absence of hallucinated paths or claims.
