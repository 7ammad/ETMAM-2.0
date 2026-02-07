# System Architect — Etmam App Flow vs PRD Validation

**Date:** February 7, 2026  
**Source of truth:** PRD.md v2.1  
**Scope:** Validate APP-FLOW.md and implementation against PRD.

**Update (Feb 2026):** Product owner agreed **Cost before Evaluation**. PRD §5, IDEA, APP-FLOW, and ORCHESTRATION-BRIEF now use: pipeline **Cost Estimation → Evaluation**; Tender Detail tabs **Overview → Cost Estimate → Evaluation → Export**. This doc's §1 and §3 below are updated to match; §2 table and §5 follow-ups reflect current SOT.

---

## 1. Canonical Pipeline Order (PRD)

PRD §3 and §5 define the end-to-end pipeline and tab order:

```
Input → AI Analysis → Cost Estimation → Evaluation → CRM Export
```

**Tender Detail tab order (PRD §5):**
1. Overview  
2. Cost Estimate  
3. Evaluation  
4. Export  

---

## 2. App Flow Validation vs PRD

| PRD requirement | APP-FLOW.md | Implementation | Verdict |
|-----------------|-------------|----------------|---------|
| **Page map** | | | |
| / (landing) | ✅ Landing (public) | `src/app/page.tsx` | ✅ |
| /login, /register | ✅ | Auth routes | ✅ |
| /dashboard | ✅ Dashboard | `(dashboard)/dashboard/page.tsx` | ✅ |
| /tenders | ✅ Tender list | `(dashboard)/tenders/page.tsx` | ✅ |
| /tenders/upload or /upload | ✅ /tenders/upload | `/tenders/upload` used in nav | ✅ |
| /tenders/[id] | ✅ Detail with tabs | `(dashboard)/tenders/[id]/page.tsx` | ⚠️ See gaps |
| /settings (Rate Cards, Criteria, Odoo) | ✅ Tabs described | Settings structure | ✅ |
| **Input (both P0)** | | | |
| CSV/Excel path | ✅ Journey A | Upload page with Excel/CSV | ✅ |
| PDF + AI path | ✅ Journey B | Upload + AI extract | ✅ |
| Manual entry | ✅ Tab 3 | Manual form | ✅ |
| **Pipeline sequence** | | | |
| Cost before Evaluation | ✅ Journey A/B: Cost Estimate → Evaluation → Export | Detail: implement tabs Overview → Cost Estimate → Evaluation → Export | ⚠️ Tabs to be implemented per PRD §5 |
| **CRM (both P0)** | | | |
| Excel export | ✅ Export tab, Journey E | Actions exist | ✅ |
| Push to Odoo | ✅ Export tab, Journey E | Odoo config/actions | ✅ |
| **Dual input / dual CRM** | Doc info + journeys | — | ✅ Aligned |
| **No P1/P2** | Stated in APP-FLOW doc info | — | ✅ |

**Gaps (implementation vs PRD):**
- Tender detail: PRD and APP-FLOW specify **four tabs** (Overview | Cost Estimate | Evaluation | Export). Current implementation may not yet have all four as separate tabs; implement per PRD §5.
- Route consistency: PRD allows `/upload` or `/tenders/upload`; app uses `/tenders/upload` only — acceptable.

---

## 3. Cost vs Evaluation Order (Current SOT)

**Agreed order: Cost before Evaluation** (per product owner and PRD §5 update).

- **Pipeline:** Input → AI Analysis → **Cost Estimator** → **Evaluation** → CRM Export.
- **Tender Detail tabs:** Overview → Cost Estimate → Evaluation → Export.
- **Rationale:** Profit Potential criterion and evaluation reasoning use **bid price** from the Cost Estimator when available; cost first ensures the score is informed by estimated value.

*(Previous recommendation was Evaluation → Cost; product owner chose Cost → Evaluation so that evaluation can use estimated value.)*

---

## 4. Summary

| Item | Status |
|------|--------|
| APP-FLOW vs PRD | Aligned (page map, journeys, dual input, dual CRM, pipeline order). |
| Implementation vs PRD | Routes and upload/list/detail exist; tender detail is missing distinct **Costs** and **Export** tabs. |
| Cost vs evaluation order | **Cost before Evaluation** (PRD §5, IDEA, APP-FLOW, ORCHESTRATION-BRIEF). Profit Potential uses bid price when available. |

---

## 5. Actionable Follow-ups

1. **Implement tabs on `/tenders/[id]`**  
   Add tabbed UI: Overview | Cost Estimate | Evaluation | Export, per PRD §5 and APP-FLOW §3.4.

2. **Keep pipeline order in docs and UI**  
   Use: Input → AI Analysis → Cost Estimation → Evaluation → CRM Export (per PRD §3, §5).

3. **Demo script**  
   Follow PRD §7 order: upload → (extraction) → cost estimator → evaluate (score + recommendation) → export (Excel and/or Odoo). Cost before evaluation so that evaluation can use bid price when available.
