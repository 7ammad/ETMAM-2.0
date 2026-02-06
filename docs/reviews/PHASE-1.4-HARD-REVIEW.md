# Phase 1.4 — Hard Review

**Phase:** 1.4 Tender Upload & List
**Reviewer:** Claude Code (code-reviewer)
**Date:** 2026-02-06
**Commit:** d925174

---

## Checklist

### 1. No bare stubs

- [x] **Pages are real structure** — `tenders/page.tsx` is a server component that fetches user tenders and renders `TenderListClient` with header + upload link. `tenders/upload/page.tsx` renders `TenderUpload` with Arabic heading. Neither is a bare `<h1>`.
- [x] **Error/loading boundaries** — Parent `(dashboard)/error.tsx` and `(dashboard)/loading.tsx` exist and cover all child routes including `/tenders` and `/tenders/upload`. The tenders page does async Supabase queries; the dashboard-level boundaries catch errors and show loading state.

**Verdict:** PASS

---

### 2. Layouts are real shells

- [x] Dashboard layout (`(dashboard)/layout.tsx`) has sidebar (240px, `w-60`) + header + main. Sidebar includes links to dashboard, tenders, upload, pipeline, settings — all in Arabic with `border-e` (RTL logical property).
- [x] No layout was added or modified in Phase 1.4 (correct — layout was already established in Phase 1.3).

**Verdict:** PASS

---

### 3. i18n / locale

- [x] **Numbers** — `toLocaleString("ar-SA")` used in both `TenderUpload.tsx:161` (preview) and `TenderListClient.tsx:142` (list).
- [x] **Dates** — `toLocaleDateString("ar-SA")` used in `TenderListClient.tsx:139`.
- [x] **Validation errors** — All Arabic: "الجهة مطلوبة", "عنوان المنافسة مطلوب", "رقم المنافسة مطلوب", "صيغة التاريخ غير صحيحة", "القيمة يجب أن تكون موجبة".
- [x] **UI labels** — All headers, buttons, empty state, error messages, status badges in Arabic.

**Verdict:** PASS

---

### 4. Error and not-found

- [x] **App-level** — `(dashboard)/error.tsx` exists with Arabic retry button ("إعادة المحاولة"). `(dashboard)/loading.tsx` exists with animated loader and Arabic sr-only text.
- [x] **New routes** — `/tenders` does async Supabase query, covered by parent error boundary. `/tenders/upload` is a static page wrapping a client component; errors are caught within the component itself.

**Verdict:** PASS

---

### 5. Doc and architecture clarity

- [x] **G1 conflict resolved** — IMPLEMENTATION.md mentioned `entity_name` but DB uses `entity`. Implementation correctly uses `entity` everywhere, matching BACKEND.md and `database.ts`. Documented in PHASE-1.4-PATTERNS.md (G1).
- [x] **Architecture** — Client-side parsing (PapaParse/XLSX) → Server Action (Zod validation + bulk insert) → revalidatePath. Clean separation of concerns. No non-obvious choices.

**Verdict:** PASS

---

### 6. External dependencies testable without keys

- [x] **N/A for Phase 1.4** — No external APIs introduced (no AI, no Odoo). Only dependency is Supabase (core infrastructure, required for any testing).

**Verdict:** PASS (N/A)

---

### 7. No redundant duplicates

- [x] **csv-parser.ts reused** — `TenderUpload` imports `parseCSV`/`parseExcel` from existing `src/lib/utils/csv-parser.ts`. No duplicate parser.
- [x] **Database types reused** — `TenderListClient` imports `Tender` from `src/types/database.ts`. Server action aligns fields with the same type definitions.
- [x] **Number/date formatting** — Uses standard `toLocaleString("ar-SA")` consistently. No custom formatting utils duplicated.
- [x] **StatusBadge** — Defined once in `TenderListClient.tsx` as a local component. Not duplicated.

**Verdict:** PASS

---

### 8. Phase-specific requirements

- [x] Upload CSV file with tender data — `TenderUpload` + `uploadTenders` server action
- [x] CSV parsed and preview shown before saving — Preview table (first 5 rows) with count
- [x] Tenders appear in table after upload — `revalidatePath("/tenders")` + `router.push("/tenders")`
- [x] Invalid rows show Arabic error messages — Error display with row numbers
- [x] Table sorts by column headers (click to toggle) — `useMemo` sort with `sortBy`/`sortOrder` state
- [x] Empty state with CTA — Arabic title + description + "رفع منافسات" link
- [x] Row click navigates to `/tenders/[id]` — `window.location.assign`
- [x] Numbers formatted with Arabic locale — `toLocaleString("ar-SA")`
- [x] Dates formatted with Arabic locale — `toLocaleDateString("ar-SA")`
- [x] All labels in Arabic — Confirmed across all 5 files

**Gotcha compliance (G1-G8):**
- G1: `entity` not `entity_name` — correct
- G2: `requirements` string→array transform — `tenders.ts:87-89`
- G3: Client-side parsing, no useActionState for files — correct
- G4: Reuses existing csv-parser.ts with Arabic number handling — correct
- G5: Deadline normalized to YYYY-MM-DD — `normalizeDeadline()` helper in `tenders.ts:8-24`
- G6: `user_id` set explicitly on each row — `tenders.ts:80`
- G7: `text-start` used everywhere, `border-e` in layout — correct
- G8: Empty state with title + description + CTA — `TenderListClient.tsx:67-82`

**Verdict:** PASS

---

### 9. Build and types

- [x] `pnpm build` — Compiled successfully (Next.js 16.1.6, Turbopack). All 11 pages generated. `/tenders` and `/tenders/[id]` correctly marked as dynamic (server-rendered on demand).
- [x] `tsc --noEmit` — No type errors.

**Verdict:** PASS

---

## Observations (non-blocking)

1. **`alert()` for success feedback** (`TenderUpload.tsx:86`) — Works for MVP. Phase 3.4 (Visual Polish) will add a toast system per the schedule.
2. **`window.location.assign` for row navigation** (`TenderListClient.tsx:133`) — Causes full page refresh instead of SPA navigation. Minor UX concern; can be improved with `useRouter().push()` in a future polish pass.
3. **10MB file limit is client-side only** — The server action doesn't enforce a size limit on the parsed JSON array. For MVP this is fine since the data is already parsed to JSON objects before sending.

---

## Result

**Sign-off: Phase 1.4 complete. All 9 items satisfied.**
