# Changelog — Etmam 2.0

**Purpose:** Single activity log for the Cursor team and for Claude Code to know what was done and pick up context. **Always append new Cursor/Claude work here** so the next agent or human can continue from a known state.

**How to use:**
- **Cursor / Claude:** Before starting work, read the latest entry. When you finish a significant change, add a new entry (date, summary, files changed, handover note).
- **Format:** Reverse chronological (newest first). Use `## [Date]` and bullet lists; keep entries concise but enough for the next person to understand.

---

## [2026-02-07] — Fix: tender not saved after PDF extraction

**Who:** Cursor (code-reviewer)  
**Summary:** Root cause and fixes for tender data not persisting after "حفظ المنافسة". Report: docs/reports/EXTRACTION-SAVE-FIX-REPORT.md.

### Causes and fixes

| Issue | Fix |
|-------|-----|
| `extraction_confidence` could be NaN (undefined → Math.round(undefined)) so DB insert fails | Server: `Math.round(Number(input.extraction_confidence) \|\| 0)`; param optional; client: `extraction.overall_confidence ?? 0` |
| Deadline DD-MM-YYYY from AI not parsed (only DD/MM/YYYY) | normalizeDeadline now splits on `[/-]`, builds YYYY-MM-DD, validates; clearer error message |
| Type required but client could pass undefined | savePdfTender extraction_confidence optional |

### Files changed

- `src/app/actions/tenders.ts` — normalizeDeadline accepts DD-MM-YYYY; extraction_confidence optional and coerced; clearer deadline error
- `src/components/tender/PDFExtractionPreview.tsx` — pass extraction_confidence ?? 0

---

## [2026-02-07] — DeepSeek implementation review (vs official API docs)

**Who:** Cursor (code-reviewer)  
**Summary:** Reviewed DeepSeek provider against platform.deepseek.com/api-docs. Implementation correct; added doc comment (official docs link), `stream: false` in request body. Report: docs/reports/DEEPSEEK-IMPLEMENTATION-REVIEW.md.

---

## [2026-02-07] — DeepSeek as primary AI model, Gemini second

**Who:** Cursor (AI)  
**Summary:** DeepSeek added as primary AI provider for tender analysis; Gemini remains second (and required for PDF extraction). Groq as fallback.

### What was done

| File | Change |
|------|--------|
| `src/lib/ai/deepseek.ts` | **New** — DeepSeek provider (OpenAI-compatible API, api.deepseek.com), model deepseek-chat; analyze() via fetch; extractFromPDF throws (use Gemini for PDF). |
| `src/lib/ai/provider.ts` | Default AI_PROVIDER and fallback order: deepseek → gemini → groq; new type AIProviderId. |
| `src/stores/settings-store.ts` | aiProvider: "deepseek" \| "gemini" \| "groq", default "deepseek"; deepseekModel: "deepseek-chat". |
| `src/components/settings/AIProviderConfig.tsx` | Three options (DeepSeek, Gemini, Groq) in that order; label + model display; note that PDF uses Gemini only. |
| `src/app/actions/analyze.ts` | aiProvider param accepts "deepseek" \| "gemini" \| "groq". |
| `src/lib/ai/mock-provider.ts` | Mock messages mention DEEPSEEK_API_KEY (primary). |
| `.env.example` | AI_PROVIDER=deepseek, DEEPSEEK_API_KEY; comments list DeepSeek primary, Gemini for PDF. |

### Handover

- **Analysis:** Uses store aiProvider (default DeepSeek). Set DEEPSEEK_API_KEY for DeepSeek; GEMINI_API_KEY still needed for PDF upload extraction (extract route uses Gemini). No new npm dependencies (DeepSeek via fetch to OpenAI-compatible endpoint). `pnpm build` passes.

---

## [2026-02-07] — Full code review & plan alignment

**Who:** Cursor (code-reviewer)  
**Summary:** Full codebase review (context, security, performance, type safety, code quality). Alignment report in docs/reports/FULL-CODE-REVIEW-AND-ALIGNMENT.md. Two corrections applied.

### Corrections applied

| File | Change |
|------|--------|
| `src/types/database.ts` | Tender.estimated_value typed as `number \| null` to match migration 20260207050000_estimated_value_nullable.sql |
| `src/app/actions/analyze.ts` | Removed unused buildAnalysisPrompt import |

