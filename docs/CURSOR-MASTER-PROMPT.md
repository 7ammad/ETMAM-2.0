# Cursor Master Prompt — Etmam 2.0

> Copy the prompt below into Cursor's composer to start Phase 1.3.
> For subsequent phases, change the phase number and agent role.

---

## Phase 1.3 Prompt (Copy This)

```
## Role & Context

You are **senior-full-stack** (per docs/AGENT-ASSIGNMENTS.md).

This project uses a **dual-tool workflow** (see docs/DUAL-TOOL-WORKFLOW.md):
- **Claude Code** generates skill-derived pattern files BEFORE each phase (already done for this phase)
- **You (Cursor)** implement the phase using the pattern file + context docs
- **Claude Code** runs the Hard Review AFTER you commit (you do NOT run it)

## Your Job: Execute Phase 1.3 — Authentication

### Step 1: READ (mandatory before coding)

Read ALL of these before writing any code:

1. **IMPLEMENTATION.md** → Phase 1.3 section (task list + acceptance test)
2. **BACKEND.md** → profiles table schema, auth triggers, RLS policies
3. **FRONTEND.md** → Auth component specs, design tokens
4. **TECH-STACK.md** → Supabase SSR (@supabase/ssr only, NOT auth-helpers), proxy.ts (NOT middleware.ts)
5. **docs/patterns/PHASE-1.3-PATTERNS.md** → Skill-derived patterns, code snippets, and **8 critical gotchas (G1-G8)**
6. **docs/ARCHITECTURE.md** → proxy.ts route protection pattern
7. **docs/SCAFFOLDING-DECISIONS.md** → Design decisions already made

After reading, confirm: "Read Phase 1.3 and [list docs]. Proceeding to implement."

### Step 2: IMPLEMENT (all tasks, no skips)

From IMPLEMENTATION.md Phase 1.3, implement:

1. **LoginForm component** → `src/components/auth/LoginForm.tsx`
   - Email + password inputs with loading state
   - Error message display (Arabic)
   - Link to register page
   - Styled with navy/gold design tokens from globals.css
   - Use `useActionState` (React 19) — NOT useFormState

2. **RegisterForm component** → `src/components/auth/RegisterForm.tsx`
   - Email + password + confirm password + full name
   - Submit with loading state
   - Link to login page

3. **Server Actions** → `src/app/actions/auth.ts`
   - `login(formData)` — sign in with Supabase, redirect to /dashboard
   - `register(formData)` — sign up with Supabase, redirect to /dashboard
   - `logout()` — sign out, redirect to /login
   - ⚠️ Use `createClient()` from `src/lib/supabase/server.ts` (SERVER client)
   - ⚠️ `redirect()` must be OUTSIDE try/catch (see G3 in pattern file)
   - ⚠️ Error messages in Arabic (see pattern file table)

4. **Verify proxy.ts works** — DO NOT rewrite `src/proxy.ts`, it already handles:
   - Protected routes → redirect to /login
   - Auth routes → redirect authenticated to /dashboard

5. **Header component** → `src/components/layout/Header.tsx`
   - Display user name + logout button
   - Use existing `useAuth()` hook from `src/hooks/use-auth.ts`
   - Logout via `<form action={logout}>` pattern

6. **Update pages:**
   - `src/app/(auth)/login/page.tsx` — replace stub with LoginForm
   - `src/app/(auth)/register/page.tsx` — replace stub with RegisterForm
   - `src/app/(dashboard)/layout.tsx` — replace header placeholder with Header component

### Critical Rules (from pattern file gotchas):

- **G1**: Server Actions use `src/lib/supabase/server.ts`, NOT `client.ts`
- **G2**: Use `redirect()` from next/navigation, NOT `router.push()`
- **G3**: `redirect()` OUTSIDE try/catch — it throws internally
- **G4**: proxy.ts exists and works — verify, don't rewrite
- **G5**: Reuse `src/hooks/use-auth.ts` — don't duplicate auth state
- **G6**: Profile auto-creation is handled by DB trigger — don't insert manually
- **G7**: `cookies()` is async in Next.js 16 — already handled in server.ts
- **G8**: If Zod v4 + @hookform/resolvers has issues, validate in Server Action with safeParse()

### Existing Code to Reuse (DO NOT recreate):

| File | Provides |
|------|----------|
| `src/proxy.ts` | Route protection — already wired |
| `src/lib/supabase/server.ts` | Server Supabase client for Server Actions |
| `src/lib/supabase/client.ts` | Browser Supabase client for Client Components |
| `src/lib/supabase/middleware.ts` | Session refresh helper for proxy |
| `src/hooks/use-auth.ts` | `{ user, loading, signOut }` for Header |
| `src/app/globals.css` | All design tokens (colors, fonts, shadows) |
| `src/lib/design-tokens.ts` | JS-accessible design tokens |

### Step 3: SELF-CHECK (before claiming done)

Run the Phase 1.3 checklist. If no specific Phase 1.3 section exists in docs/PHASE-COMPLETION-PROTOCOL.md, use the IMPLEMENTATION.md acceptance test as checklist:

- [ ] Can register a new account
- [ ] Can login with registered account
- [ ] Redirected to /dashboard after login
- [ ] Can logout → redirected to /login
- [ ] Visiting /dashboard without auth → redirected to /login
- [ ] Profile auto-created in profiles table

Also verify:
- [ ] `pnpm build` succeeds
- [ ] `tsc --noEmit` passes (no type errors)
- [ ] All user-facing text is in Arabic
- [ ] No bare stubs (pages have real structure)
- [ ] Email/password inputs use `dir="ltr"` for LTR text in RTL layout
- [ ] Loading states work (button shows spinner/text change while submitting)
- [ ] Error states work (wrong password shows Arabic error message)

Output the checklist with ✅ or ❌ for each item. Fix any ❌.

Save the result to: `docs/PHASE-1.3-CHECKLIST-RESULT.md`

### Step 4: COMMIT

Commit all changes with a descriptive message:
```
feat(auth): add Phase 1.3 authentication flow

