-- Configurable Evaluation System
-- Adds factor_inputs and decision columns to evaluations table.
-- evaluation_presets table already exists — no changes needed there.

-- Add factor_inputs JSONB to store user-provided cost/delivery/cashflow inputs
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS factor_inputs JSONB;

-- Add decision column for GO/MAYBE/SKIP output
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS decision TEXT
  CHECK (decision IN ('GO', 'MAYBE', 'SKIP'));
