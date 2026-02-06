# Dual-Tool Workflow: Claude Code + Cursor for Etmam 2.0

## Context

Etmam 2.0 is a 3-day competition build (Saudi tender management + AI analysis). Phases 1.1-1.2 are done. The project has a structured 5-step workflow enforced by Cursor (READ → IMPLEMENT → SELF-CHECK → HARD REVIEW → SIGN-OFF), but the "Hard Reviewer" role and pre-phase knowledge injection are bottlenecks. Claude Code's 500+ skills can fill both gaps — providing domain-specific patterns before implementation and acting as the independent code-reviewer after.

## Strategy: "Prep → Execute → Verify"

**Claude Code = Strategic Intelligence + Quality Gate**
- BEFORE each phase: invoke skills, generate pattern files with gotchas and code snippets
- AFTER each phase: run hard review (9-item checklist) + build verification

**Cursor = Multi-Agent Execution Engine**
- DURING each phase: assigned agent reads context docs + pattern file, implements, self-checks

**Filesystem = Message Bus** (both tools read/write to the same repo)

## The 7-Step Phase Cycle

```
 CLAUDE CODE                 CURSOR                    CLAUDE CODE
┌──────────────┐   ┌──────────────────────┐   ┌─────────────────────┐
│ CC-1: SKILLS │──>│ CU-3: READ + EXECUTE │──>│ CC-6: HARD REVIEW   │
│ CC-2: ENRICH │   │ CU-4: SELF-CHECK     │   │ CC-7: BUILD VERIFY  │
└──────────────┘   │ CU-5: COMMIT         │   └─────────────────────┘
   ~15 min         └──────────────────────┘       ~15-20 min
                       ~1-2.5 hours
```

### Step Details

| Step | Tool | What | Output |
|------|------|------|--------|
| CC-1 | Claude Code | Invoke 2-4 relevant skills for the phase | Patterns, snippets, gotcha list |
| CC-2 | Claude Code | Write `docs/patterns/PHASE-X.Y-PATTERNS.md` | Pattern file in repo |
| CU-3 | Cursor | Agent reads context docs + pattern file, implements all tasks | Code changes |
| CU-4 | Cursor | Runs PHASE-COMPLETION-PROTOCOL.md checklist, fixes failures | `docs/PHASE-X.Y-CHECKLIST-RESULT.md` |
| CU-5 | Cursor | Commits all changes | Git commit |
| CC-6 | Claude Code | Runs HARD-REVIEW-CHECKLIST.md (9 items) as code-reviewer | Sign-off or Blocked list |
| CC-7 | Claude Code | Runs `pnpm build && tsc --noEmit` | Build pass/fail |

## Artifact Storage

```
docs/
  patterns/                          ← Claude Code writes (skill outputs)
    PHASE-1.3-PATTERNS.md
    PHASE-1.4-PATTERNS.md
    PHASE-2.1-PATTERNS.md
    ...
  reviews/                           ← Claude Code writes (hard review results)
    PHASE-1.3-HARD-REVIEW.md
    ...
  PHASE-X.Y-CHECKLIST-RESULT.md     ← Cursor writes (self-check, existing pattern)
```

## Skills Per Phase

### Phase 1.3 — Authentication
**Skills:** `nextjs`, `supabase-postgres-best-practices`, `react-hook-form-zod`, `error-handling-patterns`
**Pattern file focus:**
- Server Action auth pattern using `createServerClient` from `src/lib/supabase/server.ts`
- Zod schemas for login/register with Arabic error messages
- GOTCHA: use `redirect()` not `router.push()` in Server Actions
- GOTCHA: verify existing `src/proxy.ts` works — don't rewrite it
- GOTCHA: reuse existing `src/hooks/use-auth.ts` — don't duplicate

### Phase 1.4 — Tender Upload & List
**Skills:** `nextjs`, `supabase-postgres-best-practices`, `typescript-advanced-types`, `react-hook-form-zod`
**Pattern file focus:**
- PapaParse + XLSX client-side parsing → Server Action for save
- Arabic column name mapping (build on existing `src/lib/utils/csv-parser.ts`)
- TenderTable with sort, status badges, empty state
- GOTCHA: DB uses `entity` not `entity_name` — match `src/types/database.ts`

### Phase 2.1 — AI Provider Setup
**Skills:** `google-gemini-api`, `prompt-engineering-patterns`, `error-handling-patterns`, `typescript-advanced-types`
**Pattern file focus:**
- Audit existing `src/lib/ai/*.ts` files — what's scaffolded vs what needs real implementation
- Gemini `responseMimeType: "application/json"` for structured output
- Anti-hallucination: confidence scores, evidence quotes, `null` for not-found
- Retry with exponential backoff
- GOTCHA: must work with `MOCK_AI=true` (existing `mock-provider.ts`)

### Phase 2.2 — Analysis Server Action & UI
**Skills:** `nextjs`, `tailwind-v4-shadcn`, `zustand-state-management`
**Pattern file focus:**
- `analyzeTender` Server Action using `getAIProvider()` from `src/lib/ai/provider.ts`
- SVG ScoreGauge component (circular, animated, color-coded by threshold)
- EvidenceQuotes collapsible pattern
- CRITICAL GOTCHA: save to `evaluations` table (BACKEND.md), NOT `tender_analyses` (IMPLEMENTATION.md typo)

