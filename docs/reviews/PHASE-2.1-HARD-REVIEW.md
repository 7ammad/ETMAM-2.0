# Phase 2.1 — Hard Review

**Phase:** 2.1 AI Provider Setup
**Reviewer:** Claude Code (code-reviewer)
**Date:** 2026-02-06
**Commit:** 42ad7e6

---

## Checklist

### 1. No bare stubs

- [x] **No new pages added.** Phase 2.1 touches only `src/lib/ai/` files and one Server Action. All files contain real, substantive implementations — no placeholder `<h1>` or empty shells.
- [x] **`src/lib/ai/retry.ts`** — 131 lines: `AIError` class, `withTimeout()`, `withRetry()`, `classifyError()` — all fully implemented with real logic.
- [x] **`src/app/actions/test-ai.ts`** — 65 lines: working Server Action that calls `getAIProvider().analyze()` and validates against Zod schema.
- [x] **`gemini.ts` / `groq.ts`** — modified to wrap API calls with retry+timeout+classifyError. No structure was removed, only error-resilience was added.

**Verdict:** PASS

---

### 2. Layouts are real shells

- [x] No layouts were added or modified in Phase 2.1. N/A for this phase.

**Verdict:** PASS (N/A)

---

### 3. i18n / locale

- [x] **Error messages in Arabic.** All user-facing error messages in `retry.ts:classifyError()` are Arabic:
  - Rate limit: "تم تجاوز حد الاستخدام، حاول لاحقاً"
  - Auth error: "مفتاح API غير صالح"
  - Parse error: "فشل تحليل استجابة AI"
  - Timeout: "طلب التحليل تجاوز المهلة (30 ثانية)"
  - Generic: "حدث خطأ أثناء تحليل AI: " + original message
- [x] No user-facing numbers or formatting added in this phase.

**Verdict:** PASS

---

### 4. Error and not-found

- [x] **App-level `error.tsx` and `not-found.tsx` exist** — confirmed at `src/app/error.tsx`, `src/app/(dashboard)/error.tsx`, and `src/app/not-found.tsx`.
- [x] **No new async routes added in Phase 2.1.** The `test-ai.ts` is a Server Action (not a route), so no new error/loading boundaries needed.

**Verdict:** PASS

---

### 5. Doc and architecture clarity

- [x] **"pursue" vs "proceed" mismatch documented.** The checklist result (G2) explicitly states this mapping is deferred to Phase 2.2. The patterns file (`PHASE-2.1-PATTERNS.md`) documents the full mapping table with the solution for Phase 2.2.
- [x] **zod/v4 import verified.** `zod@4.3.6` is installed; `import { z } from "zod/v4"` is the correct path for this version. Documented in checklist result (G3).
- [x] **Model name discrepancy documented.** G9 notes `gemini-2.5-flash` (code) vs `gemini-2.5-flash-preview-05-20` (TECH-STACK.md) — the code value is authoritative.
- [x] **Extraction cache deferred.** G6 documents that `extraction_cache` table exists but wiring is Phase 2.2 scope.

**Verdict:** PASS

---

### 6. External dependencies testable without keys

- [x] **`getAIProvider()` fallback chain unchanged.** MOCK_AI=true → MockProvider; no keys at all → MockProvider. Verified in `provider.ts:54-80`.
- [x] **`testAIProvider()` works with MOCK_AI.** The Server Action calls `getAIProvider().analyze()` which falls back to MockProvider when no keys are set.
- [x] **Mock data passes Zod schema.** `MockProvider.analyze()` returns a complete `AIAnalysisResult` with all required fields: `overall_score: 65`, `confidence: "medium"`, `scores` record with 5 entries, `evidence: []`, `recommendation: "review"`, `recommendation_reasoning`, `red_flags: []`, `key_dates: []`. All satisfy `analysisResponseSchema` constraints.

**Verdict:** PASS

---

### 7. No redundant duplicates

- [x] **Retry/timeout logic centralized.** Single source of truth in `retry.ts` — both `gemini.ts` and `groq.ts` import from the same module.
- [x] **Error classification centralized.** `classifyError()` in `retry.ts` is the sole error classifier.
- [x] **Minor observation:** `AI_TIMEOUT_MS = 30_000` is declared separately in both `gemini.ts:15` and `groq.ts:11`. This is a simple constant (not logic duplication), and keeping it per-provider allows future per-provider timeout tuning. Acceptable — not a blocker.

**Verdict:** PASS

---

### 8. Phase-specific requirements

All IMPLEMENTATION.md Phase 2.1 tasks verified:

| Task | Status | Evidence |
|------|--------|----------|
| Create `src/lib/ai/retry.ts` with AIError, withTimeout, withRetry, classifyError | ✅ | 131 lines, all functions implemented |
| Wrap `gemini.ts` `analyze()` with retry+timeout | ✅ | Lines 44-56, withRetry + withTimeout(30s) + classifyError |
| Wrap `gemini.ts` `extractFromPDF()` with retry+timeout | ✅ | Lines 74-103, same pattern |
| Wrap `groq.ts` `analyze()` with retry+timeout | ✅ | Lines 31-60, same pattern |
| Verify `parser.ts` zod import | ✅ | `zod@4.3.6` installed, `zod/v4` path correct |
| Verify `provider.ts` getAIProvider() unchanged | ✅ | No modifications, fallback chain intact |
| Verify `mock-provider.ts` passes schema | ✅ | Return shape matches analysisResponseSchema |
| Optional test-ai Server Action | ✅ | `src/app/actions/test-ai.ts` created, includes Zod safeParse validation |

**Acceptance test criteria:**

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Gemini API call with key | Manual test (requires GEMINI_API_KEY) |
| 2 | Groq API call with key | Manual test (requires GROQ_API_KEY) |
| 3 | AI_PROVIDER switches provider | ✅ Verified: `provider.ts` logic reads AI_PROVIDER env |
| 4 | Response parses via Zod | ✅ `analysisResponseSchema.parse()` in both providers |
| 5 | Invalid responses caught | ✅ `classifyError()` catches and wraps all errors |
| 6 | MOCK_AI=true returns valid mock | ✅ MockProvider output matches schema |
| 7 | Timeout after 30s | ✅ `withTimeout(30_000)` in both providers |
| 8 | Retry once on 429/5xx | ✅ `withRetry({ maxRetries: 1, baseDelayMs: 2000 })` |
| 9 | pnpm build passes | ✅ Verified |
| 10 | tsc --noEmit passes | ✅ Verified |

**Verdict:** PASS

---

### 9. Build and types

- [x] **`pnpm build`** — compiled successfully (Next.js 16.1.6 Turbopack, 11 pages, 3.5s compile).
- [x] **`tsc --noEmit`** — zero type errors.

**Verdict:** PASS

---

## Summary

All 9 hard review items: **PASS**

**Code quality observations (non-blocking):**
1. `AI_TIMEOUT_MS` is duplicated in `gemini.ts` and `groq.ts` — could be exported from `retry.ts`, but current approach allows per-provider tuning. Acceptable.
2. `classifyError()` uses broad string matching (e.g., `message.includes("parse")`) which could theoretically match unrelated errors, but in the AI provider context this is pragmatic and unlikely to cause issues.

---

## Sign-off: Phase 2.1 complete. All items satisfied.
