# BACKEND.md — Add: POST /api/ai/extract

**Add this endpoint spec to BACKEND.md (verify it exists; if missing, add).**

---

#### `POST /api/ai/extract`
Extract tender data from PDF using Gemini AI.

**Request:**
```typescript
// FormData
{
  file: File  // .pdf, max 20MB
}
```

**Response:**
```typescript
{
  success: true,
  extraction: {
    entity: string | null,
    tender_title: string | null,
    tender_number: string | null,
    deadline: string | null,  // ISO date
    estimated_value: number | null,
    description: string | null,

    // Confidence per field (0-100)
    confidence: {
      entity: number,
      tender_title: number,
      tender_number: number,
      deadline: number,
      estimated_value: number
    },

    // Evidence quotes from PDF
    evidence: {
      entity: string | null,
      tender_title: string | null,
      tender_number: string | null,
      deadline: string | null,
      estimated_value: string | null
    },

    // Metadata
    overall_confidence: number,
    warnings: string[],
    model_used: "gemini-2.5-flash",
    processing_time_ms: number
  },

  // Validation
  validation: {
    valid: boolean,
    issues: string[],
    requires_review: boolean
  }
}
```
