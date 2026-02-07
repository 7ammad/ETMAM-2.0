# CC Audit vs PRD & Context Docs — Verification

**Purpose:** Confirm Claude Code’s audit report matches PRD and context docs.  
**Date:** 2026-02-07  
**Reference:** CC “Etmam 2.0 — Audit Report & Updated Implementation Plan”

---

## Verdict: **CC audit tallies with PRD and our docs**

CC’s critical issues, priorities, and remaining work align with PRD §5 (Page Map), §6 (6A/6B), Feature 5 (Cost Estimator), Feature 2A (Rate Cards), and PRD-SOT-MAP. One factual correction below.

---

## A. What’s working — vs PRD

| CC claim | PRD / docs | Verdict |
|----------|------------|--------|
| Auth, DB, CSV/Excel, PDF extraction, AI analysis, Tender list, Dashboard, Settings (partial), Landing, Design system | All P0 in PRD | ✅ Matches |
| Pipeline Board “contradicts PRD” | PRD §5: no /pipeline in page map. Export on Tender Detail (Excel + Odoo). PRD-SOT-MAP: no pipeline board page. | ✅ Correct |

---

## B. Critical issues — verified against PRD

| CC issue | PRD / docs evidence | Verdict |
|----------|---------------------|--------|
| **B1. /pipeline exists but PRD says NO pipeline page** | PRD §5 Page Map: /, /upload, /tenders, /tenders/[id], /settings, /export. No /pipeline. PRD-SOT-MAP: “No separate pipeline board page.” | ✅ Correct. Action: remove /pipeline from sidebar; Export tab is required. |
| **B2. Tender Detail has no tabs — missing Evaluation, Costs, Export** | PRD §5 Tender Detail: “Tabs or sections: 1. Overview 2. Evaluation 3. Cost Estimate 4. Export (Excel + push to Odoo, both equal).” | ✅ Correct. |
| **B3. Export (6A + 6B) missing** | PRD §6A: Excel 3 sheets, button on tender detail, Export All. §6B: Push to Odoo via .env, connection test, duplicate detection, 7 fields. | ✅ Correct. No /api/export/excel, /api/export/odoo, ExportTab, or Odoo XML-RPC. |
| **B4. Cost Estimator (Feature 5) missing** | PRD 277–337: 5A line items, 5B rate card matching, 5C AI cost, 5D summary. | ✅ Correct. |
| **B5. Rate Card (2A) and Odoo tab in Settings missing** | PRD §5 Settings: “Rate Cards management”, “Evaluation Criteria presets”, “Odoo / CRM configuration”. | ✅ Correct. |

---

## C. API routes — vs TECH-STACK / PRD

CC’s list of missing routes matches TECH-STACK and PRD. Export is required: **/api/export/excel** and **/api/export/odoo** (or equivalent Server Actions). Other routes may be implemented as Server Actions; PRD does not mandate API vs Server Action.

---

## D. One correction to CC’s report

| CC claim | Correction |
|----------|------------|
| **E. “Dashboard references evaluation_score column on tenders — this column may not exist (scores are in evaluations table)”** | **BACKEND.md** defines `evaluation_score` on `tenders` (denormalized), updated by trigger from `evaluations` (see BACKEND.md §tenders table and trigger on evaluations). So the column can exist; the real risk is `pipeline.ts` using wrong table/columns (e.g. reading from tenders without join to evaluations). Fix: ensure pipeline/export code reads score from `evaluations` or from the denormalized `tenders.evaluation_score` if the trigger is in place. |

---

## E. PRD page map reminder

PRD §5 includes **/export (Batch export)** as a top-level route. So:

- **Tender Detail** must have an **Export** tab (Excel + Push to Odoo).
- **Batch export** (Export All / Push All Qualified) is also required (PRD 6A/6B acceptance criteria). CC’s item #14 (batch operations) is in scope.

---

## F. CC’s implementation plan vs PRD

CC’s prioritized list (critical #1–6, high #7–12, nice-to-have #13–16) matches PRD:

- **Critical:** Tabs on Tender Detail, ExportTab, Excel export, Odoo push, remove pipeline from sidebar, CRM field mapping — all in PRD 6A/6B and §5.
- **High:** Cost Estimator (F5), Rate Cards (F2A), Evaluation tab (F4), Odoo config tab, evaluation_score refs, rate card matching — all in PRD.
- **Nice-to-have:** Sidebar active state, batch operations (actually required per PRD 6A/6B), dead hooks, manual entry tab — batch is required; rest is polish.

**Add to CC’s list:** Ensure **batch operations** (Export All, Push All Qualified) are explicitly in the “critical” or “high” set; PRD requires them (6A/6B).

---

## G. Summary

- CC’s audit is **aligned with PRD and context docs**.
- **Single correction:** Clarify that `evaluation_score` can exist on `tenders` (BACKEND trigger); fix any code that assumes it doesn’t or reads score incorrectly.
- **Reminder:** Batch export / Push All Qualified is required by PRD; treat as required, not only nice-to-have.
- Use CC’s “Updated Implementation Plan” as the execution list; it matches PRD and our one-doc-per-type setup.
