-- Ensure tenders.estimated_value exists (fixes "schema cache" error on deployed Supabase).
-- Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenders' AND column_name = 'estimated_value'
  ) THEN
    ALTER TABLE tenders ADD COLUMN estimated_value DECIMAL(15,2) NULL;
  ELSE
    BEGIN
      ALTER TABLE tenders ALTER COLUMN estimated_value DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- already nullable
    END;
  END IF;
END $$;
