# Etmam 2.0 — Submission Pack
# حزمة التسليم — اتمام 2.0

> **منافسة MVP**: من اعتماد إلى CRM تلقائيًا
> **Competition**: MVP - Etimad to CRM Pipeline
> **Prize**: 20,000 SAR | **Duration**: 1 month | **Team**: Max 4 people

---

## ملخص الحل | Solution Summary

Etmam 2.0 is a working MVP that automates the complete workflow from **tender ingestion** (from Etimad or file upload) through **AI-powered evaluation** to **CRM opportunity creation** — addressing all five competition requirements.

**اتمام 2.0** هو MVP يعمل بالكامل ويُأتمت سير العمل الكامل من **إدخال بيانات المنافسة** (من اعتماد أو رفع ملف) إلى **التقييم الذكي بالذكاء الاصطناعي** ثم **إنشاء فرصة في الـ CRM** — مع تحقيق جميع متطلبات المنافسة الخمسة.

---

## مخرجات التسليم | Deliverables

| # | المخرج | الحالة | الملف |
|---|--------|--------|-------|
| 1 | رابط المستودع / حزمة التشغيل | Done | This repository (`etmam-2.0`) |
| 2 | دليل التشغيل المختصر | Done | [SETUP-GUIDE.md](./SETUP-GUIDE.md) |
| 3 | عرض 10 دقائق (مخطط) | Done | [PRESENTATION-OUTLINE.md](./PRESENTATION-OUTLINE.md) |

---

## متطلبات الـ MVP — كيف حققناها | MVP Requirements Mapping

### 1. جلب بيانات المنافسات | Ingest Tender Data
**Status: Done**

- **PDF upload**: AI-powered extraction from Arabic tender documents using Gemini
- **Excel/CSV**: Bulk import via file upload (parsed with xlsx + papaparse)
- **Manual entry**: Direct form input for all tender fields
- Extraction confidence indicator shows data quality
- Extraction cache prevents redundant AI calls

### 2. تقييم المنافسات | Evaluate Tenders (0-100 + Reasons)
**Status: Done**

- AI evaluation using DeepSeek (primary), with Gemini and Groq as fallbacks
- **Score**: 0-100 overall score, calculated from weighted per-criterion scores
- **Reasons**: Arabic-language reasoning for each criterion + evidence quotes from tender text
- **Recommendation**: Auto-generated (Proceed / Review / Skip) based on score thresholds
- **Editable model**: Scoring weights configurable in Settings UI — no code changes needed
- **Verification layer**: System recalculates weighted average and cross-checks evidence against source text

### 3. إنشاء فرصة في CRM | Auto-Create CRM Opportunity
**Status: Done**

CRM opportunity created with all required fields:

| Required Field | Arabic | Implementation |
|---------------|--------|---------------|
| Entity | الجهة | `tender.entity` → Odoo `partner_name` |
| Tender Title | عنوان المنافسة | `tender.tender_title` → Odoo `name` |
| Tender Number | رقم المنافسة | Included in description |
| Deadline | الموعد النهائي | `tender.deadline` → Odoo `date_deadline` |
| Estimated Value | القيمة التقديرية | `tender.estimated_value` → Odoo `expected_revenue` |
| Score | درجة التقييم | Included in description |
| Recommendation | التوصية | Included in description |

**Dual export paths**:
- **Odoo CRM**: Native XML-RPC integration (no external xmlrpc package), creates `crm.lead` records
- **Excel export**: Download complete tender + evaluation data as .xlsx file

### 4. شاشة عرض المنافسات | Display UI
**Status: Done**

- **Dashboard**: Stats overview with score distribution, recent tenders, pipeline summary
- **Tenders list**: Filterable table with status badges, scores, and recommendations
- **Tender detail**: Full tender info + AI analysis panel + cost estimation + export
- **Pipeline board**: Visual Kanban board with drag-and-drop stage management (New → Scored → Approved → Pushed to CRM → Won/Lost)
- **RTL support**: Full Arabic right-to-left layout throughout

---

## معايير التقييم | Evaluation Criteria Compliance

