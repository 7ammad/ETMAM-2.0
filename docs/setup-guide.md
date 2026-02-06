# Etmam 2.0 — Setup Guide

Minimal setup to run the app locally. For full competition handover, expand this guide.

## Prerequisites

- Node.js 20+ (22 recommended)
- pnpm (`npm install -g pnpm`)
- (Optional) Supabase CLI for local DB: `npm install -g supabase`

## Quick start

1. **Clone and install**
   ```bash
   cd etmam-2.0
   pnpm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env.local`.
   - Fill in at least:
     - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (use local Supabase or a cloud project).
     - `GEMINI_API_KEY` (from [ai.google.dev](https://ai.google.dev/)) if using AI extraction.
   - See `.env.example` comments for optional Odoo and Groq.

3. **Run**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000). You should be redirected to `/login` (or `/dashboard` if already logged in).

4. **Build**
   ```bash
   pnpm build
   ```

## Local Supabase (optional)

```bash
npx supabase init
npx supabase start
```

Use the printed API URL and anon key in `.env.local`. Run migrations when they exist: `npx supabase db push` or `npx supabase db reset`.

## Troubleshooting

- **Proxy/auth redirects:** Ensure `src/proxy.ts` exists and Supabase env vars are set so session refresh works.
- **Build errors:** Run `pnpm build` and fix TypeScript/lint errors before moving to the next phase.
