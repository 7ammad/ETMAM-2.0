/**
 * Two-phase PDF extraction — Phase 1: Deterministic pre-extraction.
 *
 * Steps:
 * 1. Extract raw text from PDF (pdf-parse)
 * 2. Detect 12 standard اعتماد sections by heading patterns
 * 3. Run section-specific regex/heuristic extractors
 * 4. Return structured pre-extraction result for AI refinement
 */
import { extractTextFromPDF } from "./extract-text";
import { detectSections, getSectionText, findBOQSection } from "./section-detector";
import {
  extractIntroduction,
  extractEvaluation,
  extractContractTerms,
  extractScopeOfWork,
  extractSpecifications,
  extractQualifications,
} from "./extractors";
import type { PreExtractionResult } from "./types";

export async function runDeterministicExtraction(
  buffer: Buffer
): Promise<PreExtractionResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  // Step 1: Extract text
  const { text: rawText, pageCount } = await extractTextFromPDF(buffer);

  if (!rawText.trim()) {
    warnings.push(
      "لم يتم استخراج أي نص من ملف PDF — قد يكون الملف صورة فقط"
    );
    return emptyResult(rawText, pageCount, startTime, warnings);
  }

  if (rawText.length < 200) {
    warnings.push(
      "النص المستخرج قصير جداً — قد يكون ملف PDF محمياً أو فارغاً"
    );
  }

  // Step 2: Detect sections
  const detectedSections = detectSections(rawText);

  if (detectedSections.length === 0) {
    warnings.push(
      "لم يتم التعرف على أقسام بنمط اعتماد — سيتم الاستخراج من النص الكامل"
    );
  } else {
    warnings.push(
      `تم التعرف على ${detectedSections.length} قسم من أصل 12`
    );
  }

  // Step 3: Extract from each section
  const sec1Text = getSectionText(detectedSections, 1, rawText);
  const sec3Text = getSectionText(detectedSections, 3, rawText);
  const sec5Text = getSectionText(detectedSections, 5, rawText);
  const sec6Text = getSectionText(detectedSections, 6, rawText);
  const sec8Text = getSectionText(detectedSections, 8, rawText);
  const sec9Text = getSectionText(detectedSections, 9, rawText);

  // For BOQ: use detected section 7 if available, otherwise fallback to heading search
  const hasSection7 = detectedSections.some((s) => s.sectionNumber === 7);
  const detectedSec7 = detectedSections.find((s) => s.sectionNumber === 7);
  const boqFallbackText = hasSection7 ? "" : findBOQSection(rawText);
  const sec7Text = detectedSec7?.text ?? (boqFallbackText || rawText);

  const introduction = extractIntroduction(sec1Text, rawText);
  const evaluation = extractEvaluation(sec5Text);
  const contract_terms = extractContractTerms(sec6Text);
  const boq = extractScopeOfWork(sec7Text);
  const technical_specs = extractSpecifications(sec8Text);
  const qualifications = extractQualifications(
    sec3Text + "\n" + sec5Text,
    sec9Text,
    rawText
  );

  // Step 4: Compute overall confidence
  const sectionConfidences = [
    introduction.tender_number?.confidence ?? 0,
    evaluation.confidence,
    contract_terms.confidence,
    boq.confidence,
    technical_specs.confidence,
    qualifications.confidence,
  ];
  const overall_confidence = Math.round(
    sectionConfidences.reduce((a, b) => a + b, 0) /
      sectionConfidences.length
  );

  // BOQ section text for AI refinement
  const boqSectionText = detectedSec7?.text ?? boqFallbackText;

  return {
    raw_text: rawText,
    page_count: pageCount,
    detected_sections: detectedSections,
    introduction,
    boq,
    boq_section_text: boqSectionText.slice(0, 8000),
    technical_specs,
    contract_terms,
    evaluation,
    qualifications,
    overall_confidence,
    extraction_time_ms: Date.now() - startTime,
    warnings,
  };
}

function emptyResult(
  rawText: string,
  pageCount: number,
  startTime: number,
  warnings: string[]
): PreExtractionResult {
  return {
    raw_text: rawText,
    page_count: pageCount,
    detected_sections: [],
    introduction: {
      entity: null,
      tender_number: null,
      tender_title: null,
      deadline: null,
      estimated_value: null,
      description: null,
      hijri_dates: [],
    },
    boq: {
      pricing_type: null,
      items: [],
      total_items_count: null,
      confidence: 0,
    },
    boq_section_text: "",
    technical_specs: {
      scope_of_work: null,
      referenced_standards: [],
      materials: [],
      equipment: [],
      deliverables: [],
      execution_methodology: null,
      confidence: 0,
    },
    contract_terms: {
      initial_guarantee_percent: null,
      final_guarantee_percent: null,
      delay_penalty_percent: null,
      delay_penalty_max_percent: null,
      execution_period_days: null,
      warranty_period_days: null,
      payment_terms: null,
      advance_payment_percent: null,
      retention_percent: null,
      insurance_required: null,
      confidence: 0,
    },
    evaluation: {
      method: null,
      financial_weight: null,
      technical_weight: null,
      min_technical_score: null,
      scoring_formula: null,
      local_content_target_percent: null,
      evaluation_criteria: [],
      confidence: 0,
    },
    qualifications: {
      contractor_classification: null,
      required_certifications: [],
      required_licenses: [],
      minimum_experience_years: null,
      similar_projects_required: null,
      required_staff: [],
      local_content_requirement: null,
      confidence: 0,
    },
    overall_confidence: 0,
    extraction_time_ms: Date.now() - startTime,
    warnings,
  };
}

export type { PreExtractionResult } from "./types";
