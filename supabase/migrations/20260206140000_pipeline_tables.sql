-- Phase 2.3: pipeline_stages and pipeline_entries (from BACKEND.md)
-- =============================================================================

CREATE TABLE pipeline_stages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pipeline_stages (id, name, name_ar, display_order, color) VALUES
  ('new', 'New', 'جديد', 1, 'gray'),
  ('scored', 'Scored', 'مُقيَّم', 2, 'purple'),
  ('approved', 'Approved', 'معتمد', 3, 'blue'),
  ('pushed', 'Pushed to CRM', 'تم الدفع', 4, 'green'),
  ('won', 'Won', 'فاز', 5, 'gold'),
  ('lost', 'Lost', 'خسر', 6, 'red');

-- =============================================================================

CREATE TABLE pipeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moved_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(tender_id)
);

CREATE INDEX idx_pipeline_entries_stage ON pipeline_entries(stage_id);
CREATE INDEX idx_pipeline_entries_user ON pipeline_entries(user_id);

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pipeline stages"
  ON pipeline_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read own pipeline entries"
  ON pipeline_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pipeline entries"
  ON pipeline_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pipeline entries"
  ON pipeline_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pipeline entries"
  ON pipeline_entries FOR DELETE USING (auth.uid() = user_id);
