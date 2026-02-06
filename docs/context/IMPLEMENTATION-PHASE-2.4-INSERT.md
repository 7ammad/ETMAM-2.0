# IMPLEMENTATION.md — Insert: Phase 2.4 (PDF Upload)

**Insert this section AFTER Phase 2.3 (CRM Pipeline Board) in IMPLEMENTATION.md.**

---

### Phase 2.4 — PDF Upload with AI Extraction (2-3 hours)

Priority: 🟡 HIGH (P1 - Differentiator)
Agent: senior-backend + prompt-engineer

**Tasks:**

1. **Update TenderUpload component**
   - Accept `.pdf` files in dropzone (in addition to .csv/.xlsx)
   - Max file size: 20MB
   - Show different preview for PDF (file info, not table preview)
   - "Extract with AI" button for PDF files

2. **Create API route: /api/ai/extract**
   - Accepts FormData with PDF file
   - Read file as Buffer
   - Convert to base64
   - Send to Gemini with extraction prompt (from Phase 2.1)
   - Parse JSON response
   - Return structured extraction result

3. **Build PDFExtractionPreview component**
   - Shows extracted fields in editable form
   - Confidence score per field (color-coded: green/amber/red)
   - Evidence quotes per field (collapsible)
   - "AI-generated, please review" disclaimer
   - Edit fields inline before saving
   - "Save Tender" button → creates tender record

4. **Update extraction prompt** (from Phase 2.1)
   - Target 12-section Etimad template (TENDER-STRUCTURE-v3.0-VERIFIED.md)
   - Extract: entity, title, tender_number, deadline, estimated_value, description
   - Return confidence scores per field
   - Return evidence quotes (exact text from PDF)
   - Return warnings for low-confidence fields

5. **Add validation layer**
   - Check date formats
   - Validate tender_number isn't a page number
   - Flag low confidence fields (<70%)
   - Show validation warnings in UI

**Acceptance Test:**
- [ ] Can upload PDF file (drag-drop or picker)
- [ ] "Extract with AI" button triggers API call
- [ ] Shows loading state during extraction (30s max)
- [ ] Extracted fields displayed in editable preview
- [ ] Confidence scores visible (color-coded)
- [ ] Evidence quotes expandable per field
- [ ] Can edit any field before saving
- [ ] Low-confidence fields highlighted in yellow
- [ ] Works with Arabic PDFs
- [ ] Graceful error handling → fallback to manual entry
