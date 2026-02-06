# Etmam 2.0 — Cursor / AI Setup

## Phase implementation (don’t skip steps)

- **Workflow:** `docs/WORKFLOW.md` — Read → Implement → Self-check → **Hard Review** → Sign-off. Mandatory for every phase.
- **Agents:** `docs/AGENT-ASSIGNMENTS.md` — Who implements (Primary/Backup) and who reviews (code-reviewer).
- **Rule:** `.cursor/rules/phase-implementation.mdc` — read spec docs first, implement every task, run phase checklist, then **hard review** before done.
- **Checklists:** `docs/PHASE-COMPLETION-PROTOCOL.md` — phase completion checklists; fix any ❌ before requesting review.
- **Hard review:** `docs/HARD-REVIEW-CHECKLIST.md` — Reviewer runs this; Sign-off or Blocked. No phase complete without sign-off.
- **Gap audits:** After each phase, compare repo to IMPLEMENTATION + FRONTEND/BACKEND; see `docs/PHASE-1.1-GAP-AUDIT.md` as example.

## Context documents

Product and technical decisions are in **8 context documents**.  
**Read them before implementing any phase.**

- **Primary location (this machine):** `C:\Users\7amma\.cursor\context\`
- **In-repo (if present):** `docs/context/` — copy of the same 8 files for reviewers and portability

Files: `IDEA.md`, `PRD.md`, `APP-FLOW.md`, `TECH-STACK.md`, `BACKEND.md`, `FRONTEND.md`, `IMPLEMENTATION.md`, `TENDER-STRUCTURE.md`.

## Workflows and agents

- **Workflows** = follow IMPLEMENTATION.md phases and the Day N checkpoints.
- **Agents** = use the “Cursor Agent Assignments” table in IMPLEMENTATION.md as the **role** in your prompt (e.g. “Act as senior-backend, implement Phase 1.2”).

Full instructions: **`docs/PROJECT-LEAD-GUIDE.md`**.

## Suggested prompt for any phase

**Implementer:**
```
Read all 8 context docs in [path]. Execute IMPLEMENTATION.md Phase X.Y exactly.
Run the phase checklist (docs/PHASE-COMPLETION-PROTOCOL.md) and acceptance test; fix any ❌.
Then request Hard Review: assign code-reviewer to run docs/HARD-REVIEW-CHECKLIST.md (Sign-off or Blocked).
```

**Reviewer (code-reviewer):**
```
Run docs/HARD-REVIEW-CHECKLIST.md on Phase X.Y. Output "Sign-off: Phase X.Y complete" or "Blocked: [list]. Fix and re-submit."
```

Replace `[path]` and `Phase X.Y` as needed.