- LoginForm and RegisterForm with Arabic labels
- Server Actions for login, register, logout
- Header component with user display and logout
- Verify proxy.ts route protection works
```

### Step 5: STOP

**Do NOT run the Hard Review.** That is done by Claude Code (code-reviewer role) separately per docs/DUAL-TOOL-WORKFLOW.md.

After committing, say: "Phase 1.3 implementation complete. Ready for Hard Review by code-reviewer."
```

---

## Prompt Template for Future Phases

Replace `[PHASE]`, `[AGENT]`, and `[TASKS]`:

```
You are [AGENT] (per docs/AGENT-ASSIGNMENTS.md).

This project uses a dual-tool workflow (see docs/DUAL-TOOL-WORKFLOW.md):
- Claude Code generates pattern files BEFORE each phase (already done)
- You (Cursor) implement using pattern file + context docs
- Claude Code runs Hard Review AFTER you commit

Read before coding:
1. IMPLEMENTATION.md → Phase [PHASE] section
2. BACKEND.md, FRONTEND.md, TECH-STACK.md (as applicable)
3. docs/patterns/PHASE-[PHASE]-PATTERNS.md (skill-derived patterns + gotchas)

Execute Phase [PHASE] exactly per IMPLEMENTATION.md. Follow patterns in the pattern file. Pay attention to GOTCHA sections.

Before claiming done:
1. Run checklist in docs/PHASE-COMPLETION-PROTOCOL.md (or IMPLEMENTATION.md acceptance test)
2. Output ✅/❌ for each item, fix any ❌
3. Verify pnpm build and tsc --noEmit pass
4. Save result to docs/PHASE-[PHASE]-CHECKLIST-RESULT.md
5. Commit all changes

Do NOT run hard review — that is done by code-reviewer (Claude Code) separately.
```

## Agent Role per Phase (from docs/AGENT-ASSIGNMENTS.md)

| Phase | Agent Role | Prompt starts with |
|-------|-----------|-------------------|
| 1.3 Auth | senior-full-stack | "You are senior-full-stack" |
| 1.4 Upload & List | senior-full-stack | "You are senior-full-stack" |
| 2.1 AI Provider | senior-backend | "You are senior-backend" |
| 2.2 Analysis UI | senior-full-stack | "You are senior-full-stack" |
| 2.3 Pipeline Board | senior-frontend | "You are senior-frontend" |
| 3.1 Bug Fixes | senior-full-stack | "You are senior-full-stack" |
| 3.2 Dashboard | senior-frontend | "You are senior-frontend" |
| 3.3 Settings | senior-full-stack | "You are senior-full-stack" |
| 3.4 Visual Polish | art-director | "You are art-director" |
| 3.5 Documentation | tech-writer | "You are tech-writer" |
