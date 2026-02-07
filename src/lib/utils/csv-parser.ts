/**
 * CSV/Excel parsing logic for tender import.
 * Maps CSV columns to tender fields; handles Arabic column names.
 */
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedTender {
  entity: string;
  tender_title: string;
  tender_number: string;
  deadline: string;
  estimated_value?: number;
  description?: string;
  requirements?: string;
  tender_url?: string;
}

export interface ParseResult {
  valid: ParsedTender[];
  errors: { row: number; message: string }[];
}

/** Maps Arabic column headers to English field names */
const COLUMN_MAP: Record<string, keyof ParsedTender> = {
  // Arabic
  "الجهة": "entity",
  "عنوان المنافسة": "tender_title",
  "رقم المنافسة": "tender_number",
  "الموعد النهائي": "deadline",
  "قيمة تقديرية": "estimated_value",
  "الوصف": "description",
  "المتطلبات": "requirements",
  "رابط المنافسة": "tender_url",
  // English
  "entity": "entity",
  "tender_title": "tender_title",
  "tender_number": "tender_number",
  "deadline": "deadline",
  "estimated_value": "estimated_value",
  "description": "description",
  "requirements": "requirements",
  "tender_url": "tender_url",
};

const REQUIRED_FIELDS: (keyof ParsedTender)[] = [
  "entity",
  "tender_title",
  "tender_number",
  "deadline",
];

function normalizeHeader(header: string): keyof ParsedTender | null {
  const trimmed = header.trim();
  return COLUMN_MAP[trimmed] ?? null;
}

function mapRow(
  row: Record<string, string>,
  headers: Record<string, keyof ParsedTender>
): Partial<ParsedTender> {
  const mapped: Partial<ParsedTender> = {};
  for (const [originalKey, fieldName] of Object.entries(headers)) {
    const value = row[originalKey]?.trim();
    if (value) {
      if (fieldName === "estimated_value") {
        const num = parseFloat(value.replace(/[,،]/g, ""));
        if (!isNaN(num)) {
          mapped.estimated_value = num;
        }
      } else {
        (mapped as Record<string, string>)[fieldName] = value;
      }
    }
  }
  return mapped;
}

function validateRow(
  row: Partial<ParsedTender>,
  rowIndex: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (!row[field]) {
      errors.push(`حقل مطلوب مفقود: ${field}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function parseCSV(text: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const headers: Record<string, keyof ParsedTender> = {};
  for (const field of result.meta.fields ?? []) {
    const mapped = normalizeHeader(field);
    if (mapped) {
      headers[field] = mapped;
    }
  }

  const valid: ParsedTender[] = [];
  const errors: { row: number; message: string }[] = [];

  result.data.forEach((row, index) => {
    const mapped = mapRow(row, headers);
    const validation = validateRow(mapped, index + 2);

    if (validation.valid) {
      valid.push(mapped as ParsedTender);
    } else {
      errors.push({
        row: index + 2,
        message: validation.errors.join(", "),
      });
    }
  });

  return { valid, errors };
}

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    raw: false,
  });

  const headers: Record<string, keyof ParsedTender> = {};
  if (jsonData.length > 0) {
    for (const key of Object.keys(jsonData[0])) {
      const mapped = normalizeHeader(key);
      if (mapped) {
        headers[key] = mapped;
      }
    }
  }

  const valid: ParsedTender[] = [];
  const errors: { row: number; message: string }[] = [];

  jsonData.forEach((row, index) => {
    const mapped = mapRow(row, headers);
    const validation = validateRow(mapped, index + 2);

    if (validation.valid) {
      valid.push(mapped as ParsedTender);
    } else {
      errors.push({
        row: index + 2,
        message: validation.errors.join(", "),
      });
    }
  });

  return { valid, errors };
}
