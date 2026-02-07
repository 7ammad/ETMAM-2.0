# Orchestrator Dispatch Guide — Etmam 2.0

**Purpose:** Let the **project lead** (or you as orchestrator) coordinate and **invoke** the right agents in the right order for each workflow. Use this when you need to dispatch agents from `.cursor/agents/` by name and prompt.

**Source:** Workflows and team table are defined in `.cursor/agents/project-lead.md`. This guide adds **how to invoke** each agent and **concrete prompts** per step.

---

## 1. How to Invoke Agents in Cursor

- **By name:** In Cursor chat, use **@agent-name** (e.g. `@project-lead`, `@brainstorming`, `@code-reviewer`). The name must match the `name:` in the agent's frontmatter (see §2).
- **By role:** You can say "Act as the project lead" or "You are the code-reviewer" and paste the prompt; the model will follow that agent's instructions if the agent file is in context or the rules reference it.
- **Orchestrator loop:** Invoke **@project-lead** first with the high-level task; project-lead outputs **Next: invoke @&lt;agent&gt; with: [prompt]**.
- **Then:** Start a new turn (or new chat) and invoke the suggested agent with the suggested prompt. After that agent responds, you can return to **@project-lead** with the output and ask for the next step.

**Agent files live in:** `.cursor/agents/` (e.g. `project-lead.md`, `brainstorming.md`).

---

## 2. Agent Roster (Invocation Names)

Use these **exact names** when invoking (e.g. `@name` in chat):

| Invocation name | Role | Use when |
|-----------------|------|----------|
| **project-lead** | Orchestrator | Coordinate work, choose workflow, assign next agent |
| **brainstorming** | Ideation & validation | Explore ideas, validate concept, compare options, review plan |
| **product-manager** | Requirements & specs | PRDs, user stories, scoping, acceptance criteria |
| **creative-director** | Brand & experience | Brand direction, UX strategy, design principles |
| **system-architect** | Architecture & infra | Tech stack, scaling, system design, ADRs |
| **art-director** | Visual design | UI specs, design tokens, component design, RTL |
| **senior-frontend** | Frontend engineering | React/Next.js components, state, performance |
| **senior-backend** | Backend engineering | DB, Supabase, RLS, APIs, Edge Functions |
| **senior-full-stack** | End-to-end implementation | Data flow, API contracts, implementation plan |
| **code-reviewer** | Code quality | PR reviews, best practices, security in code |
| **security-auditor** | Security | Vulnerability assessment, auth/RLS audit, compliance |
| **qa-engineer** | Testing | Test plans, test code, quality gates |
| **devops-engineer** | CI/CD & infra | Deployment, monitoring, environments |
| **tech-writer** | Documentation | READMEs, API docs, ADRs, changelogs |
| **gotcha** | Report accuracy | Verify any report against codebase (after any agent) |
| **ux-researcher** | Usability | UX audits, heuristic evaluation, accessibility |
| **explorer** | Codebase research | How something works, find usages, multi-file flows |
| **pre-build-docs** | Planning docs only | PRDs, implementation plans, specs → save to docs/ |
| **verifier** | Validate completed work | Confirm implementations are functional |
| **debugger** | Debug errors | Root cause, test failures |
| **test-runner** | Run tests | Run suites, diagnose failures, fix to pass |
| **subagent-advisor** | Subagent design | Recommend which subagents to create/use |
| **image-generator** | Images | Mockups, icons, diagrams, illustrations |
| **scraper-validator** | Scraper output | Validate extraction quality, pipeline health |

---

## 3. Workflow Dispatch Tables

For each workflow, **dispatch in this order**. Each row = one invocation: use **@&lt;agent&gt;** with the **Prompt** (adapt [brackets] to your context).

### 3.1 New Feature (Idea → Production)

| Step | Invoke | Prompt |
|------|--------|--------|
| 1 | **@brainstorming** | "We want to build [feature in one sentence]. Help me explore and validate the idea: feasibility, risks, and what must be true for it to work. Give a verdict (Go / No-go / Conditional) and recommended next step." |
| 2 | **@product-manager** | "Feature: [name]. Based on the validated idea, produce a short PRD with user stories and acceptance criteria. Scope to MVP only." |
| 3 | **@creative-director** | "Feature: [name]. Set experience direction and design principles for this feature. Align with our product narrative." |
| 4 | **@system-architect** | "Feature: [name]. Technical design and architecture: stack fit, boundaries, data flow, risks. Output ADR if the decision is significant." |
| 5 | **@art-director** | "Feature: [name]. Visual specs and component design for the main screens. Include RTL/Arabic and design tokens (navy/gold)." |
| 6 | **@senior-full-stack** | "Feature: [name]. Implementation plan in order: DB → API → UI. Reference PRD and BACKEND/FRONTEND. Break into phases with acceptance criteria." |
| 7 | **@senior-backend** | "Implement Phase [N]: schema, RLS, Server Actions/API for [feature]. Follow BACKEND.md and the implementation plan." |
| 8 | **@senior-frontend** | "Implement Phase [N]: components and pages for [feature]. Follow FRONTEND.md and the implementation plan." |
| 9 | **@code-reviewer** | "Review the implementation for [feature]: security, performance, type safety, RTL. Output verdict and a checklist." |
| 10 | **@gotcha** | "Verify the implementation report / summary for [feature] against the codebase. Check every path, symbol, and behavioral claim. Output Gotcha Verification Report." |
| 11 | **@qa-engineer** | "Test plan and test execution for [feature]. Confirm acceptance criteria and critical paths." |
| 12 | **@security-auditor** | "(If auth/data) Security review for [feature]: auth, RLS, input validation, no secrets in client." |
| 13 | **@devops-engineer** | "Deploy [feature] to [env]. Ensure pipeline and monitoring are in place." |
| 14 | **@tech-writer** | "Document [feature]: README section, API docs, and any ADR or runbook changes." |

