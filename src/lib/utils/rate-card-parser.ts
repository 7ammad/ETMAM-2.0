/**
 * Parse CSV/Excel for rate card upload.
 * Columns: item_name, category, unit, unit_price, brand, model_sku, specifications (Arabic or English headers).
 * New optional columns (brand, model_sku, specifications) are nullable — existing CSVs without these columns still work.
 */
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedRateCardRow {
  item_name: string;
  category: string | null;
  unit: string;
  unit_price: number;
  brand: string | null;
  model_sku: string | null;
  specifications: string | null;
}

/** Maps Arabic/English column headers to field names */
const COLUMN_MAP: Record<string, keyof ParsedRateCardRow> = {
  "البند": "item_name",
  "التصنيف": "category",
  "الوحدة": "unit",
  "سعر الوحدة": "unit_price",
  "العلامة التجارية": "brand",
  "الموديل": "model_sku",
  "الرقم المرجعي": "model_sku",
  "المواصفات": "specifications",
  item_name: "item_name",
  category: "category",
  unit: "unit",
  unit_price: "unit_price",
  brand: "brand",
  model_sku: "model_sku",
  specifications: "specifications",
};

function normalizeHeader(header: string): keyof ParsedRateCardRow | null {
  const trimmed = header.trim();
  return COLUMN_MAP[trimmed] ?? null;
}

function parseNum(val: string): number {
  const cleaned = String(val).replace(/[,،\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

function mapRow(
  row: Record<string, string>,
  headers: Record<string, keyof ParsedRateCardRow>
): ParsedRateCardRow | null {
  let item_name = "";
  let category: string | null = null;
  let unit = "وحدة";
  let unit_price = 0;
  let brand: string | null = null;
  let model_sku: string | null = null;
  let specifications: string | null = null;

  for (const [originalKey, fieldName] of Object.entries(headers)) {
    const value = row[originalKey]?.trim();
    if (value === undefined || value === "") continue;
    switch (fieldName) {
      case "item_name":
        item_name = value;
        break;
      case "category":
        category = value;
        break;
      case "unit":
        unit = value;
        break;
      case "unit_price":
        unit_price = parseNum(value);
        break;
      case "brand":
        brand = value;
        break;
      case "model_sku":
        model_sku = value;
        break;
      case "specifications":
        specifications = value;
        break;
    }
  }

  if (!item_name) return null;
  return { item_name, category, unit, unit_price, brand, model_sku, specifications };
}

export interface RateCardParseResult {
  rows: ParsedRateCardRow[];
  errors: { row: number; message: string }[];
}

export function parseRateCardCSV(text: string): RateCardParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const headers: Record<string, keyof ParsedRateCardRow> = {};
  for (const field of result.meta.fields ?? []) {
    const mapped = normalizeHeader(field);
    if (mapped) headers[field] = mapped;
  }

  const rows: ParsedRateCardRow[] = [];
  const errors: { row: number; message: string }[] = [];

  result.data.forEach((row, index) => {
    const mapped = mapRow(row, headers);
    if (mapped) {
      rows.push(mapped);
    } else {
      errors.push({ row: index + 2, message: "البند مطلوب" });
    }
  });

  return { rows, errors };
}

export function parseRateCardExcel(buffer: ArrayBuffer): RateCardParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    raw: false,
  });

  const headers: Record<string, keyof ParsedRateCardRow> = {};
  if (jsonData.length > 0) {
    for (const key of Object.keys(jsonData[0])) {
      const mapped = normalizeHeader(key);
      if (mapped) headers[key] = mapped;
    }
  }

  const rows: ParsedRateCardRow[] = [];
  const errors: { row: number; message: string }[] = [];

  jsonData.forEach((row, index) => {
    const mapped = mapRow(row, headers);
    if (mapped) {
      rows.push(mapped);
    } else {
      errors.push({ row: index + 2, message: "البند مطلوب" });
    }
  });

  return { rows, errors };
}
