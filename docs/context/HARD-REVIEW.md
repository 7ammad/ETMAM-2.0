# HARD-REVIEW.md — Etmam 2.0 Documentation Audit

> Cross-document contradiction and gap analysis
> Reviewed by: Claude (Planning AI)
> Date: February 6, 2026
> Status: ⚠️ CRITICAL ISSUES FOUND — Must resolve before build continues

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 CRITICAL | 3 | Will cause build failures or incorrect implementation |
| 🟡 HIGH | 5 | Will cause confusion for Cursor agents, inconsistent output |
| 🟢 LOW | 4 | Minor inconsistencies, won't block but should fix |

---

## 🔴 CRITICAL ISSUES

### C1: Database Table Names Mismatch — BACKEND.md vs IMPLEMENTATION.md

**Conflict:**
- **Handoff summary** (from BACKEND.md session) lists 8 tables: `users, tenders, tender_documents, tender_analyses, analysis_items, pipeline_stages, crm_mappings, crm_export_logs`
- **IMPLEMENTATION.md Phase 1.2** lists 8 different tables: `profiles, scoring_configs, tenders, tender_analyses, analysis_evidence, pipeline_stages, pipeline_entries, crm_push_logs`

**Specific mismatches:**

| BACKEND.md (Handoff) | IMPLEMENTATION.md | Issue |
|----------------------|-------------------|-------|
| `users` | `profiles` | Different table — profiles extends auth.users, but which is the source of truth? |
| `tender_documents` | *(missing)* | IMPLEMENTATION.md doesn't mention this table at all |
| `analysis_items` | `analysis_evidence` | Different name, possibly different schema |
| `crm_mappings` | *(missing)* | IMPLEMENTATION.md doesn't mention this table |
| `crm_export_logs` | `crm_push_logs` | Different name |
| *(missing)* | `scoring_configs` | New table not in original BACKEND.md handoff |
| *(missing)* | `pipeline_entries` | New table not in original BACKEND.md handoff |

**Impact:** Cursor agents following IMPLEMENTATION.md will create different tables than what BACKEND.md specifies. TypeScript types won't match. API endpoints will reference wrong tables.

**Resolution needed:**
1. Define the CANONICAL list of tables (likely IMPLEMENTATION.md is newer/more correct)
2. Update BACKEND.md to match
3. Ensure all TypeScript types reference correct table names
4. Verify all API endpoints use correct table names

---

### C2: Font Family Contradiction — TECH-STACK.md vs FRONTEND.md

**Conflict:**
- **TECH-STACK.md** (from previous session where Hammad explicitly corrected): **Cairo + Noto Kufi Arabic** — Hammad specifically rejected IBM Plex Sans Arabic and chose these fonts
- **FRONTEND.md** (latest session): **Inter + Noto Sans Arabic** — different fonts entirely

**Evidence:**
- In the TECH-STACK session, Hammad said to use "Cairo and Noto Kufi Arabic" as a correction
- FRONTEND.md design tokens show: `sans: '"Inter", "Noto Sans Arabic"'` and `arabic: '"Noto Sans Arabic"'`
- These are 3 different Arabic fonts across the docs: Cairo, Noto Kufi Arabic, Noto Sans Arabic

**Impact:** Cursor agents will install wrong fonts. Arabic text rendering will differ from Hammad's intent. Design consistency broken.

**Resolution needed:**
Hammad must confirm ONE font decision:
- Option A: **Cairo** (heading + body) + **Noto Kufi Arabic** (Arabic fallback) — matches TECH-STACK.md correction
- Option B: **Inter** (Latin) + **Noto Sans Arabic** (Arabic) — matches FRONTEND.md
- Option C: **Cairo** (both Latin + Arabic, single family) — simplest, Cairo supports both scripts

---

### C3: Pipeline Stages vs Status Colors Mismatch — FRONTEND.md vs IMPLEMENTATION.md

**Conflict:**
- **IMPLEMENTATION.md PipelineBoard**: 6 columns: `New → Scored → Approved → Pushed → Won → Lost`
- **FRONTEND.md status colors**: `draft, active, scored, pushed, rejected, expired`

**Mapping mismatch:**

| Pipeline Stage (IMPL) | Status Color (FRONT) | Match? |
|----------------------|---------------------|--------|
| New | draft? active? | ❌ Ambiguous |
| Scored | scored | ✅ |
| Approved | *(no match)* | ❌ Missing |
| Pushed | pushed | ✅ |
| Won | *(no match)* | ❌ Missing |
| Lost | rejected? | ❓ Unclear |
| *(none)* | expired | ❌ Orphaned |
| *(none)* | active | ❌ Orphaned |

**Impact:** Frontend will render wrong colors for pipeline stages. Stage-to-color mapping undefined.

**Resolution needed:**
1. Align pipeline stage names across both docs
2. Map each stage to a specific color
3. Decide: Are `expired` and `active` real stages or just tender statuses?

---

## 🟡 HIGH ISSUES

### H1: Gold Color Hex Inconsistency

