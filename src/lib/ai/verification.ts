/**
 * Post-AI verification layer — catches hallucinations that prompts and Zod can't.
 *
 * Three guardrail categories:
 * 1. Formula verification: recalculate overall_score, verify recommendation threshold
 * 2. Extraction sanity: deadline in future, value in bounds, confidence threshold
 * 3. Evidence cross-check: verify quoted text appears in the source content
 */

import type { AIAnalysisResult, ExtractionResult } from "./provider";
import type { ExtractedSections, BOQItem } from "@/types/extracted-sections";
import type { SpecCardResponse, NominationResponse } from "./parser";
import type { SpecCard } from "@/types/spec-cards";

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

  // --- Verify extracted sections ---
  if (corrected.extracted_sections) {
    const { corrected: fixedSections, corrections: sectionCorr } =
      verifySections(corrected.extracted_sections as ExtractedSections);
    corrected.extracted_sections = fixedSections;
    corrections.push(...sectionCorr);
  }

  return { corrected, corrections };
}

// ---------------------------------------------------------------------------
// 2b. EXTRACTED SECTIONS VERIFICATION
// ---------------------------------------------------------------------------

const MIN_SECTION_CONFIDENCE = 20;

function verifySections(
  sections: ExtractedSections
): { corrected: ExtractedSections | null; corrections: string[] } {
  const corrections: string[] = [];
  const corrected = structuredClone(sections);

  // Contract terms: percentages 0-100
  if (corrected.contract_terms) {
    const ct = corrected.contract_terms;
    const pctKeys = [
      "initial_guarantee_percent",
      "final_guarantee_percent",
      "delay_penalty_percent",
      "delay_penalty_max_percent",
      "advance_payment_percent",
      "retention_percent",
    ] as const;
    for (const key of pctKeys) {
      const val = ct[key];
      if (val != null && (val < 0 || val > 100)) {
        corrections.push(`تصحيح ${key}: ${val}% خارج النطاق 0-100`);
        (ct as Record<string, unknown>)[key] = null;
      }
    }
    // Execution period sanity: 7 days to 5 years
    if (ct.execution_period_days != null && (ct.execution_period_days < 7 || ct.execution_period_days > 1825)) {
      corrections.push(`تحذير: مدة التنفيذ ${ct.execution_period_days} يوم غير معتادة`);
    }
    // Null out section if confidence too low
    if (ct.confidence < MIN_SECTION_CONFIDENCE) {
      corrections.push(`إلغاء قسم شروط التعاقد: ثقة ${ct.confidence}% أقل من الحد`);
      corrected.contract_terms = null;
    }
  }

  // Evaluation method: weights should sum to ~100
  if (corrected.evaluation_method) {
    const em = corrected.evaluation_method;
    if (em.financial_weight != null && em.technical_weight != null) {
      const sum = em.financial_weight + em.technical_weight;
      if (Math.abs(sum - 100) > 5) {
        corrections.push(
          `تحذير: مجموع أوزان التقييم (${em.financial_weight}% + ${em.technical_weight}% = ${sum}%) لا يساوي 100%`
        );
      }
    }
    if (em.confidence < MIN_SECTION_CONFIDENCE) {
      corrections.push(`إلغاء قسم آلية التقييم: ثقة ${em.confidence}% أقل من الحد`);
      corrected.evaluation_method = null;
    }
  }

  // Qualifications: null out if too low confidence
  if (corrected.qualifications && corrected.qualifications.confidence < MIN_SECTION_CONFIDENCE) {
    corrections.push(`إلغاء قسم المتطلبات التأهيلية: ثقة ${corrected.qualifications.confidence}% أقل من الحد`);
    corrected.qualifications = null;
  }

  // Technical specs: null out if too low confidence
  if (corrected.technical_specs && corrected.technical_specs.confidence < MIN_SECTION_CONFIDENCE) {
    corrections.push(`إلغاء قسم المواصفات الفنية: ثقة ${corrected.technical_specs.confidence}% أقل من الحد`);
    corrected.technical_specs = null;
  }

  // BOQ: null out if too low confidence
  if (corrected.boq && corrected.boq.confidence < MIN_SECTION_CONFIDENCE) {
    corrections.push(`إلغاء قسم جدول الكميات: ثقة ${corrected.boq.confidence}% أقل من الحد`);
    corrected.boq = null;
  }

  // If all sections are null, return null
  const allNull = !corrected.boq && !corrected.technical_specs &&
    !corrected.qualifications && !corrected.contract_terms && !corrected.evaluation_method;
  if (allNull) {
    return { corrected: null, corrections };
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

// ---------------------------------------------------------------------------
// 4. SPEC CARDS VERIFICATION (Phase 3.4)
// ---------------------------------------------------------------------------

interface SpecCardsVerification {
  verified: SpecCardResponse[];
  corrections: string[];
}

/**
 * Verify spec cards against BOQ items.
 * - Each card maps to a valid BOQ item by boq_seq
 * - Clamp ai_confidence 0-100
 * - Ensure parameters array exists
 * - Flag cards with 0 parameters as low confidence
 */
export function verifySpecCards(
  cards: SpecCardResponse[],
  boqItems: BOQItem[]
): SpecCardsVerification {
  const corrections: string[] = [];
  const boqSeqs = new Set(boqItems.map((b) => b.seq));

  const verified = cards.map((card) => {
    const corrected = { ...card };

    // Verify boq_seq maps to a valid BOQ item
    if (!boqSeqs.has(card.boq_seq)) {
      corrections.push(
        `تحذير: بطاقة مواصفات boq_seq=${card.boq_seq} لا تتطابق مع أي بند في جدول الكميات`
      );
    }

    // Clamp ai_confidence to 0-100
    const clamped = Math.max(0, Math.min(100, card.confidence));
    if (clamped !== card.confidence) {
      corrections.push(
        `تصحيح ثقة بطاقة boq_seq=${card.boq_seq}: ${card.confidence} → ${clamped} (خارج النطاق 0-100)`
      );
      corrected.confidence = clamped;
    }

    // Ensure parameters array exists
    if (!Array.isArray(corrected.parameters)) {
      corrections.push(
        `تصحيح بطاقة boq_seq=${card.boq_seq}: parameters ليست مصفوفة — تم تعيينها كمصفوفة فارغة`
      );
      corrected.parameters = [];
    }

    // Flag cards with 0 parameters as low confidence
    if (corrected.parameters.length === 0 && corrected.confidence > 40) {
      corrections.push(
        `تصحيح ثقة بطاقة boq_seq=${card.boq_seq}: لا توجد معاملات — خفض الثقة من ${corrected.confidence} إلى 30`
      );
      corrected.confidence = 30;
    }

    // Ensure arrays are arrays (not null)
    if (!Array.isArray(corrected.referenced_standards)) corrected.referenced_standards = [];
    if (!Array.isArray(corrected.approved_brands)) corrected.approved_brands = [];
    if (!Array.isArray(corrected.constraints)) corrected.constraints = [];

    return corrected;
  });

  return { verified, corrections };
}

// ---------------------------------------------------------------------------
// 5. NOMINATIONS VERIFICATION (Phase 3.4)
// ---------------------------------------------------------------------------

interface NominationsVerification {
  verified: NominationResponse[];
  corrections: string[];
}

/**
 * Verify product nominations against a spec card.
 * - Recalculate compliance_score from compliance_details (mandatory params met / total mandatory)
 * - Clamp compliance_score 0-100
 * - Validate prices are non-negative if present
 * - Ensure rank ordering
 */
export function verifyNominations(
  nominations: NominationResponse[],
  specCard: SpecCard
): NominationsVerification {
  const corrections: string[] = [];

  // Get mandatory parameters from spec card
  const mandatoryParams = Array.isArray(specCard.parameters)
    ? specCard.parameters.filter((p) => p.is_mandatory)
    : [];
  const totalMandatory = mandatoryParams.length;

  const verified = nominations.map((nom, idx) => {
    const corrected = { ...nom };

    // Recalculate compliance_score from compliance_details
    if (totalMandatory > 0 && Array.isArray(corrected.compliance_details) && corrected.compliance_details.length > 0) {
      const mandatoryMet = corrected.compliance_details.filter(
        (d) => d.meets_spec && mandatoryParams.some((p) => p.name === d.parameter)
      ).length;
      const recalculated = Math.round((mandatoryMet / totalMandatory) * 100);

      if (Math.abs(recalculated - corrected.compliance_score) > 10) {
        corrections.push(
          `تصحيح درجة المطابقة لـ "${corrected.product_name}": ${corrected.compliance_score} → ${recalculated} (إعادة حساب من المعاملات الإلزامية)`
        );
        corrected.compliance_score = recalculated;
      }
    }

    // Clamp compliance_score to 0-100
    const clamped = Math.max(0, Math.min(100, corrected.compliance_score));
    if (clamped !== corrected.compliance_score) {
      corrections.push(
        `تصحيح درجة المطابقة لـ "${corrected.product_name}": ${corrected.compliance_score} → ${clamped} (خارج النطاق 0-100)`
      );
      corrected.compliance_score = clamped;
    }

    // Validate prices are non-negative if present
    if (corrected.estimated_price != null && corrected.estimated_price < 0) {
      corrections.push(
        `تصحيح سعر "${corrected.product_name}": ${corrected.estimated_price} → null (سعر سالب)`
      );
      corrected.estimated_price = null;
    }

    // Ensure compliance_details is an array
    if (!Array.isArray(corrected.compliance_details)) {
      corrected.compliance_details = [];
    }

    // Ensure rank ordering (1-based)
    if (!corrected.rank || corrected.rank < 1) {
      corrected.rank = idx + 1;
    }

    return corrected;
  });

  // Re-sort by rank and fix any duplicate ranks
  verified.sort((a, b) => a.rank - b.rank);
  const usedRanks = new Set<number>();
  for (const nom of verified) {
    if (usedRanks.has(nom.rank)) {
      const newRank = Math.max(...Array.from(usedRanks)) + 1;
      corrections.push(
        `تصحيح ترتيب "${nom.product_name}": تكرار rank=${nom.rank} → ${newRank}`
      );
      nom.rank = newRank;
    }
    usedRanks.add(nom.rank);
  }

  return { verified, corrections };
}
