# Etmam 2.0 — Backend Structure

## Document Info
- **Version:** 2.1
- **Last Updated:** February 7, 2026
- **Source of truth:** PRD.md. CRM = Push to Odoo + Excel export (both equal). See PRD-SOT-MAP.md.
- **Reference:** PRD.md (SOT), IDEA.md, APP-FLOW.md, TECH-STACK.md

---

## 1. Database Schema

### Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
├─────────────────────────────────────────────────────────────────┤
│  auth.users (built-in)                                          │
│       ↓ user_id                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  profiles          │  One per user, extends auth        │   │
│  └─────────────────────────────────────────────────────────┘   │
│       ↓ user_id                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  tenders           │  Main tender records               │   │
│  │  evaluations       │  Scoring data per tender           │   │
│  │  cost_items        │  Line items per tender             │   │
│  │  rate_cards        │  Uploaded price lists              │   │
│  │  rate_card_items   │  Individual prices in rate cards   │   │
│  │  evaluation_presets│  Saved criteria configurations     │   │
│  │  extraction_cache  │  Cached AI extractions (by hash)   │   │
│  │  pipeline_stages  │  Optional: stage definitions (if UI uses stages) │   │
│  │  pipeline_entries  │  Optional: tender stage tracking (PRD: Export = Odoo + Excel) │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Storage Buckets:                                               │
│  • tender-pdfs        │  Uploaded كراسة شروط files          │   │
│  • rate-card-files    │  Original rate card Excel files     │   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Table: `profiles`
Extends Supabase auth.users with app-specific data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### Table: `tenders`
Main tender records with all competition-required fields.

```sql
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Competition required fields (CRM mapping)
  entity TEXT NOT NULL,                    -- الجهة
  tender_title TEXT NOT NULL,              -- عنوان المنافسة
  tender_number TEXT NOT NULL,             -- رقم المنافسة
  deadline DATE NOT NULL,                  -- الموعد النهائي
  estimated_value DECIMAL(15,2) NOT NULL,  -- قيمة تقديرية
  
  -- Additional extracted data
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,  -- Array of requirement strings
  line_items JSONB DEFAULT '[]'::jsonb,    -- Extracted line items from PDF
  
  -- Source tracking
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'excel', 'pdf', 'manual')),
  source_file_path TEXT,                   -- Storage path if uploaded
  source_file_name TEXT,
  
  -- AI extraction metadata (for PDF sources)
  extraction_confidence INTEGER,           -- 0-100 overall confidence
  extraction_warnings JSONB DEFAULT '[]'::jsonb,
  
  -- Calculated fields (denormalized for performance)
  evaluation_score INTEGER,                -- 0-100, from evaluations table
  recommendation TEXT CHECK (recommendation IN ('proceed', 'review', 'skip')),
  total_cost DECIMAL(15,2),               -- Sum from cost_items
  proposed_price DECIMAL(15,2),           -- Cost + profit margin
  
  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'evaluated', 'costed', 'exported')),
  exported_at TIMESTAMPTZ,
  exported_to TEXT,                        -- 'excel' or 'odoo'
  odoo_lead_id INTEGER,                    -- If exported to Odoo
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_tenders_user_id ON tenders(user_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
CREATE INDEX idx_tenders_recommendation ON tenders(recommendation);
```

**TypeScript Type:**
```typescript
// types/tender.ts
export interface Tender {
  id: string
  user_id: string
  
  // Competition required fields
  entity: string
  tender_title: string
  tender_number: string
  deadline: string  // ISO date
  estimated_value: number
  
  // Additional data
  description?: string
  requirements: string[]
  line_items: ExtractedLineItem[]
  
  // Source
  source_type: 'csv' | 'excel' | 'pdf' | 'manual'
  source_file_path?: string
  source_file_name?: string
  
  // AI metadata
  extraction_confidence?: number
  extraction_warnings: string[]
  
  // Calculated
  evaluation_score?: number
  recommendation?: 'proceed' | 'review' | 'skip'
  total_cost?: number
  proposed_price?: number
  
  // Status
  status: 'new' | 'evaluated' | 'costed' | 'exported'
  exported_at?: string
  exported_to?: 'excel' | 'odoo'
  odoo_lead_id?: number
  
  created_at: string
  updated_at: string
}

export interface ExtractedLineItem {
  description: string
  quantity?: number
  unit?: string
  specifications?: string
  confidence: number
}
```

