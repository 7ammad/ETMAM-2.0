# Etmam 2.0 — Architecture Notes

## Route protection: proxy.ts (not middleware.ts)

**Next.js 16** uses a single **proxy** for request interception; the previous `middleware.ts` name is deprecated.

- **File:** `src/proxy.ts`
- **Exports:** `proxy(request)` and `config.matcher`
- **Role:** Refreshes Supabase session (via `lib/supabase/middleware.ts` helper) and enforces route protection (redirect unauthenticated to `/login`, authenticated from `/login` to `/dashboard`).

There is **no** `middleware.ts` in this project. If you see docs or code referring to "middleware" for auth, they mean **proxy.ts**. The Supabase session helper lives in `lib/supabase/middleware.ts` (named for Supabase’s “middleware client” pattern) and is used only by `src/proxy.ts`.
