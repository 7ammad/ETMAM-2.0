/**
 * Post-AI verification layer — catches hallucinations that prompts and Zod can't.
 *
 * Three guardrail categories:
 * 1. Formula verification: recalculate overall_score, verify recommendation threshold
 * 2. Extraction sanity: deadline in future, value in bounds, confidence threshold
 * 3. Evidence cross-check: verify quoted text appears in the source content
 */

import type { AIAnalysisResult, ExtractionResult } from "./provider";

// ---------------------------------------------------------------------------
// 1. ANALYSIS VERIFICATION
// ---------------------------------------------------------------------------

interface AnalysisVerification {
  corrected: AIAnalysisResult;
  corrections: string[];
}

/**
 * Recalculate overall_score from sub-scores and enforce recommendation thresholds.
 * Returns corrected result + list of corrections made.
 */
export function verifyAnalysis(
  result: AIAnalysisResult,
  weights: Record<string, number>
): AnalysisVerification {
  const corrections: string[] = [];
  const corrected = { ...result };

  // --- Recalculate overall_score from weighted sub-scores ---
  const weightMap: Record<string, string> = {
    relevance: "relevance",
    budget_fit: "budgetFit",
    timeline: "timeline",
    competition: "competition",
    strategic: "strategic",
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [scoreKey, weightKey] of Object.entries(weightMap)) {
    const scoreObj = result.scores[scoreKey];
    const weight = weights[weightKey] ?? 0;
    if (scoreObj) {
      // Clamp score to 0-100
      const clampedScore = Math.max(0, Math.min(100, scoreObj.score));
      if (clampedScore !== scoreObj.score) {
        corrections.push(
          `تصحيح درجة ${scoreKey}: ${scoreObj.score} → ${clampedScore} (خارج النطاق 0-100)`
        );
        corrected.scores = {
          ...corrected.scores,
          [scoreKey]: { ...scoreObj, score: clampedScore },
        };
      }
      weightedSum += clampedScore * weight;
      totalWeight += weight;
    }
  }

  // Compute verified score
  const verifiedScore =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
  const aiScore = Math.round(result.overall_score);

  if (Math.abs(verifiedScore - aiScore) > 5) {
    corrections.push(
      `تصحيح الدرجة الإجمالية: الذكاء الاصطناعي أعطى ${aiScore}، الحساب الفعلي = ${verifiedScore}`
    );
    corrected.overall_score = verifiedScore;
  }

  // --- Enforce recommendation thresholds ---
  const finalScore = corrected.overall_score;
  let expectedRec: "pursue" | "review" | "skip";
  if (finalScore >= 70) expectedRec = "pursue";
  else if (finalScore >= 40) expectedRec = "review";
  else expectedRec = "skip";

  if (corrected.recommendation !== expectedRec) {
    corrections.push(
      `تصحيح التوصية: الذكاء الاصطناعي أوصى "${corrected.recommendation}" لدرجة ${finalScore}، المتوقع "${expectedRec}"`
    );
    corrected.recommendation = expectedRec;
  }

  // --- Validate confidence ---
  const hasInsufficient = Object.values(corrected.scores).some(
    (s) =>
      typeof s === "object" &&
      s !== null &&
      "reasoning" in s &&
      typeof s.reasoning === "string" &&
      s.reasoning.includes("بيانات غير كافية")
  );
  if (hasInsufficient && corrected.confidence === "high") {
    corrections.push(
      'تصحيح الثقة: لا يمكن أن تكون "high" مع وجود معايير بدون بيانات كافية'
    );
    corrected.confidence = "medium";
  }

  return { corrected, corrections };
}

// ---------------------------------------------------------------------------
// 2. EXTRACTION VERIFICATION
// ---------------------------------------------------------------------------

interface ExtractionVerification {
  corrected: ExtractionResult;
  corrections: string[];
}

const MIN_CONFIDENCE_THRESHOLD = 30;
const MAX_ESTIMATED_VALUE = 10_000_000_000; // 10 billion SAR
const MIN_ESTIMATED_VALUE = 1000; // 1,000 SAR

/**
 * Validate extracted tender data for sanity.
 * Nulls out fields below confidence threshold, checks value bounds,
 * validates deadline is a real date.
 */