---

### Table: `evaluations`
Stores scoring data for each tender.

```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Criteria scores (JSONB for flexibility)
  criteria_scores JSONB NOT NULL,
  /*
  Example:
  {
    "alignment": { "score": 85, "weight": 25, "notes": "Good fit" },
    "profitability": { "score": 70, "weight": 25, "notes": "" },
    "timeline": { "score": 90, "weight": 20, "notes": "Comfortable deadline" },
    "competition": { "score": 60, "weight": 15, "notes": "Several competitors" },
    "strategic_value": { "score": 80, "weight": 15, "notes": "" }
  }
  */
  
  -- Calculated overall score
  overall_score INTEGER NOT NULL,  -- Weighted average
  
  -- Auto-generated recommendation (can be overridden)
  auto_recommendation TEXT NOT NULL CHECK (auto_recommendation IN ('proceed', 'review', 'skip')),
  manual_override TEXT CHECK (manual_override IN ('proceed', 'review', 'skip')),
  override_reason TEXT,
  
  -- Which preset was used (if any)
  preset_id UUID REFERENCES evaluation_presets(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tender_id)  -- One evaluation per tender
);

-- Trigger to update tender's denormalized score
CREATE OR REPLACE FUNCTION update_tender_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenders SET
    evaluation_score = NEW.overall_score,
    recommendation = COALESCE(NEW.manual_override, NEW.auto_recommendation),
    status = CASE 
      WHEN status = 'new' THEN 'evaluated'
      ELSE status 
    END,
    updated_at = NOW()
  WHERE id = NEW.tender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_evaluation_change
  AFTER INSERT OR UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_tender_evaluation();
```

**TypeScript Type:**
```typescript
// types/evaluation.ts
export interface Evaluation {
  id: string
  tender_id: string
  user_id: string
  
  criteria_scores: Record<string, CriterionScore>
  overall_score: number
  
  auto_recommendation: 'proceed' | 'review' | 'skip'
  manual_override?: 'proceed' | 'review' | 'skip'
  override_reason?: string
  
  preset_id?: string
  
  created_at: string
  updated_at: string
}

export interface CriterionScore {
  score: number      // 0-100
  weight: number     // Percentage (all weights sum to 100)
  notes?: string
}
```

---

### Table: `cost_items`
Line items for cost estimation.

```sql
CREATE TABLE cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('direct', 'indirect')),
  subcategory TEXT,  -- e.g., 'equipment', 'services', 'labor', 'overhead'
  
  -- Item details
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'unit',
  unit_price DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Price source tracking
  source TEXT NOT NULL CHECK (source IN ('rate_card', 'manual', 'ai_suggested')),
  rate_card_item_id UUID REFERENCES rate_card_items(id) ON DELETE SET NULL,
  source_notes TEXT,  -- e.g., "Matched from Dell Q1 2026 rate card"
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_items_tender_id ON cost_items(tender_id);

-- Trigger to update tender's total cost
CREATE OR REPLACE FUNCTION update_tender_costs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenders SET
    total_cost = (
      SELECT COALESCE(SUM(total), 0) 
      FROM cost_items 
      WHERE tender_id = COALESCE(NEW.tender_id, OLD.tender_id)
    ),
    status = CASE 
      WHEN status IN ('new', 'evaluated') THEN 'costed'
      ELSE status 
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.tender_id, OLD.tender_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_cost_item_change
  AFTER INSERT OR UPDATE OR DELETE ON cost_items
  FOR EACH ROW EXECUTE FUNCTION update_tender_costs();
```

**TypeScript Type:**
```typescript
// types/tender.ts
export interface CostItem {
  id: string
  tender_id: string
  user_id: string
  
  category: 'direct' | 'indirect'
  subcategory?: string
  
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number  // Computed
  
  source: 'rate_card' | 'manual' | 'ai_suggested'
  rate_card_item_id?: string
  source_notes?: string
  
  sort_order: number
  
  created_at: string
  updated_at: string
}
```

