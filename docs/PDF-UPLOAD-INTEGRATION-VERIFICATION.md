# PDF Upload Integration — Verification Checklist

**Source:** docs/Prompts.md — "ADD PDF UPLOAD TO IMPLEMENTATION"

## Merge instructions

Context docs (IMPLEMENTATION.md, PRD.md, BACKEND.md, FRONTEND.md, APP-FLOW.md) live in `C:\Users\7amma\.cursor\context\` or in `docs/context/` when copied. The following **fragments** were created so you can merge them into the main context docs:

| Target doc | Fragment to merge | Location |
|------------|--------------------|----------|
| IMPLEMENTATION.md | Phase 2.4 section (insert after Phase 2.3) | `docs/context/IMPLEMENTATION-PHASE-2.4-INSERT.md` |
| PRD.md | Day 2 schedule with PDF extraction | `docs/context/PRD-DAY2-PDF-SCHEDULE.md` |
| BACKEND.md | POST /api/ai/extract spec | `docs/context/BACKEND-API-EXTRACT-SPEC.md` |
| FRONTEND.md | PDF components tree | `docs/context/FRONTEND-PDF-COMPONENTS.md` |
| APP-FLOW.md | Upload flow with PDF path | `docs/context/APP-FLOW-UPLOAD-PDF.md` |

## Verification checklist

After merging (or when context docs are in repo):

- [ ] IMPLEMENTATION.md has Phase 2.4 for PDF upload
- [ ] PRD.md Day 2 schedule includes PDF extraction
- [ ] BACKEND.md has /api/ai/extract endpoint
- [ ] FRONTEND.md lists PDF components
- [ ] APP-FLOW.md shows PDF upload journey
- [ ] TECH-STACK.md confirms Gemini approach (no pdfplumber) — confirm in your context copy

## Tech approach (confirmed)

- **Use Gemini AI for PDF parsing — NOT pdfplumber.**
- Gemini handles Arabic PDFs natively (including scanned/OCR).
- Gemini accepts PDF as multimodal input (base64 inline).
- No separate PDF parsing library; extraction + structure in one call.

## Implementation notes

- **File upload:** Same TenderUpload component for CSV and PDF; detect by extension; different preview by type.
- **Gemini:** Existing `src/lib/ai/gemini.ts` already has `extractFromPDF(buffer, fileName)` with base64 + extraction prompt. API route can call it.
- **NO pdfplumber** — Gemini is the PDF parser per TECH-STACK.
