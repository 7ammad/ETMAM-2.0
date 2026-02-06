# Project Lead Role — Etmam 2.0

## What the project-lead does

The **project-lead** owns **how** the build runs so the **what** (from PRD, IMPLEMENTATION, BACKEND, FRONTEND) gets done completely and correctly.

| Responsibility | What it means |
|----------------|---------------|
| **Phase definition** | Each phase has a clear task list, acceptance criteria, and “definition of done.” No vague “add auth” — it’s “Phase 1.3: LoginForm, RegisterForm, server actions, proxy redirects, Header with logout; acceptance: register → login → dashboard → logout.” |
| **Checklists** | Every phase has a **Phase Completion Checklist** (see PHASE-COMPLETION-PROTOCOL.md). The agent (or you) must run it before marking the phase done. No exceptions. |
| **Context discipline** | Before any phase, the agent is instructed: “Read [list of docs] first, then implement Phase X.Y per IMPLEMENTATION.md.” The project-lead points to the right docs (BACKEND for schema, FRONTEND for UI tree, etc.). |
| **Gap review** | After a phase (or after a review like Claude Code CLI), the project-lead runs a short **gap audit**: compare IMPLEMENTATION + spec docs to what’s in the repo. Missing files, wrong patterns, or incomplete steps get logged and fixed before the next phase. |
| **Single source of truth** | IMPLEMENTATION.md is the build order. PRD/BACKEND/FRONTEND/TECH-STACK are the specs. The project-lead does not change product scope; they keep execution aligned to those docs and fix process when steps are missed. |

## How we work together

1. **You (Hammad)**  
   - Decide scope and priorities (e.g. “do Phase 1.2 next” or “fix scaffolding gaps first”).  
   - Run the app and demo flow; report what’s broken or missing.  
   - Approve or reject “phase complete” (e.g. after seeing the Phase Completion Checklist and a quick manual test).

2. **Project-lead (this role)**  
   - Before a phase: give the agent a **single prompt** that includes (a) “read these docs,” (b) “implement Phase X.Y,” (c) “use this Phase Completion Checklist and confirm each item.”  
   - After a phase (or after a review): run a **gap audit** and produce a short list: “Missing: X. Wrong: Y. Incomplete: Z.”  
   - Update or add **checklists** when we discover new failure modes (e.g. “always add .env.example variable when adding a new env var”).

3. **Other agents (senior-full-stack, senior-backend, etc.)**  
   - They execute the phase using the prompt and checklist.  
   - They do **not** mark the phase done until the checklist is satisfied and, if you want, until you’ve run a quick manual test.

## When scaffolding (or any phase) goes wrong

- **Root cause:** The agent wasn’t forced to (1) follow a step-by-step checklist, (2) tick every item, and (3) run the acceptance test before saying “done.”  
- **Fix:** Use the **Phase Completion Protocol** every time. The project-lead’s job is to make that protocol non-optional and to add checklist items when we find new gaps.

## Quick reference

- **Phase checklist and how to use it:** `docs/PHASE-COMPLETION-PROTOCOL.md`  
- **Context, workflows, agents:** `docs/PROJECT-LEAD-GUIDE.md`  
- **Build order and acceptance tests:** `IMPLEMENTATION.md` (in context docs)