---

### Table: `rate_cards`
Uploaded price list files.

```sql
CREATE TABLE rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,  -- User-provided label, e.g., "Dell Q1 2026"
  file_path TEXT NOT NULL,  -- Storage path
  file_name TEXT NOT NULL,
  
  item_count INTEGER DEFAULT 0,
  
  valid_until DATE,  -- Optional expiry
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_cards_user_id ON rate_cards(user_id);
```

---

### Table: `rate_card_items`
Individual items parsed from rate cards.

```sql
CREATE TABLE rate_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_card_id UUID NOT NULL REFERENCES rate_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item details
  item_name TEXT NOT NULL,            -- البند
  category TEXT,                      -- التصنيف
  unit TEXT NOT NULL,                 -- الوحدة
  unit_price DECIMAL(15,2) NOT NULL,  -- سعر الوحدة
  
  -- For matching
  search_text TEXT GENERATED ALWAYS AS (
    LOWER(item_name || ' ' || COALESCE(category, ''))
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_card_items_rate_card_id ON rate_card_items(rate_card_id);
CREATE INDEX idx_rate_card_items_search ON rate_card_items USING gin(to_tsvector('arabic', search_text));

-- Update rate card item count
CREATE OR REPLACE FUNCTION update_rate_card_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rate_cards SET
    item_count = (
      SELECT COUNT(*) FROM rate_card_items 
      WHERE rate_card_id = COALESCE(NEW.rate_card_id, OLD.rate_card_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.rate_card_id, OLD.rate_card_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rate_card_item_change
  AFTER INSERT OR DELETE ON rate_card_items
  FOR EACH ROW EXECUTE FUNCTION update_rate_card_count();
```

**TypeScript Type:**
```typescript
// types/rate-card.ts
export interface RateCard {
  id: string
  user_id: string
  name: string
  file_path: string
  file_name: string
  item_count: number
  valid_until?: string
  created_at: string
  updated_at: string
}

export interface RateCardItem {
  id: string
  rate_card_id: string
  user_id: string
  item_name: string
  category?: string
  unit: string
  unit_price: number
  created_at: string
}
```

---

### Table: `evaluation_presets`
Saved evaluation criteria configurations.

```sql
CREATE TABLE evaluation_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Criteria configuration
  criteria JSONB NOT NULL,
  /*
  Example:
  [
    { "key": "alignment", "name": "التوافق", "description": "مدى توافق المنافسة مع قدرات الشركة", "weight": 25 },
    { "key": "profitability", "name": "الربحية", "description": "هامش الربح المتوقع", "weight": 25 },
    { "key": "timeline", "name": "الجدول الزمني", "description": "واقعية الموعد النهائي", "weight": 20 },
    { "key": "competition", "name": "المنافسة", "description": "عدد وقوة المنافسين", "weight": 15 },
    { "key": "strategic_value", "name": "القيمة الاستراتيجية", "description": "التوافق مع أهداف الشركة", "weight": 15 }
  ]
  */
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluation_presets_user_id ON evaluation_presets(user_id);

-- Ensure only one default per user
CREATE UNIQUE INDEX idx_evaluation_presets_default 
ON evaluation_presets(user_id) 
WHERE is_default = TRUE;
```

**TypeScript Type:**
```typescript
// types/evaluation.ts
export interface EvaluationPreset {
  id: string
  user_id: string
  name: string
  is_default: boolean
  criteria: Criterion[]
  created_at: string
  updated_at: string
}

export interface Criterion {
  key: string         // Unique identifier
  name: string        // Arabic display name
  description: string // Helper text
  weight: number      // Percentage (all must sum to 100)
}
```

---

### Table: `extraction_cache`
Caches AI extraction results to avoid re-processing.

```sql
CREATE TABLE extraction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File identification
  file_hash TEXT NOT NULL UNIQUE,  -- SHA-256 of file content
  file_name TEXT,
  
  -- Extraction result
  extraction_result JSONB NOT NULL,
  model_used TEXT NOT NULL,  -- e.g., 'gemini-2.5-flash', 'llama-3.3-70b'
  
  -- Stats
  processing_time_ms INTEGER,
  token_count INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extraction_cache_hash ON extraction_cache(file_hash);
```