### 3.2 Bug Fix

| Step | Invoke | Prompt |
|------|--------|--------|
| 1 | **@qa-engineer** | "Reproduce and document this bug: [description]. Steps to reproduce, expected vs actual, environment." |
| 2 | **@senior-full-stack** | "Bug: [summary]. Identify root cause and fix approach. Suggest which layer (frontend/backend) and minimal change." |
| 3 | **@senior-frontend** or **@senior-backend** | "Implement the fix for [bug] as agreed: [brief approach]. One minimal change." |
| 4 | **@code-reviewer** | "Review the bug fix in [files]. Security and regression risk." |
| 5 | **@qa-engineer** | "Verify the fix: regression test and confirm bug is resolved." |
| 6 | **@devops-engineer** | "Deploy the fix to [env]." |

### 3.3 Architecture Review

| Step | Invoke | Prompt |
|------|--------|--------|
| 1 | **@system-architect** | "Review current architecture for [scope]. Evaluate fit, scalability, risks. Output recommendation and ADRs if needed." |
| 2 | **@security-auditor** | "Security assessment of [scope]: auth, RLS, data handling, compliance." |
| 3 | **@senior-backend** | "Database and API review for [scope]. Align with BACKEND.md." |
| 4 | **@senior-frontend** | "Frontend architecture review for [scope]. Components, state, performance." |
| 5 | **@gotcha** | "Verify the architecture review report against the codebase. Check all paths and claims." |
| 6 | **@tech-writer** | "Turn the architecture decisions into ADRs and save under docs/." |

### 3.4 UX Improvement

| Step | Invoke | Prompt |
|------|--------|--------|
| 1 | **@ux-researcher** | "Heuristic evaluation and UX findings for [flow/screen]. Prioritize issues." |
| 2 | **@creative-director** | "Experience strategy based on these UX findings: [summary]. Direction for improvement." |
| 3 | **@art-director** | "Visual solution specs for the UX improvements. Component-level and RTL." |
| 4 | **@senior-frontend** | "Implement the UX improvements per the specs." |
| 5 | **@qa-engineer** | "Usability verification: confirm improvements and no regressions." |

### 3.5 Pre-Launch Checklist (Parallel or Sequential)

Invoke each agent with the prompt below; **gotcha** after any report-producing agent.

| Invoke | Prompt |
|--------|--------|
| **@product-manager** | "Confirm requirements for launch are complete and signed off. List any open scope items." |
| **@system-architect** | "Architecture review for launch: any blockers or risks?" |
| **@security-auditor** | "Pre-launch security audit. Blockers only." |
| **@code-reviewer** | "Final code review for launch. All critical paths and recent changes." |
| **@qa-engineer** | "Test plan executed and quality gates met. Summary and any open bugs." |
| **@devops-engineer** | "Deployment pipeline and monitoring ready for launch. Runbook and rollback." |
| **@tech-writer** | "Documentation complete for launch: README, env, runbook." |
| **@gotcha** | "Verify all recent reports (architecture, security, QA summary) against the codebase." |

### 3.6 Implementation Phase (Etmam — from IMPLEMENTATION.md)

For a **single phase** (e.g. Phase 2.3 Export & Odoo):

| Step | Invoke | Prompt |
|------|--------|--------|
| 1 | **@project-lead** | "We are executing IMPLEMENTATION.md Phase [X.Y]. Assign the phase and output: who implements, what the acceptance criteria are, and the exact prompt for the implementer." |
| 2 | **@senior-full-stack** or **@senior-backend** / **@senior-frontend** | "Execute IMPLEMENTATION.md Phase [X.Y]. [Copy the acceptance test from IMPLEMENTATION.md.] Confirm when acceptance criteria are met." |
| 3 | **@code-reviewer** | "Review Phase [X.Y] implementation. Run HARD-REVIEW-CHECKLIST. Output Sign-off or Blocked with list." |
| 4 | **@gotcha** | "Verify the Phase [X.Y] implementation report or summary against the codebase." |

---

## 4. Single Entry Point (Orchestrator Prompt)

To let **project-lead** drive the workflow, invoke it once with:

```
You are the project lead. Our goal: [e.g. "Build the Export tab and Excel/Odoo per PRD 6A+6B"].

1. Choose the workflow that fits (New Feature, Bug Fix, Architecture Review, Implementation Phase, etc.).
2. Output the workflow name and the exact sequence of agents to invoke.
3. For the NEXT step only, output:
   - Invoke: @<agent-name>
   - Prompt: [concrete prompt the user should paste when invoking that agent]
4. After the user runs that step and pastes the result, they will return to you; then output the next invoke + prompt, until the workflow is done.
```

Then, for each step, **invoke the suggested @agent** with the suggested prompt; when done, return to **@project-lead** with the output and ask for the next step.

---

## 5. Quality Gates (When to Invoke Whom)

- **After any report (audit, implementation summary, architecture doc):** Invoke **@gotcha** to verify claims against the codebase.
- **After any implementation:** Invoke **@code-reviewer** before merge; **@qa-engineer** for test plan and execution.
- **Before launch:** Run the **Pre-Launch Checklist** (§3.5) and **gotcha** on all reports.

---

## 6. Cross-Reference

- **Workflow definitions and team table:** `.cursor/agents/project-lead.md`
- **Phase list and acceptance tests:** `docs/context/IMPLEMENTATION.md`
- **Ironclad implementation plan:** `docs/reports/IRONCLAD-IMPLEMENTATION-PLAN.md`
- **This guide:** `.cursor/ORCHESTRATOR-DISPATCH-GUIDE.md`
