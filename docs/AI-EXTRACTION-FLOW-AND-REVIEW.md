# AI Extraction — Where It Lives, Why It Fails, and Code Review

**For:** Senior-backend / Explorer. Use this to find the AI extraction flow and fix issues.

---

## 1. Explorer: Where Is the AI?

### Entry points

| Where | What |
|-------|------|
| **UI** | `src/components/tender/TenderUpload.tsx` — user selects a PDF → `handleFileChange` → `fetch("/api/ai/extract", { method: "POST", body: formData })`. |
| **API** | `src/app/api/ai/extract/route.ts` — POST handler: auth, file validation, then calls AI and returns extraction or error. |
| **Analysis (separate)** | `src/app/actions/analyze.ts` — uses `getAIProvider(aiProvider)` for **tender analysis** (text only, no PDF). Not used for PDF extraction. |

### AI layer (backend)

| File | Role |
|------|------|
| **`src/lib/ai/provider.ts`** | Factory: `getAIProvider(preferred?)`. Returns Gemini, Groq, or Mock. For PDF we call `getAIProvider("gemini")` so extraction always uses Gemini (Groq has no PDF support). |
| **`src/lib/ai/gemini.ts`** | `GeminiProvider.extractFromPDF(buffer, fileName)`: sends PDF + prompt to Gemini, parses JSON, normalizes, validates with Zod, returns `ExtractionResult`. |
| **`src/lib/ai/groq.ts`** | `extractFromPDF` throws (not supported). Only used for text analysis. |
| **`src/lib/ai/mock-provider.ts`** | Returns fake extraction when no API keys. |
| **`src/lib/ai/prompts.ts`** | `SECTION_TARGETED_EXTRACTION_PROMPT` — Arabic prompt telling Gemini what JSON shape to return. |
| **`src/lib/ai/parser.ts`** | `extractJSON(raw)` (markdown/plain JSON), `extractionResponseSchema` (Zod), `normalizeExtractionResponse(parsed)` (fix evidence/confidence shape, numeric strings). |
| **`src/lib/ai/retry.ts`** | `withTimeout`, `withRetry`, `classifyError` → wraps failures in `AIError` with Arabic messages (e.g. "فشل تحليل استجابة AI"). |
| **`src/lib/ai/verification.ts`** | `verifyExtraction(raw)` — sanity checks/corrections after extraction (used in route). |

### End-to-end flow (PDF extraction)

1. User picks PDF on `/tenders/upload` → `TenderUpload` sends `POST /api/ai/extract` with `FormData(file)`.
2. **Route** (`extract/route.ts`): auth via Supabase, validate file (type, size), then:
   - `buffer = Buffer.from(await file.arrayBuffer())`
   - `provider = getAIProvider("gemini")` → Gemini or Mock
   - `rawExtraction = await provider.extractFromPDF(buffer, file.name)`
   - `verifyExtraction(rawExtraction)` → optional corrections
   - Return `{ success: true, extraction, corrections?, fileName }` or 500 with `error` / `errorCode`.
3. **Gemini** (`gemini.ts`):
   - `model.generateContent([ prompt, { inlineData: { mimeType: "application/pdf", data: base64 } } ])`
   - Timeout 60s, retry 1, `maxOutputTokens: 8192`
   - Read `response.text()` → `extractJSON(text)` → `JSON.parse(json)` → `normalizeExtractionResponse(parsed)` → `extractionResponseSchema.parse(normalized)` → return typed result.
4. **Frontend**: On success, sets `extraction` and shows `PDFExtractionPreview`; on failure, sets `errors` with `data.error` (e.g. "فشل استخراج البيانات من الملف: فشل تحليل استجابة AI").

### Why extraction can fail (no data extracted)