---

### Table: `pipeline_stages` (optional)
Per PRD, CRM output = Push to Odoo + Excel export (no required pipeline board). This table is optional if you want an internal stage view; otherwise use Export tab (Excel + Odoo) only. Seeded with default data if used.

```sql
CREATE TABLE pipeline_stages (
  id TEXT PRIMARY KEY,                -- e.g., 'new', 'scored', 'approved'
  name TEXT NOT NULL,                 -- English label
  name_ar TEXT NOT NULL,              -- Arabic label
  display_order INTEGER NOT NULL,     -- Sort order for display
  color TEXT NOT NULL,                -- UI color key
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default stages
INSERT INTO pipeline_stages (id, name, name_ar, display_order, color) VALUES
  ('new', 'New', 'جديد', 1, 'gray'),
  ('scored', 'Scored', 'مُقيَّم', 2, 'purple'),
  ('approved', 'Approved', 'معتمد', 3, 'blue'),
  ('pushed', 'Pushed to CRM', 'تم الدفع', 4, 'green'),
  ('won', 'Won', 'فاز', 5, 'gold'),
  ('lost', 'Lost', 'خسر', 6, 'red');
```

**TypeScript Type:**
```typescript
export interface PipelineStage {
  id: string
  name: string
  name_ar: string
  display_order: number
  color: string
  created_at: string
}
```

---

### Table: `pipeline_entries` (optional)
Tracks which tenders are in which pipeline stage (if using pipeline_stages). One entry per tender. Optional per PRD.

```sql
CREATE TABLE pipeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moved_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  UNIQUE(tender_id)  -- One pipeline position per tender
);

CREATE INDEX idx_pipeline_entries_stage ON pipeline_entries(stage_id);
CREATE INDEX idx_pipeline_entries_user ON pipeline_entries(user_id);
```

**TypeScript Type:**
```typescript
export interface PipelineEntry {
  id: string
  tender_id: string
  stage_id: string
  user_id: string
  moved_at: string
  notes?: string
}
```

---

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_card_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tenders: Users can only access their own
CREATE POLICY "Users can view own tenders"
  ON tenders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tenders"
  ON tenders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tenders"
  ON tenders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenders"
  ON tenders FOR DELETE
  USING (auth.uid() = user_id);

-- Same pattern for other user-owned tables
-- (evaluations, cost_items, rate_cards, rate_card_items, evaluation_presets)

-- Extraction cache: Shared (anyone can read cached extractions)
CREATE POLICY "Anyone can read extraction cache"
  ON extraction_cache FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can write extraction cache"
  ON extraction_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- pipeline_stages: readable by all authenticated users (reference data)
CREATE POLICY "Anyone can read pipeline stages"
  ON pipeline_stages FOR SELECT
  TO authenticated
  USING (true);

-- pipeline_entries: users manage their own entries
CREATE POLICY "Users can read own pipeline entries"
  ON pipeline_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pipeline entries"
  ON pipeline_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pipeline entries"
  ON pipeline_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pipeline entries"
  ON pipeline_entries FOR DELETE USING (auth.uid() = user_id);
```

---

### Storage Buckets

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('tender-pdfs', 'tender-pdfs', false),
  ('rate-card-files', 'rate-card-files', false);

-- RLS policies for storage
CREATE POLICY "Users can upload own tender PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tender-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own tender PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tender-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Same for rate-card-files bucket
```

**Storage Path Convention:**
```
tender-pdfs/
  {user_id}/
    {tender_id}/
      original.pdf
      
rate-card-files/
  {user_id}/
    {rate_card_id}/
      original.xlsx
```

---

## 2. API Routes

