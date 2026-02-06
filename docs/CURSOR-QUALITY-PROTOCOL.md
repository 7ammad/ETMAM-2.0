# Cursor quality protocol — skills + MCP + one-by-one

**Purpose:** Maximize implementation quality and make Hard Review handoff clear for Claude.

## 1. One-by-one implementation

- Implement **one phase (or one logical task group) at a time**.
- After each batch: **self-check**, **checklist result**, **Gotcha on the checklist** (optional), **commit**.
- **Do not run Hard Review** — user gives Cursor output + feedback to Claude for a single Hard Review pass.

So: Cursor delivers one phase → user sends that + feedback to Claude → Claude runs Hard Review. Repeat.

## 2. Use skills when relevant

Before or during implementation, **read and follow** the relevant Cursor skill when the task matches:

| Task type | Skill to use |
|-----------|----------------|
| Adding or changing Cursor rules, RULE.md, .cursor/rules | `create-rule` (read SKILL.md, follow steps) |
| Creating or editing an Agent Skill (SKILL.md) | `create-skill` |
| Browser testing, form filling, screenshots, E2E | `playwright-cli` (or MCP Playwright) |
| Changing editor/settings.json | `update-cursor-settings` |

Skills live under the configured skills path; read the SKILL.md with the Read tool and apply the instructions.

## 3. Use MCP for correctness and docs

- **Context7:** Before using a library (Next.js, Supabase, React, Zustand, etc.), call `resolve-library-id` then `query-docs` for the exact API or pattern (e.g. Server Actions, `createServerClient`, `useTransition`).
- **Ref:** Use `ref_search_documentation` for framework/library docs when Context7 isn’t enough.
- **Tavily:** Use for current info (versions, deprecations, security) when needed.

Use MCP **before** writing code for a new area so patterns and types are correct.

## 4. After each phase batch

- Run phase checklist; write `docs/PHASE-X.Y-CHECKLIST-RESULT.md`.
- Optionally run **Gotcha** on the checklist and save to `docs/reviews/PHASE-X.Y-CHECKLIST-GOTCHA.md`.
- Commit. Reply: "Phase X.Y complete. Ready for Hard Review."
- User forwards changes + checklist (+ Gotcha) to Claude for Hard Review.

---

**Summary:** One phase at a time → skills + MCP for quality → checklist + optional Gotcha → commit → user hands off to Claude for Hard Review.
