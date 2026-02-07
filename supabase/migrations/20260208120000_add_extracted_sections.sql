-- Add structured sections JSONB column to tenders table.
-- Stores 5 vendor-critical sections: BOQ, tech specs, qualifications,
-- contract terms, evaluation method. NULL for existing tenders.
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS extracted_sections JSONB;