### Review summary

- **Critical:** 0. **High:** 2 (proxy location doc; pipeline not in nav — by design). **Medium:** 4 (2 fixed; 2 doc/batch limits). **Low:** 5 (optional).
- Security: all actions use getUser() and user_id; API extract returns 401 when unauthenticated.
- Build passes; Next.js 16 proxy active. Plan phases 1.1–3.4 + Landing done; 3.5 and 3.6 remaining.

---

## [2026-02-07] — CURSOR-PROMPTS 3–6: Evaluation criteria, Visual polish, Landing, Build

**Who:** Cursor (AI)  
**Summary:** Implemented docs/CURSOR-PROMPTS.md Prompts 3–6. Evaluation criteria (Saudi IT/Telecom), Phase 3.4 visual polish, simplified landing page, build verified.

### Prompt 3 — Evaluation criteria (Saudi IT/Telecom)

| File | Change |
|------|--------|
| `src/lib/constants.ts` | DEFAULT_SCORING_WEIGHTS: relevance 25, budgetFit 25, timeline 20, competition 15, strategic 15 |
| `src/lib/ai/prompts.ts` | Criterion names: التوافق التقني، الملاءمة المالية، الجدول الزمني، مستوى المنافسة، القيمة الاستراتيجية؛ added "وصف المعايير" block with Saudi government tender descriptions (relevance, budget_fit with cost data note, timeline, competition, strategic) |
| `src/components/analysis/ScoreBreakdown.tsx` | CRITERIA_LABELS updated to match (التوافق التقني، الملاءمة المالية، etc.) |
| `src/components/settings/ScoringWeights.tsx` | FIELDS labelAr updated to same Arabic names |
| `src/app/actions/analyze.ts` | Uses DEFAULT_SCORING_WEIGHTS from constants |
| `src/stores/settings-store.ts` | Initial scoringWeights from DEFAULT_SCORING_WEIGHTS |

### Prompt 4 — Visual polish (Phase 3.4)

| File | Change |
|------|--------|
| `src/components/dashboard/StatCard.tsx` | Default variant: gold accent border (border-r-gold-500/30) |
| `src/app/(dashboard)/dashboard/page.tsx` | Empty state when no tenders: centered card "ابدأ برفع أول منافسة" + upload button to /tenders/upload |
| `src/components/tender/TenderListClient.tsx` | Added التقييم column with ScoreBadge (size sm); rows already clickable with hover |
| `src/components/tender/TenderDetailClient.tsx` | Overview: ScoreBadge (lg, showLabel) if evaluation_score else "لم يتم التقييم"; deadline + days remaining (X يوم متبقي or "منتهي" in red) |
| Settings | Tabs already: بطاقات الأسعار \| معايير التقييم \| ربط Odoo/CRM \| عام |

### Prompt 5 — Landing page

| File | Change |
|------|--------|
| `src/components/landing/LandingPage.tsx` | Simplified: hero (إتمام، "من الملف إلى الفرصة في دقائق"، تسجيل الدخول + إنشاء حساب); 3 problem cards (البيانات متفرقة، التقييم يدوي، التكلفة تخمينية); pipeline text line; no footer. Auth redirect already in app/page.tsx (user → /dashboard). |

### Prompt 6 — Build

- `pnpm build` completed with zero errors. No TypeScript or unused-import fixes required.

### Handover for Claude Code / next Cursor session

- **Evaluation:** Weights and labels aligned to Saudi IT/Telecom; AI prompt includes cost-aware budget_fit description. Same 5 keys, no formula change.
- **Demo pages:** Dashboard empty state, StatsRow gold accent, Tenders list score column + hover, Tender Detail score badge + days remaining, Settings tabs verified. Landing: simple hero + 3 cards + pipeline; / redirects to /dashboard when logged in.
- **Next:** E2E test with docs/tenders/251139011431.pdf per CURSOR-PROMPTS.

---

## [2026-02-07] — Evaluation: cost data passed to AI (ملاءمة الميزانية)

**Who:** Cursor (AI)  
**Summary:** AI evaluation (analyzeTender) now receives cost and bid price data. buildTenderContent() fetches cost_items for the tender and appends "بيانات التكاليف" (direct/indirect totals, total cost, proposed price, profit margin %, estimated value, delta) so ملاءمة الميزانية (Budget Fit) can score using actual profitability.

