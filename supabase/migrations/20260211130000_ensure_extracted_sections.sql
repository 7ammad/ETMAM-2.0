-- Ensure tenders.extracted_sections exists (fixes schema cache error on deployed Supabase).
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS extracted_sections JSONB;
