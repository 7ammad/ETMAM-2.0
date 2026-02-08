-- Ensure all tenders columns exist (remote may have been created from older schema).
-- Safe to run: ADD COLUMN IF NOT EXISTS. Fixes "Could not find the 'X' column" errors.

-- Core columns from initial schema
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(15,2) NULL;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS source_file_path TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS source_file_name TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS extraction_confidence INTEGER;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS extraction_warnings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS extracted_sections JSONB;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Columns from fix_schema_logic migration
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS profit_margin_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tender_url TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS exported_to_excel_at TIMESTAMPTZ;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS pushed_to_odoo_at TIMESTAMPTZ;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS evaluation_score INTEGER;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15,2);
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS proposed_price DECIMAL(15,2);

-- Legacy export columns (kept for backwards compat)
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS exported_to TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS odoo_lead_id INTEGER;

-- Columns from spec_cards_and_nominations migration
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS spec_cards_status TEXT DEFAULT 'pending';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS nominations_status TEXT DEFAULT 'pending';

-- Add CHECK constraint on source_type if missing (safe: DO NOTHING on conflict)
DO $$
BEGIN
  ALTER TABLE tenders ADD CONSTRAINT tenders_source_type_check
    CHECK (source_type IN ('csv', 'excel', 'pdf', 'manual'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;