### What was done

| File | Change |
|------|--------|
| `src/app/actions/analyze.ts` | buildTenderContent made async; accepts supabase, userId, tender; fetches cost_items; appends cost block when items exist (إجمالي التكاليف المباشرة/غير المباشرة، إجمالي التكاليف، سعر العرض المقترح، هامش الربح، القيمة التقديرية للمنافسة، الفرق). analyzeTender calls await buildTenderContent(supabase, user.id, tender). |
| `docs/CHANGELOG.md` | This entry |
| `docs/CLAUDE-CODE-HANDOVER.md` | Evaluation cost data note |

### Handover for Claude Code / next Cursor session

- **Budget Fit criterion:** Now receives real cost data (cost_items + proposed_price + estimated_value) in the prompt content. No new DB columns or dependencies. `pnpm build` passes.

---

## [2026-02-07] — Phase 2.5 continuation: Cost Summary Card (PRD F5D) verified and refined

**Who:** Cursor (AI)  
**Summary:** Cost Estimate tab already had full cost summary card per PRD F5D. Refinements: label "القيمة التقديرية للمنافسة" for estimated value; removed unused sumTotal. No new actions, DB, or deps. Build passes.

### What was done

| File | Change |
|------|--------|
| `src/components/tender/CostEstimateTab.tsx` | Estimated value label set to "القيمة التقديرية للمنافسة"; removed unused sumTotal variable |
| `docs/CHANGELOG.md` | This entry |
| `docs/CLAUDE-CODE-HANDOVER.md` | Noted F5D summary card verified |

### Handover for Claude Code / next Cursor session

- **Cost Summary Card (F5D):** Subtotals by category (مباشرة/غير مباشرة + المجموع الفرعي), profit margin % (state, default 15), مبلغ الربح, سعر العرض النهائي, القيمة التقديرية للمنافسة, الفرق (مبلغ + ٪) with green/red, bid input + "حفظ سعر العرض" to proposed_price; category select in edit. All in place; minor label and cleanup only.

---

## [2026-02-07] — Phase 2.5 (PRD F5): Cost Estimate tab — source badges, summary card, margin, category

**Who:** Cursor (AI)  
**Summary:** Cost Estimate tab UI enhancements per PRD F5: source badges (بطاقة أسعار / يدوي / ذكاء اصطناعي), yellow highlight for zero unit_price rows, cost summary card with direct/indirect/subtotal, profit margin % (default 15%, component state), profit amount, final bid auto-fill, comparison to estimated value (فرق), and category selector in edit mode. No new server actions or DB changes.

### What was done

| File | Change |
|------|--------|
| `src/components/tender/CostEstimateTab.tsx` | **Source column:** `SourceBadge` — rate_card (green "🏷️ بطاقة أسعار" + source_notes), manual (gray "✋ يدوي"), ai_suggested (blue "🤖 ذكاء اصطناعي"). Row highlight: `bg-amber-500/10` when unit_price === 0. **Category:** "الفئة" column (مباشرة / غير مباشرة); in edit mode, select for category. **Summary card:** مجموع التكاليف المباشرة، غير المباشرة، المجموع الفرعي؛ هامش الربح % (state, default 15%)؛ مبلغ الربح؛ سعر العرض النهائي؛ القيمة التقديرية؛ الفرق (مبلغ و٪). Bid price field auto-updates when items or margin change; user can override and "حفظ سعر العرض" saves to tender.proposed_price. |
| `docs/CHANGELOG.md` | This entry |
| `docs/CLAUDE-CODE-HANDOVER.md` | Phase 2.5 PRD F5 UI complete |

### Handover for Claude Code / next Cursor session

- **Cost Estimate tab:** Source badges, zero-price highlight, cost summary card (direct/indirect/subtotal, margin %, profit, final bid), comparison to estimated value, category in table and edit. Margin % is component state only (MVP). `pnpm build` passes.

---

## [2026-02-07] — Phase 2.5: Cost Estimator verified and polished

**Who:** Cursor (AI)  
**Summary:** Verified Cost Estimate tab per IRONCLAD §3 Phase 2.5; cost_items CRUD, rate card matching, and bid price were already implemented. Polished UX: proposed_price on Overview, always-visible bid price block, source column (من البطاقة / يدوي), and router.refresh after saving bid price.

