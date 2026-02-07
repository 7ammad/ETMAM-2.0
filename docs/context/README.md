# Context documents (optional in-repo copy)

**Source of truth:** **PRD.md** is the SOT for features, priorities, and scope. All other docs align to it. See **PRD-SOT-MAP.md** for the single master alignment map. For a log of Cursor/Claude activity, see **docs/CHANGELOG.md** (root docs folder). For orchestration (system-architect lead + senior-full-stack, senior-frontend, senior-backend), use **docs/ORCHESTRATION-BRIEF.md** (site map and backend stages).

**One document per type — no duplicates.** There is exactly one Implementation plan (IMPLEMENTATION.md), one Build schedule (in PRD §6), one App flow (APP-FLOW.md), one Backend spec (BACKEND.md), one Frontend spec (FRONTEND.md). Fragment or "insert" files have been merged into the main docs and removed. Do not create new IMPLEMENTATION-v2, PRD-Day2-schedule, or similar; update the single canonical doc instead.

This folder is intended to hold a **copy** of the Etmam 2.0 context documents so the repo is self-contained for:

- Claude Code CLI and other reviewers
- Other machines or teammates
- Handover

**Source:** `C:\Users\7amma\.cursor\context\`

**Files to copy:**

- IDEA.md  
- PRD.md  
- APP-FLOW.md  
- TECH-STACK.md  
- BACKEND.md  
- FRONTEND.md  
- IMPLEMENTATION.md  
- TENDER-STRUCTURE-v3.0-VERIFIED.md  

If this folder is empty, use the primary path above and point agents/reviewers at `docs/PROJECT-LEAD-GUIDE.md` for how to use the context.
