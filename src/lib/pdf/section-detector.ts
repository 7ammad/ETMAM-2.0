/**
 * Detect the 12 standard اعتماد tender sections by heading patterns.
 * Pattern: "القسم [الأول..الثاني عشر] : [name]"
 */
import type { DetectedSection } from "./types";

const ORDINAL_MAP: Record<number, string> = {
  1: "الأول",
  2: "الثاني",
  3: "الثالث",
  4: "الرابع",
  5: "الخامس",
  6: "السادس",
  7: "السابع",
  8: "الثامن",
  9: "التاسع",
  10: "العاشر",
  11: "الحادي عشر",
  12: "الثاني عشر",
};

const SECTION_NAMES: Record<number, string> = {
  1: "المقدمة",
  2: "الأحكام العامة",
  3: "إعداد العروض",
  4: "تقديم العروض",
  5: "تقييم العروض",
  6: "متطلبات التعاقد",
  7: "نطاق العمل المفصل",
  8: "المواصفات",
  9: "متطلبات المحتوى المحلي",
  10: "متطلبات برنامج المشاركة الاقتصادية",
  11: "الشروط الخاصة",
  12: "الملحقات",
};

function buildSectionRegex(sectionNumber: number): RegExp {
  const ordinal = ORDINAL_MAP[sectionNumber];
  const name = SECTION_NAMES[sectionNumber];
  if (!ordinal || !name) return /^$/;

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Separator: colon, dash, em-dash, period, or whitespace
  const sep = "[\\s:؛—–.\\-]+";

  return new RegExp(
    `(?:القسم\s+)?${ordinal}\s*${sep}\s*${escaped}`,
    "gm"
  );
}

export function detectSections(fullText: string): DetectedSection[] {
  const matches: {
    sectionNumber: number;
    name: string;
    offset: number;
  }[] = [];

  // Skip matches in the first ~5% of the document (likely TOC)
  const tocCutoff = Math.min(Math.floor(fullText.length * 0.05), 3000);

  for (let num = 1; num <= 12; num++) {
    const regex = buildSectionRegex(num);
    let match: RegExpExecArray | null;
    let firstMatch: RegExpExecArray | null = null;
    let bodyMatch: RegExpExecArray | null = null;
    
    while ((match = regex.exec(fullText)) !== null) {
      if (!firstMatch) firstMatch = match;
      if (match.index >= tocCutoff) {
        bodyMatch = match;
        break;
      }
    }
    
    const best = bodyMatch ?? firstMatch;
    if (best) {
      matches.push({
        sectionNumber: num,
        name: SECTION_NAMES[num],
        offset: best.index,
      });
    }
  }

  matches.sort((a, b) => a.offset - b.offset);

  return matches.map((m, i) => {
    const nextOffset =
      i + 1 < matches.length ? matches[i + 1].offset : fullText.length;
    return {
      sectionNumber: m.sectionNumber,
      arabicName: m.name,
      startOffset: m.offset,
      endOffset: nextOffset,
      text: fullText.slice(m.offset, nextOffset),
    };
  });
}

/**
 * Get the text for a specific section number.
 * Falls back to full text if section was not detected.
 */
export function getSectionText(
  sections: DetectedSection[],
  sectionNumber: number,
  fullText: string
): string {
  const section = sections.find((s) => s.sectionNumber === sectionNumber);
  return section?.text ?? fullText;
}

/**
 * Fallback BOQ section finder: search for common BOQ headings
 * when the standard اعتماد section 7 isn't detected.
 * Returns ~15000 chars after the heading, or empty string.
 */
const BOQ_HEADING_PATTERNS = [
  /جدول\s*الكميات\s*والأسعار/,
  /جدول\s*الكميات/,
  /جدول\s*البنود/,
  /Bill\s*of\s*Quantities/i,
  /نطاق\s*العمل\s*المفصل/,
];

const BOQ_SECTION_LENGTH = 15000;

export function findBOQSection(fullText: string): string {
  const tocCutoff = Math.min(Math.floor(fullText.length * 0.05), 3000);
  
  for (const pattern of BOQ_HEADING_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags + (pattern.flags.includes('g') ? '' : 'g'));
    let match: RegExpExecArray | null;
    let firstMatch: RegExpExecArray | null = null;
    let bodyMatch: RegExpExecArray | null = null;
    
    while ((match = re.exec(fullText)) !== null) {
      if (!firstMatch) firstMatch = match;
      if (match.index >= tocCutoff) {
        bodyMatch = match;
        break;
      }
    }
    
    const best = bodyMatch ?? firstMatch;
    if (best) {
      return fullText.slice(best.index, best.index + BOQ_SECTION_LENGTH);
    }
  }
  return "";
}

export { SECTION_NAMES, ORDINAL_MAP };
