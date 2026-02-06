/**
 * Parse AI responses into typed objects.
 * Handles: JSON extraction from markdown blocks, Zod validation, fallback on failure.
 */
import { z } from "zod/v4";

export const analysisResponseSchema = z.object({
  overall_score: z.number().min(0).max(100),
  confidence: z.enum(["high", "medium", "low"]),
  scores: z.record(
    z.string(),
    z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
    })
  ),
  evidence: z.array(
    z.object({
      text: z.string(),
      relevance: z.enum(["supporting", "concerning", "neutral"]),
      source: z.string(),
    })
  ),
  recommendation: z.enum(["pursue", "review", "skip"]),
  recommendation_reasoning: z.string(),
  red_flags: z.array(z.string()),
  key_dates: z.array(z.string()),
});

export const extractionResponseSchema = z.object({
  entity: z.string().nullable(),
  tender_title: z.string().nullable(),
  tender_number: z.string().nullable(),
  deadline: z.string().nullable(),
  estimated_value: z.number().nullable(),
  description: z.string().nullable().optional(),
  requirements: z.array(z.string()).optional().default([]),
  line_items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number().nullable(),
        unit: z.string().nullable(),
        confidence: z.number(),
      })
    )
    .optional()
    .default([]),
  confidence: z.record(z.string(), z.number()),
  evidence: z.record(z.string(), z.string().nullable()),
  overall_confidence: z.number(),
  warnings: z.array(z.string()).optional().default([]),
  not_found: z.array(z.string()).optional().default([]),
});

/**
 * Extract JSON from a raw AI response string.
 * Handles responses wrapped in ```json blocks or plain JSON.
 */
export function extractJSON(raw: string): string {
  // Try to extract from markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return raw.trim();
}

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;
