"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { verifyAnalysis, verifyEvidence } from "@/lib/ai/verification";
import { revalidatePath } from "next/cache";
import { DEFAULT_SCORING_WEIGHTS } from "@/lib/constants";

type TenderForContent = {
  id: string;
  entity: string;
  tender_title: string;
  tender_number: string;
  deadline: string;
  estimated_value: number | null;
  description: string | null;
  requirements: unknown;
  proposed_price: number | null;
  extracted_sections: unknown;
  line_items: unknown;
  raw_text: string | null;
};

/**
 * Build content for AI evaluation.
 * Priority: full raw_text (complete document) > structured fields fallback.
 * When raw_text is available, Gemini sees the ENTIRE tender booklet — no missing BOQ/SOW.
 */
async function buildTenderContent(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  _userId: string,
  tender: TenderForContent
): Promise<string> {
  // Header with structured metadata (always included for context)
  const header = [
    `الجهة: ${tender.entity}`,
    `عنوان المنافسة: ${tender.tender_title}`,
    `رقم المنافسة: ${tender.tender_number}`,
    `الموعد النهائي: ${tender.deadline}`,
    `القيمة التقديرية: ${tender.estimated_value ?? "غير محدد"}`,
    tender.description ? `الوصف: ${tender.description}` : "",
  ].filter(Boolean).join("\n");

  // If we have the full raw text, send it all to Gemini
  if (tender.raw_text && tender.raw_text.length > 500) {
    // Cap at 300K chars (~200K tokens) to stay within Gemini's context
    const rawText = tender.raw_text.length > 300_000
      ? tender.raw_text.slice(0, 300_000) + "\n\n[... تم اقتطاع باقي النص ...]"
      : tender.raw_text;

    return `${header}\n\n═══════════════════════════════════════\nالنص الكامل لكراسة الشروط والمواصفات:\n═══════════════════════════════════════\n\n${rawText}`;
  }

  // Fallback: build from structured data (for tenders saved before raw_text was added)
  const parts = [header];

  if (tender.requirements) {
    const req =
      typeof tender.requirements === "string"
        ? tender.requirements
        : Array.isArray(tender.requirements)
          ? tender.requirements.join("\n")
          : String(tender.requirements);
    if (req) parts.push(`المتطلبات:\n${req}`);
  }

  const sections = tender.extracted_sections as Record<string, unknown> | null;
  if (sections) {
    if (sections.boq && typeof sections.boq === "object") {
      const boq = sections.boq as { items?: unknown[]; pricing_type?: string };
      if (boq.items && Array.isArray(boq.items) && boq.items.length > 0) {
        parts.push("\n--- جدول الكميات والأسعار (BOQ) ---");
        parts.push(`طريقة التسعير: ${boq.pricing_type ?? "غير محدد"}`);
        parts.push(`عدد البنود: ${boq.items.length}`);
        const itemLines = boq.items.slice(0, 30).map((raw: unknown) => {
          const item = raw as Record<string, unknown>;
          return `${item.seq ?? "-"}. ${item.description ?? ""} | الوحدة: ${item.unit ?? "-"} | الكمية: ${item.quantity ?? "-"} | الفئة: ${item.category ?? "-"}`;
        });
        parts.push(itemLines.join("\n"));
      }
    }
    if (sections.contract_terms && typeof sections.contract_terms === "object") {
      const ct = sections.contract_terms as Record<string, unknown>;
      parts.push("\n--- شروط التعاقد ---");
      if (ct.execution_period_days) parts.push(`مدة التنفيذ: ${ct.execution_period_days} يوم`);
      if (ct.delay_penalty_percent) parts.push(`غرامة التأخير: ${ct.delay_penalty_percent}%`);
      if (ct.initial_guarantee_percent) parts.push(`الضمان الابتدائي: ${ct.initial_guarantee_percent}%`);
      if (ct.final_guarantee_percent) parts.push(`الضمان النهائي: ${ct.final_guarantee_percent}%`);
      if (ct.payment_terms) parts.push(`شروط الدفع: ${ct.payment_terms}`);
      if (ct.warranty_period_days) parts.push(`فترة الضمان: ${ct.warranty_period_days} يوم`);
    }
    if (sections.qualifications && typeof sections.qualifications === "object") {
      const q = sections.qualifications as Record<string, unknown>;
      parts.push("\n--- المتطلبات التأهيلية ---");
      if (q.contractor_classification) parts.push(`التصنيف المطلوب: ${q.contractor_classification}`);
      if (q.minimum_experience_years) parts.push(`الحد الأدنى للخبرة: ${q.minimum_experience_years} سنوات`);
      if (Array.isArray(q.required_certifications) && q.required_certifications.length > 0) {
        parts.push(`الشهادات المطلوبة: ${q.required_certifications.join("، ")}`);
      }
    }
    if (sections.evaluation_method && typeof sections.evaluation_method === "object") {
      const ev = sections.evaluation_method as Record<string, unknown>;
      parts.push("\n--- آلية التقييم ---");
      if (ev.method) parts.push(`الطريقة: ${ev.method}`);
      if (ev.technical_weight) parts.push(`وزن العرض الفني: ${ev.technical_weight}%`);
      if (ev.financial_weight) parts.push(`وزن العرض المالي: ${ev.financial_weight}%`);
    }
  }

  return parts.filter(Boolean).join("\n\n");
}

