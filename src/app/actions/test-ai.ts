"use server";

import { getAIProvider } from "@/lib/ai/provider";
import type { AIAnalysisResult } from "@/lib/ai/provider";
import { analysisResponseSchema } from "@/lib/ai/parser";

const SAMPLE_TENDER = `
عنوان المنافسة: توريد أجهزة حاسب آلي لوزارة التعليم
الجهة: وزارة التعليم
رقم المنافسة: 1446-MOE-IT-001
الموعد النهائي: 2026-04-15
القيمة التقديرية: 2,500,000 ريال
الوصف: توريد وتركيب 500 جهاز حاسب مكتبي مع شاشات وملحقات.
المتطلبات:
- أجهزة حاسب مكتبي بمواصفات عالية
- شاشات 24 بوصة
- ضمان 3 سنوات
- خدمات التركيب والصيانة
`;

const DEFAULT_WEIGHTS = {
  relevance: 30,
  budgetFit: 25,
  timeline: 20,
  competition: 15,
  strategic: 10,
};

export type TestAIResult = {
  provider: string;
  success: boolean;
  result?: AIAnalysisResult;
  error?: string;
  durationMs: number;
  schemaValid?: boolean;
};

/**
 * Acceptance test helper: call AI provider with sample tender.
 * Use with MOCK_AI=true (no keys) or with GEMINI_API_KEY / GROQ_API_KEY.
 * Validates response against analysisResponseSchema (including mock).
 */
export async function testAIProvider(): Promise<TestAIResult> {
  const start = Date.now();
  const provider = getAIProvider();

  try {
    const result = await provider.analyze(SAMPLE_TENDER, DEFAULT_WEIGHTS);
    const schemaValid = analysisResponseSchema.safeParse(result).success;
    return {
      provider: provider.modelName,
      success: true,
      result,
      durationMs: Date.now() - start,
      schemaValid,
    };
  } catch (err) {
    return {
      provider: provider.modelName,
      success: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}
