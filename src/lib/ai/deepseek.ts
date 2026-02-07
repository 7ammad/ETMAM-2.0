/**
 * DeepSeek AI provider — OpenAI-compatible API (api.deepseek.com).
 * Docs: https://platform.deepseek.com/api-docs
 * - Base URL: https://api.deepseek.com or https://api.deepseek.com/v1 (we use /v1)
 * - Auth: Authorization: Bearer DEEPSEEK_API_KEY
 * - Model: deepseek-chat (non-thinking mode, DeepSeek-V3.2)
 * PDF extraction not supported; use Gemini for PDF.
 */
import type { AIProvider, AIAnalysisResult, ExtractionResult } from "./provider";
import { buildAnalysisPrompt } from "./prompts";
import {
  extractJSON,
  analysisResponseSchema,
} from "./parser";
import { withRetry, withTimeout, classifyError } from "./retry";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const AI_TIMEOUT_MS = 30_000;

export class DeepSeekProvider implements AIProvider {
  readonly modelName = "deepseek-chat";
  private apiKey: string;

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey?.trim()) {
      throw new Error("DEEPSEEK_API_KEY is not set");
    }
    this.apiKey = apiKey.trim();
  }

  async analyze(
    tenderContent: string,
    weights: Record<string, number>
  ): Promise<AIAnalysisResult> {
    const prompt = buildAnalysisPrompt(tenderContent, weights);

    const body = {
      model: this.modelName,
      messages: [
        {
          role: "system",
          content: "أنت خبير تحليل منافسات حكومية سعودية. أجب بـ JSON فقط.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      stream: false,
      response_format: { type: "json_object" },
    };

    const fn = () =>
      withTimeout(
        fetch(`${DEEPSEEK_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        }).then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(res.status + " " + (errText || res.statusText));
          }
          return res.json() as Promise<{
            choices?: Array<{ message?: { content?: string } }>;
          }>;
        }),
        AI_TIMEOUT_MS
      );

    try {
      const data = await withRetry(fn, { maxRetries: 1, baseDelayMs: 2000 });
      const text = data?.choices?.[0]?.message?.content ?? "";
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
    throw new Error(
      "DeepSeek لا يدعم استخراج PDF مباشرة. استخدم Gemini لرفع PDF أو حوّل الملف إلى نص أولاً."
    );
  }
}
