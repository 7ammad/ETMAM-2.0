# Run the app with a local database (when remote has issues)

If the remote Supabase project has schema/trigger issues and both localhost and production fail, use a **local** Supabase instance. All migrations apply cleanly and signup + tender save work.

## 1. Start local Supabase (requires Docker)

```bash
npx supabase start
```

Copy from the output:

- **API URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Point .env.local at local Supabase

In `.env.local` set:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from step 1>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from step 1>
```

Leave the rest (AI keys, etc.) as they are.

## 3. Apply migrations to local DB

```bash
npx supabase db reset
```

This applies all migrations in `supabase/migrations/` to the local database (profiles, trigger, tenders, RLS, etc.).

## 4. Run the app

```bash
pnpm dev
```

Open http://localhost:3000. Register and save tenders; they use the local DB.

## 5. When you want to use the remote again

Change `.env.local` back to the remote Supabase URL and keys, then restart the dev server.
