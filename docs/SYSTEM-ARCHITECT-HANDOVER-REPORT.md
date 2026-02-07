# System Architect Handover — Data Flow, AI, Built vs Required, Corrective Actions

**Audience:** System architect, senior-backend, subagent-advisor.  
**Sources:** PRD (`docs/context/PRD.md`), TENDER-STRUCTURE v3.0 (`docs/context/TENDER-STRUCTURE-v3.0-VERIFIED.md`), DB migrations (`supabase/migrations/`), codebase.

---

## 1. Current data flow (as built)

### 1.1 Tender input → storage

```
User (TenderUpload)
  ├─ CSV/Excel: parse client-side (csv-parser, xlsx) → preview → uploadTenders(tenders)
  │     → tenders.insert (entity, tender_title, tender_number, deadline, estimated_value,
  │        description, requirements as JSONB, line_items=[], source_type=csv)
  │
  └─ PDF: POST /api/ai/extract (FormData file)
        → getAIProvider("gemini") → extractFromPDF(buffer) → verifyExtraction()
        → UI shows extraction; user clicks "Save" → savePdfTender(input)
        → tenders.insert (same + source_type=pdf, source_file_name, extraction_confidence,
           extraction_warnings, line_items from extraction)
```

- **Tables written:** `tenders` only. No write to `extraction_cache` (table exists, unused).
- **Manual entry:** No dedicated “manual entry form” flow; CSV/Excel and PDF are the only inputs.

### 1.2 AI analysis (scoring) → evaluations

```
User clicks "Analyze" on tender detail
  → analyzeTender(tenderId, weights, aiProvider) [server action]
  → tenders.select + getAIProvider(aiProvider).analyze(tenderContent, weights)
  → verifyAnalysis + verifyEvidence
  → evaluations.upsert (tender_id, user_id, criteria_scores, overall_score, auto_recommendation)
  → trigger updates tenders.evaluation_score, tenders.recommendation, tenders.status='evaluated'
```

- **Tables written:** `evaluations`, and via trigger `tenders` (evaluation_score, recommendation, status).
- **AI:** Gemini or Groq text-only analysis; no PDF in this path. Weights from settings (Zustand).

### 1.3 Pipeline

```
User moves tender on pipeline board
  → moveToPipeline(tenderId, stageId) → pipeline_entries.upsert (tender_id, stage_id, user_id)
  → one row per tender; stage_id in (new, scored, approved, pushed, won, lost)
```

- **Tables written:** `pipeline_entries`. `pipeline_stages` is reference data (seeded).

### 1.4 CRM / export

```
User clicks "Push to CRM"
  → pushToCRM(tenderId) → tenders.select → returns { success: true, payload }
  → No Odoo API call; payload only (entity, title, number, deadline, value, score, recommendation).
  → UI can show preview; DB has odoo_lead_id, exported_to but they are not set by this action.
```

- **Excel export:** Not traced in this report; assume separate action if present.
- **Gap:** PRD 6B requires actual Odoo integration (connection test, push, duplicate detection). Currently only payload construction exists.

---

## 2. AI in the codebase

| Capability | Where | What it does |
|------------|--------|----------------|
| **PDF extraction** | `POST /api/ai/extract` → `GeminiProvider.extractFromPDF` | Sends PDF + prompt to Gemini; returns JSON; parse → normalize → Zod; route runs `verifyExtraction()`. |
| **Tender analysis (scoring)** | `analyzeTender` in `src/app/actions/analyze.ts` → `provider.analyze(tenderContent, weights)` | Text-only; Gemini or Groq; returns scores, evidence, recommendation; persisted to `evaluations`. |
| **Provider choice** | `getAIProvider(preferred?)` | PDF always uses Gemini; analysis uses env `AI_PROVIDER` or preference. Mock when no keys. |

- **Extraction prompt:** `SECTION_TARGETED_EXTRACTION_PROMPT` in `prompts.ts` — aligned with a simplified 12-section view; see §4 vs TENDER-STRUCTURE.
- **Analysis:** Weights (relevance, budgetFit, timeline, competition, strategic) and evidence verification; no rate-card or cost logic in analysis.

---

## 3. What is actually built (in place)

| Area | Built | Not built / partial |
|------|--------|----------------------|
| **Auth** | Supabase auth, login/register, proxy protection, server/client clients | — |
| **Tender input** | CSV/Excel upload + parse, PDF upload + Gemini extraction, save to `tenders` | Manual entry form (PRD 1B); extraction_cache not used |
| **Tender list/detail** | List with sort; detail with analysis panel, pipeline move, “Push to CRM” (payload only) | — |
| **AI analysis** | Analyze button → Gemini/Groq → evaluations + tender score/status | No AI-suggested scores per criterion (PRD 4C); no rate-card–aware analysis |
| **Pipeline** | Board, move tender between stages, pipeline_entries | — |
| **Settings** | AI provider toggle, scoring weights, profile (from context) | — |
| **Dashboard** | Stats (counts, average score, pipeline counts), recent tenders, score distribution | — |
| **Rate cards** | Tables + RLS exist | No upload UI, no parsing, no use in app (Feature 2) |
| **Cost estimator** | Tables (cost_items) + trigger to update tenders.total_cost | No UI, no rate-card matching, no AI cost suggestions (Feature 5) |
| **Evaluation presets** | Table + RLS | No UI to save/load presets (PRD 4B) |
| **CRM** | pushToCRM builds payload; types for Odoo | No Odoo API call, no connection test, no duplicate check (PRD 6B) |
| **Excel export** | Not verified in this pass | PRD 6A requires export; confirm separately |