### Route Map
```
/api/
├── auth/
│   └── callback/           POST    Supabase auth callback
│
├── tenders/
│   ├── route.ts            GET     List user's tenders
│   │                       POST    Create tender (manual entry)
│   ├── [id]/route.ts       GET     Get single tender
│   │                       PUT     Update tender
│   │                       DELETE  Delete tender
│   └── import/route.ts     POST    Import from CSV/Excel
│
├── ai/
│   └── extract/route.ts    POST    Extract data from PDF
│
├── evaluation/
│   ├── route.ts            POST    Calculate/save evaluation
│   └── presets/
│       └── route.ts        GET     List presets
│                           POST    Create preset
│                           PUT     Update preset
│                           DELETE  Delete preset
│
├── costs/
│   ├── route.ts            GET     Get cost items for tender
│   │                       POST    Add cost item
│   │                       PUT     Update cost item
│   │                       DELETE  Delete cost item
│   └── match/route.ts      POST    Match items to rate cards
│
├── rate-cards/
│   ├── route.ts            GET     List user's rate cards
│   │                       POST    Upload rate card
│   └── [id]/route.ts       GET     Get rate card details
│                           DELETE  Delete rate card
│
├── export/
│   ├── excel/route.ts      POST    Generate Excel export
│   └── odoo/route.ts       POST    Push to Odoo CRM
│
└── settings/
    └── odoo/
        ├── route.ts        GET     Get Odoo config status
        │                   PUT     Update Odoo config
        └── test/route.ts   POST    Test Odoo connection
```

---

### API Contracts

#### `POST /api/tenders/import`
Import tenders from CSV/Excel file.

**Request:**
```typescript
// FormData
{
  file: File  // .csv, .xlsx, .xls
}
```

**Response:**
```typescript
{
  success: true,
  imported: number,
  tenders: Tender[],
  errors?: { row: number, message: string }[]
}
```

---

#### `POST /api/ai/extract`
Extract tender data from PDF using AI.

**Request:**
```typescript
// FormData
{
  file: File  // .pdf, max 20MB
}
```

**Response:**
```typescript
{
  success: true,
  extraction: {
    // Extracted fields
    entity: string | null,
    tender_title: string | null,
    tender_number: string | null,
    deadline: string | null,  // ISO date
    estimated_value: number | null,
    description: string | null,
    requirements: string[],
    line_items: {
      description: string,
      quantity: number | null,
      unit: string | null,
      confidence: number
    }[],
    
    // Confidence per field
    confidence: {
      entity: number,
      tender_title: number,
      tender_number: number,
      deadline: number,
      estimated_value: number
    },
    
    // Evidence (quotes from document)
    evidence: {
      entity: string | null,
      tender_title: string | null,
      tender_number: string | null,
      deadline: string | null,
      estimated_value: string | null
    },
    
    // Metadata
    overall_confidence: number,
    warnings: string[],
    not_found: string[],
    
    // Cache info
    cached: boolean,
    model_used: string,
    processing_time_ms: number
  },
  
  // Validation results
  validation: {
    valid: boolean,
    issues: string[],
    requires_review: boolean
  },
  
  // Storage path for the PDF
  file_path: string
}
```

---

#### `POST /api/evaluation`
Calculate and save evaluation for a tender.

**Request:**
```typescript
{
  tender_id: string,
  criteria_scores: {
    [key: string]: {
      score: number,    // 0-100
      weight: number,   // Percentage
      notes?: string
    }
  },
  preset_id?: string,
  manual_override?: 'proceed' | 'review' | 'skip',
  override_reason?: string
}
```

**Response:**
```typescript
{
  success: true,
  evaluation: Evaluation,
  tender: {
    id: string,
    evaluation_score: number,
    recommendation: 'proceed' | 'review' | 'skip'
  }
}
```

---

#### `POST /api/costs/match`
Match tender line items to rate card prices.

**Request:**
```typescript
{
  tender_id: string,
  items: {
    description: string,
    quantity: number,
    unit: string
  }[]
}
```

**Response:**
```typescript
{
  success: true,
  matches: {
    description: string,
    quantity: number,
    unit: string,
    
    // Match result
    matched: boolean,
    rate_card_item?: {
      id: string,
      item_name: string,
      unit_price: number,
      rate_card_name: string
    },
    suggested_price?: number,
    match_confidence: number,  // 0-100
    
    // If no match
    requires_manual_price: boolean
  }[]
}
```

---

#### `POST /api/export/excel`
Generate Excel file with tender data.

**Request:**
```typescript
{
  tender_ids: string[]  // One or more tenders
}
```

