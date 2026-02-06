# APP-FLOW.md — Update: Section 3 (Tender Upload) to include PDF path

**Update Upload Page Flow to:**

---

Upload Page Flow:
1. User drags file or clicks picker
2. File type detection:
   - .csv/.xlsx → Parse → Show preview table → Save
   - .pdf → Upload → Extract with AI → Show extraction preview → Edit → Save
3. For PDF: Show confidence scores + evidence quotes
4. For CSV: Show parsed rows preview
5. Both paths: Manual edit before save
6. Error states: Invalid file, AI extraction failure, parsing error
