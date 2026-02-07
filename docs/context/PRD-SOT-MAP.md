# PRD as Source of Truth (SOT) — Alignment Map

**Single master reference.** All context docs derive from and must align with **PRD.md**. No duplicate alignment docs; this file is the only map.

---

## 1. SOT Definition

| Item | Value |
|------|--------|
| **Source of truth** | `docs/context/PRD.md` (current version: 2.1, Feb 7 2026) |
| **Scope** | Features, priorities, NFRs, page map, acceptance criteria, build schedule |
| **Rule** | Any conflict between PRD and another doc → PRD wins. Update the other doc. |

---

## 2. Canonical Stances (from PRD)

- **Priorities:** All features P0. No P1 or P2.
- **Tender input:** Two equally important sources — CSV/Excel (1A) and PDF with AI extraction (1C). Manual entry (1B) when no file. Both 1A and 1C must be in the pipeline.
- **CRM output:** Two equally important features — Push to Odoo (6B) and manual extraction / Excel export (6A). Not "primary" vs "fallback".
- **Odoo:** EnfraTech’s CRM. Push via .env (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY). Required for full demo; Excel export equally available.
- **Pages (PRD §5):** /, /upload (or /tenders/upload), /tenders, /tenders/[id], /settings (Rate Cards, Evaluation Criteria, Odoo/CRM config), /export. No separate “pipeline board” page.
- **Security:** .env for all secrets; Supabase RLS; Supabase auth required.
- **Build window:** Thu Feb 5 → Sun Feb 8; demo Sun.

---

## 3. Per-Doc Alignment (what each doc must do)

| Doc | Align to PRD by |
|-----|-----------------|
| **IDEA.md** | Already aligned (dual input, dual CRM, Odoo, no P1/P2). Keep in sync with PRD for any future edits. |
| **APP-FLOW.md** | Already aligned (P0 only, no pipeline page, Odoo + Excel, both inputs equal). Reference PRD in doc info. |
| **TECH-STACK.md** | State PRD = SOT; set version/date; CRM section: Odoo + Excel equal; .env.example: Odoo required for full demo, Excel equal. |
| **IMPLEMENTATION.md** | State PRD = SOT; acceptance criteria from PRD; replace “CRM pipeline” with “Push to Odoo + Excel”; remove /pipeline page from structure or mark as optional; pipeline_stages/entries → only if needed for “pushed” tracking (or use tender.pushed_to_odoo_at). |
| **BACKEND.md** | API routes: export/excel + export/odoo; no “pipeline” as primary CRM; Odoo config in settings. Tables: align to PRD (no pipeline board required). |
| **FRONTEND.md** | ✅ Aligned. SOT; no pipeline page; Export tab (Excel + Odoo); pipeline-store/board optional. |
| **README.md** (context) | Add: “PRD is source of truth. See PRD-SOT-MAP.md for alignment.” |
| **Other context docs** | When touched, check PRD and this map; no P1/P2; no “optional”/“future” for 6A/6B or 1A/1C. |

---

## 4. Change Log (this map only)

- 2026-02-07: Created. TECH-STACK and IMPLEMENTATION aligned to PRD (SOT).
- 2026-02-07: BACKEND, FRONTEND, IMPLEMENTATION-PHASE-2.4-INSERT, PRD-DAY2-PDF-SCHEDULE, HARD-REVIEW aligned. All docs in docs/context now aligned to PRD.
