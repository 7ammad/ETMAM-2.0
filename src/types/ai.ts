export type ConfidenceLevel = "high" | "medium" | "low";
export type AnalysisStatus = "pending" | "analyzing" | "completed" | "failed";
export type Recommendation = "pursue" | "review" | "skip";
export type EvidenceRelevance = "supporting" | "concerning" | "neutral";

export interface TenderAnalysis {
  id: string;
  tender_id: string;
  overall_score: number;
  confidence: ConfidenceLevel;
  scores: Record<string, CategoryScore>;
  evidence: EvidenceQuote[];
  recommendation: Recommendation;
  recommendation_reasoning: string;
  red_flags: string[];
  key_dates: string[];
  model_used: string;
  status: AnalysisStatus;
  created_at: string;
  updated_at: string;
}

export interface CategoryScore {
  score: number;
  reasoning: string;
}

export interface EvidenceQuote {
  text: string;
  relevance: EvidenceRelevance;
  source: string;
}

export interface ExtractionResult {
  entity: string | null;
  tender_title: string | null;
  tender_number: string | null;
  deadline: string | null;
  estimated_value: number | null;
  description: string | null;
  requirements: string[];
  line_items: ExtractedLineItem[];
  confidence: Record<string, number>;
  evidence: Record<string, string | null>;
  overall_confidence: number;
  warnings: string[];
  not_found: string[];
  cached: boolean;
  model_used: string;
  processing_time_ms: number;
}

export interface ExtractedLineItem {
  description: string;
  quantity: number | null;
  unit: string | null;
  confidence: number;
}
