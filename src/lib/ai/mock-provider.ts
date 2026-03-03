/**
 * Mock AI provider — used when MOCK_AI=true or no API keys are set.
 * Allows local dev and tests without Gemini/Groq credentials.
 */
import type { AIProvider, AIAnalysisResult, ExtractionResult } from "./provider";

export class MockProvider implements AIProvider {
  readonly modelName = "mock";

  async analyze(
    _tenderContent: string,
    _weights: Record<string, number>
  ): Promise<AIAnalysisResult> {
    return {
      overall_score: 65,
      confidence: "medium",
      scores: {
        deliverable_categorization: { score: 85, reasoning: "Mock: أغلب البنود تراخيص." },
        competitive_feasibility: { score: 75, reasoning: "Mock: جدوى تنافسية متوسطة." },
        risk_assessment: { score: 90, reasoning: "Mock: مخاطر قليلة." },
        company_fit: { score: 80, reasoning: "Mock: توافق ممتاز." },
      },
      parametric_estimate: {
        estimated_min_value: 300000,
        estimated_max_value: 450000,
        estimation_rationale: "Mock: 1 HW item * 300K margin 18%",
      },
      evidence: [],
      recommendation: "review",
      recommendation_reasoning: "Mock provider — configure DEEPSEEK_API_KEY, GEMINI_API_KEY or GROQ_API_KEY for real analysis.",
      red_flags: [],
      key_dates: [],
    };
  }

  async extractFromPDF(
    _fileBuffer: Buffer,
    _fileName: string
  ): Promise<ExtractionResult> {
    return {
      entity: null,
      tender_title: null,
      tender_number: null,
      deadline: null,
      estimated_value: null,
      description: null,
      requirements: [],
      line_items: [],
      extracted_sections: null,
      confidence: {},
      evidence: {},
      overall_confidence: 0,
      warnings: ["Mock provider — no API key. Set DEEPSEEK_API_KEY (primary), GEMINI_API_KEY or GROQ_API_KEY, or use MOCK_AI for stubs."],
      not_found: ["entity", "tender_title", "tender_number", "deadline", "estimated_value"],
      cached: false,
      model_used: "mock",
      processing_time_ms: 0,
    };
  }
}
