# Phase 1.1 — Gap Audit (Scaffolding)

**Purpose:** Record what was missed or wrong in the initial scaffolding so we fix it and don’t repeat the same mistakes.

---

## Gaps found (vs IMPLEMENTATION.md + FRONTEND.md + TECH-STACK.md)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **docs/setup-guide.md** | ❌ Missing | `.env.example` references it; file doesn’t exist. Either create a minimal setup-guide or remove the reference. |
| 2 | **components/shared/** | ❌ Missing | FRONTEND.md component tree includes `shared/` (ScoreBadge, SourceBadge, EmptyState, etc.). Scaffold has no `shared/` folder. Add `src/components/shared/` (can be empty or with .gitkeep) for consistency. |
| 3 | **Font choice** | ⚠️ Mismatch | TECH-STACK specifies **Cairo + Noto Kufi Arabic**. Current scaffold uses **Inter + Noto Sans Arabic**. Both work for Arabic; if we want strict doc compliance, switch to Cairo + Noto Kufi. |
| 4 | **TECH-STACK “light mode only”** | ⚠️ Mismatch | TECH-STACK says “Light mode only (dark mode is future scope).” Root layout uses `className="dark"` and design tokens are dark (navy bg). Either align to light mode per doc or treat this as an intentional override for MVP. |
| 5 | **Route protection file name** | ✅ Resolved | IMPLEMENTATION.md said “middleware.ts”; we correctly use **proxy.ts** per Next.js 16 and your request. No change needed. |
| 6 | **Lucide icons** | ⚠️ Not in deps | FRONTEND.md and TECH-STACK mention Lucide icons. Not in Phase 1.1 dependency list; add when building UI components (e.g. Phase 1.3/1.4). |
| 7 | **react-hook-form + @hookform/resolvers** | ⚠️ Not in Phase 1.1 | In TECH-STACK package list but not in IMPLEMENTATION Phase 1.1. Add when building forms (e.g. Phase 1.3 Auth forms). |

---

## Fixes done (post–Claude Code assessment)

1. **setup-guide.md** — Created minimal `docs/setup-guide.md`. ✅
2. **components/shared/** — Added `src/components/shared/.gitkeep`. ✅
3. **Page stubs** — Added `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, `(dashboard)/loading.tsx`, `(dashboard)/error.tsx`. ✅
4. **Dashboard layout** — `(dashboard)/layout.tsx` now has sidebar (240px) + header shell with nav links. ✅
5. **formatCompactNumber** — Uses Arabic suffixes (م / ألف) when locale is ar; English M/K otherwise. ✅
6. **proxy vs middleware** — `docs/ARCHITECTURE.md` and README note that `src/proxy.ts` replaces middleware. ✅
7. **AI mock** — `lib/ai/mock-provider.ts` + `getAIProvider()` returns mock when `MOCK_AI=true` or no API keys; `.env.example` documents `MOCK_AI`. ✅
8. **Redundancy** — `rtl.ts` now only exports `getDirection` (formatting lives in `utils/format.ts`). `design-tokens.ts` has a comment that `globals.css` is the Tailwind source of truth. ✅
9. **Doc conflict** — `docs/SCAFFOLDING-DECISIONS.md` records FRONTEND vs TECH-STACK (dark vs light, Inter vs Cairo) and what was chosen so you can override later. ✅

## Still to decide (optional)

- **Fonts:** Switch to Cairo + Noto Kufi per TECH-STACK? See `docs/SCAFFOLDING-DECISIONS.md`.
- **Theme:** Switch to light mode per TECH-STACK? Same doc.

---

## How to prevent this next time

- **Before calling any phase “done”:** Run `docs/PHASE-COMPLETION-PROTOCOL.md` for that phase. The Phase 1.1 checklist there is built from this audit.
- **After any phase:** Project-lead (or you) runs a short gap audit: “Compare IMPLEMENTATION + FRONTEND/BACKEND/TECH-STACK to repo; list missing/wrong/incomplete.” Then fix or log.