### Phase 2.3 — CRM Pipeline Board
**Skills:** `supabase-postgres-best-practices`, `tailwind-v4-shadcn`, `zustand-state-management`
**Pattern file focus:**
- Migration SQL for `pipeline_stages` + `pipeline_entries` (from BACKEND.md)
- 6-column kanban layout, button-based stage moves (no drag-and-drop for MVP)
- CRM field mapping: 7 required fields with Arabic labels
- Wire existing `src/stores/pipeline-store.ts`

### Phase 3.2 — Dashboard
**Skills:** `tailwind-v4-shadcn`, `nextjs`
**Pattern file focus:** StatCard grid, CSS bar chart for score distribution, RecentTenders list

### Phase 3.3 — Settings
**Skills:** `zustand-state-management`, `react-hook-form-zod`
**Pattern file focus:** Weight sliders that sum to 100%, AI provider toggle, persist to `src/stores/settings-store.ts`

### Phase 3.4 — Visual Polish + Landing Page
**Skills:** `tailwind-v4-shadcn`, `shadcn-ui`, `ui-ux-pro-max`
**Pattern file focus:** Toast system, skeleton loaders, sidebar polish, hero section for landing

### Phase 3.5 — Documentation
**Skills:** `docs-writer`, `crafting-effective-readmes`
**Pattern file focus:** README template (quick start, env table, architecture, screenshots)

## Hard Review Protocol (Claude Code as code-reviewer)

After Cursor commits, Claude Code runs all 9 items from `docs/HARD-REVIEW-CHECKLIST.md`:

1. **No bare stubs** — read every page.tsx changed; verify real structure
2. **Layouts are real shells** — sidebar + header + main per FRONTEND.md
3. **i18n/locale** — Arabic labels, Arabic number formatting
4. **Error and not-found** — error.tsx/loading.tsx on async routes
5. **Doc conflicts documented** — no silent picks; proxy.ts not middleware.ts
6. **Testable without keys** — MOCK_AI=true path works
7. **No redundant duplicates** — single source for formatting/RTL/tokens
8. **Phase-specific requirements** — all IMPLEMENTATION.md tasks done + acceptance test
9. **Build and types** — `pnpm build` + `tsc --noEmit` pass

Output: "Sign-off: Phase X.Y complete" or "Blocked: [items]. Fix and re-submit."

## Cursor Prompt Template

When starting a phase in Cursor, use this prompt:

```
You are [AGENT ROLE from AGENT-ASSIGNMENTS.md].

Read before coding:
1. Context docs: IMPLEMENTATION.md Phase X.Y + BACKEND/FRONTEND/TECH-STACK
2. Pattern file: docs/patterns/PHASE-X.Y-PATTERNS.md (skill-derived patterns and gotchas)

Execute IMPLEMENTATION.md Phase X.Y exactly.
Follow patterns in PHASE-X.Y-PATTERNS.md. Pay attention to GOTCHA sections.

Before claiming done:
1. Run checklist in docs/PHASE-COMPLETION-PROTOCOL.md
2. Output ✅/❌ for each item, fix any ❌
3. Run acceptance test from IMPLEMENTATION.md
4. Save result to docs/PHASE-X.Y-CHECKLIST-RESULT.md
5. Commit all changes

Do NOT run hard review — that is done separately by code-reviewer.
```

## Day-by-Day Schedule

### Day 1 — Phases 1.3, 1.4
| Phase | CC Prep | Cursor Execute | CC Review | You Sign-off |
|-------|---------|---------------|-----------|-------------|
| 1.3 Auth | 15 min | 1-1.5 hrs | 15 min | 10 min |
| 1.4 Upload | 15 min | 1.5-2 hrs | 15 min | 10 min |
| **Day 1 checkpoint:** register → login → upload CSV → view tenders |

### Day 2 — Phases 2.1, 2.2, 2.3
| Phase | CC Prep | Cursor Execute | CC Review | You Sign-off |
|-------|---------|---------------|-----------|-------------|
| 2.1 AI Setup | 15 min | 45-60 min | 15 min | 10 min |
| 2.2 Analysis UI | 20 min | 1.5-2 hrs | 20 min | 15 min |
| 2.3 Pipeline | 15 min | 1.5-2 hrs | 15 min | 15 min |
| **Day 2 checkpoint:** upload → analyze → score + evidence → pipeline → CRM push |

### Day 3 — Phases 3.1-3.6
| Phase | CC Prep | Cursor Execute | CC Review |
|-------|---------|---------------|-----------|
| 3.1 Bug fixes | 10 min triage | 45 min | 10 min (qa) |
| 3.2 Dashboard | 10 min | 1 hr | 10 min |
| 3.3 Settings | 5 min | 45 min | 10 min |
| 3.4 Polish + Landing | 10 min | 1.5 hrs | 10 min |
| 3.5 Docs | skill invocation | 45 min | — |
| 3.6 Demo prep | — | You (Hammad) | — |

## How to Start (Right Now)

1. **Claude Code** (this tool): Invoke skills for Phase 1.3 → write `docs/patterns/PHASE-1.3-PATTERNS.md` ✅ DONE
2. **Cursor**: Open new composer, paste the Cursor Prompt Template for Phase 1.3
3. **After Cursor commits**: Come back to Claude Code → request hard review
4. **Repeat** for each phase

## Verification

After each phase:
- `pnpm build` passes
- `tsc --noEmit` passes
- Hard review checklist: all 9 items satisfied
- Phase acceptance test from IMPLEMENTATION.md passes
- Manual smoke test by you (Hammad)

End-to-end at Day 3 end:
- Full demo flow: register → login → upload CSV → analyze → score + evidence → pipeline → CRM push → dashboard → settings → landing page
- README lets a judge set up in <5 minutes
