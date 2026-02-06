# Etmam 2.0 — Project Lead Guide

**Purpose:** How to use context documents, workflows, and agent assignments so any reviewer (Claude Code CLI, Cursor, or human) can continue the build correctly.

**Competition:** EnfraTech | Deadline Sunday Feb 8, 2026 | 3-day build.

---

## 1. Context Documents (Read First, Code Second)

All product and technical decisions live in **eight context documents**. Every implementation step must align with them.

### Where they live

| Location | Use case |
|----------|----------|
| **`C:\Users\7amma\.cursor\context\`** | Your main Cursor/IDE context (already set up). |
| **`docs/context/`** (this repo) | Optional copy so the repo is self-contained for Claude Code CLI, other machines, or handover. |

### The 8 documents

| Document | Use it for |
|----------|------------|
| **IDEA.md** | Problem, solution, competition, value prop. Use for README and demo narrative. |
| **PRD.md** | Features, personas, acceptance criteria, P0/P1/P2. Use for “done” checks. |
| **APP-FLOW.md** | Pages, user journeys, wireframes. Use for routing and UI structure. |
| **TECH-STACK.md** | Next.js 16, Gemini, Supabase, Zustand, design tokens. No substitutions. |
| **BACKEND.md** | 8 tables, RLS, API endpoints, TypeScript types. Use for schema and API contracts. |
| **FRONTEND.md** | Component tree, design tokens (navy/gold), Zustand stores. Use for folder and UI. |
| **IMPLEMENTATION.md** | Day 1/2/3 plan, phases, acceptance tests, agent table. Use as the build checklist. |
| **TENDER-STRUCTURE-v3.0-VERIFIED.md** | Saudi tender 12-section structure (verified). Use for AI extraction prompts. |

### What to do

1. **Before any phase:** Tell the agent/CLI to “read all 8 context docs in [path], then execute Phase X.Y per IMPLEMENTATION.md.”
2. **For reviewers (e.g. Claude Code CLI):** Point them at this guide and at `docs/context/` if you’ve copied the docs into the repo (see below).
3. **Keep one source of truth:** Prefer updating the files in `C:\Users\7amma\.cursor\context\` and, if you use in-repo copies, sync them when the plan or specs change.

### Tech stack rules (no exceptions)

- **Next.js 16+:** Use **proxy.ts** only for route protection; do not create **middleware.ts** (middleware is deprecated and renamed to Proxy in v16). See [docs/ARCHITECTURE.md](ARCHITECTURE.md) and [docs/GOTCHA-TECH-STACK-VERIFICATION.md](GOTCHA-TECH-STACK-VERIFICATION.md).
- **Supabase:** Use **@supabase/ssr** (createServerClient / createBrowserClient) only; do not use **@supabase/auth-helpers-nextjs** or createMiddlewareClient.

---

## 2. Workflows (How to Run the Build)

“Workflows” here = **repeating process**, not a separate tool. Map them to IMPLEMENTATION.md phases.

### Workflow A: Start a phase

1. Open **IMPLEMENTATION.md** and find the phase (e.g. Phase 1.2 — Database Schema).
2. Ensure the **Acceptance Test** at the end of that phase is the definition of done.
3. Assign the phase to an agent (or yourself) using the **docs/AGENT-ASSIGNMENTS.md** (Primary Agent, Backup, Reviewer). Then: implementer runs phase checklist + acceptance test; **code-reviewer** runs **docs/HARD-REVIEW-CHECKLIST.md** and signs off before phase is complete. See **docs/WORKFLOW.md**.
4. Prompt: *“Read docs in [context path]. Execute IMPLEMENTATION.md Phase X.Y exactly. Confirm acceptance criteria when done.”*

### Workflow B: End of day

1. Run the **Day N Checkpoint** from IMPLEMENTATION.md (e.g. “Can you register, login, upload a CSV, see tenders?”).
2. If something fails, add it as the first task for the next day.
3. Commit, push, and note the next phase to run (e.g. “Tomorrow: Phase 1.3 Auth”).

### Workflow C: Review / QA

1. **Code reviewer:** Use IMPLEMENTATION.md acceptance tests + PRD acceptance criteria.
2. **Final QA:** Use the “Day 3 — End of Day Checkpoint” and the demo script in PRD.

You don’t need separate “workflow agents”; use these three workflows and the phase list in IMPLEMENTATION.md.

---

## 3. Agents (Who Does What)

The **Cursor Agent Assignments** table in IMPLEMENTATION.md maps **tasks to roles**, not to literal Cursor agents. Use it like this:

### In Cursor

- **If you have named agents (e.g. project-lead, senior-full-stack):** Assign the phase to the role in the table; that agent gets the phase prompt + context.
- **If you don’t:** Use the role name in your prompt, e.g. *“Act as senior-backend. Read BACKEND.md and IMPLEMENTATION.md Phase 1.2. Implement the database schema and RLS.”*

### In Claude Code CLI

- There are no separate “agents.” Use the **Primary Agent** column as the **role in your instruction**, e.g. *“You are the senior-backend. Read all context docs, then implement Phase 1.2 (Database Schema) from IMPLEMENTATION.md.”*

### Reference table (from IMPLEMENTATION.md)

| Task | Primary Agent | Backup |
|------|---------------|--------|
| Project scaffolding | project-lead | senior-full-stack |
| Database schema | senior-backend | senior-full-stack |
| Auth flow | senior-full-stack | senior-backend |
| CSV parser | senior-backend | senior-full-stack |
| AI providers | senior-backend | prompt-engineer |
| Analysis prompt | prompt-engineer | senior-backend |
| Tender components | senior-frontend | senior-full-stack |
| Pipeline board | senior-frontend | senior-full-stack |
| Dashboard widgets | senior-frontend | senior-full-stack |
| Settings page | senior-full-stack | senior-frontend |
| Design polish | art-director | senior-frontend |
| Documentation | tech-writer | project-lead |
| Code review | code-reviewer | gotcha |
| Final QA | qa-engineer | gotcha |

---

## 4. Making sure agents don’t miss steps (solid implementation)

**Problem:** Scaffolding and other phases can miss files, skip tasks, or ship incomplete code if there’s no enforced checklist.

**Solution:**

1. **Phase Completion Protocol** — `docs/PHASE-COMPLETION-PROTOCOL.md`
   - Every phase has a **checklist** (Phase 1.1 is fully listed; add one per phase as we go).
   - Rule: **No phase is complete until the checklist is run and every item is ✅.**
   - When assigning a phase to an agent, include: “Before you say done, run the Phase X.Y checklist in docs/PHASE-COMPLETION-PROTOCOL.md; output ✅/❌ for each line; fix any ❌.”

2. **Cursor rule** — `.cursor/rules/phase-implementation.mdc`
   - Tells Cursor (and any agent reading .cursor rules) to: read spec docs first, implement every task, run the phase checklist before marking done, and follow file/structure compliance.
   - So agents are instructed to not skip steps or leave out files.

3. **Gap audits after each phase**
   - After a phase (or after a review like Claude Code CLI), the project-lead runs a short **gap audit**: compare IMPLEMENTATION + FRONTEND/BACKEND/TECH-STACK to the repo; list missing/wrong/incomplete.
   - Example: `docs/PHASE-1.1-GAP-AUDIT.md` — lists what was missed in scaffolding and the fixes (e.g. setup-guide, components/shared, font choice). Use the same pattern for Phase 1.2, 1.3, etc.

4. **Single prompt pattern for any phase**
   - “Read [list of docs]. Implement IMPLEMENTATION.md Phase X.Y exactly. Use the Phase Completion Checklist in docs/PHASE-COMPLETION-PROTOCOL.md; output ✅/❌; fix any ❌. Run the Acceptance Test and confirm.”

---

## 5. What to Do Right Now (After Phase 1.1 Review)

1. **Let Claude Code CLI finish reviewing Phase 1.1**  
   - It will check scaffolding, proxy, Supabase clients, folder structure, Tailwind, .env.example.

2. **Fix any issues it reports**  
   - Then re-run the Phase 1.1 acceptance test (e.g. `pnpm dev`, visit `/login`, `/dashboard` redirect).

3. **Copy context into the repo (optional but recommended)**  
   - Copy the 8 files from `C:\Users\7amma\.cursor\context\` into `docs/context/` in this repo.  
   - Then any reviewer or future dev has the same context without your local path.

4. **Start Phase 1.2 (Database Schema)**  
   - Prompt: *“Read all docs in docs/context/ (or C:\Users\7amma\.cursor\context\). Execute IMPLEMENTATION.md Phase 1.2 — Database Schema. Use BACKEND.md for tables and RLS.”*  
   - Assign to **senior-backend** (or equivalent) per the table.

5. **Keep using this guide**  
   - For each new phase: context → IMPLEMENTATION.md phase → agent role → Phase Completion Checklist → acceptance test.

---

## 5. Checklist for “We Just Kicked Off the Build”

- [ ] All 8 context docs are available (global path and/or `docs/context/`).
- [ ] Phase 1.1 is done and under review (e.g. Claude Code CLI).
- [ ] You know the next step: Phase 1.2 (Database Schema).
- [ ] You know how to prompt the next phase (context + IMPLEMENTATION.md + agent role + Phase Completion Checklist).
- [ ] End-of-day workflow is clear: run Day N checkpoint, log bugs, commit, set next phase.

---

## 7. Quick Reference: Phase → Document

| Phase | Main docs |
|-------|-----------|
| 1.1 Scaffolding | TECH-STACK, FRONTEND, IMPLEMENTATION |
| 1.2 Database | BACKEND, IMPLEMENTATION |
| 1.3 Auth | BACKEND, PRD, APP-FLOW, IMPLEMENTATION |
| 1.4 Tender upload/list | PRD, BACKEND, FRONTEND, IMPLEMENTATION |
| 2.x AI & pipeline | TECH-STACK, BACKEND, TENDER-STRUCTURE-v3.0-VERIFIED, IMPLEMENTATION |
| 3.x Polish & demo | PRD, FRONTEND, IMPLEMENTATION |

Use this guide as the single entry point for workflows, agents, and context.
