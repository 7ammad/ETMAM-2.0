-- Fix extraction_cache RLS: restrict reads to authenticated users only
-- Previously the SELECT policy was USING (true) which allowed anon access
-- Only runs if extraction_cache table exists (e.g. some remotes have older schema)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'extraction_cache') THEN
    DROP POLICY IF EXISTS "Anyone can read extraction cache" ON extraction_cache;
    CREATE POLICY "Authenticated users can read extraction cache" ON extraction_cache
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
