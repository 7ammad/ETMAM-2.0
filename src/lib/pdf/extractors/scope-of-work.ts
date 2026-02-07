/**
 * Deterministic extraction for Section 7 (نطاق العمل المفصل):
 * BOQ table detection and parsing via table-parser.
 */
import type { PreExtractedBOQ } from "../types";
import { extractBOQFromText } from "../table-parser";

export function extractScopeOfWork(sectionText: string): PreExtractedBOQ {
  const { items, pricingType } = extractBOQFromText(sectionText);

  return {
    pricing_type: pricingType,
    items,
    total_items_count: items.length > 40 ? items.length : null,
    confidence: items.length > 0 ? 60 : 10,
  };
}
