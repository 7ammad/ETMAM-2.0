# Evaluation Pipeline — Technical Reference

> Single source of truth for how Etmam evaluates tenders.
> Last updated: 2026-02-07

---

## 1. Evaluation Criteria

Five criteria, each scored 0–100, combined via weighted average:

| # | Key | Arabic Name | Weight | What It Measures |
|---|-----|-------------|--------|------------------|
| 1 | `relevance` | التوافق التقني | 25% | Do the tender requirements match our capabilities, certifications, products, and experience? Can we deliver the full scope? |
| 2 | `budget_fit` | الملاءمة المالية | 25% | If cost data exists: is margin reasonable (10-25% good)? Is bid below estimated value? Are direct/indirect costs balanced? If no cost data: score from estimated value + requirements only. |
| 3 | `timeline` | الجدول الزمني | 20% | Is the submission deadline sufficient to prepare a complete bid? Is the execution timeline realistic given current resources? Overlap with existing projects? |
| 4 | `competition` | مستوى المنافسة | 15% | Expected number of competitors? Open / limited / sole-source? Qualification barriers (contractor classification, specific certifications) that reduce competition? |
| 5 | `strategic` | القيمة الاستراتيجية | 15% | Is this a strategic government entity (ministry, major authority)? Will it open future opportunities / operational contracts? Does it strengthen our track record? |

**Weights defined in:** `src/lib/constants.ts:17-23`

### Scoring Rubric

| Range | Label | Meaning |
|-------|-------|---------|
| 90-100 | Excellent | Clear match, no notable risks |
| 70-89 | Good | Good match, minor reservations |
| 50-69 | Acceptable | Partial match, needs further review |
| 30-49 | Weak | Clear gaps or tangible risks |
| 0-29 | Not suitable | No match or very high risk |

### Recommendation Thresholds

| Overall Score | Recommendation | Arabic |
|---------------|----------------|--------|
| >= 70 | `proceed` | تقدم |
| 40 – 69 | `review` | مراجعة |
| < 40 | `skip` | تجاوز |

---

## 2. Data Sources — What Goes Into the Evaluation

Built by `buildTenderContent()` in `src/app/actions/analyze.ts:22-79`.

### A. Tender Record (always present)

| Field | Source |
|-------|--------|
| Entity (الجهة) | DB `tenders.entity` |
| Title (عنوان المنافسة) | DB `tenders.tender_title` |
| Number (رقم المنافسة) | DB `tenders.tender_number` |
| Deadline (الموعد النهائي) | DB `tenders.deadline` |
| Estimated Value (القيمة التقديرية) | DB `tenders.estimated_value` — **nullable**, Saudi PDFs often don't include it |
| Description (الوصف) | DB `tenders.description` — optional |
| Requirements (المتطلبات) | DB `tenders.requirements` — JSONB array, joined as newline-separated text |

### B. Cost Data (only if user has completed cost estimation)

When `cost_items` exist for the tender, the following are calculated and appended:

| Field | Calculation |
|-------|-------------|
| Direct costs total | Sum of `cost_items` where `category = 'direct'` |
| Indirect costs total | Sum of `cost_items` where `category = 'indirect'` |
| Grand total | Direct + Indirect |
| Proposed bid price | `tenders.proposed_price` or grand total if null |
| Profit margin % | `(proposed_price - total_cost) / proposed_price * 100` |
| Estimated value | `tenders.estimated_value` (0 if null) |
| Delta from estimated value | `estimated_value - proposed_price` (amount + %) |

**If no cost items exist:** the AI scores `budget_fit` purely from the tender text and estimated value — no bid/cost comparison is possible.

---

## 3. AI Prompt Design

Defined in `src/lib/ai/prompts.ts:14-95`.

### Role
> "You are a Saudi government tender analysis expert working in a contracting company. Your task is to evaluate this tender to help the sales team decide whether to participate."

### Prompt Structure

```
1. Tender data (plaintext blob from buildTenderContent)
2. Evaluation weights (injected per-criterion)
3. Criteria descriptions (domain-specific: Saudi gov IT/telecom/security)
4. Step-by-step instructions (chain-of-thought):
   Step 1: Read tender data, identify key points
   Step 2: Score each criterion using the rubric
   Step 3: Calculate overall_score using weighted formula
   Step 4: Derive recommendation from thresholds
   Step 5: Extract 3+ direct evidence quotes from tender text
   Step 6: Identify red flags and key dates
5. Output JSON schema (exact structure required)
6. Strict rules (6 rules — see below)
```

### Strict Rules (embedded in prompt)

1. Overall score MUST be calculated by the weighted formula — no random estimation.
2. Evidence MUST be verbatim quotes from the tender text — minimum 3.
3. If insufficient data for a criterion, score = 50, reasoning = "بيانات غير كافية", confidence = "low".
4. Do not invent information not present in the tender text.
5. If data is very short or unclear, explain in `recommendation_reasoning`.
6. All reasoning and recommendations in Arabic.

### Model Configuration

