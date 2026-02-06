/**
 * AI provider factory — selects Gemini or Groq based on AI_PROVIDER env var.
 * Used by API routes for PDF extraction and tender analysis.
 */

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

export function getAIProvider(preferred?: "gemini" | "groq"): AIProvider {
  if (process.env.MOCK_AI === "true") {
    const { MockProvider } = require("./mock-provider");
    return new MockProvider();
  }

  const provider = preferred || process.env.AI_PROVIDER || "gemini";
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  if (provider === "groq" && hasGroq) {
    const { GroqProvider } = require("./groq");
    return new GroqProvider();
  }
  if (provider === "gemini" && hasGemini) {
    const { GeminiProvider } = require("./gemini");
    return new GeminiProvider();
  }
  if (hasGemini) {
    const { GeminiProvider } = require("./gemini");
    return new GeminiProvider();
  }
  if (hasGroq) {
    const { GroqProvider } = require("./groq");
    return new GroqProvider();
  }

  // No API keys — return mock so local dev and tests work without credentials
  const { MockProvider } = require("./mock-provider");
  return new MockProvider();
}
