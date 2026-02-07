/**
 * Internal types for the deterministic pre-extraction phase (Phase 1).
 * These map closely to ExtractedSections but include source tracking.
 */

export interface DetectedSection {
  sectionNumber: number;
  arabicName: string;
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface PreExtractedField<T> {
  value: T;
  source: "regex" | "heuristic" | "heading_proximity";
  evidence: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Section sub-results
// ---------------------------------------------------------------------------

export interface PreExtractedIntroduction {
  entity: PreExtractedField<string> | null;
  tender_number: PreExtractedField<string> | null;
  tender_title: PreExtractedField<string> | null;
  deadline: PreExtractedField<string> | null;
  estimated_value: PreExtractedField<number> | null;
  description: PreExtractedField<string> | null;
  hijri_dates: PreExtractedField<string>[];
}

export interface PreExtractedBOQItem {
  seq: number;
  category: string | null;
  description: string;
  specifications: string | null;
  unit: string | null;
  quantity: number | null;
  confidence: number;
}

export interface PreExtractedBOQ {
  pricing_type: "lump_sum" | "unit_based" | "mixed" | null;
  items: PreExtractedBOQItem[];
  total_items_count: number | null;
  confidence: number;
}

export interface PreExtractedTechnicalSpecs {
  scope_of_work: string | null;
  referenced_standards: string[];
  materials: string[];
  equipment: string[];
  deliverables: string[];
  execution_methodology: string | null;
  confidence: number;
}

export interface PreExtractedContractTerms {
  initial_guarantee_percent: number | null;
  final_guarantee_percent: number | null;
  delay_penalty_percent: number | null;
  delay_penalty_max_percent: number | null;
  execution_period_days: number | null;
  warranty_period_days: number | null;
  payment_terms: string | null;
  advance_payment_percent: number | null;
  retention_percent: number | null;
  insurance_required: boolean | null;
  confidence: number;
}

export interface PreExtractedEvaluation {
  method: "lowest_price" | "quality_and_cost" | "quality_only" | null;
  financial_weight: number | null;
  technical_weight: number | null;
  min_technical_score: number | null;
  scoring_formula: string | null;
  local_content_target_percent: number | null;
  evaluation_criteria: string[];
  confidence: number;
}

export interface PreExtractedQualifications {
  contractor_classification: string | null;
  required_certifications: string[];
  required_licenses: string[];
  minimum_experience_years: number | null;
  similar_projects_required: number | null;
  required_staff: {
    role: string;
    qualification: string | null;
    count: number | null;
  }[];
  local_content_requirement: number | null;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Top-level result
// ---------------------------------------------------------------------------

export interface PreExtractionResult {
  raw_text: string;
  page_count: number;
  detected_sections: DetectedSection[];
  introduction: PreExtractedIntroduction;
  boq: PreExtractedBOQ;
  /** Raw text of the BOQ section (for AI refinement priority) */
  boq_section_text: string;
  technical_specs: PreExtractedTechnicalSpecs;
  contract_terms: PreExtractedContractTerms;
  evaluation: PreExtractedEvaluation;
  qualifications: PreExtractedQualifications;
  overall_confidence: number;
  extraction_time_ms: number;
  warnings: string[];
}