| # | المعيار | التقييم الذاتي | التفاصيل |
|---|---------|---------------|----------|
| 1 | سير إجراءات من البداية للنهاية | **Met** | Upload PDF → AI analysis → Pipeline → Push to CRM — complete working flow |
| 2 | سهولة التشغيل والاعتمادية | **Met** | `cp .env.example .env.local && pnpm install && pnpm dev` — 3 commands to run |
| 3 | منطق تقييم واضح وقابل للتعديل | **Met** | UI-configurable scoring weights in Settings; verification layer validates AI output |
| 4 | توثيق واضح للإعداد والتشغيل | **Met** | [SETUP-GUIDE.md](./SETUP-GUIDE.md) — bilingual Arabic/English with step-by-step instructions |
| 5 | حد أدنى من الأمان وحماية البيانات | **Met** | Supabase RLS on all tables, env-only secrets, server-side auth on all actions |

---

## البنية التقنية | Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                │
│                  React 19 + Tailwind CSS 4              │
├─────────────┬──────────────────┬────────────────────────┤
│  Ingestion  │   AI Analysis    │     CRM Export         │
│  PDF/CSV/XL │  DeepSeek/Gemini │  Odoo XML-RPC / Excel  │
├─────────────┴──────────────────┴────────────────────────┤
│              Supabase (PostgreSQL + Auth + RLS)          │
│              + Storage (tender PDFs, rate cards)         │
└─────────────────────────────────────────────────────────┘
```

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Frontend | React 19, Tailwind CSS 4, Lucide Icons |
| State Management | Zustand |
| Database | Supabase PostgreSQL with Row Level Security |
| Authentication | Supabase Auth |
| AI Providers | DeepSeek (primary), Gemini (PDF extraction), Groq (fallback) |
| CRM | Odoo via native XML-RPC |
| PDF Parsing | pdf-parse + AI extraction |
| Spreadsheets | xlsx + papaparse |
| Type Safety | TypeScript (strict) + Zod v4 |
| Testing | Playwright E2E |

---

## هيكل المشروع | Project Structure

```
etmam-2.0/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login + Register pages
│   │   ├── (dashboard)/        # Dashboard, Tenders, Pipeline, Settings
│   │   └── actions/            # Server Actions (analyze, pipeline, costs, export, auth)
│   ├── components/
│   │   ├── analysis/           # Score gauge, evidence, recommendations
│   │   ├── dashboard/          # Stats, charts, summaries
│   │   ├── pipeline/           # Kanban board, CRM push
│   │   ├── tender/             # Upload, detail, cost estimation
│   │   ├── settings/           # Scoring weights, Odoo config, AI provider
│   │   └── ui/                 # Shared UI components
│   ├── lib/
│   │   ├── ai/                 # AI providers (DeepSeek, Gemini, Groq, mock)
│   │   ├── supabase/           # Database client (server + client)
│   │   └── pdf/                # PDF parsing utilities
│   ├── stores/                 # Zustand state stores
│   ├── hooks/                  # React hooks
│   └── types/                  # TypeScript type definitions
├── supabase/
│   └── migrations/             # Database schema (6 migration files)
├── docs/
│   └── submission/             # This submission pack
├── .env.example                # Environment template
├── package.json
└── next.config.ts
```

---

## نطاق الـ MVP | MVP Scope

What's **included** in this MVP:
- Multi-format tender ingestion (PDF, Excel, CSV, manual)
- AI-powered evaluation with editable scoring model
- Full CRM pipeline with visual Kanban board
- Odoo CRM integration via XML-RPC
- Excel export as alternative CRM path
- Cost estimation with rate cards
- Authentication and per-user data isolation
- Bilingual UI (Arabic RTL + English)

What's **out of scope** (future iterations):
- Direct Etimad API integration (currently uses file upload)
- Multi-user collaboration / team features
- Historical analytics and win/loss tracking
- Automated bid document generation
- Mobile app

---

## المصدر الأصلي | Original Request

The competition was announced via internal email on 1/1/2026 by AbdulAziz Alajmi. The original Arabic requirements are preserved in:
`docs/archive/etmam-1.0/علاقات العملاء - فكرة .txt`
