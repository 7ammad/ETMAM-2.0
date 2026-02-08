# عرض الـ MVP — 10 دقائق
# MVP Presentation — 10 Minutes

> Competition: MVP - Etimad to CRM Pipeline
> Team: Etmam 2.0

---

## Slide Structure (10 min total)

### Slide 1 — Title (0:30)
**Etmam 2.0 — من اعتماد إلى CRM تلقائيًا**
Etmam 2.0 — From Etimad to CRM, Automatically

- Team name & members
- Date
- One-liner: "AI-powered tender evaluation pipeline that ingests tenders, scores them, and creates CRM opportunities automatically"

---

### Slide 2 — The Problem (1:00)
**المشكلة | The Problem**

- Manual process: Tenders arrive from Etimad → someone reads them → manually evaluates → manually enters into CRM
- Time-consuming: Each tender requires 30-60 minutes of manual review
- Inconsistent: Different people evaluate differently, no standardized scoring
- Missed opportunities: Deadlines pass, good tenders get buried

**Key stat to mention**: Number of tenders processed monthly vs. capacity

---

### Slide 3 — The Solution (1:00)
**الحل | Our Solution**

Etmam 2.0 automates the entire pipeline:

```
اعتماد / ملف → إدخال البيانات → تقييم AI → خط الأنابيب → CRM
Etimad / File → Data Ingestion → AI Evaluation → Pipeline → CRM
```

Three key capabilities:
1. **Multi-format ingestion** — PDF, Excel, CSV, manual
2. **AI-powered scoring** — Configurable 0-100 score with Arabic reasoning
3. **CRM pipeline** — Visual Kanban board → Push to Odoo

---

### Slide 4 — Live Demo: Tender Ingestion (2:00)
**عرض حي: إدخال المنافسات**

Demo steps:
1. Upload a PDF tender document (show Arabic extraction)
2. Show extracted fields: Entity, Title, Number, Deadline, Value
3. Optionally show CSV/Excel bulk upload
4. Show the tender list with all imported tenders

**Talking points**:
- AI extracts fields from Arabic PDF documents
- Supports multiple input formats (PDF, Excel, CSV, manual)
- Extraction confidence indicator shows quality

---

### Slide 5 — Live Demo: AI Evaluation (2:00)
**عرض حي: التقييم الذكي**

Demo steps:
1. Open a tender → Click "تحليل" (Analyze)
2. Show the evaluation loading → results appear
3. Walk through: Overall score, recommendation (Proceed/Review/Skip)
4. Show per-criterion breakdown with scores
5. Show evidence quotes from the tender text
6. Go to Settings → Show editable scoring weights

**Talking points**:
- DeepSeek AI evaluates in Arabic with reasoning
- Weighted criteria: alignment, profitability, risk, timeline, competition
- Fully editable scoring weights — non-technical users can adjust
- Verification layer: system recalculates scores, cross-checks evidence

---

### Slide 6 — Live Demo: CRM Pipeline & Export (1:30)
**عرض حي: خط الأنابيب والتصدير**

Demo steps:
1. Navigate to Pipeline page → Show Kanban board
2. Show stages: New → Scored → Approved → Pushed to CRM
3. Drag a tender between stages
4. Click "Push to CRM" → Show the CRM payload mapping
5. Show Odoo connection test in Settings (if Odoo available)
6. Show Excel export as alternative

**Talking points**:
- Visual pipeline mirrors a real CRM workflow
- All required fields mapped: Entity, Title, Number, Deadline, Value, Score, Recommendation
- Dual export: Odoo XML-RPC integration + Excel download
- Pipeline tracks tender lifecycle from discovery to decision

---

### Slide 7 — Architecture & Tech Stack (1:00)
**البنية التقنية**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Ingestion  │───→│  AI Analysis │───→│  CRM Export  │
│  PDF/CSV/XLS │    │  DeepSeek    │    │  Odoo/Excel  │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
                    ┌──────────────┐
                    │   Supabase   │
                    │  PostgreSQL  │
                    │  Auth + RLS  │
                    └──────────────┘
```

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Backend**: Server Actions (no separate API server)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: DeepSeek (primary), Gemini (PDF extraction), Groq (fallback)
- **CRM**: Odoo via native XML-RPC (zero external dependencies)
- **Security**: Row Level Security on all tables, env-based credential management

---

### Slide 8 — Evaluation Criteria Mapping (0:30)
**كيف حققنا المعايير**

| Criterion | How We Meet It |
|-----------|---------------|
| سير إجراءات كامل (End-to-end flow) | PDF upload → AI score → Pipeline → CRM push — all working |
| سهولة التشغيل (Ease of operation) | `pnpm install && pnpm dev` — one command startup |
| منطق تقييم قابل للتعديل (Editable evaluation) | Configurable scoring weights in Settings UI |
| توثيق واضح (Clear documentation) | Setup guide + this presentation |
| الأمان (Security) | Supabase RLS, env-only secrets, server-side auth checks |

---

### Slide 9 — Future Vision (0:30)
**الرؤية المستقبلية**

Beyond the MVP:
- Direct Etimad API integration (live data feed)
- Multi-user collaboration with role-based access
- Historical win/loss analytics to improve scoring models
- Automated bid document generation
- Mobile-friendly responsive design (already RTL-supported)

---

### Slide 10 — Q&A (1:00)
**الأسئلة والأجوبة**

- Thank the audience
- Open for questions
- Show any additional features on request

---

## Demo Preparation Checklist

- [ ] Have 2-3 sample tender PDFs ready (Arabic, real-looking)
- [ ] Have a CSV/Excel file with multiple tenders for bulk import demo
- [ ] Ensure DeepSeek API key is working (test analysis before demo)
- [ ] If showing Odoo: have test instance ready with credentials configured
- [ ] Pre-register a demo account so login is instant
- [ ] Clear browser cache for clean demo experience
- [ ] Have backup screenshots/recording in case of network issues
- [ ] Test the full flow end-to-end at least once before presentation

## Presenter Notes

- **Language**: Mix Arabic and English naturally (audience is bilingual)
- **Pace**: Live demos are the core — spend 5.5 min on demos, 4.5 min on context
- **Fallback**: If AI is slow during demo, have a pre-evaluated tender ready to show results
- **Key message**: "This MVP proves the complete workflow works. Every step from tender ingestion to CRM opportunity is automated."
