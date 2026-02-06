# Phase 2.4 — Code Review Report

**Phase:** 2.4 PDF Upload with AI Extraction  
**Reviewer:** code-reviewer (Cursor)  
**Date:** 2026-02-06

---

## 1. Context

Phase 2.4 adds: PDF accept in TenderUpload, `/api/ai/extract`, PDFExtractionPreview (editable fields, confidence, evidence), extraction prompt (12-section), and verification layer. Scope per `docs/context/IMPLEMENTATION-PHASE-2.4-INSERT.md`.

**Files reviewed:**  
`src/app/api/ai/extract/route.ts`, `src/components/tender/TenderUpload.tsx`, `src/components/tender/PDFExtractionPreview.tsx`, `src/components/tender/ConfidenceIndicator.tsx`, `src/app/actions/tenders.ts` (savePdfTender), `src/lib/ai/provider.ts`, `src/lib/ai/gemini.ts`, `src/lib/ai/verification.ts`, `src/lib/ai/parser.ts`.

---

## 2. Security

| Finding | Severity | Status |
|--------|----------|--------|
| API route checks auth via `supabase.auth.getUser()` | — | ✅ Correct |
| File type restricted to `.pdf`; size capped by `MAX_PDF_SIZE_MB` (20) | — | ✅ Correct |
| No raw file path or user content in error messages | — | ✅ OK |

**Verdict:** No critical or high security issues. Auth and file validation are in place.

---

## 3. Performance

| Finding | Severity | Status |
|--------|----------|--------|
| PDF sent as Buffer to AI (base64 in Gemini); 20MB max | Medium | ✅ Acceptable for MVP; consider streaming/chunking later for very large PDFs |
| No extraction cache in route (BACKEND mentions extraction_cache) | Low | Optional follow-up; not required for acceptance |
| Single await for formData and file | — | ✅ OK |

**Verdict:** No critical/high performance issues. Cache can be added later if needed.

---

## 4. Type Safety

| Finding | Severity | Status |
|--------|----------|--------|
| `extraction.warnings` / `extraction.not_found` / `extraction.evidence` / `extraction.line_items` accessed without optional chaining | High | ✅ **Fixed** — guards and `?? []` / `?? {}` added in PDFExtractionPreview |
| `ConfidenceIndicator` received `score` that could be undefined/NaN from API | Medium | ✅ **Fixed** — prop typed as `number \| undefined \| null`, normalized to 0 when invalid |
| `savePdfTender` input type matches ExtractionResult shape (requirements, line_items) | — | ✅ OK |
| ExtractionResult from parser has defaults for warnings, not_found, etc. | — | ✅ OK |

**Verdict:** Defensive null/undefined handling added; types and runtime are aligned.

---

## 5. Code Quality & Standards

| Finding | Severity | Status |
|--------|----------|--------|
| Warning/error boxes used hardcoded light colors (amber-50, red-50) vs design tokens | Medium | ✅ **Fixed** — switched to `border-amber-500/50 bg-amber-500/10` and `border-destructive/50 bg-destructive/10` for theme consistency |
| RTL/Arabic: labels and messages in Arabic | — | ✅ OK |
| "AI-generated, please review" disclaimer present in PDFExtractionPreview | — | ✅ OK |
| Evidence section only rendered when `extraction.evidence` exists and has keys | — | ✅ **Fixed** — null check added |

**Verdict:** Theme and null-safety improvements applied; RTL and disclaimer in place.

---

## 6. Fixes Applied

1. **PDFExtractionPreview.tsx**
   - `extraction.not_found` → `extraction.not_found ?? []`.
   - `extraction.warnings` → `(extraction.warnings?.length ?? 0) > 0` and `(extraction.warnings ?? []).map`.
   - `extraction.line_items` → `(extraction.line_items?.length ?? 0) > 0`, `(extraction.line_items ?? []).map`, and `item.confidence ?? 0` for indicator.
   - `extraction.evidence` → `extraction.evidence != null && Object.keys(extraction.evidence).length > 0` and `Object.entries(extraction.evidence ?? {})`.
   - `extraction.overall_confidence` → `extraction.overall_confidence ?? 0` for header indicator.
   - `extraction.model_used` → `extraction.model_used ?? "—"` in disclaimer.
   - Warning/error boxes: use semantic tokens (amber-500/10, destructive/10) instead of fixed light colors.

2. **ConfidenceIndicator.tsx**
   - `score` prop type: `number | undefined | null`.
   - Normalize invalid/NaN to 0 so the component always receives a number for display.

---

## 7. Verification Checklist

- [x] `pnpm build` passes.
- [x] No remaining unsafe access to `extraction.warnings` / `not_found` / `evidence` / `line_items`.
- [x] ConfidenceIndicator handles undefined/NaN.
- [x] Warning/error styling uses theme-aware tokens.
- [x] API route: auth, file type, size limit enforced.
- [x] savePdfTender: validation and insert shape match Tender/backend.

---

## 8. Executive Summary

**Outcome:** Phase 2.4 implementation is **sound**. Review found **type-safety and robustness gaps** (optional chaining / defaults for extraction fields) and **theme consistency** (warning/error colors). All identified issues were **fixed**; build passes.

**Recommendation:** **Sign-off** for Phase 2.4 from a code-quality perspective. Optional: add extraction cache (BACKEND) and timeout/abort for long PDFs in a future iteration.
