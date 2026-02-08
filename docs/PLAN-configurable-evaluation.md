# Implementation Plan: Configurable Evaluation System for Etmam 2.0

## Context

InfraTech is a Saudi cybersecurity/IT solutions company (NCA-licensed, Palo Alto/Cisco/IBM partner). The current evaluation engine uses AI (DeepSeek/Gemini/Groq) with 5 fixed scoring dimensions (relevance, budgetFit, timeline, competition, strategic). These criteria are too academic and don't reflect how a Saudi IT company actually decides whether to bid on a government tender.

**The new system** replaces competition and strategic with profit-focused criteria, makes all criteria user-configurable (toggle on/off, set weights), and adds editable factor inputs per criterion so users can input real cost data and see exactly how the score is calculated.

## What Already Exists in etmam-2.0

- `evaluation_presets` table (DB + RLS) — has id, user_id, name, is_default, criteria (JSONB)
- `evaluations` table — stores criteria_scores JSONB, overall_score, recommendation, preset_id FK
- `DEFAULT_SCORING_WEIGHTS` in `src/lib/constants.ts` — { relevance: 25, budgetFit: 25, timeline: 20, competition: 15, strategic: 15 }
- `analyzeTender()` server action — accepts custom weights, calls AI, runs verification guardrails
- `verifyAnalysis()` — recalculates score from weighted subscores, enforces recommendation thresholds
- `useSettingsStore()` — persists scoring weights in localStorage
- `<ScoringWeights>` component — UI for adjusting the 5 weights in settings
- `<ScoreBreakdown>`, `<ScoreGauge>`, `<AnalysisPanel>` — display components

## New 5 Criteria (replacing old 5)

| # | Key | Label (EN) | Label (AR) | Default Weight | Default ON | Min Weight |
|---|-----|-----------|-----------|---------------|------------|------------|
| 1 | `profit_potential` | Net Profit Potential | صافي الربح المتوقع | 50 | Always ON | 30 |
| 2 | `delivery_confidence` | Delivery Confidence | ثقة التنفيذ | 25 | ON | 0 |
| 3 | `cashflow_risk` | Cash Flow Risk | مخاطر السيولة | 15 | ON | 0 |
| 4 | `scope_alignment` | Scope Alignment | توافق النطاق | 10 | OFF | 0 |
| 5 | `entity_relationship` | Entity Relationship | العلاقة مع الجهة | 0 | OFF | 0 |

## Decision Output

- **GO** (score >= goThreshold, default 80) — Bid aggressively
- **MAYBE** (score >= maybeThreshold, default 60) — Leadership review
- **SKIP** (score < maybeThreshold) — Don't bid

Maps to existing DB: GO → "proceed", MAYBE → "review", SKIP → "skip"

---

## Implementation Steps

### Step 1: Add types — `src/types/evaluation-profiles.ts` (NEW FILE)

Create:
- `CriterionKey` union type for the 5 new keys
- `CriterionConfig` — { key, enabled, weight }
- `CRITERIA_META` — label, labelAr, description, defaultWeight, defaultEnabled, minWeight, icon
- Factor schemas (Zod) per criterion:
  - `ProfitFactors` — revenue_sar, labor_cost_sar, tool_licenses_sar, subcontractor_cost_sar, indirect_cost_sar, overhead_pct, is_recurring, contract_years, payment_terms_days
  - `DeliveryFactors` — has_required_certs, missing_certs, current_saudization_pct, required_saudization_pct, team_available, hires_needed, has_past_experience, similar_projects_count
  - `CashflowFactors` — payment_terms_days, has_milestone_payments, upfront_payment_pct, initial_guarantee_sar, is_known_slow_payer
  - `ScopeFactors` — scope_match_pct, vendor_match, involves_new_tech, is_vendor_locked
  - `EntityRelationshipFactors` — relationship_type, past_contracts_count, has_known_competitor_preference, competitor_name
- `CriterionFactors` mapped type
- `CriterionScoreResult` — key, label, labelAr, weight, rawScore, weightedScore, factors, reasoning
- `ConfigurableEvalResult` — profileId, profileName, finalScore, decision, criteriaScores, summary, evaluatedAt
- `getDefaultCriteriaConfig()` helper
- `validateCriteriaWeights()` helper

### Step 2: Add scoring engine — `src/lib/evaluation/configurable-scorer.ts` (NEW FILE)

Create `src/lib/evaluation/` directory with:
- `autoFillProfitFactors(tender)` — reads estimated_value, total_cost, project duration
- `autoFillDeliveryFactors(tender)` — defaults, reads from company_capabilities in profiles
- `autoFillCashflowFactors(tender)` — reads initial_guarantee from extracted_sections.contract_terms
- `autoFillScopeFactors(tender)` — reads requirements match from extracted_sections
- `autoFillEntityRelationshipFactors(tender)` — defaults (cold bid)
- `autoFillAllFactors(tender)` — calls all above
- `scoreProfitPotential(factors)` → { score: 0-100, reasoning: string }
- `scoreDeliveryConfidence(factors)` → same
- `scoreCashflowRisk(factors)` → same
- `scoreScopeAlignment(factors)` → same
- `scoreEntityRelationship(factors)` → same
- `runConfigurableEvaluation(tender, criteria, factorOverrides, profile, thresholds)` → ConfigurableEvalResult