/** Map AI recommendation to DB enum (pursue → proceed) */
function toDbRecommendation(
  rec: "pursue" | "review" | "skip"
): "proceed" | "review" | "skip" {
  return rec === "pursue" ? "proceed" : rec;
}

export type AnalyzeResult =
  | { success: true; evaluationId: string; evaluation?: any }
  | { success: false; error: string };

const analyzeTenderInputSchema = z.object({
  tenderId: z.string().uuid(),
  weights: z.record(z.string(), z.number().min(0).max(100)),
  aiProvider: z.enum(["deepseek", "gemini", "groq"]).optional(),
});

export async function analyzeTender(
  tenderId: string,
  weights: Record<string, number> = { ...DEFAULT_SCORING_WEIGHTS },
  aiProvider?: "deepseek" | "gemini" | "groq"
): Promise<AnalyzeResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // --- Input validation ---
  analyzeTenderInputSchema.parse({ tenderId, weights, aiProvider });

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    return { success: false, error: "المنافسة غير موجودة أو لا يمكنك الوصول إليها" };
  }

  const tenderContent = await buildTenderContent(supabase, user.id, tender);
  const provider = await getAIProvider(aiProvider);

  try {
    const rawResult = await provider.analyze(tenderContent, weights);

    // --- Guardrail 1: Recalculate score & enforce recommendation thresholds ---
    const { corrected: result, corrections } = verifyAnalysis(
      rawResult,
      weights
    );

    // --- Guardrail 2: Cross-check evidence against source text ---
    const { verified: checkedEvidence, flagged } = verifyEvidence(
      result.evidence,
      tenderContent
    );

    const allWarnings = [...corrections, ...flagged];

    const autoRecommendation = toDbRecommendation(result.recommendation);
    const criteriaScores = {
      scores: result.scores,
      parametric_estimate: result.parametric_estimate,
      evidence: checkedEvidence,
      recommendation_reasoning: result.recommendation_reasoning,
      red_flags: result.red_flags,
      key_dates: result.key_dates,
      verification_corrections: allWarnings.length > 0 ? allWarnings : undefined,
    } as Record<string, unknown>;

    // INSERT (not upsert) to preserve re-evaluation history
    // The UNIQUE(tender_id) constraint was dropped in migration 20260207100000
    const { data: evalRow, error: evalError } = await supabase
      .from("evaluations")
      .insert({
        tender_id: tenderId,
        user_id: user.id,
        criteria_scores: criteriaScores,
        overall_score: Math.round(result.overall_score),
        auto_recommendation: autoRecommendation,
        manual_override: null,
        override_reason: null,
        preset_id: null,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (evalError) {
      console.error("[analyzeTender] Failed to insert evaluation:", {
        tenderId,
        userId: user.id,
        error: evalError,
      });
      return {
        success: false,
        error: "فشل حفظ التقييم: " + evalError.message,
      };
    }

    // --- Backfill tender metadata from AI extraction ---
    // The combined Extract+Evaluate prompt returns extracted_metadata
    // which may have better data than the deterministic extraction.
    const meta = result.extracted_metadata;
    if (meta) {
      const backfill: Record<string, unknown> = {};
      // Only backfill fields that are currently placeholder/empty
      if (meta.entity && (!tender.entity || tender.entity === "جهة غير محددة")) {
        backfill.entity = meta.entity;
      }
      if (meta.tender_title && (!tender.tender_title || tender.tender_title === "منافسة بدون عنوان")) {
        backfill.tender_title = meta.tender_title;
      }
      if (meta.tender_number && (!tender.tender_number || tender.tender_number.startsWith("PDF-"))) {
        backfill.tender_number = meta.tender_number;
      }
      if (meta.deadline && (!tender.deadline || new Date(tender.deadline) > new Date(Date.now() + 25 * 86400000))) {
        backfill.deadline = meta.deadline;
      }
      if (meta.estimated_value && !tender.estimated_value) {
        backfill.estimated_value = meta.estimated_value;
      }
      if (meta.description) {
        backfill.description = meta.description;
      }

      // Backfill extracted_sections with SOW, BOQ, contract_terms, qualifications, evaluation_method
      const existingSections = (tender.extracted_sections as Record<string, unknown>) ?? {};
      const newSections: Record<string, unknown> = { ...existingSections, _version: 1 };
      let sectionsUpdated = false;

      if (meta.boq_items && meta.boq_items.length > 0) {
        const existingBoq = existingSections?.boq as { items?: unknown[] } | null;
        if (!existingBoq?.items?.length) {
          newSections.boq = {
            pricing_type: null,
            items: meta.boq_items,
            total_items_count: meta.boq_items.length,
            confidence: 80,
          };
          sectionsUpdated = true;
        }
      }
      if (meta.technical_specs) {
        const existingSpecs = existingSections?.technical_specs as Record<string, unknown> | null;
        if (!existingSpecs?.scope_of_work) {
          newSections.technical_specs = { ...meta.technical_specs, confidence: 80 };
          sectionsUpdated = true;
        }
      }
      if (meta.contract_terms) {
        const existingCT = existingSections?.contract_terms as Record<string, unknown> | null;
        if (!existingCT?.execution_period_days) {
          newSections.contract_terms = { ...meta.contract_terms, confidence: 80 };
          sectionsUpdated = true;
        }
      }
      if (meta.qualifications) {
        const existingQ = existingSections?.qualifications as Record<string, unknown> | null;
        if (!existingQ?.contractor_classification) {
          newSections.qualifications = { ...meta.qualifications, confidence: 80 };
          sectionsUpdated = true;
        }
      }
      if (meta.evaluation_method) {
        const existingEval = existingSections?.evaluation_method as Record<string, unknown> | null;
        if (!existingEval?.method) {
          newSections.evaluation_method = { ...meta.evaluation_method, confidence: 80 };
          sectionsUpdated = true;
        }
      }

      if (sectionsUpdated) {
        backfill.extracted_sections = newSections;
      }

      if (Object.keys(backfill).length > 0) {
        console.info("[analyzeTender] Backfilling tender with AI-extracted metadata:", Object.keys(backfill));
        await supabase
          .from("tenders")
          .update(backfill)
          .eq("id", tenderId)
          .eq("user_id", user.id);
      }
    }

    revalidatePath("/tenders");
    revalidatePath(`/tenders/${tenderId}`);
    revalidatePath("/dashboard");
    return {
      success: true,
      evaluationId: evalRow?.id ?? "",
      evaluation: {
        overall_score: Math.round(result.overall_score),
        auto_recommendation: autoRecommendation,
        criteria_scores: criteriaScores,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message.includes("مفتاح") ? message : "حدث خطأ أثناء التحليل: " + message,
    };
  }
}
