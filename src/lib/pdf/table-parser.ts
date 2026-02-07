/**
 * Heuristic table detection and BOQ parsing from raw text.
 * Detects table-like structures by tab or multi-space column separation.
 *
 * Column mapping strategy:
 *   1. Header-based: detect Arabic column keywords in the first row
 *   2. Category heuristic: if cells[1] is a known category keyword, shift description
 *   3. Positional fallback: assume standard column order
 */
import type { PreExtractedBOQItem } from "./types";

const TAB_OR_MULTI_SPACE = /\t|[ ]{3,}/;

interface RawTableRow {
  cells: string[];
  lineIndex: number;
}

/**
 * Find contiguous blocks of lines that look like table rows.
 * A line is a "table row" if it splits into 3+ cells on tabs/multi-spaces.
 */
export function detectTableBlocks(text: string): RawTableRow[][] {
  const lines = text.split("\n");
  const blocks: RawTableRow[][] = [];
  let current: RawTableRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (current.length >= 2) blocks.push(current);
      current = [];
      continue;
    }

    const cells = line
      .split(TAB_OR_MULTI_SPACE)
      .map((c) => c.trim())
      .filter(Boolean);

    if (cells.length >= 3) {
      current.push({ cells, lineIndex: i });
    } else {
      if (current.length >= 2) blocks.push(current);
      current = [];
    }
  }
  if (current.length >= 2) blocks.push(current);

  return blocks;
}

function mode(arr: number[]): number {
  const freq: Record<number, number> = {};
  let maxFreq = 0;
  let modeVal = arr[0];
  for (const n of arr) {
    freq[n] = (freq[n] || 0) + 1;
    if (freq[n] > maxFreq) {
      maxFreq = freq[n];
      modeVal = n;
    }
  }
  return modeVal;
}

function scoreBOQBlock(block: RawTableRow[]): number {
  let score = 0;

  // Sequential numbers in first column
  const firstCols = block.map((row) => parseInt(row.cells[0], 10));
  const hasSequential = firstCols.every(
    (n, i) => !isNaN(n) && (i === 0 || n >= firstCols[i - 1])
  );
  if (hasSequential) score += 30;

  // Arabic unit keywords
  const unitPattern =
    /شهر|سنة|وحدة|خدمة|م²|م³|م٢|م٣|كجم|طن|لتر|عدد|حزمة|مقطوعية/;
  if (block.some((row) => row.cells.some((c) => unitPattern.test(c))))
    score += 25;

  // Numeric quantities
  if (
    block.some((row) =>
      row.cells.some((c) => /^\d+(?:\.\d+)?$/.test(c.trim()))
    )
  )
    score += 20;

  // Reasonable row count (3–100)
  if (block.length >= 3 && block.length <= 100) score += 15;

  // Column consistency
  const colCounts = block.map((r) => r.cells.length);
  const modeColCount = mode(colCounts);
  const consistency =
    colCounts.filter((c) => c === modeColCount).length / colCounts.length;
  if (consistency > 0.8) score += 10;

  return score;
}

// ---------------------------------------------------------------------------
// Column mapping
// ---------------------------------------------------------------------------

