/**
 * Deterministic extraction for Section 5 (تقييم العروض):
 * Evaluation method, weights, formula, local content target, min technical score.
 */
import type { PreExtractedEvaluation } from "../types";

const LOWEST_PRICE_RE = /أقل\s+(?:الأسعار|سعر)/;
const QUALITY_COST_RE =
  /(?:الجودة|جودة)\s+و?\s*(?:التكلفة|السعر|الثمن)/;

const FINANCIAL_WEIGHT_RE =
  /(?:وزن|نسبة)\s*(?:العرض\s+)?المالي[\s\S]{0,30}?(\d{1,3})\s*%/;
const TECHNICAL_WEIGHT_RE =
  /(?:وزن|نسبة)\s*(?:العرض\s+)?الفني[\s\S]{0,30}?(\d{1,3})\s*%/;

const MIN_TECH_SCORE_RE =
  /(?:الحد\s+الأدنى|أقل\s+درجة)[\s\S]{0,40}?(?:الفني|فني)[\s\S]{0,20}?(\d{1,3})/;

const FORMULA_RE =
  /(?:نتيجة\s+التقييم|معادلة\s+التقييم|المعادلة)[\s:]*([^\n]{20,500})/;

const LOCAL_CONTENT_RE =
  /(?:نسبة\s+المحتوى\s+المحلي\s+المستهدفة)[\s\S]{0,30}?(\d{1,3})\s*%/;

export function extractEvaluation(
  sectionText: string
): PreExtractedEvaluation {
  let method: PreExtractedEvaluation["method"] = null;
  if (QUALITY_COST_RE.test(sectionText)) method = "quality_and_cost";
  else if (LOWEST_PRICE_RE.test(sectionText)) method = "lowest_price";

  const fwMatch = sectionText.match(FINANCIAL_WEIGHT_RE);
  const twMatch = sectionText.match(TECHNICAL_WEIGHT_RE);
  const financial_weight = fwMatch ? parseInt(fwMatch[1], 10) : null;
  let technical_weight = twMatch ? parseInt(twMatch[1], 10) : null;

  if (financial_weight != null && technical_weight == null) {
    technical_weight = 100 - financial_weight;
  }
  if (financial_weight != null && method == null) {
    method = "quality_and_cost";
  }

  const minTechMatch = sectionText.match(MIN_TECH_SCORE_RE);
  const formulaMatch = sectionText.match(FORMULA_RE);
  const lcMatch = sectionText.match(LOCAL_CONTENT_RE);

  // Extract evaluation criteria from numbered/bulleted lists
  const criteria: string[] = [];
  const criteriaRe =
    /(?:^|\n)\s*(?:\d+[.\-)]\s*|[•\-]\s*)(.{10,100})/g;
  let cMatch: RegExpExecArray | null;
  while ((cMatch = criteriaRe.exec(sectionText)) !== null) {
    const text = cMatch[1].trim();
    if (text.length > 10 && text.length < 200) {
      criteria.push(text);
    }
  }

  let confidence = 30;
  if (method) confidence += 20;
  if (financial_weight != null) confidence += 20;
  if (formulaMatch) confidence += 15;
  if (lcMatch) confidence += 15;

  return {
    method,
    financial_weight,
    technical_weight,
    min_technical_score: minTechMatch
      ? parseInt(minTechMatch[1], 10)
      : null,
    scoring_formula: formulaMatch ? formulaMatch[1].trim() : null,
    local_content_target_percent: lcMatch
      ? parseInt(lcMatch[1], 10)
      : null,
    evaluation_criteria: criteria,
    confidence: Math.min(confidence, 95),
  };
}
