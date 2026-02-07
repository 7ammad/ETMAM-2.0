# System Architect Feedback — Handover Report Review

**Date:** February 6, 2026  
**Reviewed:** `docs/SYSTEM-ARCHITECT-HANDOVER-REPORT.md`  
**Cross-referenced:** PRD, TENDER-STRUCTURE v3.0, ARCHITECTURE.md, IMPLEMENTATION.md, codebase

---

## 1. Validation of the handover report

**Verdict: The handover report is accurate and usable.**

| Claim in report | Checked | Result |
|-----------------|--------|--------|
| Data flow: CSV/Excel → tenders only | Code + actions | ✅ Correct |
| PDF → /api/ai/extract → Gemini → savePdfTender | Route + actions | ✅ Correct |
| extraction_cache not used | Grep + actions | ✅ Correct |
| Analysis → evaluations + trigger updates tenders | analyze.ts + DB | ✅ Correct |
| pushToCRM returns payload only, no Odoo call | pipeline.ts | ✅ Correct |
| Rate cards, cost_items, presets, extraction_cache in DB but unused | Types + usage | ✅ Correct |
| PRD feature mapping (1A–6B) | PRD vs code | ✅ Aligned |
| TENDER-STRUCTURE vs current extraction (subset) | parser + schema vs doc | ✅ Correct |
| Excel export “to be confirmed” | Grep in src | ✅ Confirmed: **not implemented** (no export route/action) |

**Minor correction:** PRD §4 “Non-Functional Requirements” says “No authentication required for MVP (single user demo)” but the codebase has Supabase auth and proxy protection. Treat this as an **intentional upgrade** from PRD (auth is in place); no change to the handover needed. If the demo is strictly single-user, auth can stay as-is; if judges expect “no login,” that’s a product decision.

---

## 2. Gaps and additions (architectural)

### 2.1 Security and data

- **RLS:** Handover correctly states RLS is enabled. Recommend: ensure every table used by the app has a policy that restricts by `auth.uid()` (or equivalent); `extraction_cache` and `evaluation_presets` when used later must be scoped per user or per org.
- **Secrets:** Odoo credentials in .env only — correct. When implementing `src/lib/odoo.ts`, never log URLs, DB names, or API keys; use generic “Odoo connection failed” in user-facing messages.
- **File hashing for cache:** SHA-256 of PDF buffer is fine for extraction_cache key. Consider truncating or limiting stored JSONB size (e.g. 1MB cap) to avoid unbounded growth.

### 2.2 Scalability and performance

- **Extraction:** Single PDF per request is appropriate for MVP. If later moving to “bulk PDF,” use a queue (e.g. in-process queue, then background worker) and keep `/api/ai/extract` as single-file to avoid timeouts.
- **Analysis:** Same pattern — one tender per analyze call. No change needed for current scope.
- **Dashboard stats:** If tender count grows large, aggregate counts (e.g. materialized view or cached counts) may be needed; not required for demo.

### 2.3 Data model

- **TENDER-STRUCTURE alignment:** Handover correctly identifies that `tenders` has a single `deadline` and no columns for evaluation formula, licenses, multiple dates. For **post-MVP** alignment with كراسة الشروط:
  - Option A: Add JSONB `extraction_metadata` (or similar) and store full extraction there; keep existing columns for current UI. No migration to many new columns initially.
  - Option B: Add nullable columns for `bid_submission_deadline`, `document_purchase_fee`, `evaluation_method`, `financial_weight`, `technical_weight`, `scoring_formula` (TEXT), `local_content_target`, `required_licenses` (JSONB). Use when extraction is extended.
- **Rate cards:** Schema exists; handover’s “upload → rate_cards + rate_card_items” is the right path. No schema change needed before implementing Feature 2.

### 2.4 Integration points

- **Odoo:** PRD specifies XML-RPC or REST. Prefer **JSON-RPC over HTTPS** (Odoo’s native API) for simplicity. Field mapping in PRD (§6B) is clear; duplicate detection via `ref` (tender_number) search on `crm.lead` is correct.
- **Excel export:** No external service; use existing `xlsx` in a server action or API route that streams the file. Handover’s 3-sheet structure (overview, evaluation, cost) matches PRD.

---

## 3. Prioritization and dependencies

### 3.1 Recommended order (for demo and PRD compliance)

| Order | Action | Rationale |
|-------|--------|-----------|
| 1 | **Excel export (PRD 6A — P0)** | Demo script and PRD say “Excel export ALWAYS works”; no dependency on Odoo. Unblocks “Export to Excel” on detail + “Export All” on dashboard. |
| 2 | **Manual tender entry (PRD 1B — P0)** | Fallback when CSV/PDF fail; quick to implement (one form + one action). |
| 3 | **Odoo integration (PRD 6B — P1)** | Connection test in settings + actual create lead in pushToCRM + set `odoo_lead_id`/`exported_to`. Duplicate check by `ref` improves demo story. |
| 4 | **extraction_cache** | Reduces cost and improves repeat-upload UX; optional for demo but high value. Can follow immediately after Excel/Odoo if time allows. |
| 5 | **Cost estimator UI (PRD 5 — P0)** | Cost line items, direct/indirect, total. Required for “cost → export” story. Can start with manual rows only (no rate card matching at first). |
| 6 | **Rate cards (PRD 2A — P1)** | Enables rate card matching in cost estimator and AI cost suggestions. Depends on cost estimator existing. |
| 7 | **Evaluation presets (PRD 4B)** | Improves UX; not blocking demo. |
| 8 | **Richer extraction / TENDER-STRUCTURE** | Post-MVP; do after P0/P1 features are stable. |