**Conflict:**
- Handoff summary references: **#D4A843**
- FRONTEND.md design tokens gold-500: **#f0b429**
- FRONTEND.md gold-400: **#f7c948**
- None of these match each other

**Impact:** Inconsistent brand color across components. Minor visual issue but breaks "professional" design goal.

**Resolution:** Pick ONE gold hex as the primary accent. Update all references.

---

### H2: Navy Primary Color Hex Inconsistency

**Conflict:**
- Handoff summary: **#0A1628**
- FRONTEND.md navy-950: **#0a1929**
- FRONTEND.md bg.primary: **#0a1929**

**Difference:** `#0A1628` vs `#0a1929` — these are noticeably different dark blues.

**Resolution:** Confirm which hex is the actual app background color.

---

### H3: Dashboard — Build It or Cut It?

**Conflict within IMPLEMENTATION.md itself:**
- **"What to cut if behind schedule"** section says: `Dashboard widgets — Redirect dashboard to tender list`
- **Day 3, Phase 3.2** spends 1-2 hours building: StatCard, StatsRow, RecentTenders, PipelineSummary, ScoreDistribution

**Impact:** Agent will waste 1-2 hours on a feature listed as cuttable. If cut, the sidebar nav still shows "Home/Dashboard" which will 404.

**Resolution:**
- If dashboard IS being built: Remove from "what to cut" list
- If dashboard is cuttable: Add a fallback redirect in Phase 3.2 instructions
- RECOMMENDATION: Build a minimal dashboard (4 stat cards + recent tenders list, skip charts) — covers judges' expectations without over-investing

---

### H4: Settings Page — Build It or Cut It?

**Conflict within IMPLEMENTATION.md:**
- **"What to cut"** section says: `Settings page — Hardcode reasonable defaults`
- But **APP-FLOW.md** shows `/settings` as a page route
- And the demo script at 4:30 says: `Show settings (switch AI provider, adjust weights)`
- And Phase 3.3 seems to reference settings functionality

**Impact:** If cut, demo script breaks at 4:30. If built, it contradicts the cut list.

**Resolution:**
- The demo NEEDS settings to show "switch AI provider" (this is a differentiator for judges)
- Build a MINIMAL settings page: just AI provider toggle + scoring weight sliders
- Remove from "what to cut" list
- Update cut list to say: "Full settings page with profile/theme/notifications — just build AI provider + weights"

---

### H5: Reports Nav Item — Should It Exist?

**Conflict:**
- **IMPLEMENTATION.md "What to cut"**: `Reports page — Already a stretch goal, don't even start`
- **FRONTEND.md sidebar layout**: Shows `□ Report` in navigation

**Impact:** Users see a nav item that leads to a 404 or empty page.

**Resolution:** Remove Reports from the sidebar nav in FRONTEND.md component tree. Or add a "Coming Soon" placeholder.

---

## 🟢 LOW ISSUES

### L1: Next.js Version Verification

**Concern:** TECH-STACK.md specifies **Next.js 16.1** but IMPLEMENTATION.md uses `pnpm create next-app@latest`.

**Question:** Does Next.js 16.1 exist as of Feb 2026? The `@latest` tag will install whatever is current, which may be a different version. Need to verify the exact version string and pin it: `pnpm create next-app@16.1`.

---

### L2: TENDER-STRUCTURE-v3.0-VERIFIED.md — Tracking Gap

**Concern:** This document was created in the previous session but wasn't included in the handoff summary's "5 completed documents" list. Hammad corrected this to confirm 8 total docs.

**Risk:** New Cursor agents may not know this doc exists if they only read the handoff instructions.

**Resolution:** Add TENDER-STRUCTURE-v3.0-VERIFIED.md to all document reference lists across other docs.

---

### L3: Supabase CLI Commands — Local vs Cloud Ambiguity

**Concern:** IMPLEMENTATION.md Phase 1.2 shows two command paths:
```
npx supabase db push   # Cloud
npx supabase start && npx supabase db reset  # Local
```

But there's no clear decision tree for which to use. TECH-STACK.md says "Supabase local dev → user configures own cloud via .env" which implies local-first, but the cloud commands appear first.

**Resolution:** Make IMPLEMENTATION.md explicitly say: "Use local Supabase during development. Only configure cloud Supabase via .env for demo/deployment."

---

### L4: CRM "Simulation" vs Real Integration

**Concern:** IMPLEMENTATION.md's CRM push says "Simulate CRM push (no real CRM for competition)" but the PRD and IDEA.md position CRM integration as a core feature and competition requirement.

**Question for Hammad:** Is the CRM push:
- (a) A real API integration to an external CRM (Salesforce, HubSpot, etc.)?
- (b) An internal pipeline board that SIMULATES a CRM workflow?
- (c) A data export (CSV/JSON) that COULD be pushed to a CRM?

This matters because judges will evaluate it differently. If it's (b), the docs should clearly frame it as "internal CRM pipeline" not "CRM integration."

---