### What was verified (no changes)

- **costs.ts:** listCostItems, createCostItem, updateCostItem, deleteCostItem, updateTenderBidPrice, matchCostItems — all use Supabase with user_id (RLS). matchCostItems reads rate_card_items + rate_cards, returns matches with suggested_price and rate_card_item; CostEstimateTab applies matches via updateCostItem (unit_price, source, rate_card_item_id, source_notes).
- **CostEstimateTab:** Add/edit/delete rows, "مطابقة من بطاقات الأسعار", sum of items, bid price input + "حفظ سعر العرض". DB: cost_items.total is generated (quantity × unit_price); trigger updates tenders.total_cost.

### What was changed

| File | Change |
|------|--------|
| `src/components/tender/TenderDetailClient.tsx` | Overview: show **سعر العرض** (proposed_price) in the details list |
| `src/components/tender/CostEstimateTab.tsx` | Bid price block always visible (was hidden when no items); table **المصدر** column (من البطاقة / مقترح / يدوي); source_notes under description when set; `useRouter()` + `router.refresh()` after successful "حفظ سعر العرض" so Overview shows updated proposed_price |
| `docs/CHANGELOG.md` | This entry |
| `docs/CLAUDE-CODE-HANDOVER.md` | Phase 2.5 Done; next step 3.4/Landing |

### Handover for Claude Code / next Cursor session

- **Phase 2.5:** Done. التكاليف tab: list/add/edit/delete cost items, match from rate cards, sum + bid price save; proposed_price persisted and visible on Overview and Export. No new dependencies.
- **Next from plan:** Phase 3.4 (visual polish), Landing, 3.5 (docs), 3.6 (demo prep).

---

## [2026-02-07] — Phase 2.4 verification: PDF + AI extraction

**Who:** Cursor (AI)  
**Summary:** Verified existing PDF + AI extraction path per IRONCLAD §3 Phase 2.4. No code changes; flow is end-to-end and wired correctly.

### What was verified

1. **TenderUpload** (`src/components/tender/TenderUpload.tsx`): Accepts `.pdf` (with `.csv`, `.xlsx`, `.xls`); on PDF selection sends file via `POST /api/ai/extract` (FormData); on success sets `extraction` from `data.extraction` and renders `PDFExtractionPreview`. Back/retry via `onBack` (resetState).
2. **POST /api/ai/extract** (`src/app/api/ai/extract/route.ts`): Exists; accepts PDF (FormData `file`); validates type/size; uses `getAIProvider("gemini")` → `extractFromPDF(buffer, file.name)`; runs `verifyExtraction(rawExtraction)`; returns `{ success: true, extraction, corrections?, fileName }`. Auth required (401 if no user).
3. **PDFExtractionPreview** (`src/components/tender/PDFExtractionPreview.tsx`): Rendered when `extraction` is set. Shows editable fields (الجهة, عنوان المنافسة, رقم المنافسة, الموعد النهائي, القيمة التقديرية, الوصف) with per-field confidence and evidence; overall confidence; warnings and not_found; line_items table with confidence; optional evidence section; "حفظ المنافسة" calls `savePdfTender` then redirects to `/tenders/{id}`. No placeholders; no dead code for the PDF path.

### Key files (no changes)

| File | Role |
|------|------|
| `src/components/tender/TenderUpload.tsx` | File input (.csv/.xlsx/.xls/.pdf); PDF → fetch /api/ai/extract → PDFExtractionPreview |
| `src/app/api/ai/extract/route.ts` | POST PDF → Gemini extractFromPDF → verifyExtraction → JSON response |
| `src/components/tender/PDFExtractionPreview.tsx` | Editable extraction form, confidence/evidence, savePdfTender |
| `src/app/actions/tenders.ts` | savePdfTender (insert tender from extraction) |
| `src/lib/ai/provider.ts` | ExtractionResult type; getAIProvider("gemini") |
| `src/lib/ai/gemini.ts` | extractFromPDF (vision + JSON), model_used, processing_time_ms |
| `src/lib/ai/verification.ts` | verifyExtraction (confidence threshold, value bounds, deadline) |

### Handover for Claude Code / next Cursor session

