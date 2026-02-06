# Etmam 2.0 — Required Workflow

**Every phase** must follow this workflow. No exceptions. This is how we avoid repeating the scaffolding mistakes (bare stubs, empty layouts, missed files, no review).

---

## The workflow (5 steps)

```
1. READ        → 2. IMPLEMENT  → 3. SELF-CHECK  → 4. HARD REVIEW  → 5. SIGN-OFF
   (specs)         (phase tasks)    (phase checklist)   (reviewer)        (then next phase)
```

---

## Step 1 — READ (before any code)

**Who:** The agent (or human) doing the phase.

**Do:**
- Read the **phase section** in IMPLEMENTATION.md (full task list and acceptance test).
- Read the **referenced docs** (BACKEND for schema, FRONTEND for UI/structure, TECH-STACK for stack, PRD for acceptance criteria).
- If FRONTEND and TECH-STACK (or any two docs) **conflict**, note it and either decide or escalate to project-lead / you — do not silently pick one side.

**Output:** Short confirmation: “Read Phase X.Y and [list docs]. Proceeding to implement.”

---

## Step 2 — IMPLEMENT

**Who:** Primary Agent (see AGENT-ASSIGNMENTS.md).

**Do:**
- Implement **every** task in the phase. Use the phase’s task list as a checklist; do not skip items.
- Create **all** files and folders specified (no “we’ll add it later”).
- Follow TECH-STACK and BACKEND/FRONTEND exactly (no substitutions unless documented).

**Output:** Code + brief summary of what was added/changed.

---

## Step 3 — SELF-CHECK (phase checklist)

**Who:** Same agent (before claiming done).

**Do:**
- Open **docs/PHASE-COMPLETION-PROTOCOL.md** and run the **checklist for this phase**.
- Output the checklist with ✅ or ❌ for each line.
- **Fix every ❌** before moving to Step 4.
- Run the **Acceptance Test** from IMPLEMENTATION.md for this phase and confirm each point.

**Output:** Checklist with all ✅ and “Acceptance test: [list] — all pass.”

---

## Step 4 — HARD REVIEW (mandatory)

**Who:** **code-reviewer** (or qa-engineer for bug-fix phases). Not the implementer.

**Do:**
- Run **docs/HARD-REVIEW-CHECKLIST.md** against the changed files and the phase scope.
- Check for the **failure modes** we saw in Phase 1.1 (bare stubs, empty layouts, missing loading/error, doc conflicts not flagged, redundancy, missing mocks, proxy vs middleware unclear).
- Produce: either **“Sign-off: phase complete”** or **“Blocked: [list of issues]. Fix and re-submit for review.”**

**Rule:** If the reviewer says Blocked, the phase is **not** complete. Fix the list and re-run Hard Review.

---

## Step 5 — SIGN-OFF

**Who:** You (Hammad) or project-lead.

**Do:**
- Confirm Hard Review passed (or run a quick manual test if you prefer).
- Mark the phase complete and move to the next phase (or to bug fixes).

---

## Summary table

| Step | Who | What |
|------|-----|------|
| 1. Read | Implementer | Read phase + referenced docs; flag doc conflicts. |
| 2. Implement | Primary Agent | All tasks; all files; no silent skips. |
| 3. Self-check | Implementer | Phase checklist ✅ + Acceptance test pass. |
| 4. Hard review | code-reviewer | HARD-REVIEW-CHECKLIST; Sign-off or Blocked. |
| 5. Sign-off | You / project-lead | Confirm and proceed. |

---

## Where to find things

- **Phase tasks & acceptance tests:** IMPLEMENTATION.md  
- **Phase completion checklists:** docs/PHASE-COMPLETION-PROTOCOL.md  
- **Hard review checklist:** docs/HARD-REVIEW-CHECKLIST.md  
- **Who does what:** docs/AGENT-ASSIGNMENTS.md  