Key: Auto-fill uses tender data from DB (estimated_value, extracted_sections.contract_terms for guarantee/payment, cost_items for labor/tool costs). User overrides merge on top.

### Step 3: Add server action — `src/app/actions/evaluate-configurable.ts` (NEW FILE)

- `getAutoFilledFactors(tenderId)` — returns auto-filled factors for UI pre-population
- `runConfigurableEvaluation(tenderId, profileId, factorOverrides)` — runs evaluation, persists to evaluations table
- `listEvaluationProfiles(userId)` — query evaluation_presets
- `getDefaultProfile(userId)` — get or seed default
- `createProfile(data)` — insert into evaluation_presets
- `updateProfile(profileId, data)` — update evaluation_presets
- `deleteProfile(profileId)` — delete from evaluation_presets
- `seedDefaultProfile(userId)` — create default profile with new criteria if none exists

### Step 4: Update constants — `src/lib/constants.ts`

- Add `NEW_DEFAULT_CRITERIA` constant with the 5 new criteria configs
- Add `DECISION_THRESHOLDS` — { go: 80, maybe: 60 }
- Keep `DEFAULT_SCORING_WEIGHTS` for backward compatibility (legacy AI-based evaluation still works)

### Step 5: Update settings store — `src/stores/settings-store.ts`

- Add `evaluationMode: 'ai' | 'configurable'` — toggle between legacy AI eval and new configurable eval
- Add `activeProfileId: string | null` — currently selected evaluation profile
- Keep existing `scoringWeights` for legacy AI mode

### Step 6: Update database types — `src/types/database.ts`

- Add `EvaluationProfile` type matching evaluation_presets table
- Add `decision` field type to Evaluation ('GO' | 'MAYBE' | 'SKIP' | null)
- Add `factor_inputs` JSONB field type to Evaluation

### Step 7: DB Migration — `supabase/migrations/YYYYMMDD_configurable_evaluation.sql`

- Add columns to `evaluations`: `factor_inputs JSONB`, `decision TEXT`
- No new tables needed — `evaluation_presets` already exists!
- Seed a default preset with the new 5 criteria for existing users (optional, can be done in app)

### Step 8: Update `<ScoringWeights>` component or create new `<EvaluationProfileEditor>`

In `src/components/settings/`:
- New component: `<EvaluationProfileEditor>` — shows 5 criteria with toggle + weight slider, preview of sum
- Or: extend existing `<ScoringWeights>` with mode toggle (AI weights vs. Configurable criteria)

### Step 9: Update tender detail — evaluation tab

In the tender detail page's Evaluation tab:
- Add "Configurable Evaluation" section alongside existing AI analysis
- Shows auto-filled factors per criterion with edit fields
- "Run Evaluation" button → calls configurable eval action
- Displays per-criterion breakdown with scores, reasoning, and editable inputs

### Step 10: Update docs

- Update `DEMO_SCRIPT.md` with configurable evaluation summary
- Update `HANDOVER_CHECKLIST.md` with new evidence section
- Update `PRESENTATION_OUTLINE.md` with new slides
- Update `docs/competition-submission/` copies

---

## File Map (what goes where)

| Action | File Path | Type |
|--------|-----------|------|
| New types | `src/types/evaluation-profiles.ts` | CREATE |
| Scoring engine | `src/lib/evaluation/configurable-scorer.ts` | CREATE |
| Server actions | `src/app/actions/evaluate-configurable.ts` | CREATE |
| Constants update | `src/lib/constants.ts` | EDIT |
| Settings store | `src/stores/settings-store.ts` | EDIT |
| DB types | `src/types/database.ts` | EDIT |
| Migration | `supabase/migrations/20260208200000_configurable_evaluation.sql` | CREATE |
| Profile editor UI | `src/components/settings/EvaluationProfileEditor.tsx` | CREATE |
| Eval form UI | `src/components/analysis/ConfigurableEvalPanel.tsx` | CREATE |
| Docs | `DEMO_SCRIPT.md`, `HANDOVER_CHECKLIST.md`, `PRESENTATION_OUTLINE.md` | EDIT |
| Submission docs | `docs/competition-submission/*` | EDIT |

## What NOT to change

- Existing `analyzeTender()` action — AI-based evaluation stays as-is (dual mode)
- Existing `verifyAnalysis()` / `verifyEvidence()` — only used by AI path
- Existing `<AnalysisPanel>` — still shows AI results when AI mode is used
- Existing `evaluation_presets` table — we USE it, don't recreate it

## Backward Compatibility

- Legacy AI evaluation: `analyzeTender(tenderId, weights)` → unchanged
- New configurable evaluation: `runConfigurableEvaluation(tenderId, profileId, overrides)` → new path
- Both write to the same `evaluations` table
- Settings store has `evaluationMode` toggle
- UI shows both options in the tender detail Evaluation tab
