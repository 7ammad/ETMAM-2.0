/**
 * Deterministic extraction for Sections 3/5/9 (المتطلبات التأهيلية):
 * Classification, certifications, licenses, experience, staff, local content.
 */
import type { PreExtractedQualifications } from "../types";

const CLASSIFICATION_RE =
  /(?:تصنيف\s+(?:المقاولين|الموردين))[\s:]*([^\n]{3,100})/;

const CERT_RE = /(?:ISO|CMMI|PMP|ITIL|CISSP|CISM|SOC)\s*[\d\-]*/g;

const LICENSE_KEYWORDS = [
  "السجل التجاري",
  "شهادة الزكاة",
  "شهادة الضريبة",
  "التأمينات الاجتماعية",
  "الغرفة التجارية",
  "السعودة",
  "رخصة البلدية",
  "تصنيف المقاولين",
];

const EXPERIENCE_RE =
  /(?:خبرة|سنوات\s+الخبرة)[\s\S]{0,30}?(\d{1,2})\s*(?:سنة|سنوات)/;
const SIMILAR_PROJECTS_RE =
  /(?:مشاريع?\s+مماثل|مشاريع?\s+سابق)[\s\S]{0,30}?(\d{1,2})/;

const LOCAL_CONTENT_REQ_RE =
  /(?:نسبة\s+المحتوى\s+المحلي)[\s\S]{0,40}?(\d{1,3})\s*%/;

export function extractQualifications(
  qualSectionText: string,
  localContentText: string,
  fullText: string
): PreExtractedQualifications {
  const combined = qualSectionText + "\n" + localContentText;

  const classMatch = combined.match(CLASSIFICATION_RE);

  // Certifications
  const certs: string[] = [];
  const certRe = new RegExp(CERT_RE.source, "g");
  let certMatch: RegExpExecArray | null;
  while ((certMatch = certRe.exec(fullText)) !== null) {
    const val = certMatch[0].trim();
    if (val && !certs.includes(val)) certs.push(val);
  }

  // Licenses: keyword presence
  const licenses = LICENSE_KEYWORDS.filter((kw) => combined.includes(kw));

  // Experience
  const expMatch = combined.match(EXPERIENCE_RE);
  const simMatch = combined.match(SIMILAR_PROJECTS_RE);

  // Staff from فريق العمل section
  const staff: {
    role: string;
    qualification: string | null;
    count: number | null;
  }[] = [];
  const teamSectionMatch = fullText.match(/فريق\s+العمل[\s\S]{0,2000}/);
  if (teamSectionMatch) {
    const teamText = teamSectionMatch[0];
    const staffRe =
      /(?:^|\n)\s*(?:\d+[.\-)]\s*|[•\-]\s*)(.{5,50}?)(?:\s*[-:]\s*(\d{1,3})\s*(?:شخص|فرد|موظف)?)?(?:\n|$)/gm;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = staffRe.exec(teamText)) !== null) {
      const role = sMatch[1].trim();
      if (role.length > 3 && role.length < 100) {
        staff.push({
          role,
          qualification: null,
          count: sMatch[2] ? parseInt(sMatch[2], 10) : null,
        });
      }
      if (staff.length >= 20) break;
    }
  }

  const lcMatch =
    combined.match(LOCAL_CONTENT_REQ_RE) ??
    fullText.match(LOCAL_CONTENT_REQ_RE);

  let confidence = 20;
  if (licenses.length > 0) confidence += 25;
  if (certs.length > 0) confidence += 15;
  if (classMatch) confidence += 15;
  if (expMatch) confidence += 10;

  return {
    contractor_classification: classMatch
      ? classMatch[1].trim()
      : null,
    required_certifications: certs,
    required_licenses: licenses,
    minimum_experience_years: expMatch
      ? parseInt(expMatch[1], 10)
      : null,
    similar_projects_required: simMatch
      ? parseInt(simMatch[1], 10)
      : null,
    required_staff: staff,
    local_content_requirement: lcMatch
      ? parseInt(lcMatch[1], 10)
      : null,
    confidence: Math.min(confidence, 90),
  };
}
