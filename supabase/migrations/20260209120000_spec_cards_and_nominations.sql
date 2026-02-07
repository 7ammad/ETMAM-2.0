-- Phase 3.1: spec_cards, product_nominations, rate_card_items enrichment,
--            and pipeline tracking columns on tenders.
-- Depends on: 20260206120000_initial_schema.sql (tenders, rate_card_items)
--             20260207100000_fix_schema_logic.sql (set_updated_at function)

-- =============================================================================
-- 1. SPEC_CARDS
--    One card per BOQ line item. Stores AI-extracted technical parameters,
--    referenced standards, approved brands, and constraints parsed from the
--    tender document. Reviewed/edited by the user before nomination.
-- =============================================================================

CREATE TABLE spec_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boq_seq INTEGER NOT NULL,
  boq_description TEXT NOT NULL,
  category TEXT,
  parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  referenced_standards TEXT[] DEFAULT '{}',
  approved_brands TEXT[] DEFAULT '{}',
  constraints TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  ai_confidence INTEGER DEFAULT 0 CHECK (ai_confidence BETWEEN 0 AND 100),
  model_used TEXT,
  user_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_spec_cards_tender ON spec_cards(tender_id);
CREATE INDEX idx_spec_cards_user ON spec_cards(user_id);
CREATE UNIQUE INDEX idx_spec_cards_tender_boq ON spec_cards(tender_id, boq_seq);

-- Auto-update updated_at (set_updated_at function from 20260207100000)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON spec_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 2. PRODUCT_NOMINATIONS
--    Candidate products matched to a spec card. Can come from rate cards,
--    web search, or manual entry. One nomination is marked is_selected per
--    spec card for the final proposal.
-- =============================================================================

CREATE TABLE product_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_card_id UUID NOT NULL REFERENCES spec_cards(id) ON DELETE CASCADE,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT,
  model_sku TEXT,
  distributor TEXT,
  unit_price DECIMAL(15,2),
  currency TEXT DEFAULT 'SAR',
  source TEXT NOT NULL CHECK (source IN ('rate_card', 'web_search', 'manual')),
  rate_card_item_id UUID REFERENCES rate_card_items(id) ON DELETE SET NULL,
  source_url TEXT,
  source_notes TEXT,
  compliance_score INTEGER DEFAULT 0 CHECK (compliance_score BETWEEN 0 AND 100),
  compliance_details JSONB DEFAULT '[]'::jsonb,
  is_selected BOOLEAN DEFAULT FALSE,
  rank INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_nominations_spec_card ON product_nominations(spec_card_id);
CREATE INDEX idx_nominations_tender ON product_nominations(tender_id);
CREATE INDEX idx_nominations_user ON product_nominations(user_id);
CREATE INDEX idx_nominations_selected ON product_nominations(is_selected) WHERE is_selected = TRUE;

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON product_nominations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 3. ROW LEVEL SECURITY — spec_cards
-- =============================================================================

ALTER TABLE spec_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spec_cards"
  ON spec_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spec_cards"
  ON spec_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spec_cards"
  ON spec_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spec_cards"
  ON spec_cards FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. ROW LEVEL SECURITY — product_nominations
-- =============================================================================

ALTER TABLE product_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own product_nominations"
  ON product_nominations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own product_nominations"
  ON product_nominations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own product_nominations"
  ON product_nominations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own product_nominations"
  ON product_nominations FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 5. ENRICH rate_card_items
--    Add brand, model_sku, and specifications columns.
--    Rebuild the search_text generated column to include the new fields
--    and recreate the GIN index for Arabic full-text search.
-- =============================================================================

ALTER TABLE rate_card_items ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE rate_card_items ADD COLUMN IF NOT EXISTS model_sku TEXT;
ALTER TABLE rate_card_items ADD COLUMN IF NOT EXISTS specifications JSONB;

-- Rebuild search_text to incorporate brand + model_sku
ALTER TABLE rate_card_items DROP COLUMN search_text;
ALTER TABLE rate_card_items ADD COLUMN search_text TEXT GENERATED ALWAYS AS (
  LOWER(item_name || ' ' || COALESCE(category, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(model_sku, ''))
) STORED;

DROP INDEX IF EXISTS idx_rate_card_items_search;
CREATE INDEX idx_rate_card_items_search ON rate_card_items USING gin(to_tsvector('arabic', search_text));

-- =============================================================================
-- 6. PIPELINE TRACKING COLUMNS ON tenders
--    Track the generation status of spec cards and nominations independently
--    so the UI can show progress spinners and error states.
-- =============================================================================

ALTER TABLE tenders ADD COLUMN spec_cards_status TEXT DEFAULT 'pending'
  CHECK (spec_cards_status IN ('pending', 'generating', 'ready', 'error'));

ALTER TABLE tenders ADD COLUMN nominations_status TEXT DEFAULT 'pending'
  CHECK (nominations_status IN ('pending', 'generating', 'ready', 'error'));
