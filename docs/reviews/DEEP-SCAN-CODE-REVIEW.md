# Deep Scan — Code Review Report

**Date:** 2026-02-06  
**Scope:** Full app (auth, proxy, API routes, server actions, landing, dashboard).  
**Ref MCP:** Used for Next.js and Supabase patterns.  
**Debugger-style:** Hypotheses, evidence, minimal fixes.

**Next.js 16+:** There is no middleware; only **proxy** (`src/proxy.ts`) for route interception. The file `src/lib/supabase/middleware.ts` is Supabase's session-refresh helper used by the proxy, not a framework middleware.

---

## 1. Context

| Area | Finding |
|------|--------|
| **Route protection** | `src/proxy.ts` exports `proxy` + `config.matcher`. Next.js 16 invokes it automatically (per GOTCHA-TECH-STACK-VERIFICATION). Protected: `/dashboard`, `/tenders`, `/pipeline`, `/settings`. Public: `/`, `/login`, `/register`. API routes excluded via matcher; they perform own auth. **Verified.** |
| **Auth flow** | Server: `createClient()` from `@/lib/supabase/server` (cookies()). Client: `createClient()` from `@/lib/supabase/client` (createBrowserClient). **Next.js 16+ has no middleware — only proxy.** Session refresh: `updateSession()` in `@/lib/supabase/middleware.ts` (Supabase helper) is used by `src/proxy.ts`. **Verified.** |
| **Landing** | Root `page.tsx`: if user → redirect `/dashboard`; else `<LandingPage />`. No redirect of unauthenticated to `/login`. **Correct.** |

---

## 2. Security

| Check | Severity | Verdict |
|-------|----------|--------|
| API route auth | **Critical** | `/api/ai/extract` calls `getUser()` and returns 401 when no user. **Verified.** |
| Server actions auth | **Critical** | `analyze.ts`, `tenders.ts`, `auth.ts`, `pipeline.ts` use server `createClient()` and check `getUser()` before DB/API work. **Verified.** |
| Env usage | **High** | No server secrets in client. `NEXT_PUBLIC_*` only for Supabase URL/anon key. `GEMINI_API_KEY`, `GROQ_API_KEY` used only in server/API. **Verified.** |
| Input validation | **High** | Auth: email/password trimmed and checked. Tenders: Zod schema + server-side sanity (deadline, value bounds). Extract API: file type/size validated. **Verified.** |
| Cookie handling | **Medium** | Supabase design: setAll must set on response; request is “when available”. The session-refresh helper (used by proxy) sets both. **Defensive fix applied:** wrap `request.cookies.set` in try/catch so if request.cookies is read-only in some runtimes, session refresh still works via response cookies. |

---

## 3. Performance

| Check | Severity | Verdict |
|-------|----------|--------|
| Landing | **Low** | LandingPage is a Server Component (no "use client"); no client bundle for static landing. **Verified.** |
| AI provider loading | **Low** | `getAIProvider()` uses `require()` for Gemini/Groq/Mock; avoids pulling unused SDKs at startup. **Acceptable.** |
| Dashboard data | **Low** | Dashboard page uses `Promise.all` for tenders + pipeline_entries. **Good.** |

---

## 4. Type safety

| Check | Verdict |
|-------|--------|
| No `any` in `src` | **Verified** (grep for `: any`, `as any` — no matches). |
| Server/client boundaries | Server components use async and server createClient; client components use "use client" and hooks. **Verified.** |

---

## 5. Code quality & RTL

| Check | Verdict |
|-------|--------|
| Root layout | `lang="ar"`, `dir="rtl"` in `layout.tsx`. **Verified.** |
| Auth forms | LoginForm/RegisterForm use `dir="ltr"` on email/password inputs. **Good.** |
| Error handling | API and actions return structured errors; extract route sanitizes message for “مفتاح”. **Good.** |
| AI provider fallback | When no API keys, `getAIProvider()` returns MockProvider so dev/tests work. **Good.** |

---

## 6. Issues found and fixes

### 6.1 [Medium] Proxy session refresh — cookie set defensive

**Note:** Next.js 16+ has no middleware — only proxy. Session refresh runs in `src/proxy.ts`, which uses `updateSession()` from `src/lib/supabase/middleware.ts` (Supabase's session-refresh helper).

**Hypothesis:** In some runtimes, `request.cookies.set` in that helper may be read-only or missing; calling it could throw and break session refresh.

**Evidence:** Supabase design doc says set cookies “both on the request (when available) and response”. Response is mandatory for session refresh.

**Fix:** Wrap `request.cookies.set` in try/catch so we always set on response; if request mutation fails, we still send Set-Cookie headers.

**Applied:** Yes (see `src/lib/supabase/middleware.ts`).

---

### 6.2 [Low] Dashboard fallback when !user

**Finding:** Dashboard page has an in-component check `if (!user) return <p>يجب تسجيل الدخول</p>`.

**Verdict:** Defensive only. Proxy already redirects unauthenticated users from `/dashboard` to `/login`. No change required; keeps behavior correct if proxy is ever disabled or bypassed.

---

### 6.3 [Info] Proxy matcher and `/`

**Finding:** `config.matcher` excludes `api`, `_next/static`, etc. Root path `/` is included; proxy runs and returns `response` (no redirect) when user is null, so landing is shown. **Correct.**

---

## 7. Executive summary

- **Security:** Auth is enforced in API route and server actions; env and input validation are correct. No critical/high issues.
- **Performance:** Landing is server-rendered; dashboard uses parallel fetch; AI providers loaded on demand.
- **Type safety:** No `any`; boundaries are clear.
- **Quality:** RTL and Arabic preserved; error handling and fallbacks are in place.
- **Fix applied:** Session-refresh helper’s `setAll` (used by proxy) now tolerates read-only `request.cookies` (try/catch around request.cookies.set).

---

## 8. Verification checklist

- [x] `pnpm build` passes (run after changes).
- [x] Unauthenticated `/` shows landing; authenticated `/` redirects to `/dashboard`.
- [x] Protected routes redirect to `/login` when not authenticated (proxy).
- [x] `/api/ai/extract` returns 401 without auth.
- [x] Server actions check user before DB/API.
- [x] No `any` in `src`.
- [x] Proxy’s session-refresh helper sets cookies on response; request set is best-effort (defensive).