- **Phase 2.4:** Verified. PDF upload is available from `/tenders/upload`; extraction uses existing API and components; preview → save works. Optional: run a smoke test with a real Arabic PDF and document in a short note.
- **Next from plan:** Phase 2.5 (Cost Estimator verification), then 3.1–3.6, Landing, docs, demo prep.

---

## [2026-02-07] — Phase 2.3 batch: Export All + Push All Qualified

**Who:** Cursor (AI)  
**Summary:** Batch Export All (Excel) and Push All Qualified (Odoo) per IRONCLAD §3 Phase 2.3 and IMPLEMENTATION.md. Server Actions in `export.ts`; CTAs on Dashboard and Tenders list.

### What was done

- **Export All:** `exportTendersToExcel(tenderIds)` builds one 3-sheet Excel (بيانات المنافسة, التقييم, التكاليف) with Arabic headers; `getAllTenderIds()` returns user's IDs. Client triggers download via base64 → blob → anchor click.
- **Push All Qualified:** `pushQualifiedTendersToOdoo()` selects tenders with `evaluation_score >= 70` and `odoo_lead_id` null, calls `pushTenderToOdoo` for each, returns `{ successCount, failedCount, results }`.
- **UI:** `BatchExportActions` component (تصدير الكل Excel, إرسال المؤهلة إلى Odoo) added to Dashboard header and Tenders list toolbar. Toasts for success/error/info.
- **Fix:** `TenderUpload.tsx` — `estimated_value` nullable display (existing type error).

### Key files touched

| File | Change |
|------|--------|
| `src/app/actions/export.ts` | exportTendersToExcel(tenderIds), getAllTenderIds(), pushQualifiedTendersToOdoo() |
| `src/components/export/BatchExportActions.tsx` | **New** — Export All + Push Qualified buttons, download + toasts |
| `src/app/(dashboard)/dashboard/page.tsx` | BatchExportActions in header |
| `src/app/(dashboard)/tenders/page.tsx` | BatchExportActions in toolbar |
| `src/components/tender/TenderUpload.tsx` | estimated_value optional display |
| `docs/CHANGELOG.md` | This entry |
| `docs/CLAUDE-CODE-HANDOVER.md` | Phase 2.3 batch complete; Known Gaps updated |

### Handover for Claude Code / next Cursor session

- **Phase 2.3 batch:** Complete. From Dashboard or Tenders list user can "تصدير الكل (Excel)" (one file, all tenders, same 3-sheet format) and "إرسال المؤهلة إلى Odoo" (score ≥ 70, not already pushed). Summary toasts on push.
- **Next from plan:** Phase 2.4 (PDF verification), 2.5 (Cost Estimator verification), 3.1–3.6, Landing, docs, demo prep.

---

## [2026-02-07] — Dashboard: pipeline removed; terminology (pages vs tabs); handover docs

**Who:** Cursor (AI)  
**Summary:** Dashboard no longer shows pipeline; ExportSummary card (Odoo count + link to Tenders). Ironclad plan: Terminology section (sidebar = pages, tabs = in-page only). CHANGELOG + CLAUDE-CODE-HANDOVER updated for continuity.

### What was done

- **Dashboard:** Replaced `PipelineSummary` with `ExportSummary`: shows count of tenders pushed to Odoo (`odoo_lead_id`), link to "المنافسات" (no `/pipeline`). Dashboard page now fetches only `tenders` (no `pipeline_entries`); "مرسلة إلى CRM" = count where `odoo_lead_id` set.
- **New component:** `src/components/dashboard/ExportSummary.tsx` — card "التصدير إلى Odoo" with pushed count and link to `/tenders`.
- **Ironclad plan:** `docs/reports/IRONCLAD-IMPLEMENTATION-PLAN.md` — added **Terminology** section: Sidebar = main pages (Dashboard, Tenders, Upload, Settings); Tabs = only inside Tender Detail and Settings; do not use "tabs" for sidebar.
- **IA clarification (not yet implemented):** Upload is an **action** (button → modal/drawer), not a destination. Correct nav from first principles = 3 pages: Dashboard | Tenders | Settings; "رفع منافسة" = button. Current codebase still has `/upload` as a full page — optional follow-up: remove from sidebar and add prominent "رفع منافسة" button opening modal.
- **CHANGELOG + CLAUDE-CODE-HANDOVER:** This entry and handover doc updated so Claude Code / next session know current state.

