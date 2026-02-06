# Gotcha — Tech Stack & Dependencies Verification (Ref MCP)

**Date:** 2026-02-06  
**Scope:** Plan and implementation vs official docs (Next.js 16+, Supabase SSR). Ref MCP used to verify.

---

## 1. Next.js 16: proxy.ts (not middleware.ts)

**Official source:** [Next.js proxy docs](https://nextjs.org/docs/pages/api-reference/file-conventions/proxy.md) (via Ref MCP).

| Claim | Official doc | Verdict |
|-------|--------------|---------|
| Next.js 16 uses proxy, not middleware | Version history: **v16.0.0 — "Middleware is deprecated and renamed to Proxy"**. Migration: "We recommend users avoid relying on Middleware unless no other options exist." | **Verified** |
| File name | Create `proxy.ts` (or `.js`) at project root or inside `src`, same level as `pages` or `app`. | **Verified** |
| Exports | File must export a single function **named `proxy`** (or default export) and optionally **`config`** with **`matcher`**. | **Verified** |
| Migration | Codemod: `npx @next/codemod@canary middleware-to-proxy .` renames middleware → proxy. | **Verified** |

**Repo implementation:** [src/proxy.ts](src/proxy.ts) — exports `proxy(request)` and `config.matcher`. No `middleware.ts` at root. **Correct.**

**Plan / ARCHITECTURE:** State route protection via proxy.ts; IMPLEMENTATION.md in context still says "Create middleware.ts" — see Mistakes below.

---

## 2. Supabase: @supabase/ssr (not auth-helpers-nextjs)

**Official source:** Supabase SSR / Next.js App Router (via Ref MCP).

| Claim | Official doc | Verdict |
|-------|--------------|---------|
| Use @supabase/ssr for Next.js | "Supabase SSR helper library … create both browser Supabase clients for client components and server Supabase clients for server components." | **Verified** |
| Browser client | `createBrowserClient(SUPABASE_URL, ANON_KEY)` from `@supabase/ssr`. | **Verified** |
| Server client | `createServerClient(SUPABASE_URL, ANON_KEY, { cookies: { get/getAll, setAll } })` from `@supabase/ssr`. | **Verified** |

**Repo implementation:**

- [src/lib/supabase/client.ts](src/lib/supabase/client.ts) — `createBrowserClient` from `@supabase/ssr`. **Correct.**
- [src/lib/supabase/server.ts](src/lib/supabase/server.ts) — `createServerClient` from `@supabase/ssr` with `cookies()`. **Correct.**
- [src/lib/supabase/middleware.ts](src/lib/supabase/middleware.ts) — `createServerClient` from `@supabase/ssr` with request/response cookie handling for use inside **proxy**. **Correct.** (File name "middleware" here is Supabase’s pattern for the helper used by proxy; the root route-protection file is still proxy.ts.)

**package.json:** `@supabase/ssr` ^0.8.0, `@supabase/supabase-js` ^2.95.2. **Correct.**

**Context BACKEND.md:** Section 5 shows `createMiddlewareClient` from `@supabase/auth-helpers-nextjs` and `middleware.ts` — **deprecated**. See Mistakes below.

---

## 3. Dependencies (package.json vs TECH-STACK / IMPLEMENTATION)

| Package | Repo version | Context / IMPLEMENTATION | Verdict |
|---------|--------------|---------------------------|---------|
| next | 16.1.6 | 16.1.x | **Verified** |
| @supabase/ssr | ^0.8.0 | — | **Correct** (no auth-helpers) |
| @supabase/supabase-js | ^2.95.2 | — | **Verified** |
| zustand | ^5.0.11 | Zustand | **Verified** |
| zod | ^4.3.6 | zod | **Verified** |
| @google/generative-ai | ^0.24.1 | Gemini | **Verified** |
| groq-sdk | ^0.37.0 | Groq | **Verified** |
| papaparse, xlsx | present | Phase 1.1 | **Verified** |
| tailwindcss | ^4 | Tailwind | **Verified** |

No extra or wrong dependencies; stack matches intent.

---

## 4. Mistakes (context docs — can cause middleware-style errors)

These are in **context folder** (`C:\Users\7amma\.cursor\context`), not in the repo. They can cause future implementers to add middleware or deprecated auth.

| Location | Wrong | Correction |
|----------|--------|------------|
| **IMPLEMENTATION.md** line 130 | "6. **Create middleware.ts** — Route protection" | "6. **Create proxy.ts** — Route protection (Next.js 16: no middleware.ts)." |
| **IMPLEMENTATION.md** line 236 | "4. **Wire up middleware** — Protect all `/dashboard/*` routes" | "4. **Wire up proxy** — Protect all `/dashboard/*` routes (proxy.ts)." |
| **IMPLEMENTATION.md** line 128 | "lib/supabase/middleware.ts — Middleware auth client" | "lib/supabase/middleware.ts — Supabase session helper used by proxy (not root middleware)." |
| **BACKEND.md** Section 5 (lines ~1338–1372) | "## 5. Middleware", "// middleware.ts", `export async function middleware`, `createMiddlewareClient({ req, res })` | Replace with: "## 5. Proxy (route protection)" and a sample using **proxy.ts**, **export function proxy**, and **createServerClient** from `@supabase/ssr` with cookie get/set (same pattern as [src/lib/supabase/middleware.ts](src/lib/supabase/middleware.ts)). Remove any reference to `createMiddlewareClient` or `@supabase/auth-helpers-nextjs`. |
| **TECH-STACK.md** lines 359, 382, 923, 997 | "middleware checks session", "middleware.ts — auth middleware", "middleware.ts # Auth middleware" | Use "proxy" for route protection: e.g. "proxy checks session", "proxy.ts (route protection)", "lib/supabase/middleware.ts — session refresh helper for proxy". |

---

## 5. Plan and repo alignment

- **Plan / ARCHITECTURE:** Correctly state Next.js 16 proxy, no middleware for route protection, and proxy.ts + config.matcher.
- **Codebase:** Uses proxy.ts and @supabase/ssr only; no middleware.ts at root; no auth-helpers-nextjs.
- **Risk:** Context IMPLEMENTATION.md and BACKEND.md still describe middleware and deprecated auth. Anyone following only context could create middleware.ts or use createMiddlewareClient.

**Recommendation:** Update context docs per table above. Optionally add to plan or PROJECT-LEAD-GUIDE: **"Next.js 16+: use proxy.ts only for route protection; do not create middleware.ts. Use @supabase/ssr (createServerClient / createBrowserClient) only; do not use @supabase/auth-helpers-nextjs."**

---

## 6. Summary

| Classification | Count |
|----------------|-------|
| **Verified (official Ref + repo)** | Next.js 16 proxy, Supabase SSR, package.json stack. |
| **Mistake (context only)** | IMPLEMENTATION.md and BACKEND.md (and some TECH-STACK lines) still reference middleware / createMiddlewareClient. |
| **Hallucination** | None. |
| **Action** | Fix context docs; keep plan and repo as-is. |

---

## 7. Action completed (2026-02-06)

Context docs in `C:\Users\7amma\.cursor\context\` were updated:

- **IMPLEMENTATION.md:** Phase 1.1 task 5/6 now say "Supabase session helper used by proxy" and "Create proxy.ts (Next.js 16: no middleware.ts)"; Phase 1.3 task 4 says "Wire up proxy (proxy.ts)".
- **BACKEND.md:** Section 5 renamed to "Proxy (route protection)" with proxy.ts sample and createServerClient/@supabase/ssr; removed middleware.ts and createMiddlewareClient.
- **TECH-STACK.md:** "middleware checks session" → "proxy checks session"; "auth middleware" → "session refresh helper for proxy"; root file "middleware.ts" → "proxy.ts"; lib/supabase/middleware.ts comment → "Session refresh helper for proxy".

**PROJECT-LEAD-GUIDE.md:** Added "Tech stack rules (no exceptions)" with Next.js 16+ proxy-only and Supabase @supabase/ssr-only.
