/**
 * Groq AI provider — backup if Gemini is unavailable.
 * Model: llama-3.3-70b-versatile (decent Arabic, fast inference).
 */
import Groq from "groq-sdk";
import type { AIProvider, AIAnalysisResult, ExtractionResult } from "./provider";
import { buildAnalysisPrompt } from "./prompts";
import { extractJSON, analysisResponseSchema } from "./parser";
import { withRetry, withTimeout, classifyError } from "./retry";

const AI_TIMEOUT_MS = 30_000;

export class GroqProvider implements AIProvider {
  readonly modelName = "llama-3.3-70b-versatile";
  private client: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }
    this.client = new Groq({ apiKey });
  }

  async analyze(
    tenderContent: string,
    weights: Record<string, number>
  ): Promise<AIAnalysisResult> {
    const prompt = buildAnalysisPrompt(tenderContent, weights);

    try {
      const completion = await withRetry(
        () =>
          withTimeout(
            this.client.chat.completions.create({
              model: this.modelName,
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert Saudi government tender analyst. Respond with JSON only.",
                },
                { role: "user", content: prompt },
              ],
              temperature: 0.3,
              max_tokens: 2000,
              response_format: { type: "json_object" },
            }),
            AI_TIMEOUT_MS
          ),
        { maxRetries: 1, baseDelayMs: 2000 }
      );

      const text = completion.choices[0]?.message?.content ?? "";
      const json = extractJSON(text);
      const parsed = analysisResponseSchema.parse(JSON.parse(json));
      return parsed;
    } catch (err) {
      throw classifyError(err);
    }
  }

  async extractFromPDF(
    _fileBuffer: Buffer,
    _fileName: string
  ): Promise<ExtractionResult> {
    // Groq doesn't support direct PDF input — return error state.
    // In production, we'd use a PDF-to-text converter first.
    throw new Error(
      "Groq provider does not support direct PDF extraction. Use Gemini or convert PDF to text first."
    );
  }
}
