-- Add raw_text column to store full PDF text for AI evaluation
-- This allows deterministic-only extraction while Gemini evaluates the full document
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS raw_text text;

-- Index not needed — only read by primary key during evaluation
COMMENT ON COLUMN tenders.raw_text IS 'Full extracted text from PDF for AI evaluation';
