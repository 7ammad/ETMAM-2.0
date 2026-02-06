# FRONTEND.md — Add: PDF components to component tree

**Add under `components/upload/` (or `components/tender/` per existing layout):**

```
├── tender/   (existing path in repo)
│   ├── TenderUpload.tsx          // (update to handle PDF; CSV preview is inline)
│   ├── TenderListClient.tsx      // (existing)
│   ├── PDFExtractionPreview.tsx  // (NEW)
│   ├── ConfidenceIndicator.tsx   // (NEW)
│   └── EvidenceQuote.tsx         // (NEW)
```

Note: Repo currently uses `src/components/tender/TenderUpload.tsx`. Use that path; add PDFExtractionPreview, ConfidenceIndicator, EvidenceQuote under `tender/` for consistency.