## GAPS — Missing Documentation

### G1: Error Handling Strategy

**Gap:** No document defines a consistent error handling pattern.
- What happens when Gemini API fails mid-analysis?
- What happens when CSV has malformed rows?
- What happens when Supabase RLS blocks a query?
- Where do errors get logged?

**Recommendation:** Add an "Error Handling" section to BACKEND.md or TECH-STACK.md defining:
- Error response format: `{ error: string, code: string, details?: any }`
- Retry strategy for AI providers
- User-facing error messages (Arabic + English)
- Logging approach (console.error for MVP, structured logging stretch)

---

### G2: AI Prompt Template

**Gap:** No document contains the actual AI prompt that gets sent to Gemini/Groq.
- What system prompt is used?
- What output format is expected (JSON schema)?
- How are confidence scores calculated?
- How does the prompt reference TENDER-STRUCTURE-v3.0-VERIFIED.md sections?

**Recommendation:** Create a `PROMPTS.md` document or add a "Prompt Templates" section to BACKEND.md with:
- System prompt (Arabic-aware)
- Output JSON schema (with confidence scores)
- Section-specific extraction prompts
- Scoring rubric (how weights map to the prompt)

---

### G3: Testing Strategy

**Gap:** Each phase has "Acceptance Tests" but they're manual checks. No document defines:
- Unit testing approach (if any for MVP)
- E2E testing (even a simple Playwright script)
- Demo data generation script

**Recommendation for competition MVP:** Skip automated tests, but add a `DEMO-DATA.md` with:
- 10-15 sample tender CSV rows
- Expected AI analysis results for 2-3 tenders
- This helps both development AND demo preparation

---

### G4: Deployment Checklist

**Gap:** IMPLEMENTATION.md covers the 3-day build but doesn't address:
- How to deploy for the competition demo (Vercel? Local? Docker?)
- Environment variables needed for production/demo
- What URL the judges will access

**Recommendation:** Add a "Demo Deployment" section to IMPLEMENTATION.md.

---

## CROSS-REFERENCE MATRIX

Shows which documents reference each other and where they should be consistent:

| Source Doc | Must Be Consistent With | Status |
|-----------|------------------------|--------|
| BACKEND.md tables | IMPLEMENTATION.md Phase 1.2 | 🔴 MISMATCH (C1) |
| BACKEND.md API endpoints | FRONTEND.md server actions | ⚠️ Unverified (need full docs) |
| TECH-STACK.md fonts | FRONTEND.md typography | 🔴 MISMATCH (C2) |
| TECH-STACK.md dependencies | IMPLEMENTATION.md installs | ⚠️ Unverified |
| PRD.md features | IMPLEMENTATION.md phases | 🟡 Partial (H3, H4) |
| APP-FLOW.md routes | FRONTEND.md component tree | 🟡 Partial (H5) |
| APP-FLOW.md routes | IMPLEMENTATION.md folder structure | ⚠️ Unverified |
| FRONTEND.md design tokens | IMPLEMENTATION.md Tailwind config | 🟡 MISMATCH (H1, H2) |
| FRONTEND.md pipeline stages | IMPLEMENTATION.md pipeline | 🔴 MISMATCH (C3) |
| TENDER-STRUCTURE-v3.0-VERIFIED.md fields | BACKEND.md tender table columns | ⚠️ Unverified |
| TENDER-STRUCTURE-v3.0-VERIFIED.md sections | BACKEND.md AI extraction logic | ⚠️ Unverified |
| IDEA.md differentiators | IMPLEMENTATION.md demo script | ✅ Aligned |
| PRD.md acceptance criteria | IMPLEMENTATION.md acceptance tests | ⚠️ Unverified |

---

## ACTION ITEMS

### Immediate (Before continuing any build)

1. **[C1] Resolve table names** — Decide canonical list, update BACKEND.md + IMPLEMENTATION.md
2. **[C2] Resolve fonts** — Hammad picks one set, update TECH-STACK.md + FRONTEND.md
3. **[C3] Resolve pipeline stages** — Align names + colors across FRONTEND.md + IMPLEMENTATION.md

### Before Day 2

4. **[H1-H2] Fix hex colors** — Pick canonical gold + navy hex, update all references
5. **[H3] Decide dashboard scope** — Minimal build or redirect? Update IMPLEMENTATION.md
6. **[H4] Decide settings scope** — Minimal (AI provider + weights) or cut? Update IMPLEMENTATION.md
7. **[H5] Remove Reports from nav** — Update FRONTEND.md component tree

### Before Demo

8. **[G1] Document error handling** — At least basic error response format
9. **[G2] Write AI prompt template** — Critical for consistent extraction
10. **[G3] Create demo data** — CSV with realistic Saudi tenders
11. **[G4] Document deployment** — How judges access the app

---

## NOTES

This review was conducted using conversation history snippets, not the full document files. Some issues marked "⚠️ Unverified" require re-reading the complete docs to confirm. **Upload all 8 docs for a deeper verification pass.**
