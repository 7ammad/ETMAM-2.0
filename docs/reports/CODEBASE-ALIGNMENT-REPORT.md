# Codebase Alignment Report — Etmam 2.0

**Date:** February 7, 2026  
**Source of truth:** PRD.md (docs/context/PRD.md), APP-FLOW.md, ORCHESTRATION-BRIEF.md  
**Purpose:** Compare current codebase to the agreed plan; list gaps and corrections to align implementation with PRD.

---

## 1. Summary Verdict

| Area | Status | Action |
|------|--------|--------|
| Tender Detail tabs | **Gap** | Implement 4 tabs: Overview \| Cost Estimate \| Evaluation \| Export |
| Navigation | **Gap** | Remove or de-emphasize `/pipeline` per PRD (no pipeline in nav) |
| Settings areas | **Gap** | Align to PRD 3 areas: Rate Cards, Evaluation Criteria, Odoo/CRM |
| Cost Estimate (tab + backend) | **Missing** | Build Cost tab, cost_items UI, rate card matching, bid price |
| Export (tab + Excel/Odoo) | **Missing** | Build Export tab; implement Excel export and Odoo push |
| Upload route | Aligned | `/tenders/upload` used; PRD allows `/upload` or `/tenders/upload` |
| Auth, DB, AI extract, Analysis UI | Implemented | Keep; move Analysis into Evaluation tab when tabs exist |

---

## 2. Factual Claims (Verified Against Codebase)

### 2.1 Routes and Pages

| Claim | Evidence | Verdict |
|-------|----------|---------|
| Dashboard at `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` exists | Verified |
| Tender list at `/tenders` | `src/app/(dashboard)/tenders/page.tsx` exists | Verified |
| Tender upload at `/tenders/upload` | `src/app/(dashboard)/tenders/upload/page.tsx` exists | Verified |
| Tender detail at `/tenders/[id]` | `src/app/(dashboard)/tenders/[id]/page.tsx` exists | Verified |
| Pipeline page at `/pipeline` | `src/app/(dashboard)/pipeline/page.tsx` exists | Verified |
| Settings at `/settings` | `src/app/(dashboard)/settings/page.tsx` exists | Verified |
| No `/upload` route | No `src/app/(dashboard)/upload/page.tsx` | Verified (PRD allows either; app uses `/tenders/upload`) |
| No `/export` route | No `src/app/(dashboard)/export/page.tsx` | Verified — gap: PRD/ORCHESTRATION list batch export at `/export` |

### 2.2 Tender Detail Page

| Claim | Evidence | Verdict |
|-------|----------|---------|
| Single view (no tabs) | `TenderDetailClient.tsx`: one block (tender card + AnalysisPanel), no `<Tabs>` | Verified |
| Overview content present | Tender title, entity, number, deadline, estimated_value, description in card | Verified |
| Cost Estimate tab missing | No cost_items UI, no rate card matching, no bid price component | Verified |
| Evaluation content present but not in tab | AnalysisPanel (ScoreGauge, ScoreBreakdown, EvidenceQuotes, RecommendationCard) | Verified — move into Evaluation tab when tabs added |
| Export tab missing | No ExportTab component; no Excel download or Odoo push from detail page | Verified |

### 2.3 Navigation (Sidebar)

| Claim | Evidence | Verdict |
|-------|----------|---------|
| Pipeline link in sidebar | `src/app/(dashboard)/layout.tsx` lines 41–45: `<Link href="/pipeline">المسار</Link>` | Verified |
| PRD: no /pipeline in nav | ORCHESTRATION-BRIEF §2: "Explicitly out of scope for nav: /pipeline" | Verified — correction: remove or make secondary |

### 2.4 Settings Page

| Claim | Evidence | Verdict |
|-------|----------|---------|
| Current tabs: AI, Scoring, Profile | `SettingsTabs.tsx`: TABS = ai, scoring, profile | Verified |
| PRD/APP-FLOW: Rate Cards, Evaluation Criteria, Odoo/CRM | ORCHESTRATION-BRIEF §2: "Rate Cards \| Evaluation Criteria \| Odoo/CRM" | Verified — gap: add Rate Cards and Odoo/CRM; map "Scoring" to Evaluation Criteria |

### 2.5 API Routes and Server Actions

| Claim | Evidence | Verdict |
|-------|----------|---------|
| Only AI extract API route | `src/app/api/ai/extract/route.ts` only under `src/app/api/` | Verified |
| No /api/export/excel or /api/export/odoo | Grep: no such paths in src | Verified |
| pushToCRM in pipeline actions | `src/app/actions/pipeline.ts`: pushToCRM returns payload, does not call Odoo API | Verified — simulation only; no real Odoo push |
| No Excel export implementation | No xlsx generation or download in src | Verified |