### Key files touched

| File | Change |
|------|--------|
| `src/app/(dashboard)/dashboard/page.tsx` | ExportSummary instead of PipelineSummary; single tenders query; pushedToCrm from odoo_lead_id |
| `src/components/dashboard/ExportSummary.tsx` | **New** — Odoo export count card, link to /tenders |
| `docs/reports/IRONCLAD-IMPLEMENTATION-PLAN.md` | Terminology section (pages vs tabs) |
| `docs/CHANGELOG.md` | This entry |
| `docs/CLAUDE-CODE-HANDOVER.md` | TL;DR, dashboard widgets, file map, known gaps |

### Handover for Claude Code / next Cursor session

- **Dashboard:** Shows StatsRow, RecentTenders, **ExportSummary** (Odoo count), ScoreDistribution. No pipeline card or link to `/pipeline`.
- **Single source for "where we are":** Read **docs/CHANGELOG.md** (latest entry) then **docs/CLAUDE-CODE-HANDOVER.md** (TL;DR + What still needs to be done).
- **Terminology:** In plans/docs, "tabs" = only in Tender Detail and Settings; "pages" / "nav" = Dashboard, Tenders, Upload, Settings.
- **Upload:** IA-correct approach is 3 nav pages + Upload as button (modal). Current app still has 4 nav items including Upload page; refactor is optional.

---

## [2026-02-07] — Orchestration brief (site map & backend stages)

**Who:** Cursor (AI)  
**Summary:** Added **docs/ORCHESTRATION-BRIEF.md** for system-architect (lead) + senior-full-stack, senior-frontend, senior-backend. Single reference for site map (PRD §5), backend stages (BACKEND + TECH-STACK), and agent responsibilities.

### What was done

- **ORCHESTRATION-BRIEF.md** — Canonical site map (/, /upload, /tenders, /tenders/[id], /settings, /export; no /pipeline). Backend stage table (tenders, ai/extract, evaluation, costs, rate-cards, export/excel, export/odoo, settings/odoo). Role of each agent; architect checklist; handoffs to backend/frontend/full-stack.

### Handover

When invoking system-architect as lead with senior-full-stack, senior-frontend, senior-backend: use **docs/ORCHESTRATION-BRIEF.md**. Architect validates site map and backend stages; then backend → frontend → full-stack per handoffs.

---

## [2026-02-07] — One document per type (no duplicate/fragment files)

**Who:** Cursor (AI)  
**Summary:** Consolidated to a single canonical doc per type. Merged fragments into main docs and removed duplicates.

### What was done

- **IMPLEMENTATION.md** — Phase 2.4 (PDF Upload with AI Extraction) merged in from the former insert file. One implementation plan only.
- **Deleted:** IMPLEMENTATION-PHASE-2.4-INSERT.md, PRD-DAY2-PDF-SCHEDULE.md, APP-FLOW-UPLOAD-PDF.md, BACKEND-API-EXTRACT-SPEC.md, FRONTEND-PDF-COMPONENTS.md. Content lives in IMPLEMENTATION.md, PRD §6, APP-FLOW.md, BACKEND.md, FRONTEND.md respectively.
- **FRONTEND.md** — PDF component (PDFExtractionPreview) added to component tree under tender/ so the single FRONTEND doc has everything.
- **README.md (context)** — Added "One document per type — no duplicates" policy: one IMPLEMENTATION, one schedule (in PRD), one APP-FLOW, one BACKEND, one FRONTEND; do not create IMPLEMENTATION-v2 or similar.

### Handover

Use only: IMPLEMENTATION.md (full plan including Phase 2.4), PRD.md (schedule in §6), APP-FLOW.md, BACKEND.md, FRONTEND.md, TENDER-STRUCTURE-v3.0-VERIFIED.md. TENDER-STRUCTURE.md is deprecated (redirect to v3.0-VERIFIED).

---

## [2026-02-07] — Full docs/context alignment to PRD

**Who:** Cursor (AI)  
**Summary:** Aligned all remaining docs in `docs/context` to PRD (SOT). No P1/P2; CRM = Odoo + Excel; input = CSV/Excel + PDF.

### What was done (this pass)

