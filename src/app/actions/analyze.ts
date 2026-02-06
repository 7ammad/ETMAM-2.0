"use server";

import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { verifyAnalysis, verifyEvidence } from "@/lib/ai/verification";
import { revalidatePath } from "next/cache";

const DEFAULT_WEIGHTS = {
  relevance: 30,
  budgetFit: 25,
  timeline: 20,
  competition: 15,
  strategic: 10,
};

function buildTenderContent(tender: {
  entity: string;
  tender_title: string;
  tender_number: string;
  deadline: string;
  estimated_value: number;
  description: string | null;
  requirements: unknown;
}): string {
  const parts = [
    `الجهة: ${tender.entity}`,
    `عنوان المنافسة: ${tender.tender_title}`,
    `رقم المنافسة: ${tender.tender_number}`,
    `الموعد النهائي: ${tender.deadline}`,
    `القيمة التقديرية: ${tender.estimated_value}`,
    tender.description ? `الوصف: ${tender.description}` : "",
  ];
  if (tender.requirements) {
    const req =
      typeof tender.requirements === "string"
        ? tender.requirements
        : Array.isArray(tender.requirements)
          ? tender.requirements.join("\n")
          : String(tender.requirements);
    if (req) parts.push(`المتطلبات:\n${req}`);
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
  | { success: true; evaluationId: string }
  | { success: false; error: string };

export async function analyzeTender(
  tenderId: string,
  weights: Record<string, number> = DEFAULT_WEIGHTS,
  aiProvider?: "gemini" | "groq"
): Promise<AnalyzeResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", tenderId)
    .eq("user_id", user.id)
    .single();

  if (tenderError || !tender) {
    return { success: false, error: "المنافسة غير موجودة أو لا يمكنك الوصول إليها" };
  }

  const tenderContent = buildTenderContent(tender);
  const provider = getAIProvider(aiProvider);

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
      evidence: checkedEvidence,
      recommendation_reasoning: result.recommendation_reasoning,
      red_flags: result.red_flags,
      key_dates: result.key_dates,
      verification_corrections: allWarnings.length > 0 ? allWarnings : undefined,
    } as Record<string, unknown>;

    const { data: evalRow, error: evalError } = await supabase
      .from("evaluations")
      .upsert(
        {
          tender_id: tenderId,
          user_id: user.id,
          criteria_scores: criteriaScores,
          overall_score: Math.round(result.overall_score),
          auto_recommendation: autoRecommendation,
          manual_override: null,
          override_reason: null,
          preset_id: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tender_id" }
      )
      .select("id")
      .single();

    if (evalError) {
      return {
        success: false,
        error: "فشل حفظ التقييم: " + evalError.message,
      };
    }

    revalidatePath("/tenders");
    revalidatePath(`/tenders/${tenderId}`);
    revalidatePath("/dashboard");
    return {
      success: true,
      evaluationId: evalRow?.id ?? "",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message.includes("مفتاح") ? message : "حدث خطأ أثناء التحليل: " + message,
    };
  }
}
