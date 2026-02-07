/**
 * Deterministic extraction for Section 6 (متطلبات التعاقد):
 * Guarantees, penalties, execution period, payment terms, insurance.
 */
import type { PreExtractedContractTerms } from "../types";

const INITIAL_GUARANTEE_RE =
  /(?:الضمان|ضمان)\s*الابتدائي[\s\S]{0,50}?(\d{1,3})\s*%/;
const FINAL_GUARANTEE_RE =
  /(?:الضمان|ضمان)\s*النهائي[\s\S]{0,50}?(\d{1,3})\s*%/;

const DELAY_PENALTY_RE =
  /(?:غرام[ةه]\s+(?:ال)?تأخير)[\s\S]{0,80}?(\d{1,2}(?:\.\d+)?)\s*%/;
const MAX_PENALTY_RE =
  /(?:لا\s+يتجاوز|الحد\s+الأقصى)[\s\S]{0,50}?(?:غرام|عقوب)[\s\S]{0,50}?(\d{1,3})\s*%/;

const EXEC_PERIOD_DAYS_RE =
  /(?:مدة\s+التنفيذ|فترة\s+التنفيذ)[\s\S]{0,40}?(\d{1,4})\s*(?:يوم|أيام)/;
const EXEC_PERIOD_MONTHS_RE =
  /(?:مدة\s+التنفيذ|فترة\s+التنفيذ)[\s\S]{0,40}?(\d{1,3})\s*(?:شهر|أشهر)/;

const WARRANTY_RE =
  /(?:فترة\s+الضمان|مدة\s+الضمان)[\s\S]{0,40}?(\d{1,4})\s*(?:يوم|أيام|شهر|أشهر|سنة|سنوات)/;

const ADVANCE_PAYMENT_RE =
  /(?:الدفعة\s+المقدمة|دفعة\s+مقدمة)[\s\S]{0,50}?(\d{1,3})\s*%/;
const RETENTION_RE =
  /(?:المحتجزات|الاستقطاع|نسبة\s+الحسم)[\s\S]{0,50}?(\d{1,3})\s*%/;

const INSURANCE_RE =
  /(?:التأمين\s+مطلوب|يلتزم[\s\S]{0,20}?تأمين|وثيقة\s+تأمين)/;

const PAYMENT_TERMS_RE =
  /(?:شروط\s+الدفع|جدول\s+الدفعات|آلية\s+الصرف)[\s:]*([^\n]{10,300})/;

function extractPercent(text: string, re: RegExp): number | null {
  const match = text.match(re);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return val >= 0 && val <= 100 ? val : null;
}

export function extractContractTerms(
  sectionText: string
): PreExtractedContractTerms {
  let execution_period_days =
    (() => {
      const m = sectionText.match(EXEC_PERIOD_DAYS_RE);
      return m ? parseInt(m[1], 10) || null : null;
    })();

  if (execution_period_days == null) {
    const m = sectionText.match(EXEC_PERIOD_MONTHS_RE);
    if (m) execution_period_days = (parseInt(m[1], 10) || 0) * 30 || null;
  }

  let warranty_period_days: number | null = null;
  const warrantyMatch = sectionText.match(WARRANTY_RE);
  if (warrantyMatch) {
    const val = parseInt(warrantyMatch[1], 10);
    const unit = warrantyMatch[0];
    if (/سنة|سنوات/.test(unit)) warranty_period_days = val * 365;
    else if (/شهر|أشهر/.test(unit)) warranty_period_days = val * 30;
    else warranty_period_days = val;
  }

  const paymentMatch = sectionText.match(PAYMENT_TERMS_RE);

  let confidence = 20;
  const fields = [
    extractPercent(sectionText, INITIAL_GUARANTEE_RE),
    extractPercent(sectionText, FINAL_GUARANTEE_RE),
    execution_period_days,
    extractPercent(sectionText, DELAY_PENALTY_RE),
  ];
  confidence += fields.filter((f) => f != null).length * 15;

  return {
    initial_guarantee_percent: extractPercent(
      sectionText,
      INITIAL_GUARANTEE_RE
    ),
    final_guarantee_percent: extractPercent(
      sectionText,
      FINAL_GUARANTEE_RE
    ),
    delay_penalty_percent: extractPercent(
      sectionText,
      DELAY_PENALTY_RE
    ),
    delay_penalty_max_percent: extractPercent(
      sectionText,
      MAX_PENALTY_RE
    ),
    execution_period_days,
    warranty_period_days,
    payment_terms: paymentMatch ? paymentMatch[1].trim() : null,
    advance_payment_percent: extractPercent(
      sectionText,
      ADVANCE_PAYMENT_RE
    ),
    retention_percent: extractPercent(sectionText, RETENTION_RE),
    insurance_required: INSURANCE_RE.test(sectionText) ? true : null,
    confidence: Math.min(confidence, 95),
  };
}