---

## 4. PRD and TENDER-STRUCTURE vs built

### 4.1 PRD — feature-level

- **1A CSV/Excel:** Built (upload, parse, save to tenders).  
- **1B Manual entry:** Not built (no form for single-tender manual add).  
- **1C PDF + AI extraction:** Built (Gemini, prompt, save via savePdfTender). PRD also mentions specifications, eligibility_criteria, financial_requirements, submission_requirements — current extraction schema is a subset (see §4.2).  
- **2 Rate cards:** Not built (no upload, no storage usage, no cost matching).  
- **3 AI analysis (risks, summary, rate-card suggestions):** Partially built (scoring + evidence only; no “match line items to rate cards” or dedicated risk summary).  
- **4 Evaluation:** Built (weights, AI-assisted overall score, recommendation). Presets and per-criterion AI suggestions not built.  
- **5 Cost estimator:** Not built (no UI, no rate_card usage, no AI cost generation).  
- **6A Excel export:** To be confirmed.  
- **6B Odoo:** Not built (payload only; no API, no test, no duplicate handling).

### 4.2 TENDER-STRUCTURE v3.0 vs extraction and DB

**TENDER-STRUCTURE (verified) highlights:**

- 12 sections; Section 1: entity, tender_number, tender_title, document_purchase_fee, **multiple dates (Hijri)** (document_issue, questions_deadline, bid_submission_deadline, bid_opening, award_date, work_start), **required_licenses** (list).  
- Section 5 (Bid Evaluation): evaluation_method, financial_weight, technical_weight, scoring_formula (verbatim), local_content_target, minimum_technical_score.  
- Section 7: BOQ, place, duration, **line_items**.  
- Section 8: specifications, team, materials, equipment.  
- Sections 9–12: local content, offset, special terms, attachments.

**Current extraction schema (parser + prompt):**

- entity, tender_title, tender_number, deadline (single), estimated_value, description, requirements[], line_items[], confidence, evidence, overall_confidence, warnings, not_found.  
- **Not extracted:** document_purchase_fee, multiple dates (Hijri), required_licenses, evaluation formula/weights, local_content_target, specifications as separate list, eligibility_criteria, financial_requirements, submission_requirements.

**DB `tenders`:**

- Single `deadline` (DATE); no columns for bid_opening, award_date, document_issue, etc.  
- No columns for evaluation_method, financial_weight, scoring_formula, required_licenses, document_purchase_fee.  
- So: **data model and extraction are a subset of TENDER-STRUCTURE**; sufficient for current MVP but not for full spec alignment.

### 4.3 Database vs usage

| Table | In schema | Used in app (read/write) |
|-------|-----------|---------------------------|
| profiles | ✅ | Created by trigger; profile form may update |
| tenders | ✅ | ✅ Full CRUD (list, detail, insert from CSV/Excel/PDF) |
| evaluations | ✅ | ✅ Upsert from analyze |
| pipeline_stages | ✅ | ✅ Read for board |
| pipeline_entries | ✅ | ✅ Upsert for move |
| rate_cards | ✅ | ❌ Not used |
| rate_card_items | ✅ | ❌ Not used |
| cost_items | ✅ | ❌ Not used (trigger exists) |
| evaluation_presets | ✅ | ❌ Not used |
| extraction_cache | ✅ | ❌ Not used |

---

## 5. Corrective actions (logic and tech)

### 5.1 High impact — align with PRD and data flow

1. **Use extraction_cache (optional but recommended)**  
   - **Logic:** After successful PDF extraction, hash file (e.g. SHA-256 of buffer), insert/update `extraction_cache` (file_hash, file_name, extraction_result JSONB, model_used, processing_time_ms). Before calling Gemini, check cache by hash; if hit, return cached result.  
   - **Tech:** In `extract/route.ts`, after `verifyExtraction()`, upsert into `extraction_cache`; at start of route, compute hash and select by file_hash.  
   - **Benefit:** Faster repeat uploads, lower API cost.

2. **Manual tender entry (PRD 1B)**  
   - **Logic:** New form (or modal) with fields: entity, tender_title, tender_number, deadline, estimated_value, description, requirements (textarea or list). On submit, insert into `tenders` with source_type='manual'.  
   - **Tech:** Server action (e.g. `createTenderManual`) + form in existing tenders or upload page. Reuse existing `tenderInputSchema` or equivalent for validation.

