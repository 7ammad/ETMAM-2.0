# DeepSeek Implementation Review

**Date:** 2026-02-07  
**Scope:** Review of DeepSeek AI provider implementation against official API docs.  
**Reference:** [DeepSeek API Docs](https://platform.deepseek.com/api-docs) (Your First API Call), OpenAI-compatible format.

---

## 1. Executive Summary

| Severity | Count | Status |
|----------|--------|--------|
| **Critical** | 0 | — |
| **High** | 0 | — |
| **Medium** | 0 | — |
| **Low** | 2 | Addressed (docs comment, stream: false) |

**Verdict:** Implementation is **correct and aligned** with official DeepSeek API documentation. One minor improvement applied: added `stream: false` and doc comment with official docs link.

---

## 2. Official API Specification (from docs)

| Item | Official docs | Our implementation | Match |
|------|----------------|--------------------|--------|
| **Base URL** | `https://api.deepseek.com` or `https://api.deepseek.com/v1` (OpenAI-compatible) | `https://api.deepseek.com/v1` | Yes |
| **Endpoint** | `POST .../chat/completions` | `POST ${DEEPSEEK_BASE}/chat/completions` | Yes |
| **Auth** | `Authorization: Bearer ${DEEPSEEK_API_KEY}` | `Authorization: Bearer ${this.apiKey}` | Yes |
| **Model** | `deepseek-chat` (non-thinking, DeepSeek-V3.2) | `modelName = "deepseek-chat"` | Yes |
| **Request body** | `model`, `messages` (system + user), `stream: false` (optional) | model, messages, temperature, max_tokens, stream: false, response_format | Yes |
| **API key env** | Apply at platform.deepseek.com/api_keys | `DEEPSEEK_API_KEY` | Yes |

---

## 3. Review by Category

### 3.1 Context & correctness

- **Base URL:** Docs allow either `https://api.deepseek.com` or `https://api.deepseek.com/v1`. We use `/v1` for OpenAI-style paths; `.../v1/chat/completions` is correct.
- **Request shape:** We send `model`, `messages`, `temperature`, `max_tokens`, `stream: false`, `response_format: { type: "json_object" }`. OpenAI-compatible APIs (and DeepSeek’s compatibility claim) support `response_format` for JSON; our parser also uses `extractJSON()` for markdown-wrapped or plain JSON, so we tolerate non–strict-JSON responses.
- **Response shape:** We read `data.choices?.[0]?.message?.content`; this matches the standard OpenAI chat completions response used in the docs examples.

### 3.2 Security

- **API key:** Taken from `process.env.DEEPSEEK_API_KEY`; no key in client code. Constructor throws if missing/empty.
- **Headers:** Only `Content-Type` and `Authorization`; no unnecessary headers. Key never logged.
- **Server-only:** Provider is used only in server actions and API route (analyze, extract); key is not exposed to the client.

### 3.3 Performance

- **Timeout:** `AI_TIMEOUT_MS = 30_000`; same as Gemini/Groq. `withTimeout` wraps the fetch so long-running calls are aborted.
- **Retry:** `withRetry(fn, { maxRetries: 1, baseDelayMs: 2000 })`; one retry with backoff, consistent with other providers.
- **No streaming:** We use `stream: false`; single request/response, no streaming overhead.

### 3.4 Type safety

- **Response type:** We cast `res.json()` to `Promise<{ choices?: Array<{ message?: { content?: string } }> }>`. Sufficient for our use; optional chaining handles missing fields.
- **Errors:** `classifyError()` in retry.ts already maps 401/403/429 and message substrings to `AIError`; our `throw new Error(res.status + " " + errText)` includes status, so classification works.

### 3.5 Code quality

- **Doc comment:** Added reference to official docs URL and short spec (base URL, auth, model).
- **Explicit stream:** Set `stream: false` in the request body to match docs and avoid any default ambiguity.
- **Arabic error for PDF:** `extractFromPDF` throws a clear Arabic message directing users to Gemini for PDF; consistent with Groq and product intent.

---

## 4. Findings by Severity

### Critical — 0

None.

### High — 0

None.

### Medium — 0

None.

### Low — 2 (addressed)

| ID | Finding | Action taken |
|----|---------|--------------|
| L1 | Doc comment did not cite official API docs | Added comment with link to https://platform.deepseek.com/api-docs and base URL / auth / model summary. |
| L2 | Request body did not set `stream` explicitly | Set `stream: false` in the request body to match docs and avoid reliance on server default. |

---

## 5. Optional Follow-ups

- **DeepSeek error schema:** If DeepSeek publishes a structured error body (e.g. `error.code`, `error.type`), we could map them in `classifyError()` for clearer Arabic messages. Current string-based handling is sufficient.
- **response_format:** If a future DeepSeek version does not support `response_format: { type: "json_object" }`, the existing `extractJSON()` + Zod parsing will still handle plain or markdown-wrapped JSON.

---

## 6. Verification Checklist

- [x] Base URL matches docs (`https://api.deepseek.com/v1`).
- [x] Auth header: `Bearer` + API key.
- [x] Model name: `deepseek-chat`.
- [x] Request: model, messages, temperature, max_tokens, stream: false, response_format.
- [x] Response: read `choices[0].message.content`.
- [x] API key from env only; no client exposure.
- [x] Timeout and retry applied.
- [x] `extractFromPDF` throws with clear message; PDF extraction remains Gemini-only.
- [x] Doc comment and `stream: false` added.

---

## 7. Files Touched (this review)

| File | Change |
|------|--------|
| `src/lib/ai/deepseek.ts` | Added doc comment (official docs link + spec); added `stream: false` to request body. |

---

*End of DeepSeek Implementation Review.*
