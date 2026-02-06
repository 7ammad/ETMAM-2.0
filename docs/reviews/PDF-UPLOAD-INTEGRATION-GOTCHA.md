# Gotcha: PDF Upload Integration Changes

**Scope:** docs/PDF-UPLOAD-INTEGRATION-VERIFICATION.md + docs/context/* fragments created by the PDF Upload prompt.  
**Date:** 2026-02-06

---

## Factual claims verified

| Claim | Source | Evidence | Verdict |
|-------|--------|----------|--------|
| Fragment at `docs/context/IMPLEMENTATION-PHASE-2.4-INSERT.md` | Verification doc | File exists; contains Phase 2.4 tasks 1–5 and acceptance list | **Verified** |
| Fragment at `docs/context/PRD-DAY2-PDF-SCHEDULE.md` | Verification doc | File exists; Day 2 table includes PDF extraction | **Verified** |
| Fragment at `docs/context/BACKEND-API-EXTRACT-SPEC.md` | Verification doc | File exists; POST /api/ai/extract request/response spec | **Verified** |
| Fragment at `docs/context/FRONTEND-PDF-COMPONENTS.md` | Verification doc | File exists | **Verified** |
| Fragment at `docs/context/APP-FLOW-UPLOAD-PDF.md` | Verification doc | File exists; upload flow with CSV vs PDF paths | **Verified** |
| `src/lib/ai/gemini.ts` has `extractFromPDF(buffer, fileName)` with base64 + extraction prompt | Verification doc § Implementation notes | gemini.ts:59–62 `extractFromPDF(fileBuffer: Buffer, _fileName: string)`; uses `SECTION_TARGETED_EXTRACTION_PROMPT` and `inlineData: { mimeType: "application/pdf", data: fileBuffer.toString("base64") }` | **Verified** |
| Extraction prompt from Phase 2.1 | IMPLEMENTATION-PHASE-2.4-INSERT.md task 2 & 4 | prompts.ts exports `SECTION_TARGETED_EXTRACTION_PROMPT`; used in gemini.ts extractFromPDF | **Verified** |
| extractionResponseSchema shape vs API spec | BACKEND-API-EXTRACT-SPEC | parser.ts:30–54 has entity, tender_title, tender_number, deadline, estimated_value, description, confidence (record), evidence (record), overall_confidence, warnings; provider ExtractionResult adds model_used, processing_time_ms | **Verified** |
| TenderUpload lives under `src/components/tender/` | FRONTEND fragment note | list_dir: TenderUpload.tsx, TenderListClient.tsx under src/components/tender/ | **Verified** |

---

## Mistakes / corrections

| Location | Claim | Correction |
|----------|--------|------------|
| **docs/context/FRONTEND-PDF-COMPONENTS.md** | "CSVPreviewTable.tsx (existing)" | **Mistake.** No such file exists. Preview table is inline in TenderUpload.tsx (Phase 1.4). Either remove CSVPreviewTable from the tree or label as "(NEW – optional extract)" so implementers don’t expect an existing file. |

---

## Unverifiable

| Claim | Reason |
|-------|--------|
| Context docs "live in `C:\Users\7amma\.cursor\context\`" | User-specific path; not in repo. |
| "TECH-STACK.md confirms Gemini approach" | TECH-STACK.md not in repo; cannot verify. |

---

## Summary verdict

- **Verified:** Fragment paths, Phase 2.4 content, API spec alignment with parser/provider, gemini.ts `extractFromPDF` signature and base64 + prompt usage, extraction prompt existence, tender component path.
- **Mistake:** FRONTEND fragment lists `CSVPreviewTable.tsx (existing)` but the component does not exist; preview is inline in TenderUpload.
- **Unverifiable:** Context path and TECH-STACK.md (external context).

---

## Minimal edit recommendation

**docs/context/FRONTEND-PDF-COMPONENTS.md** — Fix the component tree so it matches the repo:

- Remove "CSVPreviewTable.tsx (existing)" or change to "(preview inline in TenderUpload for CSV)" so the spec doesn’t reference a non-existent file.