### 2.6 Database and Types

| Claim | Evidence | Verdict |
|-------|----------|---------|
| evaluations table used | `tenders/[id]/page.tsx` and `analyze.ts` query `evaluations` | Verified |
| cost_items, rate_cards in schema | `supabase/migrations/20260206120000_initial_schema.sql` and `src/types/database.ts` | Verified |
| pipeline_stages, pipeline_entries exist | `20260206140000_pipeline_tables.sql`; types in database.ts | Verified |

---

## 3. Corrections Needed (Prioritized)

### Critical (Required for PRD alignment)

1. **Tender Detail: Add 4-tab UI**
   - File: `src/components/tender/TenderDetailClient.tsx` (and optionally a wrapper in `tenders/[id]/page.tsx`).
   - Add `<Tabs>` with: Overview | Cost Estimate | Evaluation | Export.
   - **Overview:** Current tender card (existing content).
   - **Cost Estimate:** New component(s): line items table, rate card matching, bid price (persist to cost_items / tender.total_cost, proposed_price if in schema).
   - **Evaluation:** Move existing AnalysisPanel here; keep AnalyzeButton; ensure evaluation uses bid price when available (PRD).
   - **Export:** New ExportTab: "تحميل Excel" + "إرسال إلى Odoo" (both equal).

2. **Export: Implement Excel and Odoo**
   - Excel: Implement 3-sheet export (Tender Overview, Evaluation Details, Cost Breakdown), Arabic headers, filename `Etmam_[TenderNumber]_[Date].xlsx`. Either API route `POST /api/export/excel` or Server Action callable from Export tab and (later) batch.
   - Odoo: Implement actual HTTP call to Odoo (BACKEND.md/TECH-STACK); connection test endpoint; duplicate detection by tender number. Either API route `POST /api/export/odoo` or Server Action.

3. **Settings: Align to 3 areas**
   - Add **Rate Cards** tab: upload/list/delete rate cards (F2A); use rate_cards + rate_card_items.
   - Rename or map **Scoring** → **Evaluation Criteria** (presets + weights); keep current ScoringWeights if it matches evaluation_presets/criteria.
   - Add **Odoo/CRM** tab: connection test, .env or DB-backed config (ODOO_URL, ODOO_DB, etc.).
   - Optionally keep AI and Profile as extra tabs or move into a "General" or "Profile" section.

### High (Nav and batch export)

4. **Navigation**
   - Remove "المسار" (pipeline) from sidebar, or move to secondary/footer. Per PRD, primary CRM = Export tab on Tender Detail + batch Export All / Push All Qualified.
   - Add "Export All" / batch export entry: either a link to `/export` (implement page) or a button on dashboard/tender list that triggers batch Excel and/or Push All Qualified.

5. **Batch export page (optional but in ORCHESTRATION)**
   - ORCHESTRATION-BRIEF §2 lists `/export` for "Export All / Push All Qualified". Implement `/export` page or equivalent batch actions on dashboard/list.

### Medium (Backend surface)

6. **API routes per BACKEND.md / ORCHESTRATION-BRIEF §3**
   - Evaluation: presets CRUD and POST evaluation (if not already via Server Actions).
   - Costs: cost_items CRUD + rate card match (for Cost tab).
   - Rate cards: upload/list/delete (for Settings Rate Cards tab).
   - Export: excel + odoo (for Export tab and batch).
   - Settings/Odoo: config + test (for Settings Odoo tab).

---

## 4. What Is Already Aligned (No Change Required)

- Auth (login, register, logout, proxy protection).
- Tender list, upload (CSV/Excel/PDF), PDF extraction via `/api/ai/extract`.
- Tender detail data loading (tender + evaluation from DB).
- Analysis UI (ScoreGauge, ScoreBreakdown, EvidenceQuotes, RecommendationCard, AnalyzeButton); save to `evaluations` table.
- Database: profiles, tenders, evaluations, evaluation_presets, cost_items, rate_cards, rate_card_items, extraction_cache, pipeline_stages, pipeline_entries.
- Route protection implemented in **src/proxy.ts** (including `/pipeline`).
- Use of `/tenders/upload` (acceptable per PRD).

---

## 5. References

- **PRD:** docs/context/PRD.md (§3 pipeline, §5 tabs and pages, §6 Export/Odoo).
- **APP-FLOW:** docs/context/APP-FLOW.md (tab order, Settings 3 areas).
- **ORCHESTRATION-BRIEF:** docs/ORCHESTRATION-BRIEF.md (site map, no /pipeline in nav, backend stages).
- **SYSTEM-ARCHITECT-FLOW-VALIDATION:** docs/SYSTEM-ARCHITECT-FLOW-VALIDATION.md (Cost before Evaluation, 4 tabs).