/** Known header keywords for each column role */
const HEADER_KEYWORDS: Record<string, RegExp> = {
  seq: /^(?:م|#|الرقم|التسلسل|ر\.م|رقم)$/,
  category: /^(?:الفئة|النوع|التصنيف|فئة)$/,
  description: /^(?:البند|الوصف|وصف\s*البند|اسم\s*البند|بيان\s*الأعمال|وصف\s*الخدمة)$/,
  unit: /^(?:الوحدة|وحدة\s*القياس|وحده)$/,
  quantity: /^(?:الكمية|الكميه|العدد)$/,
  specs: /^(?:المواصفات|مواصفات)$/,
  price: /^(?:السعر|سعر\s*الوحدة|سعر\s*الافرادي|السعر\s*الفردي)$/,
  total: /^(?:الإجمالي|المجموع|إجمالي|الاجمالي)$/,
};

/** Common category values that appear as cell content, not descriptions */
const CATEGORY_VALUES =
  /^(?:خدمة|خدمات|توريد|تركيب|صيانة|تشغيل|استشارات|أعمال|تجهيز|دعم\s*فني|تدريب)/;

interface ColumnMap {
  seq: number;
  category: number | null;
  description: number;
  unit: number | null;
  quantity: number | null;
  specs: number | null;
  confidence: number;
}

/**
 * Try to detect column roles from a header row.
 * Returns null if no confident mapping found.
 */
function detectHeaderColumns(headerCells: string[]): ColumnMap | null {
  const map: Partial<Record<keyof typeof HEADER_KEYWORDS, number>> = {};

  for (let i = 0; i < headerCells.length; i++) {
    const cell = headerCells[i].trim();
    for (const [role, pattern] of Object.entries(HEADER_KEYWORDS)) {
      if (pattern.test(cell) && !(role in map)) {
        map[role] = i;
        break;
      }
    }
  }

  // Must have at least description to be useful
  if (map.description == null) return null;

  return {
    seq: map.seq ?? 0,
    category: map.category ?? null,
    description: map.description,
    unit: map.unit ?? null,
    quantity: map.quantity ?? null,
    specs: map.specs ?? null,
    confidence: 75,
  };
}

/**
 * Heuristic column mapping when no header is detected.
 * Checks if cells[1] is a repeated category keyword.
 */
function inferColumns(
  block: RawTableRow[],
  startIdx: number
): ColumnMap {
  const dataRows = block.slice(startIdx);
  const colCount = mode(dataRows.map((r) => r.cells.length));

  // Check if cells[1] is a category keyword across most rows
  const cell1Values = dataRows.map((r) => r.cells[1]?.trim() ?? "");
  const categoryMatchCount = cell1Values.filter((v) =>
    CATEGORY_VALUES.test(v)
  ).length;
  const hasCategoryColumn =
    dataRows.length >= 2 && categoryMatchCount >= dataRows.length * 0.6;

  if (hasCategoryColumn && colCount >= 4) {
    // Pattern: seq | category | description | unit | [qty] | ...
    return {
      seq: 0,
      category: 1,
      description: 2,
      unit: colCount >= 4 ? 3 : null,
      quantity: colCount >= 5 ? 4 : null,
      specs: colCount >= 6 ? 5 : null,
      confidence: 65,
    };
  }

  if (colCount >= 6) {
    return {
      seq: 0,
      category: 1,
      description: 2,
      unit: 3,
      quantity: colCount >= 7 ? colCount - 1 : 4,
      specs: colCount >= 7 ? 5 : null,
      confidence: 60,
    };
  }


  // Default: seq | description | unit | qty
  return {
    seq: 0,
    category: null,
    description: 1,
    unit: colCount >= 3 ? 2 : null,
    quantity: colCount >= 4 ? 3 : null,
    specs: null,
    confidence: 55,
  };
}

// ---------------------------------------------------------------------------
// Table parsing
// ---------------------------------------------------------------------------

function parseBOQTable(block: RawTableRow[]): {
  items: PreExtractedBOQItem[];
  pricingType: "lump_sum" | "unit_based" | "mixed" | null;
} {
  if (block.length === 0) return { items: [], pricingType: null };

  // Determine if first row is a header (non-numeric first cell)
  const firstCellIsNumber = !isNaN(parseInt(block[0].cells[0], 10));
  const startIdx = firstCellIsNumber ? 0 : 1;

  // Try header-based mapping first, then fall back to heuristic
  let colMap: ColumnMap;
  if (!firstCellIsNumber) {
    const headerMap = detectHeaderColumns(block[0].cells);
    colMap = headerMap ?? inferColumns(block, startIdx);
  } else {
    colMap = inferColumns(block, startIdx);
  }

  const items: PreExtractedBOQItem[] = [];
  for (let i = startIdx; i < block.length; i++) {
    const cells = block[i].cells;
    const seq = parseInt(cells[colMap.seq], 10) || i - startIdx + 1;

    const description =
      (colMap.description < cells.length ? cells[colMap.description] : null) ||
      "";
    const category =
      colMap.category != null && colMap.category < cells.length
        ? cells[colMap.category] || null
        : null;
    const unit =
      colMap.unit != null && colMap.unit < cells.length
        ? cells[colMap.unit] || null
        : null;
    const quantity =
      colMap.quantity != null && colMap.quantity < cells.length
        ? parseFloat(cells[colMap.quantity]) || null
        : null;
    const specifications =
      colMap.specs != null && colMap.specs < cells.length
        ? cells[colMap.specs] || null
        : null;

    items.push({
      seq,
      category,
      description,
      specifications,
      unit,
      quantity,
      confidence: colMap.confidence,
    });
  }

  // Determine pricing type
  const hasCategory = items.some((it) => it.category != null);
  const pricingType = hasCategory
    ? ("unit_based" as const)
    : ("mixed" as const);

  return { items, pricingType };
}

/**
 * Find and parse the best BOQ table in a section's text.
 */
export function extractBOQFromText(text: string): {
  items: PreExtractedBOQItem[];
  pricingType: "lump_sum" | "unit_based" | "mixed" | null;
} {
  const blocks = detectTableBlocks(text);
  if (blocks.length === 0) return { items: [], pricingType: null };

  let bestBlock = blocks[0];
  let bestScore = 0;

  for (const block of blocks) {
    const score = scoreBOQBlock(block);
    if (score > bestScore) {
      bestScore = score;
      bestBlock = block;
    }
  }

  if (bestScore < 30) return { items: [], pricingType: null };

  return parseBOQTable(bestBlock);
}
