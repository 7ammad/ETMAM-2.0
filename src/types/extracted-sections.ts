/**
 * Structured extraction of 5 vendor-critical tender sections.
 * Stored as JSONB in tenders.extracted_sections.
 */

export interface BOQItem {
  seq: number;
  category: string | null;
  description: string;
  specifications: string | null;
  unit: string | null;
  quantity: number | null;
  confidence: number;
}

export interface RequiredStaff {
  role: string;
  qualification: string | null;
  count: number | null;
}

export interface ExtractedSections {
  /** Schema version for future migrations */
  _version: 1;

  /** جداول الكميات والأسعار (BOQ) — Section 7 */
  boq: {
    pricing_type: "lump_sum" | "unit_based" | "mixed" | null;
    items: BOQItem[];
    total_items_count: number | null;
    confidence: number;
  } | null;

  /** المواصفات الفنية — Section 8 */
  technical_specs: {
    scope_of_work: string | null;
    referenced_standards: string[];
    materials: string[];
    equipment: string[];
    deliverables: string[];
    execution_methodology: string | null;
    confidence: number;
  } | null;

  /** المتطلبات التأهيلية — Section 3/5 */
  qualifications: {
    contractor_classification: string | null;
    required_certifications: string[];
    required_licenses: string[];
    minimum_experience_years: number | null;
    similar_projects_required: number | null;
    required_staff: RequiredStaff[];
    local_content_requirement: number | null;
    confidence: number;
  } | null;

  /** شروط التعاقد والضمانات — Section 6 */
  contract_terms: {
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
  } | null;

  /** آلية التقييم — Section 5/9 */
  evaluation_method: {
    method: "lowest_price" | "quality_and_cost" | "quality_only" | null;
    financial_weight: number | null;
    technical_weight: number | null;
    min_technical_score: number | null;
    scoring_formula: string | null;
    local_content_target_percent: number | null;
    evaluation_criteria: string[];
    confidence: number;
  } | null;
}

/** Arabic labels for UI display */
export const SECTION_LABELS: Record<keyof Omit<ExtractedSections, "_version">, string> = {
  boq: "جداول الكميات والأسعار",
  technical_specs: "المواصفات الفنية",
  qualifications: "المتطلبات التأهيلية",
  contract_terms: "شروط التعاقد والضمانات",
  evaluation_method: "آلية التقييم",
};
