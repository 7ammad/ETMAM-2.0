# UI Building Workflow — Brainstorm & Cursor Adoption

**Purpose:** Define a default UI-building workflow for Cursor (all projects), incorporate **ux-researcher**, **art-director**, and **playwright-cli**, and adopt it via rules + settings.

**Date:** 2026-02-07

---

## 1. Workflow Definition (5+1 steps)

Based on the existing READ → IMPLEMENT → SELF-CHECK → HARD REVIEW → SIGN-OFF pattern, adapted for **UI building** with UX and visual design in the loop:

| Step | Who / What | Output |
|------|------------|--------|
| **1. READ** | Implementer | Read specs (PRD/FRONTEND/IMPLEMENTATION or equivalent). Confirm scope. |
| **2. UX** | **@ux-researcher** | Heuristic evaluation, user flow, accessibility, prioritized findings. |
| **3. Art direction** | **@art-director** | Visual hierarchy, component specs, tokens, states, RTL; implementation-ready specs. |
| **4. IMPLEMENT** | **@senior-frontend** (or main agent) | Build UI per art-director specs and UX recommendations. |
| **5. SELF-CHECK** | Implementer + **playwright-cli** | Phase checklist; **browser automation**: snapshot, key flows, screenshots. |
| **6. HARD REVIEW** | **@code-reviewer** | Checklist; Sign-off or Blocked. |
| **7. SIGN-OFF** | User / project-lead | Proceed. |

**Playwright-cli** is explicitly in step 5: use `playwright-cli open`, `snapshot`, `click`/`fill` for critical paths, and `screenshot` for visual regression or handoff.

---

## 2. How to Make It “Default” in Cursor

Cursor does **not** expose a “default workflow” in `settings.json`. Adoption is via **rules** and **orchestrator**:

- **Global (all projects):** Add the workflow text as a **Global Rule** in Cursor: **Settings → Cursor Settings → Rules for AI**. Paste the content of `.cursor/rules/ui-building-workflow.mdc` (rule body only) so every project gets it.
- **Per project:** Add `.cursor/rules/ui-building-workflow.mdc` to the repo so the workflow applies when working in that project. Project rules override or combine with global by Cursor’s hierarchy.
- **Settings:** `settings.json` cannot store workflow logic. A **comment** in the Cursor section can point to the workflow (see §5) for quick reference.

**Recommendation:** Use **both**: (1) Global Rule for “whenever I build UI, follow this,” and (2) project-level `.cursor/rules/ui-building-workflow.mdc` for version-controlled, team-shared workflow.

---

## 3. Agents & Skills That Add Value

### Must-have in the workflow (you specified)

| Role | Type | Use in workflow |
|------|------|------------------|
| **ux-researcher** | Subagent | Step 2: UX audit, heuristics, a11y, prioritised recommendations. |
| **art-director** | Subagent | Step 3: Visual specs, design tokens, components, RTL. |
| **playwright-cli** | Skill | Step 5: Browser automation (open, snapshot, click, fill, screenshot). |

### Strongly recommended (add value)

| Role | Type | Use in workflow |
|------|------|------------------|
| **brainstorming** | Subagent | Before step 1: explore options, validate approach, compare UI patterns. |
| **creative-director** | Subagent | Before/with art-director: experience strategy, brand alignment. |
| **senior-frontend** | Subagent | Step 4: Implement from art-director specs. |
| **code-reviewer** | Subagent | Step 6: Hard review, checklist, sign-off. |
| **verifier** | Subagent | After implementation: confirm behaviour and checks. |
| **qa-engineer** | Subagent | After review: test plan, acceptance, regression. |
| **project-lead** | Subagent | Orchestrate: choose workflow, assign next agent, next prompt. |

### Supporting skills (user-level)

| Skill | Use |
|-------|-----|
| **update-cursor-settings** | Add workflow reference comment in settings; adjust editor/formatting if needed. |
| **create-rule** | Create or update the UI-building rule (e.g. per-project variants). |
| **create-skill** | Add project-specific UI skills (e.g. “run design-system check”) if needed. |

---

## 4. Implementation Checklist for Adoption

- [ ] **Create** `.cursor/rules/ui-building-workflow.mdc` in this project (done in this session).
- [ ] **Add** “UI Building” workflow and dispatch table to `.cursor/ORCHESTRATOR-DISPATCH-GUIDE.md` (invoke order: ux-researcher → art-director → senior-frontend → playwright-cli usage → code-reviewer).
- [ ] **Optional:** Add a short comment in `%APPDATA%\Cursor\User\settings.json` in the Cursor section pointing to “Default UI workflow: see .cursor/rules/ui-building-workflow.mdc or Cursor Settings → Rules for AI.”
- [ ] **For all projects:** In Cursor, open **Settings → Cursor Settings → Rules for AI** and paste the UI-building workflow (from the rule file) so it applies globally.
- [ ] **Test:** Start a small UI task (e.g. “Add a settings card”) and confirm the agent suggests or follows: READ → @ux-researcher → @art-director → implement → playwright-cli check → @code-reviewer.

---

## 5. Settings Consultation (update-cursor-settings)

- **Location:** `%APPDATA%\Cursor\User\settings.json` (Windows).
- **What to add:** Only a **comment** in the Cursor block, e.g.  
  `// Default UI workflow: .cursor/rules/ui-building-workflow.mdc or Settings → Rules for AI`  
  so the workflow is discoverable. No new Cursor keys are needed (Cursor does not read custom workflow keys).
- **Reload:** Not required for a comment-only change.

---

## 6. Next Step

1. Add the **UI Building** dispatch table to `ORCHESTRATOR-DISPATCH-GUIDE.md` and create **ui-building-workflow.mdc** in this repo.
2. Optionally update **settings.json** with the comment above.
3. Copy the rule content into **Cursor Settings → Rules for AI** for global default.
4. Run one UI task through the workflow and adjust prompts/order if needed.
