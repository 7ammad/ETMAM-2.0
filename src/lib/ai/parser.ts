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

// ---------------------------------------------------------------------------
// Extracted Sections schemas (5 vendor-critical sections)
// ---------------------------------------------------------------------------

const boqItemSchema = z.object({
  seq: z.coerce.number(),
  category: z.string().nullable().optional().default(null),
  description: z.string(),
  specifications: z.string().nullable().optional().default(null),
  unit: z.string().nullable().optional().default(null),
  quantity: z.coerce.number().nullable().optional().default(null),
  confidence: z.coerce.number().default(50),
});

const boqSchema = z.object({
  pricing_type: z.enum(["lump_sum", "unit_based", "mixed"]).nullable().default(null),
  items: z.array(boqItemSchema).default([]),
  total_items_count: z.coerce.number().nullable().default(null),
  confidence: z.coerce.number().default(0),
});

const technicalSpecsSchema = z.object({
  scope_of_work: z.string().nullable().default(null),
  referenced_standards: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  execution_methodology: z.string().nullable().default(null),
  confidence: z.coerce.number().default(0),
});

const qualificationsSchema = z.object({
  contractor_classification: z.string().nullable().default(null),
  required_certifications: z.array(z.string()).default([]),
  required_licenses: z.array(z.string()).default([]),
  minimum_experience_years: z.coerce.number().nullable().default(null),
  similar_projects_required: z.coerce.number().nullable().default(null),
  required_staff: z.array(z.object({
    role: z.string(),
    qualification: z.string().nullable().default(null),
    count: z.coerce.number().nullable().default(null),
  })).default([]),
  local_content_requirement: z.coerce.number().nullable().default(null),
  confidence: z.coerce.number().default(0),
});

const contractTermsSchema = z.object({
  initial_guarantee_percent: z.coerce.number().nullable().default(null),
  final_guarantee_percent: z.coerce.number().nullable().default(null),
  delay_penalty_percent: z.coerce.number().nullable().default(null),
  delay_penalty_max_percent: z.coerce.number().nullable().default(null),
  execution_period_days: z.coerce.number().nullable().default(null),
  warranty_period_days: z.coerce.number().nullable().default(null),
  payment_terms: z.string().nullable().default(null),
  advance_payment_percent: z.coerce.number().nullable().default(null),
  retention_percent: z.coerce.number().nullable().default(null),
  insurance_required: z.boolean().nullable().default(null),
  confidence: z.coerce.number().default(0),
});

const evaluationMethodSchema = z.object({
  method: z.enum(["lowest_price", "quality_and_cost", "quality_only"]).nullable().default(null),
  financial_weight: z.coerce.number().nullable().default(null),
  technical_weight: z.coerce.number().nullable().default(null),
  min_technical_score: z.coerce.number().nullable().default(null),
  scoring_formula: z.string().nullable().default(null),
  local_content_target_percent: z.coerce.number().nullable().default(null),
  evaluation_criteria: z.array(z.string()).default([]),
  confidence: z.coerce.number().default(0),
});

const extractedSectionsSchema = z.object({
  _version: z.literal(1).default(1),
  boq: boqSchema.nullable().default(null),
  technical_specs: technicalSpecsSchema.nullable().default(null),
  qualifications: qualificationsSchema.nullable().default(null),
  contract_terms: contractTermsSchema.nullable().default(null),
  evaluation_method: evaluationMethodSchema.nullable().default(null),
}).optional().nullable();

// ---------------------------------------------------------------------------
// Main extraction response schema
// ---------------------------------------------------------------------------

export const extractionResponseSchema = z.object({
  entity: z.string().nullable(),
  tender_title: z.string().nullable(),
  tender_number: z.string().nullable(),
  deadline: z.string().nullable(),
  estimated_value: z.coerce.number().nullable(),
  description: z.string().nullable().optional(),
  requirements: z.array(z.string()).optional().default([]),
  line_items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.coerce.number().nullable(),
        unit: z.string().nullable(),
        confidence: z.coerce.number(),
      })
    )
    .optional()
    .default([]),
  extracted_sections: extractedSectionsSchema,
  confidence: z.record(z.string(), z.coerce.number()).optional().default({}),
  evidence: z.record(z.string(), z.string().nullable()).optional().default({}),
  overall_confidence: z.coerce.number().default(0),
  warnings: z.array(z.string()).optional().default([]),
  not_found: z.array(z.string()).optional().default([]),
});