| Cause | Where it happens | What you see |
|-------|------------------|--------------|
| **MAX_TOKENS** | Gemini stops output mid-stream; JSON truncated. | `finishReason: MAX_TOKENS`, `SyntaxError: Unterminated string in JSON`. **Fix:** `maxOutputTokens` raised to 8192 in `gemini.ts`. |
| **Invalid JSON** | Model returns non-JSON or malformed JSON. | `JSON.parse` fails → `classifyError` → "فشل تحليل استجابة AI". |
| **Zod validation** | Model returns different shape (e.g. wrong types, missing required fields). | `extractionResponseSchema.parse` throws → same message. Parser was relaxed (optional confidence/evidence, coerce numbers). |
| **No Gemini key / wrong provider** | Route uses `getAIProvider("gemini")`; if no key, Mock is used (no real extraction). | Mock returns fake data; if you expect real PDF content, ensure `GEMINI_API_KEY` is set. |
| **Safety / block** | Gemini blocks response (content or safety). | "الاستجابة محظورة" or "تم حظر الاستجابة بواسطة فلتر الأمان". |
| **Timeout / rate limit** | 60s timeout or API 429. | Timeout → "طلب التحليل تجاوز المهلة"; rate → "تم تجاوز حد الاستخدام". |

**Caveats:**  
- Groq is never used for PDF (route forces Gemini).  
- `.env.local`: `GEMINI_API_KEY` (and optional `AI_PROVIDER` for analysis only).  
- Logs: `[Gemini extractFromPDF]` and `[extract/route]` in server console.

---

## 2. Code review (AI extraction path)

### Context

- Extraction is auth-gated (Supabase), file type/size validated, then single provider call (Gemini).
- No streaming; one full JSON response parsed and validated.

### Security

| Check | Severity | Verdict |
|-------|----------|--------|
| Auth | **Critical** | Route calls `getUser()`; returns 401 when no user. **OK.** |
| File type/size | **High** | Only `.pdf`, size ≤ `MAX_PDF_SIZE_MB`. **OK.** |
| API key | **High** | `GEMINI_API_KEY` server-side only; not sent to client. **OK.** |

### Performance

| Check | Severity | Verdict |
|-------|----------|--------|
| Timeout | **Medium** | PDF timeout 60s; analysis 30s. **OK.** |
| Retries | **Low** | `maxRetries: 1` for extraction; avoids long waits. **OK.** |
| Token limit | **Medium** | `maxOutputTokens: 8192` (was 4000) to avoid truncation. **Fixed.** |

### Type safety

| Check | Verdict |
|-------|--------|
| ExtractionResult | Used in route, verification, frontend; matches schema. **OK.** |
| Parser | Zod schema + normalize; coerce for numbers, optional confidence/evidence. **OK.** |

### Code quality

| Check | Verdict |
|-------|--------|
| Error handling | Route catch returns 500 with message; `classifyError` gives Arabic + code. **OK.** |
| Logging | Gemini logs raw length, finishReason, parse/validation failures. **OK.** |
| RTL/Arabic | Prompts and user-facing errors in Arabic. **OK.** |

### Recommendations

| Severity | Item | Recommendation |
|----------|------|----------------|
| **Low** | Truncated response | If `finishReason === "MAX_TOKENS"`, consider logging a warning and optionally retrying with a prompt that asks for shorter `requirements` / fewer `line_items`. |
| **Low** | Frontend error copy | Surface `errorCode` (e.g. INVALID_RESPONSE, AUTH_ERROR) in UI for support/debug. |

---

## 3. Executive summary

- **Where:** PDF extraction is triggered from `TenderUpload` → `POST /api/ai/extract` → `getAIProvider("gemini")` → `GeminiProvider.extractFromPDF` in `src/lib/ai/gemini.ts`, with parsing in `parser.ts` and errors classified in `retry.ts`.
- **Why "no data extracted":** Typically (1) response truncated (MAX_TOKENS) → invalid JSON → "فشل تحليل استجابة AI", or (2) schema mismatch (Zod). Truncation is addressed by `maxOutputTokens: 8192`; schema was relaxed (optional confidence/evidence, coerce numbers).
- **Backend/explorer:** Use this doc to trace from route → provider → Gemini → parser; check server logs for `[Gemini extractFromPDF]` and `[extract/route]`; ensure `GEMINI_API_KEY` is set for real extraction.

---

## 4. Verification checklist

- [ ] `GEMINI_API_KEY` in `.env.local` for real PDF extraction.
- [ ] Upload a PDF on `/tenders/upload`; server logs show `raw response length` and `finishReason` (not MAX_TOKENS).
- [ ] On success, API returns `{ success: true, extraction, fileName }`; UI shows preview.
- [ ] On failure, API returns 500 with `error` (and optionally `errorCode`); UI shows error in red box.
- [ ] No use of Groq for PDF (route uses `getAIProvider("gemini")`).
