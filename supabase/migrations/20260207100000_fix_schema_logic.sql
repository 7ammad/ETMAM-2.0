-- Fix Phase 1.2 logical issues found during audit
-- 1. Status flow: cost-before-evaluate (not evaluate-before-cost)
-- 2. Add profit_margin_percent to tenders
-- 3. Add company_capabilities to profiles
-- 4. Replace exported_to with dual export tracking
-- 5. Drop UNIQUE on evaluations(tender_id) for re-evaluation history
-- 6. Add updated_at auto-trigger on all tables
-- 7. Add tender_url to tenders

-- =============================================================================
-- 1. FIX STATUS FLOW TRIGGERS
--    Correct pipeline: Input → Cost → Evaluate → Export
--    new → costed → evaluated → exported
-- =============================================================================

-- Evaluation trigger: should fire when status is 'new' OR 'costed'
CREATE OR REPLACE FUNCTION update_tender_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenders SET
    evaluation_score = NEW.overall_score,
    recommendation = COALESCE(NEW.manual_override, NEW.auto_recommendation),
    status = CASE WHEN status IN ('new', 'costed') THEN 'evaluated' ELSE status END,
    updated_at = NOW()
  WHERE id = NEW.tender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cost trigger: should only advance from 'new' (costing is the first step)
CREATE OR REPLACE FUNCTION update_tender_costs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenders SET
    total_cost = (
      SELECT COALESCE(SUM(total), 0)
      FROM cost_items
      WHERE tender_id = COALESCE(NEW.tender_id, OLD.tender_id)
    ),
    status = CASE WHEN status = 'new' THEN 'costed' ELSE status END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.tender_id, OLD.tender_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. ADD profit_margin_percent TO TENDERS
--    PRD Feature 5D: "Profit margin input (%) — applied on top of grand total"
--    proposed_price = total_cost * (1 + profit_margin_percent / 100)
-- =============================================================================

ALTER TABLE tenders ADD COLUMN profit_margin_percent DECIMAL(5,2) DEFAULT 0;

-- =============================================================================
-- 3. ADD company_capabilities TO PROFILES
--    PRD Feature 2B: "company capabilities used by AI to match requirements"
--    Feeds into Alignment evaluation criterion (25% default weight)
-- =============================================================================

ALTER TABLE profiles ADD COLUMN company_capabilities TEXT;

-- =============================================================================
-- 4. REPLACE exported_to WITH DUAL EXPORT TRACKING
--    PRD: Excel AND Odoo are both equal features, not mutually exclusive
-- =============================================================================

ALTER TABLE tenders ADD COLUMN exported_to_excel_at TIMESTAMPTZ;
ALTER TABLE tenders ADD COLUMN pushed_to_odoo_at TIMESTAMPTZ;

-- Migrate existing data before dropping old columns
UPDATE tenders SET exported_to_excel_at = exported_at WHERE exported_to = 'excel';
UPDATE tenders SET pushed_to_odoo_at = exported_at WHERE exported_to = 'odoo';

ALTER TABLE tenders DROP COLUMN exported_at;
ALTER TABLE tenders DROP COLUMN exported_to;

-- =============================================================================
-- 5. DROP UNIQUE ON evaluations(tender_id) FOR RE-EVALUATION HISTORY
--    PRD: "Re-analyze button works (creates new analysis)"
--    Trigger always writes latest scores to tender row
-- =============================================================================

ALTER TABLE evaluations DROP CONSTRAINT evaluations_tender_id_key;

-- =============================================================================
-- 6. ADD updated_at AUTO-TRIGGER ON ALL TABLES
--    BACKEND.md: "updated_at auto-update trigger on all tables"
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON cost_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON rate_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON evaluation_presets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 7. ADD tender_url TO TENDERS
--    PRD Feature 1A: رابط المنافسة / tender_url (optional CSV column)
-- =============================================================================

ALTER TABLE tenders ADD COLUMN tender_url TEXT;

-- =============================================================================
-- 8. FIX handle_new_user TRIGGER TO SAVE full_name FROM AUTH METADATA
--    Registration passes full_name in options.data but trigger only saved id+email
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