/**
 * Strip control characters (0x00–0x1F) that appear unescaped inside
 * JSON string literals. These are invalid per the JSON spec and cause
 * `JSON.parse` to throw "Bad control character in string literal".
 *
 * Walks through the string tracking whether we're inside a JSON string
 * (between unescaped quotes) and replaces control chars with a space.
 */
function sanitizeJSONControlChars(json: string): string {
  const chars = [...json];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    // Only strip control chars inside strings (except \n, \r, \t which
    // we replace with their escaped equivalents for readability)
    if (inString) {
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        if (code === 0x0a) chars[i] = "\\n";
        else if (code === 0x0d) chars[i] = "\\r";
        else if (code === 0x09) chars[i] = "\\t";
        else chars[i] = " ";
      }
    }
  }

  return chars.join("");
}

/**
 * Extract JSON from a raw AI response string.
 * Handles responses wrapped in ```json blocks or plain JSON.
 * Sanitizes control characters that Gemini sometimes includes in strings.
 */
export function extractJSON(raw: string): string {
  let json: string;

  // Try to extract from markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    json = codeBlockMatch[1].trim();
  } else {
    // Try to find JSON object directly
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    json = jsonMatch ? jsonMatch[0] : raw.trim();
  }

  return sanitizeJSONControlChars(json);
}

/**
 * Normalize a raw Gemini extraction response before Zod validation.
 * Fixes common type mismatches: evidence array → record, missing fields → defaults.
 */
export function normalizeExtractionResponse(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };

  // Gemini sometimes returns evidence as an array instead of a record
  if (Array.isArray(out.evidence)) {
    out.evidence = {};
  }

  // Ensure confidence is a record, not an array
  if (Array.isArray(out.confidence)) {
    out.confidence = {};
  }

  // Handle estimated_value with commas/formatting (e.g. "1,500,000")
  if (typeof out.estimated_value === "string") {
    const cleaned = (out.estimated_value as string).replace(/[,،\s]/g, "");
    const num = Number(cleaned);
    out.estimated_value = isNaN(num) ? null : num;
  }

  // Normalize extracted_sections: empty objects → null
  if (out.extracted_sections && typeof out.extracted_sections === "object") {
    const sections = out.extracted_sections as Record<string, unknown>;
    for (const key of ["boq", "technical_specs", "qualifications", "contract_terms", "evaluation_method"]) {
      const val = sections[key];
      if (val && typeof val === "object" && !Array.isArray(val) && Object.keys(val as object).length === 0) {
        sections[key] = null;
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Spec Card AI Response Schemas (Phase 3.4)
// ---------------------------------------------------------------------------

export const specParameterSchema = z.object({
  name: z.string(),
  value: z.string(),
  unit: z.string().nullable().default(null),
  is_mandatory: z.boolean().default(false),
});

export const specCardResponseSchema = z.object({
  boq_seq: z.coerce.number(),
  category: z.string().nullable().default(null),
  parameters: z.array(specParameterSchema).default([]),
  referenced_standards: z.array(z.string()).default([]),
  approved_brands: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  notes: z.string().nullable().default(null),
  confidence: z.coerce.number().default(50),
});

export const specCardsResponseSchema = z.object({
  spec_cards: z.array(specCardResponseSchema),
  warnings: z.array(z.string()).default([]),
});

// ---------------------------------------------------------------------------
// Product Nomination AI Response Schemas (Phase 3.4)
// ---------------------------------------------------------------------------

export const complianceDetailSchema = z.object({
  parameter: z.string(),
  meets_spec: z.boolean(),
  note: z.string().default(""),
});

export const nominationResponseSchema = z.object({
  product_name: z.string(),
  brand: z.string().nullable().default(null),
  model_sku: z.string().nullable().default(null),
  distributor: z.string().nullable().default(null),
  estimated_price: z.coerce.number().nullable().default(null),
  source: z.enum(["rate_card", "web_search", "manual"]).default("web_search"),
  source_url: z.string().nullable().default(null),
  compliance_score: z.coerce.number().default(0),
  compliance_details: z.array(complianceDetailSchema).default([]),
  rank: z.coerce.number().default(0),
});

export const nominationsResponseSchema = z.object({
  nominations: z.array(nominationResponseSchema),
  warnings: z.array(z.string()).default([]),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;
export type SpecCardResponse = z.infer<typeof specCardResponseSchema>;
export type SpecCardsResponse = z.infer<typeof specCardsResponseSchema>;
export type NominationResponse = z.infer<typeof nominationResponseSchema>;
export type NominationsResponse = z.infer<typeof nominationsResponseSchema>;
