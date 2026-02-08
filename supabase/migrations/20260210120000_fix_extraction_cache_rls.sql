-- Fix extraction_cache RLS: restrict reads to authenticated users only
-- Previously the SELECT policy was USING (true) which allowed anon access

DROP POLICY IF EXISTS "Anyone can read extraction cache" ON extraction_cache;

CREATE POLICY "Authenticated users can read extraction cache" ON extraction_cache
  FOR SELECT USING (auth.role() = 'authenticated');
