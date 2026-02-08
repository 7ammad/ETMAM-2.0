/**
 * Extract raw text from a PDF buffer using pdf-parse v2.
 * Runs entirely in Node.js — no API calls, no network cost.
 * DOMMatrix polyfill must run before pdf-parse loads (Node has no DOMMatrix).
 */
import "./dom-matrix-polyfill";
import { PDFParse } from "pdf-parse";

export interface PDFTextResult {
  text: string;
  pageCount: number;
}

export async function extractTextFromPDF(
  buffer: Buffer
): Promise<PDFTextResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return {
    text: result.text,
    pageCount: result.total,
  };
}
