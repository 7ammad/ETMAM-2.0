# Final Implementation Plan — Etmam 2.0

**Date:** February 7, 2026  
**Sources:** CODEBASE-ALIGNMENT-REPORT.md, docs/context/IMPLEMENTATION.md, .cursor/plans/etmam_multi-agent_implementation_plan_1b931381.plan.md, PRD.md, ORCHESTRATION-BRIEF.md  
**Purpose:** Single execution plan that (1) applies alignment corrections to the current build and (2) completes remaining work in phase order. Pipeline order: **Cost before Evaluation**; Tender Detail: **Overview | Cost Estimate | Evaluation | Export**; Settings: **Rate Cards | Evaluation Criteria | Odoo/CRM**.

---

## 1. Source of Truth and Flow (Locked)

- **PRD.md** is the source of truth for features and acceptance criteria.
- **Pipeline order:** Input → AI Analysis → **Cost Estimation** → **Evaluation** → CRM Export.
- **Tender Detail tabs (PRD §5):** 1. Overview  2. Cost Estimate  3. Evaluation  4. Export.
- **Settings (PRD §5):** 3 areas — Rate Cards | Evaluation Criteria | Odoo/CRM config.
- **Nav:** No `/pipeline` in primary nav; primary CRM = Export tab (Excel + Odoo) and batch Export All / Push All Qualified. Optional: `/export` page or batch actions on dashboard/list.

---

## 2. Alignment Phase (Corrections to Current Build)

Apply the changes in **docs/reports/CODEBASE-ALIGNMENT-REPORT.md** before or in parallel with new feature work.

| # | Correction | Priority | Notes |
|---|------------|----------|--------|
| A1 | **Tender Detail: Add 4-tab UI** (Overview, Cost Estimate, Evaluation, Export) | Critical | Use `src/components/ui/tabs.tsx`. Move current overview + AnalysisPanel into Overview and Evaluation tabs; add placeholder Cost and Export tabs if building incrementally. |
| A2 | **Navigation:** Remove or de-emphasize "المسار" (pipeline) link in sidebar | High | `src/app/(dashboard)/layout.tsx`: remove or relocate pipeline link per PRD. |
| A3 | **Settings: Add Rate Cards and Odoo/CRM tabs** | Critical | Add Rate Cards (upload/list rate_cards), Odoo/CRM (config + test). Keep or rename Scoring → Evaluation Criteria. |
| A4 | **Export tab + Excel + Odoo implementation** | Critical | Build ExportTab on Tender Detail; implement Excel (3 sheets, Arabic headers) and Odoo push (real API call, connection test, duplicate detection). |
| A5 | **Cost Estimate tab + backend** | Critical | Line items (cost_items), rate card matching, bid price; persist total_cost/proposed_price. |

Order of implementation for alignment: **A1 (tabs shell)** → **A2 (nav)** → **A3 (Settings areas)** → **A5 (Cost tab + APIs)** → **A4 (Export tab + Excel/Odoo)**. Evaluation tab content already exists (AnalysisPanel); place it in the Evaluation tab when A1 is done.

---

## 3. Phase Sequence (Execution Order)

### Already done (reference only)

- **Phase 1.1** — Project scaffolding (Next.js, deps, folder structure, Supabase clients, proxy).
- **Phase 1.2** — Database schema (8 tables + pipeline_stages/entries), RLS, types.
- **Phase 1.3** — Authentication (LoginForm, RegisterForm, Server Actions, proxy, Header).
- **Phase 1.4** — Tender upload & list (TenderUpload, CSV/Excel/PDF, TenderListClient, uploadTenders).
- **Phase 2.1** — AI provider (Gemini, Groq, provider factory, prompts, parser).
- **Phase 2.2** — Analysis Server Action & UI (analyzeTender, evaluations table, ScoreGauge, ScoreBreakdown, EvidenceQuotes, RecommendationCard, AnalysisPanel).

### To do (in order)