3. **CRM: actual Odoo integration (PRD 6B)**  
   - **Logic:** In `pushToCRM`, call Odoo XML-RPC or REST (create crm.lead, optionally res.partner). Use .env (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY). On success, update tender: exported_to='odoo', odoo_lead_id=<id>. Connection test in settings: simple “list” or “version” call.  
   - **Tech:** New module e.g. `src/lib/odoo.ts` (or use existing if present); call from `pushToCRM`; duplicate check by tender_number/ref if Odoo API supports search.

4. **Excel export (PRD 6A)**  
   - **Logic:** Export current tender (or filtered list) to .xlsx: Sheet 1 overview, Sheet 2 evaluation details, Sheet 3 cost breakdown (if cost_items used later).  
   - **Tech:** Use existing xlsx dependency; server action or API route that returns file stream. Confirm if already implemented elsewhere.

### 5.2 Medium impact — product depth

5. **Rate cards (Feature 2)**  
   - **Logic:** Upload Excel/CSV → parse (item, category, unit, unit_price, etc.) → insert into `rate_cards` + `rate_card_items`. List/delete rate cards in settings or dedicated page.  
   - **Tech:** Reuse parsing patterns from tenders; RLS and triggers already exist.  
   - **Enables:** Cost estimator and “match requirements to rate cards” (PRD 5B, 5C).

6. **Cost estimator (Feature 5)**  
   - **Logic:** Tender detail: cost table (direct/indirect); add/edit/delete rows in `cost_items`; total_cost from trigger. Optional: “Suggest from BOQ” using tender line_items + rate_card search (source = 'ai_suggested' or 'rate_card').  
   - **Tech:** CRUD on `cost_items`; optional AI endpoint or server action that suggests items from extraction + rate_card_items search.

7. **Evaluation presets (PRD 4B)**  
   - **Logic:** Save current weights as a preset (name, criteria JSON) into `evaluation_presets`; load preset to populate weights.  
   - **Tech:** Settings UI + server actions for insert/update/select presets; is_default handling per user.

### 5.3 Lower priority — TENDER-STRUCTURE alignment

8. **Richer extraction and schema**  
   - **Logic:** Extend prompt and extraction schema to include: required_licenses[], key dates (e.g. bid_submission_deadline, award_date), document_purchase_fee, evaluation_method, financial_weight, local_content_target (if needed for scoring).  
   - **Tech:** Add fields to `extractionResponseSchema` and to DB (migration: new columns or JSONB for flexible fields). Prompt update in `SECTION_TARGETED_EXTRACTION_PROMPT` to match TENDER-STRUCTURE section map.  
   - **Benefit:** Better alignment with Saudi كراسة الشروط and future evaluation/cost features.

9. **Hijri dates**  
   - **Logic:** TENDER-STRUCTURE uses Hijri in documents. Option A: store as text (e.g. deadline_hijri); Option B: convert to Gregorian for `deadline` and keep Hijri in JSONB for display.  
   - **Tech:** If extending extraction, add optional hijri fields; conversion library if needed.

### 5.4 Technical debt / robustness

10. **Tender.estimated_value type**  
    - DB allows NULL (migration done). Ensure TypeScript types and UI treat `estimated_value` as `number | null` everywhere (e.g. pushToCRM already uses Number()).

11. **Error and observability**  
    - Extraction and analysis: keep existing logging; consider structured logs (e.g. requestId, tenderId) for traceability.  
    - Frontend: show errorCode (e.g. INVALID_RESPONSE, AUTH_ERROR) where useful for support.

---

## 6. Summary for system-architect

- **Data flow:** Tenders enter via CSV/Excel or PDF (Gemini); stored in `tenders`. AI analysis writes to `evaluations` and updates tenders. Pipeline uses `pipeline_entries`. Rate cards, cost items, presets, and extraction cache are in the DB but **not used** in the app.  
- **AI:** PDF extraction (Gemini only) and tender analysis (Gemini/Groq) are implemented; no rate-card or cost AI yet.  
- **Gaps vs PRD:** Manual entry (1B), rate cards (2), cost estimator (5), evaluation presets (4B), real Odoo push (6B); Excel export to be confirmed.  
- **Gaps vs TENDER-STRUCTURE:** Extraction and DB are a subset (single deadline, no evaluation formula/licenses/dates); optional enrichment in §5.3.  
- **Corrective actions:** §5.1 gives high-impact items (cache, manual entry, Odoo, Excel); §5.2 adds rate cards and cost estimator; §5.3 aligns with TENDER-STRUCTURE; §5.4 covers small tech fixes.

Use this report to prioritize backlog and assign work (backend, frontend, or both) per feature. Subagent-advisor can refine each corrective action into concrete tasks and acceptance criteria.
