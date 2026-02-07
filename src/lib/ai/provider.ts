/**
 * AI provider factory — primary: DeepSeek, second: Gemini, fallback: Groq.
 * Selection: preferred arg, then AI_PROVIDER env, then first available key (deepseek → gemini → groq).
 * Used by API routes for PDF extraction and tender analysis.
 */

import type { ExtractedSections } from "@/types/extracted-sections";

export interface AIAnalysisResult {
  overall_score: number;
  confidence: "high" | "medium" | "low";
  scores: Record<
    string,
    { score: number; reasoning: string }
  >;
  evidence: {
    text: string;
    relevance: "supporting" | "concerning" | "neutral";
    source: string;
  }[];
  recommendation: "pursue" | "review" | "skip";
  recommendation_reasoning: string;
  red_flags: string[];
  key_dates: string[];
}

export interface ExtractionResult {
  entity: string | null;
  tender_title: string | null;
  tender_number: string | null;
  deadline: string | null;
  estimated_value: number | null;
  description: string | null;
  requirements: string[];
  line_items: {
    description: string;
    quantity: number | null;
    unit: string | null;
    confidence: number;
  }[];
  extracted_sections?: ExtractedSections | null;
  confidence: Record<string, number>;
  evidence: Record<string, string | null>;
  overall_confidence: number;
  warnings: string[];
  not_found: string[];
  cached: boolean;
  model_used: string;
  processing_time_ms: number;
}

export interface AIProvider {
  readonly modelName: string;
  analyze(tenderContent: string, weights: Record<string, number>): Promise<AIAnalysisResult>;
  extractFromPDF(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult>;
}

export type AIProviderId = "deepseek" | "gemini" | "groq";

export async function getAIProvider(preferred?: AIProviderId): Promise<AIProvider> {
  if (process.env.MOCK_AI === "true") {
    const { MockProvider } = await import("./mock-provider");
    return new MockProvider();
  }

  const provider = (preferred || process.env.AI_PROVIDER || "deepseek") as AIProviderId;
  const hasDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  if (provider === "deepseek" && hasDeepSeek) {
    const { DeepSeekProvider } = await import("./deepseek");
    return new DeepSeekProvider();
  }
  if (provider === "gemini" && hasGemini) {
    const { GeminiProvider } = await import("./gemini");
    return new GeminiProvider();
  }
  if (provider === "groq" && hasGroq) {
    const { GroqProvider } = await import("./groq");
    return new GroqProvider();
  }
  // Fallback order: DeepSeek → Gemini → Groq
  if (hasDeepSeek) {
    const { DeepSeekProvider } = await import("./deepseek");
    return new DeepSeekProvider();
  }
  if (hasGemini) {
    const { GeminiProvider } = await import("./gemini");
    return new GeminiProvider();
  }
  if (hasGroq) {
    const { GroqProvider } = await import("./groq");
    return new GroqProvider();
  }

  const { MockProvider } = await import("./mock-provider");
  return new MockProvider();
}