**Response:**
```typescript
// Returns Excel file as blob
// Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// Content-Disposition: attachment; filename="etmam-export-{timestamp}.xlsx"
```

**Excel Structure:**
- Sheet 1: "بيانات المنافسة" — All required CRM fields
- Sheet 2: "التقييم" — Evaluation criteria, scores, weights
- Sheet 3: "التكاليف" — Cost breakdown with totals

---

#### `POST /api/export/odoo`
Push tender(s) to Odoo CRM.

**Request:**
```typescript
{
  tender_ids: string[]
}
```

**Response:**
```typescript
{
  success: true,
  results: {
    tender_id: string,
    status: 'created' | 'updated' | 'error',
    odoo_lead_id?: number,
    odoo_url?: string,  // Direct link to opportunity
    error?: string
  }[]
}
```

---

#### `POST /api/settings/odoo/test`
Test Odoo connection.

**Request:**
```typescript
{
  url: string,
  db: string,
  username: string,
  api_key: string
}
```

**Response:**
```typescript
{
  success: true,
  connected: boolean,
  error?: string,
  server_version?: string,
  database_name?: string
}
```

---

## 3. Server-Side Logic

### AI Extraction Flow

**Strategy: Section-Targeted Extraction**

Saudi government tenders follow a standardized 12-section template (Etimad platform). See **TENDER-STRUCTURE-v3.0-VERIFIED.md** for the full section map. Instead of scanning entire documents blindly, we target specific sections:

| Section | Key Data | Priority |
|---------|----------|----------|
| القسم الأول (المقدمة) | الجهة، رقم المنافسة، المواعيد | HIGH |
| القسم السابع (نطاق العمل المفصل) | BOQ جدول الكميات | CRITICAL |
| القسم الثامن (المواصفات) | SOW نطاق العمل التفصيلي | CRITICAL |

See **TENDER-STRUCTURE-v3.0-VERIFIED.md** for full section mapping.

```typescript
// lib/ai/provider.ts
export async function extractFromPDF(
  fileBuffer: Buffer,
  fileName: string
): Promise<ExtractionResult> {
  // 1. Check cache first
  const fileHash = await sha256(fileBuffer)
  const cached = await getCachedExtraction(fileHash)
  if (cached) {
    return { ...cached, cached: true }
  }
  
  // 2. Select provider based on .env
  const provider = process.env.AI_PROVIDER === 'groq' 
    ? groqProvider 
    : geminiProvider
  
  // 3. Call AI with SECTION-TARGETED prompt
  //    Instructs AI to locate specific sections first
  const startTime = Date.now()
  const rawResult = await provider.extract(fileBuffer, SECTION_TARGETED_PROMPT)
  const processingTime = Date.now() - startTime
  
  // 4. Parse and validate with Zod
  const parsed = extractionSchema.safeParse(rawResult)
  if (!parsed.success) {
    throw new ExtractionError('Invalid AI response', parsed.error)
  }
  
  // 5. Deterministic validation
  const validated = validateExtraction(parsed.data)
  
  // 6. Cache the result
  await cacheExtraction(fileHash, fileName, {
    ...validated.result,
    model_used: provider.modelName,
    processing_time_ms: processingTime
  })
  
  return {
    extraction: validated.result,
    validation: {
      valid: validated.valid,
      issues: validated.issues,
      requires_review: validated.requiresReview
    },
    cached: false,
    model_used: provider.modelName,
    processing_time_ms: processingTime
  }
}
```

**Section-Targeted Prompt (Arabic):**
```typescript
const SECTION_TARGETED_PROMPT = `
أنت مساعد متخصص في تحليل كراسات الشروط والمواصفات السعودية.
الوثيقة تتبع الهيكل المعياري لمنصة اعتماد (12 قسم، راجع TENDER-STRUCTURE-v3.0-VERIFIED.md).

المطلوب:
1. حدد القسم الأول (المقدمة) واستخرج:
   - الجهة الحكومية
   - رقم المنافسة
   - عنوان المنافسة  
   - الموعد النهائي لتقديم العروض

