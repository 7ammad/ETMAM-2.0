# Tender Not Saved After Extraction — Root Cause & Fixes

**Date:** 2026-02-07  
**Scope:** Why tender data from PDF extraction might not persist when user clicks "حفظ المنافسة". Structured review: context → security → performance → type safety → code quality.

---

## 1. Executive Summary

| Severity | Finding | Status |
|----------|---------|--------|
| **High** | `extraction_confidence` could be `NaN` on insert (PostgreSQL rejects NaN for INTEGER) | **Fixed** |
| **Medium** | Deadline format DD-MM-YYYY from AI not parsed (only DD/MM/YYYY was) | **Fixed** |
| **Low** | `extraction_confidence` typed required; client could pass `undefined` | **Fixed** |

**Root causes addressed:** (1) Coerce `extraction_confidence` so it is never `NaN`. (2) Accept DD-MM-YYYY in deadline and return a clearer date error. (3) Client sends `overall_confidence ?? 0`; server accepts optional and defaults it.

---

## 2. Flow Reviewed

1. **PDF upload** → `POST /api/ai/extract` → Gemini returns `ExtractionResult` (with `overall_confidence` from Zod default 0).
2. **Preview** → `PDFExtractionPreview` shows form; user edits and clicks "حفظ المنافسة".
3. **Save** → `savePdfTender({ ... extraction.overall_confidence ... })` → Supabase `tenders.insert(...)`.

If insert fails, the action returns `{ success: false, error: "..." }` and the UI sets `setError(result.error)` and shows it in a red alert box.

---

## 3. Root Causes

### 3.1 extraction_confidence → NaN (High)

- **What:** `savePdfTender` did `Math.round(input.extraction_confidence)`. If `extraction.overall_confidence` was ever `undefined` (e.g. partial API response or type drift), then `Math.round(undefined)` is `NaN`.
- **DB:** Column `extraction_confidence INTEGER` — PostgreSQL does not accept `NaN`; the insert can fail or behave unexpectedly.
- **Fix:** Server: `Math.round(Number(input.extraction_confidence) || 0)`. Input type: `extraction_confidence?: number` (optional). Client: `extraction_confidence: extraction.overall_confidence ?? 0`.

### 3.2 Deadline format (Medium)

- **What:** `normalizeDeadline` only split on `/`. AI often returns dates like `15-03-2026` (DD-MM-YYYY). `new Date("15-03-2026")` is invalid or inconsistent across engines, so we returned `null` and "صيغة التاريخ غير صحيحة".
- **Fix:** Split on `/` or `-` and build YYYY-MM-DD; validate with `new Date(iso)`. Clearer error: "صيغة التاريخ غير صحيحة. استخدم YYYY-MM-DD أو DD/MM/YYYY".

### 3.3 Error visibility (Low)

- **What:** If the insert failed, the UI already shows `result.error` in a destructive-styled alert. No change needed; fixes above reduce how often the insert fails.

---

## 4. Changes Made

| File | Change |
|------|--------|
| `src/app/actions/tenders.ts` | `extraction_confidence` optional; insert uses `Math.round(Number(input.extraction_confidence) \|\| 0)`; `normalizeDeadline` accepts DD-MM-YYYY (split on `[/-]`), builds ISO, validates; clearer deadline error message. |
| `src/components/tender/PDFExtractionPreview.tsx` | Pass `extraction_confidence: extraction.overall_confidence ?? 0`. |

---

## 5. Verification Checklist

- [x] extraction_confidence never NaN (coerced to 0 if missing/invalid).
- [x] Deadline parses YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY.
- [x] Server returns structured error; client displays it.
- [x] RLS: insert uses `user_id` from `getUser()`; policy allows insert when `auth.uid() = user_id`.
- [ ] **Run migration** `20260207050000_estimated_value_nullable.sql` if not already (so empty estimated_value can be stored as NULL).

---

## 6. If Tender Still Doesn’t Save

1. **Browser console / network:** Check the Server Action response for `result.error`.
2. **Server logs:** Look for `[savePdfTender] Auth failed` or `[savePdfTender] Insert failed` (message, code, details).
3. **DB:** Confirm migration for nullable `estimated_value` is applied; confirm RLS allows insert for the authenticated user.
4. **Required fields:** Ensure الجهة، عنوان المنافسة، رقم المنافسة، الموعد النهائي are non-empty and deadline parses.

---

*End of report.*
