/**
 * Gemini AI provider — uses @google/genai SDK (v1.x).
 * Model: gemini-3-flash-preview (fastest, good Arabic support, via AI Studio).
 *
 * Two-phase extraction pipeline:
 *   Phase 1: Deterministic pre-extraction (regex/heuristics, no API call)
 *   Phase 2: AI refinement (text-only, reviews pre-extracted data)
 *
 * Thinking is DISABLED (thinkingBudget: 0) for extraction — cuts 30-40s.
 */
import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import type { AIProvider, AIAnalysisResult, ExtractionResult } from "./provider";
import { buildAnalysisPrompt, buildPhase2Prompt, buildPdfBinaryPrompt } from "./prompts";
import {
  extractJSON,
  normalizeExtractionResponse,
  analysisResponseSchema,
  extractionResponseSchema,
} from "./parser";
import { withRetry, withTimeout, classifyError, AIError } from "./retry";
import { runDeterministicExtraction, type PreExtractionResult } from "@/lib/pdf";

const AI_TIMEOUT_MS = 120_000; // 2 min — evaluation with rich tender content
const PDF_TIMEOUT_MS = 180_000; // 3 min — with thinking off, extraction is much faster

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
      // Cap BOQ items to 60 — Gemini 2.5 Flash has 1M context, send more
      const cappedBoq = { ...pre.boq };
      if (cappedBoq.items.length > 60) {
        cappedBoq.items = cappedBoq.items.slice(0, 60);
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

/** Extract text safely from a GenerateContentResponse */
function getResponseText(response: GenerateContentResponse): string {
  const text = response.text;
  if (!text?.trim()) {
    throw new AIError("Gemini أرجع استجابة فارغة", "INVALID_RESPONSE", true);
  }
  return text;
}

export class GeminiProvider implements AIProvider {
  readonly modelName = "gemini-3-flash-preview";
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyze(
    tenderContent: string,
    weights: Record<string, number>
  ): Promise<AIAnalysisResult> {
    const prompt = buildAnalysisPrompt(tenderContent, weights);

    try {
      const result = await withRetry(
        () =>
          withTimeout(
            this.ai.models.generateContent({
              model: this.modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                temperature: 0.3,
                maxOutputTokens: 16_384,
                // Thinking ON for evaluation — needs deep reasoning on 5 criteria
                thinkingConfig: { thinkingBudget: -1 },
              },
            }),
            AI_TIMEOUT_MS
          ),
        { maxRetries: 2, baseDelayMs: 800 }
      );
      const text = getResponseText(result);
      const json = extractJSON(text);
      const parsed = analysisResponseSchema.parse(JSON.parse(json));
      return parsed;
    } catch (err) {
      throw classifyError(err);
    }
  }

  async extractFromPDF(
    fileBuffer: Buffer,
    _fileName: string,
    options?: { lean?: boolean }
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const isLean = options?.lean ?? false;

    // ─── FAST PATH: text extraction + Phase 2 AI refinement ─────────────────
    if (isLean) {
      console.info(`[Extraction LEAN] Running deterministic extraction on ${Math.round(fileBuffer.length / 1024)} KB PDF`);
      const pre = await runDeterministicExtraction(fileBuffer);
      console.info(`[Extraction LEAN] Deterministic done in ${pre.extraction_time_ms}ms, confidence=${pre.overall_confidence}, sections=${pre.detected_sections.length}`);

      const { json: preJson, extraWarnings } = convertPreExtractionToAIInput(pre);

      // ─── FAST EXIT: if Phase 1 got enough data, skip AI entirely (~1-2s total) ──
      const hasBasics = preJson.entity && preJson.tender_title && preJson.tender_number;
      const hasBoq = pre.boq.items.length > 0 && !hasSuspiciousBOQ(pre);
      const highConfidence = pre.overall_confidence >= 50;

      if (hasBasics && hasBoq && highConfidence && extraWarnings.length === 0) {
        console.info(`[Extraction LEAN] Phase 1 sufficient (confidence=${pre.overall_confidence}, BOQ=${pre.boq.items.length} items) — skipping AI call`);
        const normalized = normalizeExtractionResponse(preJson);
        const validated = extractionResponseSchema.parse(normalized);
        return {
          ...validated,
          description: validated.description ?? null,
          extracted_sections: validated.extracted_sections ?? null,
          cached: false,
          model_used: "deterministic-phase1",
          processing_time_ms: Date.now() - startTime,
        };
      }

      // ─── Phase 2: AI refinement with section-targeted text ───────────────
      const sectionTexts: string[] = [];
      sectionTexts.push(pre.raw_text.slice(0, 15_000));
      for (const sec of pre.detected_sections) {
        if (sec.text && sec.text.length > 100) {
          sectionTexts.push(
            `\n═══ القسم ${sec.sectionNumber}: ${sec.arabicName} ═══\n` +
            sec.text.slice(0, 12_000)
          );
        }
      }
      const targetedText = sectionTexts.join("\n");
      console.info(`[Extraction LEAN] Targeted text: ${Math.round(targetedText.length / 1000)}K chars (from ${Math.round(pre.raw_text.length / 1000)}K raw)`);

      const textPrompt = buildPhase2Prompt(preJson, targetedText, pre.boq_section_text);

      try {
        console.info(`[Extraction LEAN] Sending ${Math.round(textPrompt.length / 1000)}K chars prompt to Gemini (thinking OFF)`);
        const result = await withRetry(
          () =>
            withTimeout(
              this.ai.models.generateContent({
                model: this.modelName,
                contents: textPrompt,
                config: {
                  responseMimeType: "application/json",
                  temperature: 0.1,
                  maxOutputTokens: 65_536,
                  thinkingConfig: { thinkingBudget: 0 },
                },
              }),
              PDF_TIMEOUT_MS
            ),
          { maxRetries: 1, baseDelayMs: 800 }
        );

        const response = result;
        if (!response.candidates?.length) {
          const reason = response.promptFeedback?.blockReason ?? "unknown";
          throw new AIError(`الاستجابة محظورة من Gemini (${reason})`, "INVALID_RESPONSE", false);
        }

        const text = getResponseText(response);
        const json = extractJSON(text);
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(json);
        } catch {
          console.warn("[Extraction LEAN] JSON.parse failed. Attempting repair...");
          const repaired = repairTruncatedJSON(json);
          if (repaired) {
            console.info("[Extraction LEAN] JSON repaired successfully.");
            parsed = repaired;
          } else {
            console.error("[Extraction LEAN] JSON repair failed. Raw text (first 500 chars):", text.slice(0, 500));
            throw new AIError("فشل تحليل JSON من Gemini", "INVALID_RESPONSE", true);
          }
        }

        const normalized = normalizeExtractionResponse(parsed);
        const validated = extractionResponseSchema.parse(normalized);
        console.info(`[Extraction LEAN] Done in ${Date.now() - startTime}ms total`);
        return {
          ...validated,
          description: validated.description ?? null,
          extracted_sections: validated.extracted_sections ?? null,
          cached: false,
          model_used: this.modelName,
          processing_time_ms: Date.now() - startTime,
        };
      } catch (err) {
        console.error("[Gemini extractFromPDF LEAN] Error:", err);
        throw classifyError(err);
      }
    }

    // ─── FULL PATH: binary PDF to Gemini ────────────────────────────────────
    try {
      const prompt = buildPdfBinaryPrompt(null);
      const pdfBase64 = fileBuffer.toString("base64");
      console.info(`[Extraction FULL] Sending PDF to Gemini (${Math.round(fileBuffer.length / 1024)} KB, thinking OFF)`);

      const result = await withRetry(
        () =>
          withTimeout(
            this.ai.models.generateContent({
              model: this.modelName,
              contents: [
                {
                  inlineData: {
                    data: pdfBase64,
                    mimeType: "application/pdf",
                  },
                },
                { text: prompt },
              ],
              config: {
                responseMimeType: "application/json",
                temperature: 0.1,
                maxOutputTokens: 65_536,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
            PDF_TIMEOUT_MS
          ),
        { maxRetries: 2, baseDelayMs: 800 }
      );

      // Handle blocked/empty responses
      const response = result;
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

      const text = getResponseText(response);
      console.info("[Gemini extractFromPDF] raw response length:", text.length, "finishReason:", finishReason);

      const json = extractJSON(text);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(json);
      } catch {
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
          throw new AIError("فشل تحليل JSON من Gemini", "INVALID_RESPONSE", true);
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
