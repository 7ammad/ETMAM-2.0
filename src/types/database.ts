/**
 * Database types aligned to BACKEND.md schema (Phase 1.2).
 * When Supabase is linked: run `pnpm exec supabase gen types typescript --project-id <ref> > src/types/database.ts` to replace with generated types.
 */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ProfileInsert; Update: ProfileUpdate };
      tenders: { Row: Tender; Insert: TenderInsert; Update: TenderUpdate };
      evaluations: { Row: Evaluation; Insert: EvaluationInsert; Update: EvaluationUpdate };
      cost_items: { Row: CostItem; Insert: CostItemInsert; Update: CostItemUpdate };
      rate_cards: { Row: RateCard; Insert: RateCardInsert; Update: RateCardUpdate };
      rate_card_items: { Row: RateCardItem; Insert: RateCardItemInsert; Update: RateCardItemUpdate };
      evaluation_presets: { Row: EvaluationPreset; Insert: EvaluationPresetInsert; Update: EvaluationPresetUpdate };
      extraction_cache: { Row: ExtractionCache; Insert: ExtractionCacheInsert; Update: ExtractionCacheUpdate };
    };
  };
}

// --- Profiles ---
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}
export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
export type ProfileUpdate = Partial<Omit<Profile, "id">>;

// --- Tenders ---
export type TenderSourceType = "csv" | "excel" | "pdf" | "manual";
export type TenderRecommendation = "proceed" | "review" | "skip";
export type TenderStatus = "new" | "evaluated" | "costed" | "exported";

export interface Tender {
  id: string;
  user_id: string;
  entity: string;
  tender_title: string;
  tender_number: string;
  deadline: string;
  estimated_value: number;
  description: string | null;
  requirements: Json;
  line_items: Json;
  source_type: TenderSourceType;
  source_file_path: string | null;
  source_file_name: string | null;
  extraction_confidence: number | null;
  extraction_warnings: Json;
  evaluation_score: number | null;
  recommendation: TenderRecommendation | null;
  total_cost: number | null;
  proposed_price: number | null;
  status: TenderStatus;
  exported_at: string | null;
  exported_to: string | null;
  odoo_lead_id: number | null;
  created_at: string;
  updated_at: string;
}
export type TenderInsert = Omit<Tender, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  requirements?: Json;
  line_items?: Json;
  extraction_warnings?: Json;
  status?: TenderStatus;
};
export type TenderUpdate = Partial<Omit<Tender, "id" | "user_id">>;

// --- Evaluations ---
export type EvaluationRecommendation = "proceed" | "review" | "skip";

export interface Evaluation {
  id: string;
  tender_id: string;
  user_id: string;
  criteria_scores: Json;
  overall_score: number;
  auto_recommendation: EvaluationRecommendation;
  manual_override: EvaluationRecommendation | null;
  override_reason: string | null;
  preset_id: string | null;
  created_at: string;
  updated_at: string;
}
export type EvaluationInsert = Omit<Evaluation, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type EvaluationUpdate = Partial<Omit<Evaluation, "id" | "tender_id" | "user_id">>;

// --- Cost items ---
export type CostItemCategory = "direct" | "indirect";
export type CostItemSource = "rate_card" | "manual" | "ai_suggested";

export interface CostItem {
  id: string;
  tender_id: string;
  user_id: string;
  category: CostItemCategory;
  subcategory: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  source: CostItemSource;
  rate_card_item_id: string | null;
  source_notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
export type CostItemInsert = Omit<CostItem, "id" | "created_at" | "updated_at"> & { id?: string; total?: number; created_at?: string; updated_at?: string };
export type CostItemUpdate = Partial<Omit<CostItem, "id" | "tender_id" | "user_id">>;

// --- Rate cards ---
export interface RateCard {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_name: string;
  item_count: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}
export type RateCardInsert = Omit<RateCard, "id" | "created_at" | "updated_at"> & { id?: string; item_count?: number; created_at?: string; updated_at?: string };
export type RateCardUpdate = Partial<Omit<RateCard, "id" | "user_id">>;

// --- Rate card items ---
export interface RateCardItem {
  id: string;
  rate_card_id: string;
  user_id: string;
  item_name: string;
  category: string | null;
  unit: string;
  unit_price: number;
  created_at: string;
}
export type RateCardItemInsert = Omit<RateCardItem, "id" | "created_at"> & { id?: string; created_at?: string };
export type RateCardItemUpdate = Partial<Omit<RateCardItem, "id" | "rate_card_id" | "user_id">>;

// --- Evaluation presets ---
export interface Criterion {
  key: string;
  name: string;
  description: string;
  weight: number;
}

export interface EvaluationPreset {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  criteria: Json; // Criterion[]
  created_at: string;
  updated_at: string;
}
export type EvaluationPresetInsert = Omit<EvaluationPreset, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type EvaluationPresetUpdate = Partial<Omit<EvaluationPreset, "id" | "user_id">>;

// --- Extraction cache ---
export interface ExtractionCache {
  id: string;
  file_hash: string;
  file_name: string | null;
  extraction_result: Json;
  model_used: string;
  processing_time_ms: number | null;
  token_count: number | null;
  created_at: string;
}
export type ExtractionCacheInsert = Omit<ExtractionCache, "id" | "created_at"> & { id?: string; created_at?: string };
export type ExtractionCacheUpdate = Partial<Omit<ExtractionCache, "id" | "file_hash">>;