2. حدد القسم السابع (نطاق العمل المفصل) واستخرج:
   - وصف المشروع
   - جدول الكميات (كل بند مع الوصف والكمية والوحدة)
   - القيمة التقديرية (إن وجدت)

3. حدد القسم الثامن (المواصفات) واستخرج:
   - متطلبات العمالة الرئيسية
   - المواد والمعدات الأساسية

القواعد الصارمة:
1. استخرج فقط المعلومات الموجودة فعلياً في الوثيقة
2. إذا لم تجد المعلومة، اكتب null — لا تخمن أبداً
3. اذكر النص الأصلي كدليل لكل حقل
4. أعط درجة ثقة (0-100) لكل حقل
5. اذكر رقم الصفحة التي وجدت فيها المعلومة
6. إذا كان هناك تعارض أو غموض، سجله في التحذيرات
7. لا تضف معلومات من خارج الوثيقة
`;
```
```

### Evaluation Calculation

```typescript
// lib/evaluation.ts
export function calculateScore(
  criteriaScores: Record<string, CriterionScore>
): { score: number, recommendation: 'proceed' | 'review' | 'skip' } {
  // Weighted average
  let totalWeight = 0
  let weightedSum = 0
  
  for (const [key, criterion] of Object.entries(criteriaScores)) {
    weightedSum += criterion.score * criterion.weight
    totalWeight += criterion.weight
  }
  
  // Normalize (weights should sum to 100, but handle edge cases)
  const score = Math.round(weightedSum / totalWeight)
  
  // Recommendation thresholds
  let recommendation: 'proceed' | 'review' | 'skip'
  if (score >= 70) {
    recommendation = 'proceed'
  } else if (score >= 50) {
    recommendation = 'review'
  } else {
    recommendation = 'skip'
  }
  
  return { score, recommendation }
}
```

### Rate Card Matching

```typescript
// lib/rate-card-matcher.ts
export async function matchToRateCards(
  items: { description: string, quantity: number, unit: string }[],
  userId: string
): Promise<MatchResult[]> {
  // Get all user's rate card items
  const rateCardItems = await getRateCardItems(userId)
  
  return items.map(item => {
    // Simple fuzzy matching on description
    const matches = rateCardItems
      .map(rci => ({
        item: rci,
        score: fuzzyScore(item.description, rci.item_name)
      }))
      .filter(m => m.score > 0.6)  // Threshold
      .sort((a, b) => b.score - a.score)
    
    if (matches.length > 0) {
      const best = matches[0]
      return {
        ...item,
        matched: true,
        rate_card_item: best.item,
        match_confidence: Math.round(best.score * 100),
        requires_manual_price: false
      }
    }
    
    return {
      ...item,
      matched: false,
      match_confidence: 0,
      requires_manual_price: true
    }
  })
}

function fuzzyScore(needle: string, haystack: string): number {
  // Normalize Arabic text
  const n = normalizeArabic(needle.toLowerCase())
  const h = normalizeArabic(haystack.toLowerCase())
  
  // Check for substring match
  if (h.includes(n) || n.includes(h)) {
    return 0.9
  }
  
  // Levenshtein distance based score
  const distance = levenshtein(n, h)
  const maxLen = Math.max(n.length, h.length)
  return 1 - (distance / maxLen)
}
```

### Odoo Integration

```typescript
// lib/odoo.ts
import xmlrpc from 'xmlrpc'

export class OdooClient {
  private url: string
  private db: string
  private uid: number | null = null
  private apiKey: string
  
  async authenticate(): Promise<boolean> {
    const client = xmlrpc.createClient({
      url: `${this.url}/xmlrpc/2/common`
    })
    
    this.uid = await new Promise((resolve, reject) => {
      client.methodCall('authenticate', [
        this.db, 
        this.username, 
        this.apiKey, 
        {}
      ], (err, value) => {
        if (err) reject(err)
        else resolve(value)
      })
    })
    
    return this.uid !== false
  }
  
