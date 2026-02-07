/**
 * Deterministic extraction for Section 1 (المقدمة):
 * Entity, tender number, title, deadline, estimated value, dates.
 */
import type { PreExtractedIntroduction, PreExtractedField } from "../types";
import { parseHijriDate } from "../hijri-converter";

const TENDER_NUMBER_RE =
  /(?:رقم\s+(?:الكراسة|المنافسة|الطرح|العملية)|منافسة\s+رقم|الرقم\s+المرجعي)[\s:]*([\d-]{4,14})/;

const ENTITY_RE =
  /(?:الجهة\s*(?:الحكومية)?|صاحب\s+العمل|الطرف\s+الأول)[\s:]+([^\n\d]{3,100})/;

const TITLE_RE =
  /(?:اسم|عنوان)\s+المنافسة[\s:]+([^\n]{5,120})/;

const HIJRI_DATE_RE = /(\d{1,2}\/\d{1,2}\/1[34]\d{2})/g;

const DEADLINE_LABEL_RE =
  /(?:آخر\s+موعد|الموعد\s+النهائي|تقديم\s+العروض)[\s:]*(\d{1,2}\/\d{1,2}\/1[34]\d{2})/;

const SAR_AMOUNT_RE =
  /([\d,،]+(?:\.\d{1,2})?)\s*(?:ريال|ر\.?\s*س|SAR)/g;

function matchField<T>(
  text: string,
  regex: RegExp,
  transform: (m: RegExpMatchArray) => T,
  confidence: number
): PreExtractedField<T> | null {
  const match = text.match(regex);
  if (!match) return null;
  return {
    value: transform(match),
    source: "regex",
    evidence: match[0].slice(0, 200),
    confidence,
  };
}

export function extractIntroduction(
  sectionText: string,
  fullText: string
): PreExtractedIntroduction {
  // Intro fields are in the first ~5000 chars
  const introText = sectionText.slice(0, 5000);

  const entity = matchField(introText, ENTITY_RE, (m) => m[1].trim(), 80);
  const tender_number = matchField(
    introText,
    TENDER_NUMBER_RE,
    (m) => m[1].trim(),
    90
  );
  const tender_title = matchField(
    introText,
    TITLE_RE,
    (m) => m[1].trim(),
    85
  );

  // Collect all Hijri dates
  const hijri_dates: PreExtractedField<string>[] = [];
  const dateRe = new RegExp(HIJRI_DATE_RE.source, "g");
  let dateMatch: RegExpExecArray | null;
  while ((dateMatch = dateRe.exec(fullText)) !== null) {
    hijri_dates.push({
      value: dateMatch[1],
      source: "regex",
      evidence: fullText.slice(
        Math.max(0, dateMatch.index - 30),
        dateMatch.index + dateMatch[0].length + 30
      ),
      confidence: 70,
    });
  }

  // Deadline: labeled date first, then fallback
  let deadline: PreExtractedField<string> | null = null;
  const dlMatch =
    introText.match(DEADLINE_LABEL_RE) ??
    fullText.slice(0, 8000).match(DEADLINE_LABEL_RE);
  if (dlMatch) {
    const iso = parseHijriDate(dlMatch[1]);
    if (iso) {
      deadline = {
        value: iso,
        source: "regex",
        evidence: dlMatch[0],
        confidence: 85,
      };
    }
  }

  // Estimated value: largest SAR amount in the document
  let estimated_value: PreExtractedField<number> | null = null;
  const amountRe = new RegExp(SAR_AMOUNT_RE.source, "g");
  let amountMatch: RegExpExecArray | null;
  let maxAmount = 0;
  let maxEvidence = "";
  while ((amountMatch = amountRe.exec(fullText)) !== null) {
    const cleaned = amountMatch[1].replace(/[,،]/g, "");
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > maxAmount) {
      maxAmount = num;
      maxEvidence = amountMatch[0];
    }
  }
  if (maxAmount > 0) {
    estimated_value = {
      value: maxAmount,
      source: "regex",
      evidence: maxEvidence,
      confidence: 60,
    };
  }

  return {
    entity,
    tender_number,
    tender_title,
    deadline,
    estimated_value,
    description: null,
    hijri_dates,
  };
}
