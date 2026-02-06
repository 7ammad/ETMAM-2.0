/**
 * Gemini AI provider — uses @google/generative-ai SDK.
 * Model: gemini-2.5-flash (fast, good Arabic support, free tier via AI Studio).
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIAnalysisResult, ExtractionResult } from "./provider";
import { buildAnalysisPrompt, SECTION_TARGETED_EXTRACTION_PROMPT } from "./prompts";
import {
  extractJSON,
  analysisResponseSchema,
  extractionResponseSchema,
} from "./parser";

export class GeminiProvider implements AIProvider {
  readonly modelName = "gemini-2.5-flash";
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyze(
    tenderContent: string,
    weights: Record<string, number>
  ): Promise<AIAnalysisResult> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    });

    const prompt = buildAnalysisPrompt(tenderContent, weights);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = extractJSON(text);
    const parsed = analysisResponseSchema.parse(JSON.parse(json));

    return parsed;
  }

  async extractFromPDF(
    fileBuffer: Buffer,
    _fileName: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 4000,
      },
    });

    const result = await model.generateContent([
      { text: SECTION_TARGETED_EXTRACTION_PROMPT },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: fileBuffer.toString("base64"),
        },
      },
    ]);

    const text = result.response.text();
    const json = extractJSON(text);
    const parsed = extractionResponseSchema.parse(JSON.parse(json));

    return {
      ...parsed,
      description: parsed.description ?? null,
      cached: false,
      model_used: this.modelName,
      processing_time_ms: Date.now() - startTime,
    };
  }
}
