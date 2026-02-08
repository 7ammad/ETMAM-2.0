# Plan: Fix AI Extraction Zod NaN Validation Failure

## Objective
Eliminate `ZodError: expected number, received NaN` when Gemini returns invalid numeric values (e.g. empty string or non-numeric) for `extracted_sections.qualifications.local_content_requirement` or other nullable numeric fields. Extraction should succeed with such values normalized to `null`.

## Root Cause (from terminal + Ref/Zod docs)
- **Zod:** `z.number()` rejects `NaN` (see [Zod Numbers](https://zod.dev/api#numbers): `schema.parse(NaN); // ❌`).
- **Flow:** Gemini JSON → `normalizeExtractionResponse(parsed)` → `extractionResponseSchema.parse(normalized)`.
- **Coercion:** Schema uses `z.coerce.number().nullable().default(null)`. Coercion runs first; `Number("")` or invalid string yields `NaN`, which fails the number check before nullable/default apply.
- **Fix location:** Normalize so Zod never sees NaN: in `normalizeExtractionResponse`, sanitize nested numeric values in `extracted_sections`.

## Prerequisites
- [x] Parser and Gemini extraction code located (`src/lib/ai/parser.ts`, `src/lib/ai/gemini.ts`).
- [x] Zod docs consulted (Ref MCP): coercion and number validation behavior confirmed.
- No new dependencies; no API changes.

## Tasks (execution order)

### 1. Sanitize NaN in `normalizeExtractionResponse` — **parser.ts**
- **What:** Recursively walk `extracted_sections` (objects and arrays) and replace any value that is a number and `Number.isNaN(value)` with `null`.
- **Files:** `src/lib/ai/parser.ts`
- **Depends on:** nothing
- **Complexity:** Simple

### 2. Verification
- **Typecheck:** `pnpm exec tsc --noEmit`
- **Build:** `pnpm build`
- **Manual:** Run extraction on a PDF that previously triggered the error (or unit test with mock payload containing NaN).

## Database / API / UI
- None.

## Risks & Edge Cases
- **Risk:** Over-sanitizing (e.g. replacing valid 0). Mitigation: only replace when `typeof v === 'number' && Number.isNaN(v)`.
- **Edge:** Nested arrays (e.g. `boq.items`, `required_staff`). Mitigation: recursive walk handles arrays by iterating and recursing into elements.

## References
- Zod: [Numbers](https://zod.dev/api#numbers), [Coercion](https://zod.dev/api#coercion), [preprocess](https://zod.dev/api#preprocess).
- Code: `src/lib/ai/parser.ts` (qualificationsSchema line 72: `local_content_requirement`), `normalizeExtractionResponse` (lines 213–245).