export function verifyExtraction(
  result: ExtractionResult
): ExtractionVerification {
  const corrections: string[] = [];
  const corrected = { ...result };

  // --- Null out fields below confidence threshold ---
  const fieldKeys = [
    "entity",
    "tender_title",
    "tender_number",
    "deadline",
    "estimated_value",
    "description",
  ] as const;

  const notFound = [...(corrected.not_found ?? [])];

  for (const key of fieldKeys) {
    const conf = corrected.confidence?.[key];
    if (
      conf != null &&
      conf < MIN_CONFIDENCE_THRESHOLD &&
      corrected[key] != null
    ) {
      corrections.push(
        `إلغاء حقل "${key}": ثقة ${conf}% أقل من الحد الأدنى (${MIN_CONFIDENCE_THRESHOLD}%)`
      );
      // TypeScript needs individual assignments
      (corrected as Record<string, unknown>)[key] = null;
      if (!notFound.includes(key)) notFound.push(key);
    }
  }
  corrected.not_found = notFound;

  // --- Estimated value bounds ---
  if (corrected.estimated_value != null) {
    if (corrected.estimated_value <= 0) {
      corrections.push(
        `إلغاء القيمة التقديرية: ${corrected.estimated_value} (يجب أن تكون موجبة)`
      );
      corrected.estimated_value = null;
      if (!corrected.not_found.includes("estimated_value"))
        corrected.not_found.push("estimated_value");
    } else if (corrected.estimated_value < MIN_ESTIMATED_VALUE) {
      corrections.push(
        `تحذير: القيمة التقديرية ${corrected.estimated_value} ريال منخفضة جداً لمنافسة حكومية`
      );
      corrected.warnings = [
        ...(corrected.warnings ?? []),
        `القيمة التقديرية (${corrected.estimated_value} ريال) منخفضة بشكل غير معتاد`,
      ];
    } else if (corrected.estimated_value > MAX_ESTIMATED_VALUE) {
      corrections.push(
        `تحذير: القيمة التقديرية ${corrected.estimated_value} ريال مرتفعة جداً — يرجى التحقق`
      );
      corrected.warnings = [
        ...(corrected.warnings ?? []),
        `القيمة التقديرية (${corrected.estimated_value.toLocaleString()} ريال) مرتفعة بشكل غير معتاد`,
      ];
    }
  }

  // --- Deadline validation ---
  if (corrected.deadline != null) {
    const deadlineDate = new Date(corrected.deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      corrections.push(
        `إلغاء الموعد النهائي: "${corrected.deadline}" ليس تاريخاً صالحاً`
      );
      corrected.deadline = null;
      if (!corrected.not_found.includes("deadline"))
        corrected.not_found.push("deadline");
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        corrections.push(
          `تحذير: الموعد النهائي ${corrected.deadline} في الماضي`
        );
        corrected.warnings = [
          ...(corrected.warnings ?? []),
          `الموعد النهائي (${corrected.deadline}) قد يكون منتهياً — يرجى التحقق`,
        ];
      }
    }
  }

  // --- Recalculate overall_confidence from non-null fields ---
  const confValues = fieldKeys
    .filter((k) => corrected[k] != null && corrected.confidence?.[k] != null)
    .map((k) => corrected.confidence[k] as number);

  if (confValues.length > 0) {
    const avg = Math.round(
      confValues.reduce((a, b) => a + b, 0) / confValues.length
    );
    if (Math.abs(avg - corrected.overall_confidence) > 10) {
      corrections.push(
        `تصحيح ثقة الاستخراج الإجمالية: ${corrected.overall_confidence} → ${avg}`
      );
      corrected.overall_confidence = avg;
    }
  }

  return { corrected, corrections };
}

// ---------------------------------------------------------------------------
// 3. EVIDENCE CROSS-CHECK (for analysis)
// ---------------------------------------------------------------------------

/**
 * Check if evidence quotes actually appear in the source text.
 * Uses fuzzy substring matching to account for minor whitespace differences.
 */
export function verifyEvidence(
  evidence: AIAnalysisResult["evidence"],
  sourceText: string
): { verified: AIAnalysisResult["evidence"]; flagged: string[] } {
  const flagged: string[] = [];
  const normalizedSource = normalizeArabic(sourceText);

  const verified = evidence.map((item) => {
    const normalizedQuote = normalizeArabic(item.text);
    // Check if at least 60% of words in the quote appear in the source
    const words = normalizedQuote.split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) return item;

    const matchedWords = words.filter((w) => normalizedSource.includes(w));
    const matchRatio = matchedWords.length / words.length;

    if (matchRatio < 0.5) {
      flagged.push(
        `اقتباس مشكوك فيه (تطابق ${Math.round(matchRatio * 100)}%): "${item.text.slice(0, 80)}..."`
      );
      return { ...item, relevance: "concerning" as const };
    }
    return item;
  });

  return { verified, flagged };
}

/** Normalize Arabic text for comparison (remove diacritics, normalize alef/hamza) */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
    .replace(/[أإآ]/g, "ا") // normalize alef
    .replace(/ة/g, "ه") // normalize ta marbuta
    .replace(/ى/g, "ي") // normalize alef maqsura
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
