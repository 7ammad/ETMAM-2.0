"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runDeterministicExtraction } from "@/lib/pdf";
import { verifyExtraction } from "@/lib/ai/verification";
import { normalizeExtractionResponse, extractionResponseSchema } from "@/lib/ai/parser";
import { savePdfTender } from "./tenders";
import { analyzeTender } from "./analyze";
import { pushTenderToOdoo } from "./odoo";
import { DEFAULT_SCORING_WEIGHTS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Pipeline step results (streamed back via progressive response)
// ---------------------------------------------------------------------------

export type PipelineStepStatus = "pending" | "running" | "done" | "error";

export interface PipelineResult {
  success: boolean;
  /** Step that failed (if !success) */
  failedStep?: "extract" | "save" | "evaluate" | "odoo";
  error?: string;

  // Extraction results
  extraction?: {
    entity: string | null;
    tender_title: string | null;
    tender_number: string | null;
    deadline: string | null;
    estimated_value: number | null;
    description: string | null;
    boqItemCount: number;
    overall_confidence: number;
    model_used: string;
    processing_time_ms: number;
  };

  // Save result
  tenderId?: string;

  // Evaluation result
  evaluationId?: string;
  evaluationDigest?: {
    overall_score: number;
    auto_recommendation: string;
    parametric_estimate?: {
      estimated_min_value: number;
      estimated_max_value: number;
      estimation_rationale: string;
    };
  };

  // Odoo result
  odooOpportunityId?: string;

  // Timing
  totalTimeMs?: number;
}

/**
 * Convert Phase 1 pre-extraction to the extraction schema shape.
 */
function convertPreToExtraction(pre: Awaited<ReturnType<typeof runDeterministicExtraction>>) {
  // Check for suspicious BOQ (all identical descriptions)
  const hasSuspiciousBOQ = pre.boq.items.length >= 2 &&
    new Set(pre.boq.items.map((it) => it.description.trim())).size === 1;

  const boq = hasSuspiciousBOQ ? null : (pre.boq.items.length > 0 ? {
    ...pre.boq,
    items: pre.boq.items.slice(0, 60),
    total_items_count: pre.boq.items.length,
  } : null);

  const json: Record<string, unknown> = {
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
      technical_specs: pre.technical_specs.confidence > 15 ? pre.technical_specs : null,
      qualifications: pre.qualifications.confidence > 15 ? pre.qualifications : null,
      contract_terms: pre.contract_terms.confidence > 15 ? pre.contract_terms : null,
      evaluation_method: pre.evaluation.confidence > 15 ? pre.evaluation : null,
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
    warnings: [...pre.warnings],
    not_found: [],
  };

  const normalized = normalizeExtractionResponse(json);
  return extractionResponseSchema.parse(normalized);
}

/**
 * Full auto-pipeline: Upload PDF → Deterministic Extract → Save → AI Evaluate → Odoo
 *
 * Extraction is PURELY deterministic (no AI call) — fast (~1-2s).
 * Full raw text is saved to DB so Gemini can reason about the complete document
 * during the evaluation step.
 */
export async function processTenderPipeline(
  formData: FormData
): Promise<PipelineResult> {
  const totalStart = Date.now();

  // --- Auth ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, failedStep: "extract", error: "يجب تسجيل الدخول" };
  }

  // --- Validate FormData ---
  const formDataSchema = z.object({
    file: z.instanceof(File).refine((f) => f.size > 0, "لم يتم اختيار ملف"),
  });

  const rawFile = formData.get("file");
  const parsed = formDataSchema.safeParse({ file: rawFile });
  if (!parsed.success) {
    return { success: false, failedStep: "extract", error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const file = parsed.data.file;

  if (file.size > 20 * 1024 * 1024) {
    return { success: false, failedStep: "extract", error: "حجم الملف يتجاوز 20 ميجابايت" };
  }

  // ═══════════════════════════════════════════════
  // Step 1: Deterministic extraction ONLY (no AI)
  // ═══════════════════════════════════════════════
  const buffer = Buffer.from(await file.arrayBuffer());
  let pre;
  try {
    console.info("[pipeline] Step 1: deterministic extraction...");
    pre = await runDeterministicExtraction(buffer);
    console.info(`[pipeline] Extraction done in ${pre.extraction_time_ms}ms, confidence=${pre.overall_confidence}, sections=${pre.detected_sections.length}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, failedStep: "extract", error: msg };
  }

  // Convert to extraction schema
  let extraction;
  try {
    const validated = convertPreToExtraction(pre);
    const withMeta = {
      ...validated,
      description: validated.description ?? null,
      extracted_sections: validated.extracted_sections ?? null,
      cached: false,
      model_used: "deterministic-phase1" as const,
      processing_time_ms: pre.extraction_time_ms,
    };
    const { corrected } = verifyExtraction(withMeta);
    extraction = corrected;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, failedStep: "extract", error: "فشل تحويل البيانات: " + msg };
  }

  // Validate — only fail if we have NO raw text at all (empty/corrupt PDF)
  const hasBasicFields = extraction.entity || extraction.tender_title || extraction.tender_number;
  const hasRawText = pre.raw_text.length > 500;
  if (!hasBasicFields && !hasRawText) {
    return {
      success: false,
      failedStep: "extract",
      error: "لم يتم استخراج أي بيانات من الملف. تأكد أنه كراسة شروط ومواصفات",
    };
  }
  // If deterministic extraction got little but we have raw text, that's fine —
  // Gemini will analyze the full document during evaluation

  // ═══════════════════════════════════════════════
  // Step 2: Save tender + raw_text
  // ═══════════════════════════════════════════════
  const saveResult = await savePdfTender({
    entity: extraction.entity ?? "جهة غير محددة",
    tender_title: extraction.tender_title ?? "منافسة بدون عنوان",
    tender_number: extraction.tender_number ?? `PDF-${Date.now()}`,
    deadline: extraction.deadline ?? new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    estimated_value: extraction.estimated_value,
    description: extraction.description ?? null,
    requirements: extraction.requirements ?? [],
    line_items: extraction.line_items ?? [],
    extracted_sections: extraction.extracted_sections as Record<string, unknown> | null,
    extraction_confidence: extraction.overall_confidence,
    extraction_warnings: extraction.warnings ?? [],
    source_file_name: file.name,
    raw_text: pre.raw_text,
  });

  if (!saveResult.success) {
    return { success: false, failedStep: "save", error: saveResult.error };
  }

  const tenderId = saveResult.tenderId;

  // ═══════════════════════════════════════════════
  // Step 3: AI Evaluate (Gemini gets full raw text)
  // ═══════════════════════════════════════════════
  let evaluationId: string | undefined;
  let evaluationDigest: PipelineResult["evaluationDigest"] | undefined;
  try {
    const evalResult = await analyzeTender(
      tenderId,
      { ...DEFAULT_SCORING_WEIGHTS },
      "gemini"
    );
    if (evalResult.success) {
      evaluationId = evalResult.evaluationId;
      if (evalResult.evaluation) {
        evaluationDigest = {
          overall_score: evalResult.evaluation.overall_score,
          auto_recommendation: evalResult.evaluation.auto_recommendation,
          parametric_estimate: evalResult.evaluation.criteria_scores?.parametric_estimate,
        };
      }
    } else {
      console.warn("[pipeline] Evaluation failed:", evalResult.error);
    }
  } catch (err) {
    console.warn("[pipeline] Evaluation exception:", err);
  }

  // ═══════════════════════════════════════════════
  // Step 4: Push to Odoo CRM
  // ═══════════════════════════════════════════════
  let odooOpportunityId: string | undefined;
  if (tenderId && evaluationId) {
    try {
      const odooResult = await pushTenderToOdoo(tenderId, evaluationId);
      if (odooResult.success) {
        odooOpportunityId = odooResult.opportunityId;
      } else {
        console.warn("[pipeline] Odoo push failed:", odooResult.error);
      }
    } catch (err) {
      console.warn("[pipeline] Odoo push exception:", err);
    }
  }

  // Derive BOQ item count
  const sections = extraction.extracted_sections as Record<string, unknown> | null;
  const boq = sections?.boq as { items?: unknown[] } | null;
  const boqItemCount = boq?.items?.length ?? extraction.line_items?.length ?? 0;

  return {
    success: true,
    extraction: {
      entity: extraction.entity,
      tender_title: extraction.tender_title,
      tender_number: extraction.tender_number,
      deadline: extraction.deadline,
      estimated_value: extraction.estimated_value,
      description: extraction.description ?? null,
      boqItemCount,
      overall_confidence: extraction.overall_confidence,
      model_used: "deterministic-phase1",
      processing_time_ms: pre.extraction_time_ms,
    },
    tenderId,
    evaluationId,
    evaluationDigest,
    odooOpportunityId,
    totalTimeMs: Date.now() - totalStart,
  };
}
