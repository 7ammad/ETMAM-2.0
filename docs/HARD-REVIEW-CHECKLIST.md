# Hard Review Checklist

**Purpose:** Catch the kinds of mistakes we had in Phase 1.1 so we don’t repeat them.  
**Who runs it:** code-reviewer (or qa-engineer for bug-fix phases). Not the implementer.  
**When:** After the implementer has completed the phase checklist and acceptance test, and **before** the phase is signed off.

---

## Rule

**No phase is complete until this checklist is run and every item is satisfied.** If any item fails, the reviewer returns a **Blocked** list; the implementer fixes and re-submits for review.

---

## 1. No bare stubs

- [ ] **Pages** in this phase are not “just `<h1>`” — they have at least the structure described in APP-FLOW/FRONTEND (e.g. layout shell, placeholders for content), or a clear loading/empty state.
- [ ] **Route segments** that can load slowly or error have `loading.tsx` and/or `error.tsx` where appropriate (e.g. new routes or segments touched in this phase).

---

## 2. Layouts are real shells

- [ ] Any **layout** added or modified in this phase includes the structure specified in FRONTEND/APP-FLOW (e.g. dashboard layout has sidebar + header + main, not an empty fragment).

---

## 3. i18n / locale

- [ ] **Numbers and compact numbers** (e.g. K/M) respect locale: Arabic locale uses Arabic suffixes (ألف, م) or the decision is documented; no silent English-only for user-facing copy when the app is Arabic-first.
- [ ] **Validation and error messages** that the user sees are in Arabic (or follow the language rule in PRD).

---

## 4. Error and not-found

- [ ] **App-level** `error.tsx` and `not-found.tsx` exist and are wired (no missing global error boundary or 404).
- [ ] **New routes** in this phase have appropriate error/loading handling if they do async work or can fail.

---

## 5. Doc and architecture clarity

- [ ] If **two context docs conflict** (e.g. FRONTEND vs TECH-STACK), the choice made is **documented** (e.g. in SCAFFOLDING-DECISIONS.md or a short DECISIONS note) and not silently picked.
- [ ] **Non-obvious architecture** (e.g. “we use proxy.ts not middleware”) is documented where a future contributor would look (e.g. ARCHITECTURE.md, README).

---

## 6. External dependencies testable without keys

- [ ] **External APIs** (e.g. AI, Odoo) that require keys have a **mock/stub or fallback** so local dev and tests can run without real keys (e.g. MOCK_AI or env check with stub provider).

---

## 7. No redundant duplicates

- [ ] **Formatting / RTL / design tokens:** No duplicate implementations of the same concern (e.g. one place for number/date formatting, one for RTL direction, design tokens in one source of truth with a short comment if both CSS and JS need them).
- [ ] **Unnecessary duplication** introduced in this phase is removed or justified in a comment.

---

## 8. Phase-specific requirements

- [ ] **This phase’s** IMPLEMENTATION.md tasks are all done (no skipped bullets).
- [ ] **This phase’s** acceptance test from IMPLEMENTATION.md has been run and all points pass.
- [ ] **BACKEND/FRONTEND/PRD** requirements that apply to this phase are met (e.g. required CRM fields, required UI elements).

---

## 9. Build and types

- [ ] `pnpm build` succeeds.
- [ ] `tsc --noEmit` (or equivalent) passes — no type errors.

---

## Reviewer output

After running the checklist, the reviewer must output one of:

- **“Sign-off: Phase X.Y complete. All items satisfied.”**  
  → Phase can be marked done.

- **“Blocked: [list item numbers and short description]. Fix and re-submit for review.”**  
  → Implementer fixes the list; then re-run this checklist until Sign-off.

---

## Why these items

| Item | Phase 1.1 mistake it prevents |
|------|------------------------------|
| No bare stubs | Pages were just `<h1>` with no structure. |
| Layouts real shells | Dashboard layout was an empty fragment. |
| i18n / locale | formatCompactNumber used English M/K only. |
| Error and not-found | No global error or not-found. |
| Doc/architecture clarity | Doc conflicts picked silently; proxy vs middleware unclear. |
| Mock without keys | AI providers untestable without API keys. |
| No redundant duplicates | rtl.ts and format.ts duplicated; design-tokens and globals duplicated. |
| Phase + build | Ensures checklist and acceptance test and build are all satisfied. |
