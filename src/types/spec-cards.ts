/**
 * Spec Card and Product Nomination types (Phase 3.4).
 * Spec cards hold structured technical specifications per BOQ item.
 * Product nominations are candidate products matched against spec cards.
 */

// --- Spec Parameters ---
export interface SpecParameter {
  name: string;
  value: string;
  unit: string | null;
  is_mandatory: boolean;
}

// --- Spec Cards ---
export interface SpecCard {
  id: string;
  tender_id: string;
  user_id: string;
  boq_seq: number;
  boq_description: string;
  category: string | null;
  parameters: SpecParameter[];
  referenced_standards: string[];
  approved_brands: string[];
  constraints: string[];
  notes: string | null;
  status: 'draft' | 'approved' | 'rejected';
  ai_confidence: number;
  model_used: string | null;
  user_edited: boolean;
  created_at: string;
  updated_at: string;
}

export type SpecCardInsert = Omit<SpecCard, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string;
};
export type SpecCardUpdate = Partial<Omit<SpecCard, 'id' | 'tender_id' | 'user_id'>>;

// --- Compliance Details ---
export interface ComplianceDetail {
  parameter: string;
  meets_spec: boolean;
  note: string;
}

// --- Product Nominations ---
export interface ProductNomination {
  id: string;
  spec_card_id: string;
  tender_id: string;
  user_id: string;
  product_name: string;
  brand: string | null;
  model_sku: string | null;
  distributor: string | null;
  unit_price: number | null;
  currency: string;
  source: 'rate_card' | 'web_search' | 'manual';
  rate_card_item_id: string | null;
  source_url: string | null;
  source_notes: string | null;
  compliance_score: number;
  compliance_details: ComplianceDetail[];
  is_selected: boolean;
  rank: number;
  created_at: string;
  updated_at: string;
}

export type ProductNominationInsert = Omit<ProductNomination, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string;
};
export type ProductNominationUpdate = Partial<Omit<ProductNomination, 'id' | 'tender_id' | 'user_id' | 'spec_card_id'>>;