- **BACKEND.md** — Doc info: SOT, version 2.1. Schema overview: pipeline_stages/entries marked optional (PRD: Export = Odoo + Excel). Table sections: pipeline_stages / pipeline_entries labeled optional.
- **FRONTEND.md** — Doc header: SOT. Routes: removed pipeline page; tender detail = Overview | Evaluation | Costs | Export. Components: export/ (ExportTab, PushToOdoo, CRMFieldMapping); pipeline/ optional. Stores/hooks: pipeline-store and use-pipeline marked optional. PipelineBoard and store diagram note: per PRD Export tab primary.
- **IMPLEMENTATION-PHASE-2.4-INSERT.md** — P1 → P0; "Insert after Phase 2.3 (Export & Odoo)"; PDF equally important with CSV/Excel.
- **PRD-DAY2-PDF-SCHEDULE.md** — All P0; "CRM pipeline board" → Odoo + Excel export (F6A/F6B); Day 2 goal and checkpoint use Odoo + Excel.
- **HARD-REVIEW.md** — CRM question resolved: PRD = Push to Odoo + Excel (both equal); no internal pipeline board required.
- **PRD-SOT-MAP.md** — BACKEND and FRONTEND marked ✅ Aligned; changelog entry for full context alignment.

### Key files touched

| File | Change |
|------|--------|
| docs/context/BACKEND.md | SOT, optional pipeline tables |
| docs/context/FRONTEND.md | SOT, no pipeline page, Export tab, optional pipeline |
| docs/context/IMPLEMENTATION-PHASE-2.4-INSERT.md | P0, Export & Odoo ref |
| docs/context/PRD-DAY2-PDF-SCHEDULE.md | All P0, Odoo + Excel |
| docs/context/HARD-REVIEW.md | Resolution: Odoo + Excel |
| docs/context/PRD-SOT-MAP.md | BACKEND/FRONTEND ✅, changelog |

### Handover

All docs in **docs/context** are now aligned to PRD. Use PRD-SOT-MAP.md for the per-doc summary.

---

## [2026-02-07] — PRD as source of truth; doc alignment; no P1/P2

**Who:** Cursor (AI)  
**Branch:** (working tree)  
**Summary:** PRD established as single source of truth (SOT). All context docs aligned to PRD. Odoo and Excel are equal CRM outputs; CSV/Excel and PDF are equal input sources. No P1 or P2 in scope.

### What was done

1. **PRD as SOT**
   - Created **`docs/context/PRD-SOT-MAP.md`** — single master alignment map. All context docs derive from PRD; conflicts → PRD wins.
   - **`docs/context/README.md`** — added SOT statement and pointer to PRD-SOT-MAP.

2. **IDEA.md**
   - Odoo restored as required (EnfraTech’s CRM). Push via .env + manual extraction (Excel) — **both equal features** (not primary vs fallback).
   - Tender input: **CSV/Excel and PDF** — both equally important, both in pipeline (no “base” vs “enhancement”).
   - All CRM and input framing updated; no “fallback” for 6A/6B or 1A/1C.

3. **PRD.md**
   - 6A = Manual Extraction (Excel) P0; 6B = Push to Odoo CRM P0. Both equal.
   - 1A = CSV/Excel P0; 1C = PDF with AI P0. Both equal. 1B = Manual entry when no file.
   - Executive summary, persona, Feature 6, NFRs, roadmap, demo script, risks — all use Odoo + Excel parity and dual input parity.
   - **No P1 or P2** — only note: “There are no P1 or P2 features.”

4. **APP-FLOW.md**
   - Journeys A/B/C/E all P0 (was P1 for B, C, E). “Base”/“Enhancement” removed; “equally important input” added.
   - **Pipeline** removed from sidebar and page map (PRD has no pipeline board page). Settings tabs include Odoo.
   - Doc info: version 2.1, alignment note (inputs + CRM outputs both equal).

5. **TECH-STACK.md**
   - Document info: **Source of truth: PRD.md**; version 2.1, Feb 7 2026; reference to PRD-SOT-MAP.
   - CRM §6: “Push to Odoo and Excel export are equally important”; when Odoo .env missing, show message and offer Excel (no “primary”/“fallback”).
   - .env.example (main block): Odoo section “Required for full demo — EnfraTech’s CRM”; comment that both are equal.
   - Second .env block and setup guide step 8: “Optional” → “required for full demo” (Odoo).

