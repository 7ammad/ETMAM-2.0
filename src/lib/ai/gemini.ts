/**
 * Gemini AI provider — uses @google/generative-ai SDK.
 * Model: gemini-2.5-flash (fast, good Arabic support, free tier via AI Studio).
 *
 * Two-phase extraction pipeline:
 *   Phase 1: Deterministic pre-extraction (regex/heuristics, no API call)
 *   Phase 2: AI refinement (text-only, reviews pre-extracted data)
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIAnalysisResult, ExtractionResult } from "./provider";
import { buildAnalysisPrompt, buildPhase2Prompt, buildPdfBinaryPrompt } from "./prompts";
import {
  extractJSON,
  normalizeExtractionResponse,
  analysisResponseSchema,
  extractionResponseSchema,
} from "./parser";
import { withRetry, withTimeout, classifyError, AIError } from "./retry";
import {
  runDeterministicExtraction,
  type PreExtractionResult,
} from "@/lib/pdf";

const AI_TIMEOUT_MS = 30_000;
const PDF_TIMEOUT_MS = 120_000;

/**
 * Attempt to repair JSON truncated by MAX_TOKENS.
 * Closes open strings, arrays, and objects so JSON.parse succeeds.
 */
function repairTruncatedJSON(json: string): Record<string, unknown> | null {
  let attempt = json.trim();
  attempt = attempt.replace(/,\s*"[^"]*"?\s*:\s*"?[^"]*$/, "");
  const quoteCount = (attempt.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) attempt += '"';
  const opens: string[] = [];
  for (const ch of attempt) {
    if (ch === "{" || ch === "[") opens.push(ch);
    else if (ch === "}" && opens.at(-1) === "{") opens.pop();
    else if (ch === "]" && opens.at(-1) === "[") opens.pop();
  }
  while (opens.length) {
    const open = opens.pop();
    attempt += open === "{" ? "}" : "]";
  }
  try {
    return JSON.parse(attempt) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Check if BOQ items have suspicious patterns (all identical descriptions).
 * Returns true if the BOQ data should be discarded and re-extracted by AI.
 */
function hasSuspiciousBOQ(pre: PreExtractionResult): boolean {
  const items = pre.boq.items;
  if (items.length < 2) return false;
  const descriptions = new Set(items.map((it) => it.description.trim()));
  return descriptions.size === 1;
}

/**
 * Convert Phase 1 pre-extraction result to the JSON shape the AI prompt expects.
 */
function convertPreExtractionToAIInput(
  pre: PreExtractionResult
): { json: Record<string, unknown>; extraWarnings: string[] } {
  const extraWarnings: string[] = [];

  // Detect suspicious BOQ: all descriptions identical → likely column mapping error
  let boq: Record<string, unknown> | null = null;
  if (pre.boq.items.length > 0) {
    if (hasSuspiciousBOQ(pre)) {
      extraWarnings.push(
        `⚠️ جميع أوصاف بنود الكميات متطابقة ("${pre.boq.items[0].description}") — محتمل خطأ في تعيين الأعمدة، أعد الاستخراج من النص الخام`
      );
      boq = null; // Force AI to re-extract
    } else {
      // Cap BOQ items to 25 to avoid overwhelming the AI context window
      const cappedBoq = { ...pre.boq };
      if (cappedBoq.items.length > 25) {
        cappedBoq.items = cappedBoq.items.slice(0, 25);
        cappedBoq.total_items_count = pre.boq.items.length;
      }
      boq = cappedBoq as unknown as Record<string, unknown>;
    }
  }

  return {
    json: {
      entity: pre.introduction.entity?.value ?? null,
      tender_title: pre.introduction.tender_title?.value ?? null,
      tender_number: pre.introduction.tender_number?.value ?? null,
      deadline: pre.introduction.deadline?.value ?? null,
      estimated_value: pre.introduction.estimated_value?.value ?? null,
      description: pre.introduction.description?.value ?? null,
      requirements: [],
      line_items: [],
      extracted_sections: {
        _version: 1,
        boq,
        technical_specs:
          pre.technical_specs.confidence > 15 ? pre.technical_specs : null,
        qualifications:
          pre.qualifications.confidence > 15 ? pre.qualifications : null,
        contract_terms:
          pre.contract_terms.confidence > 15 ? pre.contract_terms : null,
        evaluation_method:
          pre.evaluation.confidence > 15 ? pre.evaluation : null,
      },
      confidence: {
        entity: pre.introduction.entity?.confidence ?? 0,
        tender_title: pre.introduction.tender_title?.confidence ?? 0,
        tender_number: pre.introduction.tender_number?.confidence ?? 0,
        deadline: pre.introduction.deadline?.confidence ?? 0,
        estimated_value: pre.introduction.estimated_value?.confidence ?? 0,
        description: 0,
      },
      evidence: {
        entity: pre.introduction.entity?.evidence ?? null,
        tender_title: pre.introduction.tender_title?.evidence ?? null,
        tender_number: pre.introduction.tender_number?.evidence ?? null,
        deadline: pre.introduction.deadline?.evidence ?? null,
        estimated_value: pre.introduction.estimated_value?.evidence ?? null,
        description: null,
      },
      overall_confidence: pre.overall_confidence,
      warnings: [...pre.warnings, ...extraWarnings],
      not_found: [],
    },
    extraWarnings,
  };
}

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

    try {
      const result = await withRetry(
        () =>
          withTimeout(model.generateContent(prompt), AI_TIMEOUT_MS),
        { maxRetries: 1, baseDelayMs: 2000 }
      );
      const text = result.response.text();
      const json = extractJSON(text);
      const parsed = analysisResponseSchema.parse(JSON.parse(json));
      return parsed;
    } catch (err) {
      throw classifyError(err);
    }
  }

  async extractFromPDF(
    fileBuffer: Buffer,
    _fileName: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    // ═══════════════════════════════════════════════
    // Phase 1: Deterministic pre-extraction (no API)
    // ═══════════════════════════════════════════════
    let preExtraction: PreExtractionResult | null = null;
    try {
      preExtraction = await runDeterministicExtraction(fileBuffer);
      console.log(
        "[Phase 1] Deterministic extraction complete:",
        preExtraction.detected_sections.length,
        "sections detected,",
        "confidence:",
        preExtraction.overall_confidence,
        "time:",
        preExtraction.extraction_time_ms,
        "ms"
      );
    } catch (err) {
      console.warn("[Phase 1] Failed, will proceed with text-only AI extraction:", err);
    }

    // ═══════════════════════════════════════════════
    // Phase 2: AI extraction with PDF binary
    // ═══════════════════════════════════════════════
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 32768,
      },
    });

    try {
      // Build prompt with Phase 1 hints
      let preExtractedForAI: Record<string, unknown> | null = null;
      if (preExtraction && (preExtraction.raw_text.length > 200 || preExtraction.overall_confidence > 0)) {
        const { json, extraWarnings } = convertPreExtractionToAIInput(preExtraction);
        preExtractedForAI = json;
        if (extraWarnings.length > 0) {
          console.log("[Phase 2] BOQ warnings:", extraWarnings);
        }
      }

      const prompt = buildPdfBinaryPrompt(preExtractedForAI);

      // Send PDF binary + prompt to Gemini
      const pdfBase64 = fileBuffer.toString("base64");
      console.log("[Phase 2] Sending PDF binary to Gemini (" + Math.round(fileBuffer.length / 1024) + " KB)");

      const result = await withRetry(
        () =>
          withTimeout(
            model.generateContent([
              {
                inlineData: {
                  data: pdfBase64,
                  mimeType: "application/pdf",
                },
              },
              prompt,
            ]),
            PDF_TIMEOUT_MS
          ),
        { maxRetries: 1, baseDelayMs: 3000 }
      );

      // Handle blocked/empty responses
      const response = result.response;
      if (!response.candidates?.length) {
        const reason = response.promptFeedback?.blockReason ?? "unknown";
        console.error("[Gemini extractFromPDF] No candidates. Block reason:", reason);
        throw new AIError(
          `الاستجابة محظورة من Gemini (${reason}). جرّب ملف PDF آخر`,
          "INVALID_RESPONSE",
          false
        );
      }

      const finishReason = response.candidates[0].finishReason;
      if (finishReason === "SAFETY") {
        console.error("[Gemini extractFromPDF] Response blocked by safety filter");
        throw new AIError(
          "تم حظر الاستجابة بواسطة فلتر الأمان. جرّب ملف PDF آخر",
          "INVALID_RESPONSE",
          false
        );
      }

      let text: string;
      try {
        text = response.text();
      } catch {
        throw new AIError("Gemini أرجع استجابة بدون نص", "INVALID_RESPONSE", true);
      }
      console.log("[Gemini extractFromPDF] raw response length:", text.length, "finishReason:", finishReason);

      if (!text.trim()) {
        throw new AIError("Gemini أرجع استجابة فارغة", "INVALID_RESPONSE", true);
      }

      const json = extractJSON(text);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(json);
      } catch (jsonErr) {
        if (finishReason === "MAX_TOKENS") {
          console.warn("[Gemini extractFromPDF] MAX_TOKENS — attempting JSON repair");
          const repaired = repairTruncatedJSON(json);
          if (repaired) {
            parsed = repaired;
          } else {
            console.error("[Gemini extractFromPDF] JSON repair failed. Raw text (first 500 chars):", text.slice(0, 500));
            throw new AIError(
              "استجابة Gemini مقطوعة (MAX_TOKENS). جرّب ملف PDF أصغر",
              "INVALID_RESPONSE",
              true
            );
          }
        } else {
          console.error("[Gemini extractFromPDF] JSON.parse failed. Raw text (first 500 chars):", text.slice(0, 500));
          throw jsonErr;
        }
      }

      const normalized = normalizeExtractionResponse(parsed);

      let validated;
      try {
        validated = extractionResponseSchema.parse(normalized);
      } catch (zodErr) {
        console.error("[Gemini extractFromPDF] Zod validation failed. Keys:", Object.keys(parsed));
        console.error("[Gemini extractFromPDF] Zod error:", zodErr);
        throw zodErr;
      }
      return {
        ...validated,
        description: validated.description ?? null,
        extracted_sections: validated.extracted_sections ?? null,
        cached: false,
        model_used: this.modelName,
        processing_time_ms: Date.now() - startTime,
      };
    } catch (err) {
      console.error("[Gemini extractFromPDF] Error:", err);
      throw classifyError(err);
    }
  }
}