| Phase | Name | Objective | Reference |
|-------|------|-----------|-----------|
| **Align** | Alignment (A1–A5) | 4 tabs on Tender Detail, nav fix, Settings 3 areas, Cost tab, Export tab + Excel/Odoo | CODEBASE-ALIGNMENT-REPORT.md |
| **2.3** | Export & Odoo (PRD 6A+6B) | Export tab on Tender Detail; Excel 3-sheet export; Odoo push (real API); batch Export All / Push All Qualified | IMPLEMENTATION.md Phase 2.3 |
| **2.4** | PDF + AI extraction | Already implemented (TenderUpload PDF, /api/ai/extract, PDFExtractionPreview). Verify and document. | IMPLEMENTATION.md Phase 2.4 |
| **2.5** | Cost Estimator (PRD F5) | Cost Estimate tab: cost_items CRUD, rate card matching, bid price; APIs or Server Actions per BACKEND.md | PRD §5, ORCHESTRATION-BRIEF §3 |
| **3.1** | Bug fixes | Fix issues from demo run or alignment | IMPLEMENTATION.md Phase 3.1 |
| **3.2** | Dashboard | StatsRow, RecentTenders, ScoreDistribution, PipelineSummary (or Export summary); Upload, Export All CTAs | IMPLEMENTATION.md Phase 3.2 |
| **3.3** | Settings assembly | Ensure 3 areas (Rate Cards, Evaluation Criteria, Odoo/CRM); AI/Profile optional or merged | IMPLEMENTATION.md Phase 3.3 |
| **3.4** | Visual polish | Sidebar, table, gauge, toasts, empty states, navy/gold | IMPLEMENTATION.md Phase 3.4 |
| **Landing** | Landing page | Already implemented (LandingPage at /). Verify auth redirect. | IMPLEMENTATION.md Phase 3.3 Landing |
| **3.5** | Documentation | README, .env.example, inline comments | IMPLEMENTATION.md Phase 3.5 |
| **3.6** | Demo prep | Demo data, script (upload → cost → evaluate → export), rehearsal, deploy | IMPLEMENTATION.md Phase 3.6 |

---

## 4. Acceptance Criteria (Key Checkpoints)

- **After Alignment:** Tender Detail has 4 tabs; Overview and Evaluation show content; Cost and Export tabs exist (can be placeholder initially). Nav has no primary pipeline link. Settings has Rate Cards and Odoo/CRM areas.
- **After 2.3:** "Export to Excel" downloads .xlsx (3 sheets, Arabic headers); "Push to Odoo" creates opportunity when configured; Export tab visible on Tender Detail.
- **After 2.5:** Cost Estimate tab shows line items, rate card matching, and bid price; data persists.
- **Demo script (PRD §7):** Upload → (extraction) → **cost estimator** → **evaluate** (score + recommendation) → export (Excel and/or Odoo).

---

## 5. Backend Surface (from ORCHESTRATION-BRIEF §3)

Implement or verify the following (API routes or Server Actions per §3.1):

| Stage | Endpoints / surface | Purpose |
|-------|----------------------|--------|
| Tenders | CRUD, import | Already via Server Actions |
| AI | POST /api/ai/extract | Done |
| Evaluation | Presets CRUD, POST evaluation | Partially (analyze saves to evaluations); presets UI in Settings |
| Costs | cost_items CRUD, rate card match | For Cost tab |
| Rate cards | GET/POST, GET/delete by id | For Settings Rate Cards tab |
| Export | Excel generation, Odoo push | For Export tab and batch |
| Settings (Odoo) | Config GET/PUT, test POST | For Settings Odoo tab |

---

## 6. References

- **Alignment report:** docs/reports/CODEBASE-ALIGNMENT-REPORT.md  
- **PRD:** docs/context/PRD.md  
- **Implementation detail:** docs/context/IMPLEMENTATION.md  
- **Orchestration & backend:** docs/ORCHESTRATION-BRIEF.md  
- **Flow validation:** docs/SYSTEM-ARCHITECT-FLOW-VALIDATION.md  