### 3.2 Dependencies (logic)

- **Cost estimator** → rate card matching: cost_items CRUD first, then “match from rate_card” when rate cards exist.
- **AI cost suggestions (5C):** Depends on cost estimator UI + ideally rate cards; can be “manual only” initially.
- **Odoo** does not depend on Excel export; both can be implemented in parallel.

---

## 4. Risks and assumptions

### 4.1 Product / scope

- **PRD build window:** “3-day sprint” and “Demo Feb 8” imply limited time. Prioritization above favors “demo path”: Excel + manual entry + Odoo + cost estimator (basic) first; rate cards and presets as time allows.
- **Auth:** Code has auth; PRD says no auth for MVP. **Assumption:** Auth stays; demo uses one pre-created account. If stakeholder wants “no login at all,” that’s a scope change (e.g. bypass auth in dev or add demo mode).
- **Excel export:** **Assumption:** “Export All” means “all tenders visible to the user” (after filters if any), not necessarily pagination; for demo, full list export is acceptable.

### 4.2 Technical

- **Gemini limits:** Handover and PRD mention caching to avoid rate limits. extraction_cache is the right mitigation; implement before or during demo prep.
- **Odoo version:** PRD does not specify Odoo version. **Assumption:** Odoo 14+ (JSON-RPC and `crm.lead`/`res.partner` are stable). If client uses older Odoo, XML-RPC may be required.
- **Hijri dates:** TENDER-STRUCTURE is clear; current app uses single Gregorian `deadline`. **Assumption:** MVP continues with single deadline; Hijri and multiple dates are post-MVP unless product explicitly requests them for demo.

### 4.3 Contradictions or ambiguities

- **PRD §5 “Pages & Navigation”:** “Dashboard (/)” — codebase has `/` as landing and `/dashboard` as app dashboard. Handover does not need to change; ensure demo script uses `/dashboard` for “Dashboard” and `/` for public landing.
- **PRD “Out of Scope”: “User authentication / multi-user support”** — implementation has auth but single-user usage. No contradiction if “multi-user” means no roles/tenancy; if it means “no login,” see 4.1.

---

## 5. Recommended next steps

### 5.1 Immediate (before or during next sprint)

1. **Confirm with product owner:** (a) Is Excel export (6A) the top priority? (b) Is “no login” required for demo, or is one demo account acceptable? (c) Is Odoo instance/version known for integration testing?
2. **Implement Excel export (6A):** Server action or API route; 3 sheets per PRD; filename `Etmam_[TenderNumber]_[Date].xlsx`; “Export to Excel” on detail, “Export All” on dashboard. No dependency on cost estimator for Sheet 1 and 2; Sheet 3 can be “Cost breakdown” with placeholder or empty if cost_items not yet used.
3. **Implement manual tender entry (1B):** Form (entity, tender_title, tender_number, deadline, estimated_value, description, requirements) → `createTenderManual` → insert with source_type='manual'.

### 5.2 Short term (same sprint or next)

4. **Implement Odoo (6B):** `src/lib/odoo.ts` (or equivalent); connection test in settings; in `pushToCRM`, call Odoo to create lead (and partner if needed); on success update tender (`exported_to`, `odoo_lead_id`); duplicate check by tender_number/ref.
5. **Add extraction_cache:** Hash PDF → lookup → on miss call Gemini → store result; on hit return cached. Reduces cost and improves reliability for demo.
6. **Cost estimator UI (5A):** Tender detail section: cost_items table (direct/indirect), add/edit/delete rows, auto total; link to tenders.total_cost via existing trigger. Optional: profit margin % and final bid price field for export.

### 5.3 Backlog (after P0/P1 stable)

7. Rate card upload and list (2A); rate card matching in cost estimator (5B).  
8. Evaluation presets (4B).  
9. AI cost suggestions (5C) and, if needed, AI-assisted scoring (4C).  
10. Richer extraction and optional schema extension for TENDER-STRUCTURE (Section 5 formula, licenses, multiple dates).

---

## 6. Summary

- **Handover report:** Accurate; use it as the single source of truth for “what’s built vs required” and for corrective actions.
- **Additions:** Security (RLS, no logging of Odoo secrets), light scalability notes, data model options for TENDER-STRUCTURE, and Odoo/Excel tech choices.
- **Prioritization:** Excel export and manual entry first; then Odoo and extraction_cache; then cost estimator and rate cards; presets and richer extraction later.
- **Risks:** Demo timing; auth vs “no auth” in PRD; Odoo version. Validate with product owner.
- **Next steps:** Confirm priorities with product owner; implement Excel export and manual entry; then Odoo and cache; then cost estimator.

This feedback is intended for the dev team and product owner to align on order of work and scope. The handover report remains the primary reference for data flow, gaps, and corrective action detail; this document refines order, dependencies, and assumptions.
