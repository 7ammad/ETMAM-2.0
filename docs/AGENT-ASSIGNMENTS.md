# Etmam 2.0 — Agent Assignments

**Source:** IMPLEMENTATION.md Cursor Agent Assignments table.  
**Rule:** Every phase has a **Primary Agent** (implements), **Backup** (if primary unavailable), and **Reviewer** (runs hard review before sign-off).

---

## Phase → Agent matrix

| Phase | Primary Agent | Backup | Hard Reviewer |
|-------|---------------|--------|----------------|
| **1.1** Project scaffolding | project-lead | senior-full-stack | code-reviewer |
| **1.2** Database schema | senior-backend | senior-full-stack | code-reviewer |
| **1.3** Auth flow | senior-full-stack | senior-backend | code-reviewer |
| **1.4** Tender upload & list | senior-full-stack | senior-backend | code-reviewer |
| **2.1** AI provider setup | senior-backend | prompt-engineer | code-reviewer |
| **2.2** Analysis Server Action & UI | senior-full-stack | senior-backend | code-reviewer |
| **2.3** CRM pipeline board | senior-frontend | senior-full-stack | code-reviewer |
| **3.1** Bug fixes (Day 2 demo) | senior-full-stack | — | qa-engineer |
| **3.2** Dashboard page | senior-frontend | senior-full-stack | code-reviewer |
| **3.3** Settings page | senior-full-stack | senior-frontend | code-reviewer |
| **3.4** Visual polish | art-director | senior-frontend | code-reviewer |
| **3.5** Documentation | tech-writer | project-lead | project-lead |
| **3.6** Demo prep | YOU (Hammad) | — | — |

---

## Role definitions (for prompts)

| Agent | Use when |
|-------|----------|
| **project-lead** | Scaffolding, process, checklists, gap audits, doc alignment. |
| **senior-backend** | DB schema, RLS, API routes, AI provider code, parsers, server actions. |
| **senior-full-stack** | Auth, forms, upload flow, API + UI wiring, settings. |
| **senior-frontend** | Components, layout, dashboard widgets, pipeline board, UI only. |
| **prompt-engineer** | AI prompts, extraction schema, analysis prompt tuning. |
| **art-director** | Visual polish, design tokens, consistency, no “AI slob” look. |
| **tech-writer** | README, setup guide, API reference, inline docs. |
| **code-reviewer** | Runs Hard Review Checklist; does not implement. |
| **qa-engineer** | End-to-end test, demo flow, regression. |
| **gotcha** | Backup reviewer; catches edge cases. |

---

## How to assign work

1. **Pick the phase** from IMPLEMENTATION.md.
2. **Assign to Primary Agent** (e.g. “You are senior-backend. Read BACKEND.md and IMPLEMENTATION.md Phase 1.2…”).
3. **Require** the phase checklist (PHASE-COMPLETION-PROTOCOL.md) and **Hard Review** (docs/HARD-REVIEW-CHECKLIST.md) before marking the phase done.
4. **Reviewer** runs the Hard Review Checklist and either signs off or returns a list of fixes. No sign-off → phase is not complete.