  async createLead(tender: Tender, evaluation: Evaluation): Promise<number> {
    if (!this.uid) await this.authenticate()
    
    const client = xmlrpc.createClient({
      url: `${this.url}/xmlrpc/2/object`
    })
    
    // Check if entity exists as partner
    let partnerId = await this.findOrCreatePartner(tender.entity)
    
    // Create CRM lead with competition-required fields
    const leadData = {
      name: tender.tender_title,
      partner_id: partnerId,
      expected_revenue: tender.proposed_price || tender.estimated_value,
      date_deadline: tender.deadline,
      
      // Custom fields (mapped per competition requirements)
      x_tender_number: tender.tender_number,
      x_evaluation_score: evaluation.overall_score,
      x_recommendation: evaluation.manual_override || evaluation.auto_recommendation,
      
      // Description with full details
      description: this.formatDescription(tender, evaluation)
    }
    
    const leadId = await new Promise<number>((resolve, reject) => {
      client.methodCall('execute_kw', [
        this.db, this.uid, this.apiKey,
        'crm.lead', 'create', [leadData]
      ], (err, value) => {
        if (err) reject(err)
        else resolve(value)
      })
    })
    
    return leadId
  }
}
```

---

## 4. Error Handling

### Standard Error Response
```typescript
// All API errors follow this format
{
  success: false,
  error: {
    code: string,       // Machine-readable code
    message: string,    // Arabic user-facing message
    details?: any       // Additional debug info (dev only)
  }
}
```

### Error Codes
| Code | HTTP | Arabic Message |
|---|---|---|
| `AUTH_REQUIRED` | 401 | يجب تسجيل الدخول للمتابعة |
| `FORBIDDEN` | 403 | ليس لديك صلاحية لهذا الإجراء |
| `NOT_FOUND` | 404 | لم يتم العثور على العنصر المطلوب |
| `VALIDATION_ERROR` | 400 | بيانات غير صالحة |
| `FILE_TOO_LARGE` | 413 | حجم الملف يتجاوز الحد المسموح |
| `INVALID_FILE_TYPE` | 415 | نوع الملف غير مدعوم |
| `AI_EXTRACTION_FAILED` | 500 | تعذر تحليل الوثيقة |
| `AI_RATE_LIMITED` | 429 | تم تجاوز حد الاستخدام، حاول لاحقاً |
| `ODOO_CONNECTION_FAILED` | 502 | تعذر الاتصال بـ Odoo |
| `INTERNAL_ERROR` | 500 | حدث خطأ غير متوقع |

---

## 5. Proxy (route protection)

Next.js 16+ uses **proxy.ts** (not middleware.ts). Use `@supabase/ssr` only; do not use `@supabase/auth-helpers-nextjs` or `createMiddlewareClient`.

### Auth proxy
```typescript
// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  if (isProtectedPath(pathname) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isPublicAuthPath(pathname) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico|jpg|jpeg|gif|webp)$).*)'],
}
```

Session refresh lives in `lib/supabase/middleware.ts` using **createServerClient** from `@supabase/ssr` with cookie get/set (same pattern as repo `src/lib/supabase/middleware.ts`).

---

## 6. Seed Data

For development and demo, we include sample data:

```sql
-- supabase/seed.sql

-- Sample evaluation preset (default)
INSERT INTO evaluation_presets (id, user_id, name, is_default, criteria)
VALUES (
  'preset-default',
  'user-demo-id',  -- Replace with actual user ID after signup
  'المعايير الافتراضية',
  true,
  '[
    {"key": "alignment", "name": "التوافق", "description": "مدى توافق المنافسة مع قدرات الشركة", "weight": 25},
    {"key": "profitability", "name": "الربحية", "description": "هامش الربح المتوقع", "weight": 25},
    {"key": "timeline", "name": "الجدول الزمني", "description": "واقعية الموعد النهائي", "weight": 20},
    {"key": "competition", "name": "المنافسة", "description": "عدد وقوة المنافسين", "weight": 15},
    {"key": "strategic_value", "name": "القيمة الاستراتيجية", "description": "التوافق مع أهداف الشركة", "weight": 15}
  ]'::jsonb
);
```

Sample files in `docs/sample-data/`:
- `sample-tenders.csv` — 3 sample tenders for CSV import testing
- `sample-rate-card.xlsx` — 50 sample items (IT equipment)
- `sample-rfp.pdf` — Real-looking كراسة شروط for AI extraction testing
