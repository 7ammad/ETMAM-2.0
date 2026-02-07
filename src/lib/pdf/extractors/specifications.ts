/**
 * Deterministic extraction for Section 8 (المواصفات):
 * Standards, materials, equipment, deliverables, methodology.
 */
import type { PreExtractedTechnicalSpecs } from "../types";

const STANDARDS_RE =
  /(?:ISO|SASO|NFPA|IEC|IEEE|ASHRAE|ASTM|BS|EN)\s*[\d\-]+(?::\d{4})?/g;

const MATERIALS_LABEL_RE = /(?:المواد|الأصناف|مواد\s+التوريد)[\s:]*/;
const EQUIPMENT_LABEL_RE = /(?:المعدات|الأجهزة|معدات\s+التشغيل)[\s:]*/;
const DELIVERABLES_LABEL_RE =
  /(?:المخرجات|التسليمات|التقارير\s+المطلوبة)[\s:]*/;

const METHODOLOGY_RE =
  /(?:منهجية\s+التنفيذ|طريقة\s+التنفيذ|أسلوب\s+التنفيذ|خطة\s+العمل)[\s:]*([^\n]{20,500})/;

/**
 * Extract list items following a label within ~1000 chars.
 */
function extractListAfterLabel(text: string, labelRe: RegExp): string[] {
  const match = text.match(labelRe);
  if (!match || match.index == null) return [];

  const start = match.index + match[0].length;
  const afterLabel = text.slice(start, start + 1000);
  const items: string[] = [];

  const listRe = /(?:^|\n)\s*(?:\d+[.\-)]\s*|[•\-]\s*)(.{5,150})/g;
  let m: RegExpExecArray | null;
  while ((m = listRe.exec(afterLabel)) !== null) {
    items.push(m[1].trim());
    if (items.length >= 30) break;
  }

  return items;
}

export function extractSpecifications(
  sectionText: string
): PreExtractedTechnicalSpecs {
  // Referenced standards (deduplicated)
  const standards: string[] = [];
  const stdRe = new RegExp(STANDARDS_RE.source, "g");
  let stdMatch: RegExpExecArray | null;
  while ((stdMatch = stdRe.exec(sectionText)) !== null) {
    if (!standards.includes(stdMatch[0])) {
      standards.push(stdMatch[0]);
    }
  }

  const materials = extractListAfterLabel(sectionText, MATERIALS_LABEL_RE);
  const equipment = extractListAfterLabel(sectionText, EQUIPMENT_LABEL_RE);
  const deliverables = extractListAfterLabel(
    sectionText,
    DELIVERABLES_LABEL_RE
  );

  // Scope summary: first 500 chars of the section
  const scope =
    sectionText.slice(0, 500).replace(/\s+/g, " ").trim() || null;

  const methodologyMatch = sectionText.match(METHODOLOGY_RE);

  let confidence = 20;
  if (standards.length > 0) confidence += 20;
  if (materials.length > 0) confidence += 15;
  if (equipment.length > 0) confidence += 15;
  if (scope) confidence += 15;

  return {
    scope_of_work: scope,
    referenced_standards: standards,
    materials,
    equipment,
    deliverables,
    execution_methodology: methodologyMatch
      ? methodologyMatch[1].trim()
      : null,
    confidence: Math.min(confidence, 90),
  };
}