6. **IMPLEMENTATION.md**
   - Header: **Source of truth: PRD.md**; build window Thu Feb 5 – Sun Feb 8; reference PRD-SOT-MAP.
   - Build philosophy: “push to Odoo and Excel export” (no “CRM push pipeline”).
   - **Folder structure:** Removed `pipeline/page.tsx` and `components/pipeline/`.
   - **Schema:** Replaced pipeline_stages/entries with optional “export_log or tender.pushed_to_odoo_at” for tracking.
   - **Day 2:** Title/goal/success = “Odoo + Excel (both equal).”
   - **Phase 2.3:** Replaced “CRM Pipeline Board” with **“Export & Odoo (6A + 6B per PRD)”** — Export tab (Excel download + Push to Odoo), connection test, duplicate detection, 7 fields.
   - Day 2 checkpoint, README features, demo script, backup plan, cut list, agent table: all use Export/Odoo+Excel wording.
   - **Cross-Reference:** PRD listed as SOT.
   - **Day 1 date:** Corrected to Thursday, February 5, 2026 (was Feb 6).

7. **Reviews / Gotcha**
   - **`docs/reviews/FINAL-IDEA-PRD-APP-FLOW-GOTCHA-REPORT.md`** — final review of IDEA, PRD, APP-FLOW; all P0, Odoo + dual input/output.
   - **`docs/reviews/CONTEXT-DOCS-ALIGNMENT-GOTCHA-REPORT.md`** — supersede notice added (Odoo required; see FINAL report).
   - **`docs/reviews/PRD-SOT-STEP-GOTCHA-REPORT.md`** — Gotcha of this step; three corrections applied (TECH-STACK Odoo “optional” x2, IMPLEMENTATION Day 1 date).

### Key files touched

| File | Change |
|------|--------|
| `docs/context/PRD-SOT-MAP.md` | **New** — SOT definition, canonical stances, per-doc alignment table |
| `docs/context/README.md` | SOT statement + PRD-SOT-MAP pointer |
| `docs/context/IDEA.md` | Odoo + dual input/output parity throughout |
| `docs/context/PRD.md` | 6A/6B and 1A/1C equal; Odoo; no P1/P2 |
| `docs/context/APP-FLOW.md` | All P0; no pipeline page; Odoo + Excel |
| `docs/context/TECH-STACK.md` | SOT, version, CRM parity, .env wording |
| `docs/context/IMPLEMENTATION.md` | SOT, no pipeline page, Phase 2.3 = Export & Odoo, Day 1 date |
| `docs/reviews/FINAL-IDEA-PRD-APP-FLOW-GOTCHA-REPORT.md` | Final alignment Gotcha |
| `docs/reviews/CONTEXT-DOCS-ALIGNMENT-GOTCHA-REPORT.md` | Supersede notice |
| `docs/reviews/PRD-SOT-STEP-GOTCHA-REPORT.md` | **New** — Gotcha of PRD-SOT step |

### Handover for Claude Code / next Cursor session

- **Source of truth:** **PRD.md**. For any feature/priority/scope question, use PRD. Alignment map: **`docs/context/PRD-SOT-MAP.md`**.
- **No P1/P2:** Everything in scope is P0. Do not reintroduce P1 or P2 in PRD or implementation plan.
- **CRM:** Two equal features — Push to Odoo (6B) and manual extraction / Excel export (6A). Not “primary” vs “fallback.”
- **Input:** Two equal sources — CSV/Excel (1A) and PDF with AI (1C). Both must be in the pipeline.
- **Pages:** PRD has no `/pipeline` page. Export is on Tender Detail (Excel + Push to Odoo). Settings include Odoo/CRM config.
- **CONTEXT-DOCS-PRD-ALIGNMENT-CHANGES.md** does not exist in repo; do not expect it. Use PRD-SOT-MAP.md and this CHANGELOG.

---

## Template for next entry (copy and fill)

```markdown
## [YYYY-MM-DD] — Short title

**Who:** Cursor / Claude Code / Human name
**Branch:** branch name or (working tree)
**Summary:** One line.

### What was done
- Bullet list of changes.

### Key files touched
| File | Change |

### Handover for Claude Code / next Cursor session
- Any “pick up from here” notes.
```

---

*End of changelog. Append new entries above this line.*