| Setting | Value | Why |
|---------|-------|-----|
| Model | `gemini-2.5-flash` | Fast, good Arabic support, free tier |
| `responseMimeType` | `application/json` | Forces structured JSON output |
| `temperature` | 0.3 | Low creativity, more deterministic scoring |
| `maxOutputTokens` | 2000 | Sufficient for analysis response |
| Timeout | 30 seconds | With 1 retry, 2s backoff |

---

## 4. Guardrails Against Hallucination

Three post-AI verification layers, executed in sequence before saving to DB.

### Layer 1 — Zod Schema Validation
**File:** `src/lib/ai/parser.ts:7-28`

Enforces type safety on the raw AI JSON response:

- `overall_score`: number, 0-100
- `confidence`: exactly `"high"` | `"medium"` | `"low"`
- Each sub-score: number 0-100 + reasoning string
- `recommendation`: exactly `"pursue"` | `"review"` | `"skip"`
- `evidence[]`: text + relevance enum + source string
- `red_flags[]`, `key_dates[]`: string arrays

**If validation fails:** hard error, no silent pass-through.

### Layer 2 — Formula Verification
**File:** `src/lib/ai/verification.ts:25-107`

Deterministic checks that override the AI when it makes math or logic errors:

| Check | Action |
|-------|--------|
| **Score recalculation** | Independently recomputes `overall_score` from the 5 sub-scores using the weighted formula. If AI's score deviates by **> 5 points**, it is **overwritten**. |
| **Score clamping** | Any sub-score outside 0-100 is clamped and logged. |
| **Recommendation enforcement** | If AI says "pursue" but verified score is 55, recommendation is corrected to "review". Thresholds are enforced deterministically. |
| **Confidence downgrade** | If any criterion reasoning contains "بيانات غير كافية" but confidence = "high", confidence is forced to "medium". |

All corrections are saved in `criteria_scores.verification_corrections`.

### Layer 3 — Evidence Cross-Check
**File:** `src/lib/ai/verification.ts:243-269`

Verifies that AI-generated evidence quotes actually exist in the source text:

1. Normalizes Arabic text — strips tashkeel (diacritics), normalizes alef/hamza, ta marbuta, alef maqsura.
2. Splits each quote into words (> 2 chars).
3. Checks what percentage of words appear in the original tender text.
4. **If < 50% word match:** quote is flagged as "concerning" (suspected hallucination).
5. Flagged quotes are still shown in the UI but marked with a warning.
6. Flag messages are saved in `verification_corrections`.

---

## 5. End-to-End Pipeline Flow

```
Tender DB record + Cost items (if any)
       │
       ▼
buildTenderContent()          ← Assembles plaintext from fields + cost data
       │
       ▼
buildAnalysisPrompt()         ← Injects into Arabic chain-of-thought prompt with weights
       │
       ▼
Gemini 2.5 Flash              ← temp=0.3, JSON mode, 30s timeout, 1 retry
       │
       ▼
extractJSON() + JSON.parse    ← Strips markdown code blocks if present
       │
       ▼
Zod schema validation         ← LAYER 1: Type safety — hard fail on bad structure
       │
       ▼
verifyAnalysis()              ← LAYER 2: Recalc score, enforce thresholds, clamp
       │
       ▼
verifyEvidence()              ← LAYER 3: Cross-check quotes against source text
       │
       ▼
Upsert to evaluations table   ← Saves scores + corrections + evidence
       │
       ▼
DB trigger fires              ← Updates tenders.evaluation_score, .recommendation, .status
```

---

## 6. Key Files

| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | Default weights (25/25/20/15/15) |
| `src/lib/ai/prompts.ts` | Analysis prompt + extraction prompt |
| `src/lib/ai/provider.ts` | AIProvider interface, factory function |
| `src/lib/ai/gemini.ts` | Gemini implementation (analyze + extractFromPDF) |
| `src/lib/ai/parser.ts` | JSON extraction, Zod schemas, normalization |
| `src/lib/ai/verification.ts` | All 3 guardrail layers |
| `src/lib/ai/retry.ts` | Retry/timeout/error classification utilities |
| `src/app/actions/analyze.ts` | Server Action: buildTenderContent + orchestration |
| `supabase/migrations/20260206120000_initial_schema.sql` | evaluations table + trigger |

---

## 7. Known Constraints

- **Estimated value is nullable.** Saudi tender PDFs rarely include pricing. When null, `budget_fit` is scored from text context alone (typically ~50 with "insufficient data" note).
- **Cost data is optional.** If the user hasn't done cost estimation, the AI has no bid/margin data. `budget_fit` scoring is less precise in this case.
- **Evidence matching is fuzzy.** The 50% word-match threshold accommodates Arabic text normalization differences but may occasionally miss short quotes or flag valid paraphrases.
- **Single AI provider per call.** No ensemble or cross-model verification. Gemini is primary; Groq is fallback if Gemini key is missing.
- **Weights are user-adjustable.** The 25/25/20/15/15 split is the default. Users can customize via evaluation presets, so scores are not directly comparable across different weight configurations.
