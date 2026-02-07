-- Etmam 2.0 — Initial schema (Phase 1.2)
-- Source: BACKEND.md. Tables: profiles, evaluation_presets, tenders, evaluations, rate_cards, rate_card_items, cost_items, extraction_cache

-- =============================================================================
-- PROFILES (extends auth.users)
-- =============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- EVALUATION_PRESETS (before evaluations for FK)
-- =============================================================================
CREATE TABLE evaluation_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluation_presets_user_id ON evaluation_presets(user_id);
CREATE UNIQUE INDEX idx_evaluation_presets_default ON evaluation_presets(user_id) WHERE is_default = TRUE;

-- =============================================================================
-- TENDERS
-- =============================================================================
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,
  tender_title TEXT NOT NULL,
  tender_number TEXT NOT NULL,
  deadline DATE NOT NULL,
  estimated_value DECIMAL(15,2) NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  line_items JSONB DEFAULT '[]'::jsonb,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'excel', 'pdf', 'manual')),
  source_file_path TEXT,
  source_file_name TEXT,
  extraction_confidence INTEGER,
  extraction_warnings JSONB DEFAULT '[]'::jsonb,
  evaluation_score INTEGER,
  recommendation TEXT CHECK (recommendation IN ('proceed', 'review', 'skip')),
  total_cost DECIMAL(15,2),
  proposed_price DECIMAL(15,2),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'evaluated', 'costed', 'exported')),
  exported_at TIMESTAMPTZ,
  exported_to TEXT,
  odoo_lead_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenders_user_id ON tenders(user_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
CREATE INDEX idx_tenders_recommendation ON tenders(recommendation);

-- =============================================================================
-- EVALUATIONS
-- =============================================================================
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criteria_scores JSONB NOT NULL,
  overall_score INTEGER NOT NULL,
  auto_recommendation TEXT NOT NULL CHECK (auto_recommendation IN ('proceed', 'review', 'skip')),
  manual_override TEXT CHECK (manual_override IN ('proceed', 'review', 'skip')),
  override_reason TEXT,
  preset_id UUID REFERENCES evaluation_presets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tender_id)
);

CREATE OR REPLACE FUNCTION update_tender_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenders SET
    evaluation_score = NEW.overall_score,
    recommendation = COALESCE(NEW.manual_override, NEW.auto_recommendation),
    status = CASE WHEN status = 'new' THEN 'evaluated' ELSE status END,
    updated_at = NOW()
  WHERE id = NEW.tender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_evaluation_change
  AFTER INSERT OR UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_tender_evaluation();

-- =============================================================================
-- RATE_CARDS & RATE_CARD_ITEMS (before cost_items for FK)
-- =============================================================================
CREATE TABLE rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  item_count INTEGER DEFAULT 0,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_cards_user_id ON rate_cards(user_id);

CREATE TABLE rate_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_card_id UUID NOT NULL REFERENCES rate_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  search_text TEXT GENERATED ALWAYS AS (LOWER(item_name || ' ' || COALESCE(category, ''))) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_card_items_rate_card_id ON rate_card_items(rate_card_id);
CREATE INDEX idx_rate_card_items_search ON rate_card_items USING gin(to_tsvector('arabic', search_text));

CREATE OR REPLACE FUNCTION update_rate_card_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rate_cards SET
    item_count = (SELECT COUNT(*) FROM rate_card_items WHERE rate_card_id = COALESCE(NEW.rate_card_id, OLD.rate_card_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.rate_card_id, OLD.rate_card_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rate_card_item_change
  AFTER INSERT OR DELETE ON rate_card_items
  FOR EACH ROW EXECUTE FUNCTION update_rate_card_count();

-- =============================================================================
-- COST_ITEMS
-- =============================================================================
CREATE TABLE cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('direct', 'indirect')),
  subcategory TEXT,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'unit',
  unit_price DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  source TEXT NOT NULL CHECK (source IN ('rate_card', 'manual', 'ai_suggested')),
  rate_card_item_id UUID REFERENCES rate_card_items(id) ON DELETE SET NULL,
  source_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_items_tender_id ON cost_items(tender_id);

CREATE OR REPLACE FUNCTION update_tender_costs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenders SET
    total_cost = (SELECT COALESCE(SUM(total), 0) FROM cost_items WHERE tender_id = COALESCE(NEW.tender_id, OLD.tender_id)),
    status = CASE WHEN status IN ('new', 'evaluated') THEN 'costed' ELSE status END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.tender_id, OLD.tender_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_cost_item_change
  AFTER INSERT OR UPDATE OR DELETE ON cost_items
  FOR EACH ROW EXECUTE FUNCTION update_tender_costs();

-- =============================================================================
-- EXTRACTION_CACHE
-- =============================================================================
CREATE TABLE extraction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_hash TEXT NOT NULL UNIQUE,
  file_name TEXT,
  extraction_result JSONB NOT NULL,
  model_used TEXT NOT NULL,
  processing_time_ms INTEGER,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extraction_cache_hash ON extraction_cache(file_hash);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_card_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_cache ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tenders
CREATE POLICY "Users can view own tenders" ON tenders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tenders" ON tenders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tenders" ON tenders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tenders" ON tenders FOR DELETE USING (auth.uid() = user_id);

-- Evaluations
CREATE POLICY "Users can view own evaluations" ON evaluations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own evaluations" ON evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evaluations" ON evaluations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evaluations" ON evaluations FOR DELETE USING (auth.uid() = user_id);

-- Cost items
CREATE POLICY "Users can view own cost_items" ON cost_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cost_items" ON cost_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cost_items" ON cost_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cost_items" ON cost_items FOR DELETE USING (auth.uid() = user_id);

-- Rate cards
CREATE POLICY "Users can view own rate_cards" ON rate_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own rate_cards" ON rate_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rate_cards" ON rate_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rate_cards" ON rate_cards FOR DELETE USING (auth.uid() = user_id);

-- Rate card items
CREATE POLICY "Users can view own rate_card_items" ON rate_card_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own rate_card_items" ON rate_card_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rate_card_items" ON rate_card_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rate_card_items" ON rate_card_items FOR DELETE USING (auth.uid() = user_id);

-- Evaluation presets
CREATE POLICY "Users can view own evaluation_presets" ON evaluation_presets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own evaluation_presets" ON evaluation_presets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evaluation_presets" ON evaluation_presets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evaluation_presets" ON evaluation_presets FOR DELETE USING (auth.uid() = user_id);

-- Extraction cache (shared read, authenticated write)
CREATE POLICY "Anyone can read extraction cache" ON extraction_cache FOR SELECT USING (true);
CREATE POLICY "Authenticated users can write extraction cache" ON extraction_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- STORAGE BUCKETS (optional; may require Supabase dashboard for first run)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('tender-pdfs', 'tender-pdfs', false),
  ('rate-card-files', 'rate-card-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own tender PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tender-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own tender PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tender-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own rate card files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'rate-card-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own rate card files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rate-card-files' AND auth.uid()::text = (storage.foldername(name))[1]);
