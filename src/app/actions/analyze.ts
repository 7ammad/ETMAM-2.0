"use server";

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
};

async function buildTenderContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tender: TenderForContent
): Promise<string> {
  const parts = [
    `الجهة: ${tender.entity}`,
    `عنوان المنافسة: ${tender.tender_title}`,
    `رقم المنافسة: ${tender.tender_number}`,
    `الموعد النهائي: ${tender.deadline}`,
    `القيمة التقديرية: ${tender.estimated_value ?? ""}`,
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

  const { data: costItems } = await supabase
    .from("cost_items")
    .select("description, quantity, unit, unit_price, total, category, source")
    .eq("tender_id", tender.id)
    .eq("user_id", userId);

  if (costItems && costItems.length > 0) {
    const directTotal = costItems
      .filter((i) => i.category === "direct")
      .reduce((s, i) => s + Number(i.total), 0);
    const indirectTotal = costItems
      .filter((i) => i.category === "indirect")
      .reduce((s, i) => s + Number(i.total), 0);
    const totalCost = directTotal + indirectTotal;
    const proposedPrice = tender.proposed_price ?? totalCost;
    const margin =
      totalCost > 0 && proposedPrice > 0
        ? ((proposedPrice - totalCost) / proposedPrice) * 100
        : 0;
    const estimatedValue = tender.estimated_value ?? 0;
    const delta = estimatedValue - proposedPrice;
    const deltaPct =
      estimatedValue > 0 ? ((delta / estimatedValue) * 100).toFixed(1) : "0";
    parts.push("\n--- بيانات التكاليف ---");
    parts.push(`إجمالي التكاليف المباشرة: ${directTotal}`);
    parts.push(`إجمالي التكاليف غير المباشرة: ${indirectTotal}`);
    parts.push(`إجمالي التكاليف: ${totalCost}`);
    parts.push(`سعر العرض المقترح: ${proposedPrice}`);
    parts.push(`هامش الربح: ${margin.toFixed(1)}%`);
    parts.push(`القيمة التقديرية للمنافسة: ${estimatedValue}`);
    parts.push(`الفرق عن القيمة التقديرية: ${delta} (${deltaPct}%)`);
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
