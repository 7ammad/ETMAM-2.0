# Ironclad Implementation Plan — Etmam 2.0

**Date:** February 7, 2026  
**Status:** Gotcha-verified (see docs/reports/GOTCHA-VERIFICATION-REPORT.md). All factual claims checked against codebase and PRD/ORCHESTRATION-BRIEF.  
**Use:** Single execution plan for aligning the current build with PRD and completing remaining work.

---

## Terminology (avoid wording mix-ups)

| Term | Meaning in this plan |
|------|----------------------|
| **Sidebar / main nav / pages** | The left-hand links: **لوحة التحكم** (Dashboard), **المنافسات** (Tenders list), **رفع منافسة** (Upload), **الإعدادات** (Settings). These are **main app pages**, not "tabs". |
| **Tabs** | Only **inside** a page: (1) **Tender Detail** page has 4 tabs: Overview, Cost Estimate, Evaluation, Export. (2) **Settings** page has tabs: Rate Cards, Evaluation Criteria, Odoo/CRM, General. |
| **Dashboard** | Single page (no tabs): stats, recent tenders, export summary, distribution. |

Do not use "tabs" for the sidebar. Use "pages" or "nav" for Dashboard / Tenders / Upload / Settings.

---

## 1. Source of Truth (Locked)

| Item | Authority |
|------|------------|
| Features & acceptance | **PRD.md** (docs/context/PRD.md) |
| Pipeline order | Input → AI Analysis → **Cost Estimation** → **Evaluation** → CRM Export |
| Tender Detail tabs | 1. Overview  2. Cost Estimate  3. Evaluation  4. Export |
| Settings | 3 areas: Rate Cards \| Evaluation Criteria \| Odoo/CRM config |
| Nav | No `/pipeline` in primary nav; CRM = Export tab + batch Export All / Push All Qualified |
| Route protection | **src/proxy.ts** (protectedRoutePrefixes: /dashboard, /tenders, /pipeline, /settings) |

---

## 2. Alignment Corrections (Apply First)

From **docs/reports/CODEBASE-ALIGNMENT-REPORT.md** (verified):

| Id | Correction | Where |
|----|------------|--------|
| **A1** | Add 4-tab UI on Tender Detail (Overview, Cost Estimate, Evaluation, Export) | `src/components/tender/TenderDetailClient.tsx`; use `src/components/ui/tabs.tsx` (Tabs, TabsList, TabsTrigger, TabsContent). Move current overview block → Overview tab; move AnalysisPanel → Evaluation tab; add Cost Estimate and Export tabs. |
| **A2** | Remove or de-emphasize pipeline in sidebar | `src/app/(dashboard)/layout.tsx`: remove or relocate the link to `/pipeline`. |
| **A3** | Settings: 3 areas (Rate Cards, Evaluation Criteria, Odoo/CRM) | `src/components/settings/SettingsTabs.tsx`: **Full implementation** — Rate Cards tab: upload, list, delete rate cards (rate_cards + rate_card_items); Odoo/CRM tab: config form (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY) + connection test. No placeholders. Evaluation Criteria = existing ScoringWeights. Optional 4th tab "عام" for AI + Profile. |
| **A4** | Export tab + Excel + Odoo | Build ExportTab on Tender Detail. Implement Excel export (3 sheets, Arabic headers) and Odoo push (real API, connection test, duplicate detection). API or Server Action per ORCHESTRATION-BRIEF §3.1. |
| **A5** | Cost Estimate tab + backend | Line items (cost_items), rate card matching, bid price. APIs or Server Actions for cost_items CRUD and rate card match (BACKEND.md / ORCHESTRATION-BRIEF §3). |

**Order:** A1 (tabs shell) → A2 (nav) → A3 (Settings) → A5 (Cost tab) → A4 (Export tab + Excel/Odoo).

---

## 3. Phase Sequence (To Do)

| Phase | Name | Objective |
|-------|------|------------|
| **Align** | A1–A5 | See §2. |
| **2.3** | Export & Odoo | Export tab on Tender Detail; Excel 3-sheet; Odoo push; batch Export All / Push All Qualified (IMPLEMENTATION.md Phase 2.3). |
| **2.4** | PDF + AI extraction | Verify existing (TenderUpload PDF, POST /api/ai/extract, PDFExtractionPreview). |
| **2.5** | Cost Estimator | Cost Estimate tab: cost_items CRUD, rate card matching, bid price (PRD F5). |
| **3.1** | Bug fixes | From demo or alignment. |
| **3.2** | Dashboard | StatsRow, RecentTenders, ScoreDistribution, Upload/Export All CTAs. |
| **3.3** | Settings assembly | Confirm 3 areas; AI/Profile optional or merged. |
| **3.4** | Visual polish | Sidebar, table, gauge, toasts, empty states, navy/gold. |
| **Landing** | Landing | Verify / and auth redirect (LandingPage exists). |
| **3.5** | Documentation | README, .env.example, key comments. |
| **3.6** | Demo prep | Data, script (upload → cost → evaluate → export), rehearsal, deploy. |

---

## 4. Acceptance Checkpoints

- **After Alignment:** Tender Detail has 4 tabs; Overview and Evaluation show content; Cost and Export tabs present; nav without primary pipeline link; Settings has Rate Cards and Odoo/CRM.
- **After 2.3:** Excel download and Odoo push work from Export tab (and optionally batch).
- **After 2.5:** Cost Estimate tab shows line items, rate card match, bid price.
- **Demo (PRD §7):** Upload → (extraction) → cost estimator → evaluate → export (Excel and/or Odoo).

---

## 5. Backend Surface (Verified vs Codebase)

| Stage | Current state | Target |
|-------|----------------|--------|
| Tenders | Server Actions (upload, save) | Keep; optional API for import. |
| AI | POST /api/ai/extract | Done. |
| Evaluation | analyze.ts → evaluations table | Add presets CRUD for Settings. |
| Costs | — | Add cost_items CRUD + rate card match. |
| Rate cards | — | Add for Settings Rate Cards tab. |
| Export | pushToCRM (payload only) | Add Excel generation + real Odoo HTTP. |
| Settings (Odoo) | — | Add config + test. |

---

## 6. References

| Doc | Role |
|-----|------|
| docs/reports/CODEBASE-ALIGNMENT-REPORT.md | Gap list and evidence. |
| docs/reports/FINAL-IMPLEMENTATION-PLAN.md | Full phase list and references. |
| docs/reports/GOTCHA-VERIFICATION-REPORT.md | Verification of alignment and final plan. |
| docs/context/PRD.md | Feature and flow SOT. |
| docs/context/IMPLEMENTATION.md | Task detail and acceptance tests. |
| docs/ORCHESTRATION-BRIEF.md | Site map and backend stages. |
