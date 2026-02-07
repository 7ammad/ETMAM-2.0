# Gotcha Report — PRD v2.1 Changes

**Reviewed:** `docs/context/PRD.md` (post–v2.1 edits)  
**Focus:** No P1/P2 remaining; factual consistency with internal pipeline and auth.

---

## Summary Verdict

| Category | Result |
|----------|--------|
| **P1/P2 removal** | ✅ **Verified** — No feature or schedule row uses P1 or P2. Only mention is the note: "There are no P1 or P2 features." |
| **Priority legend** | ✅ P1/P2 definitions removed; note added. All features and schedule rows are P0. |
| **6B Internal Pipeline** | ✅ Title, description, table, and acceptance criteria updated; no Odoo API/.env. |
| **Auth** | ✅ Security and Out of Scope updated (Supabase required; advanced multi-user out). |
| **Remaining "Odoo" copy** | ✅ **Corrected** — Four places updated to "pipeline" (Reliability, Page Map, Tender Detail, Success Metrics). Persona and 6A left as instructed. |

---

## Factual Claims Verified

| Claim | Location | Verification |
|-------|----------|--------------|
| Version 2.1, Feb 7 2026 | Doc Info | ✅ Present |
| Change Log line | Doc Info | ✅ Present |
| Executive summary: "internal CRM pipeline with field mapping or Excel export" | §1 | ✅ Present |
| Priority Legend: only P0 + note | §3 | ✅ P1/P2 definitions removed; note present |
| 1A, 1B, 1C all (P0) | §1 | ✅ |
| Feature 2 **Priority:** P0 | §2 | ✅ |
| 2A, 2B both (P0) | §2 | ✅ |
| Feature 3 **Priority:** P0 (extends Feature 1C extraction) | §3 | ✅ |
| 4C (P0) | §4 | ✅ |
| 5B, 5C (P0) | §5 | ✅ |
| 6B: Internal CRM Pipeline (P0), Push to Pipeline, pipeline field mapping | §6 | ✅ |
| Security: Supabase email/password authentication required | §4 | ✅ |
| Out of Scope: Advanced multi-user support (roles, permissions, teams) | §8 | ✅ |
| Day 2 table: all P0; "Internal CRM pipeline integration" | §6 | ✅ |
| Day 3 table: F4C, F5C, F2B all P0 | §6 | ✅ |
| Day 2 checkpoint: "push to pipeline" | §6 | ✅ |
| Demo script: "push to pipeline" | §7 | ✅ |
| Risks: "Pipeline push fails" + mitigation | §9 | ✅ |

---

## Mistakes Found and Corrections

### 1. Odoo references (inconsistency with 6B)

6B is now **Internal CRM Pipeline**; these four spots still said "Odoo":

| Location | Before | Correction |
|----------|--------|------------|
| **Reliability** (line ~427) | "If Odoo is not configured, Excel export is the default" | "If pipeline push fails, Excel export is the default" |
| **Page Map** (line ~443) | `Odoo Configuration` | `Pipeline / CRM configuration` |
| **Tender Detail** (line ~458) | "Excel download + Odoo push buttons" | "Excel download + pipeline push buttons" |
| **Success Metrics** (line ~562) | "7/7 fields present in Excel and Odoo" | "7/7 fields present in Excel and pipeline" |

**Left unchanged (per instructions):**  
- **§2 Persona:** "Has Odoo CRM but rarely updates it" — describes user’s current tools; no change.  
- **6A acceptance criteria:** "Works regardless of whether Odoo is configured" — 6A was not to be touched; optional follow-up: reword to "Works without external CRM (standalone export)" for consistency.

---

## Unverified / Optional

- **IDEA.md:** Note in Priority Legend references "Per IDEA.md"; not opened for this review.  
- **TENDER-STRUCTURE-v3.0-VERIFIED.md:** Extraction JSON in 1C is described as aligned to it; schema match not re-verified here.

---

## Minimal Edit Recommendations

The four corrections above have been applied to `docs/context/PRD.md`. The doc is now consistent: no P1/P2 as priorities, and CRM wording aligned to internal pipeline throughout (except persona and 6A per instructions).
