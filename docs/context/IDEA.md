# Etmam 2.0 — IDEA Document

## Project Name
**Etmam** (إتمام) — AI-Powered Tender Management System

## Competition Context
- **Competition:** EnfraTech & Exotech Internal MVP Competition
- **Announced by:** AbdulAziz Alajmi
- **Prize:** SAR 20,000
- **Original Duration:** 1 month from 1/1/2026
- **Current Status:** First version submitted (demo failed) — rebuilding from scratch
- **Resubmission + Demo:** Sunday, February 8, 2026 (3 days from now)
- **Team:** Hammad (developer) + Salman (demo/submission)
- **Deliverables Required:**
  1. Repository link or deployment package
  2. Short setup/operation guide
  3. 10-minute presentation explaining the MVP and results

---

## Problem Statement

Saudi businesses competing for government tenders through Etimad (اعتماد) face a painful, manual, and error-prone process:

1. **Tender data is scattered** — Competition information sits in Etimad, PDFs, emails, and spreadsheets with no central view.
2. **Evaluation is subjective** — No standardized method to score whether a tender is worth pursuing before investing time.
3. **Cost estimation is manual** — Building cost breakdowns from specifications requires manually identifying every required product and service, then pricing each line item.
4. **CRM is disconnected** — Qualified opportunities are tracked in spreadsheets instead of flowing automatically into Odoo CRM (EnfraTech’s CRM system).

---

## Solution

Etmam is an AI-powered tender management tool that: gets tender data from two equally important sources (CSV/Excel and PDF), analyzes all data, produces evaluation, creates an Odoo CRM opportunity, then supports two equally important outputs — push to Odoo via .env integration and manual extraction (Excel / manual entry).

### Core Flow
```
Setup: Upload Company Profile + Rate Cards (once)
  ↓
Input (CSV/Excel or PDF) → AI Analysis & Extraction → Cost Estimator (uses rate cards) → Evaluation (0-100, custom criteria & weights; Profit Potential uses bid price) → Push to Odoo (via .env) and/or manual extraction (Excel)
```

### Architecture: Two Equally Important Input Sources

**Path A — CSV/Excel**
```
CSV/Excel Upload → Parse & Structure → Cost Estimate → Evaluate → Push to Odoo (via .env) and Excel/manual extraction
```
Required. Both input sources must be in the pipeline.

**Path B — PDF (كراسة الشروط)**
```
PDF Upload → Gemini AI Extraction → Same pipeline as Path A
```
Required. AI reads the Arabic RFP and extracts structured data, then feeds into the same evaluation and costing pipeline. Equally important with CSV/Excel — not an enhancement or fallback.

---

## Competition MVP Requirements (from brief)

| # | Requirement | Our Approach |
|---|-----------|--------------|
| 1 | Fetch tender data from Etimad, or start with Excel/CSV | CSV/Excel and PDF — both equally important input sources, both in the pipeline |
| 2 | Evaluate each tender with adjustable model (0-100 score + brief reasons) | Simple scoring system with configurable criteria and weights |
| 3 | Auto-create CRM opportunity with required fields | Push to Odoo via .env integration and manual extraction (Excel) — both equally important features |
| 4 | Simple screen showing tenders and evaluation results | Dashboard with tender list, scores, and status |

### Required CRM Fields (from competition brief)
- الجهة (Entity/Organization)
- عنوان المنافسة (Tender Title)
- رقم المنافسة (Tender Number)
- الموعد النهائي (Deadline)
- قيمة تقديرية (Estimated Value)
- درجة التقييم (Evaluation Score)
- التوصية (Recommendation)

---

## Feature Set

### 1. Tender Input (two equally important sources)
**CSV/Excel:** Upload CSV/Excel with tender data (columns matching required fields). Required; equally important with PDF.
**PDF:** Upload كراسة الشروط PDF → Gemini Flash extracts and structures all data automatically. Required; equally important with CSV/Excel.
**Manual Entry:** Form-based input when no file is available.

### 2. Company Profile & Rate Cards Upload
- Upload company capabilities document (what services/products they offer)
- Upload internal services rate card (their own pricing)
- Upload distributor rate cards (the monthly Excel files they receive from distis)
- Rate cards are stored and referenced by the Cost Estimator for accurate pricing
- This ensures cost estimates use REAL internal/disti pricing, not retail web prices that could lose a tender
- Multiple rate cards supported (different distis, different product lines)

### 3. AI-Powered Tender Analysis (PDF path)
- Reads full Arabic PDF documents
- Extracts: title, reference number, entity, deadline, specifications, requirements, eligibility, financial requirements
- Matches extracted requirements against uploaded company capabilities
- Generates structured data that feeds into evaluation and costing

### 4. Tender Evaluation System
- Adjustable scoring model (0-100)
- **User-defined evaluation criteria** — user selects which criteria matter to them
- **User-defined weights** — user assigns importance (%) to each criterion
- Default criteria provided as starting template (can be modified):
  - Alignment with company capabilities
  - Profit potential
  - Timeline feasibility
  - Competition level
  - Resource availability
  - Strategic value
- Auto-generates brief reasoning for each score based on selected criteria
- Go/No-Go recommendation
- Criteria and weights saved as presets for reuse across tenders

### 5. Cost Estimator
- Auto-generates cost line items based on tender specifications
- **Prices pulled from uploaded rate cards** (company rates + disti rates) — not web search
- Falls back to manual entry if no matching rate card item found
- Direct costs: materials, labor, equipment, services
- Indirect costs: overhead, admin, contingency, profit margin
- Adjustable quantities, unit prices, margins
- Real-time total calculation
- Highlights items where no rate card match was found (needs manual pricing)

### 6. CRM Integration (two equal features)
- **Push to Odoo:** EnfraTech’s CRM. Create opportunity with required fields and push via .env (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY). All competition-required CRM fields mapped; duplicate detection by tender number.
- **Manual extraction:** Excel export with all required CRM fields, or manual entry. Includes all required fields + cost breakdown + evaluation. Equally important — not a fallback.

---

## Target Users

**Primary:** Small-to-medium Saudi businesses bidding on government tenders through Etimad.

**User Profile:**
- Business development managers, procurement officers, company owners
- Arabic-speaking, working with Arabic-language RFP documents
- Use Odoo for CRM (EnfraTech’s system); need tender opportunities in Odoo
- Need speed and accuracy in tender evaluation

---

## Value Proposition

**"من الملف إلى الفرصة في دقائق — From File to Opportunity in Minutes"**

What takes a procurement team hours manually, Etmam does in minutes:
- Read and structure tender data ✓
- Score the opportunity ✓
- Estimate costs ✓
- Push to Odoo CRM ✓

---

## Key Differentiators

1. **Dual Input** — CSV/Excel and PDF (كراسة الشروط) — both equally important, both required in the pipeline
2. **Arabic-First AI** — Built specifically for Saudi government tender documents
3. **Real Pricing, Not Guesswork** — Uses uploaded company & distributor rate cards for cost estimation, not web-scraped retail prices
4. **Your Evaluation, Your Rules** — Fully customizable scoring criteria and weights, not a one-size-fits-all model
5. **End-to-End** — Not just extraction OR evaluation — the complete tender-to-CRM pipeline
6. **Configurable** — Rate cards, evaluation criteria, cost categories, and CRM connection all adjustable
7. **Production-Ready Architecture** — .env configuration for AI providers and Odoo (EnfraTech’s CRM)

---

## Technical Approach (High-Level)

- **Frontend:** Next.js (latest stable) + shadcn/ui + Tailwind CSS
- **Backend:** Next.js API routes + Supabase (PostgreSQL + Auth + Storage)
- **AI Engine:** Google Gemini Flash (free tier — Arabic PDF analysis)
- **CRM:** Odoo (push via .env) + manual extraction (SheetJS Excel export)
- **Language:** Full Arabic RTL support

---

## Competition Evaluation Criteria (from brief)

| Criteria | How We Address It |
|----------|------------------|
| End-to-end workflow (input → CRM opportunity) | Tender → evaluate → Odoo CRM opportunity (push via .env) + both input paths |
| Ease of operation and reliability | Simple UI, clear flow; push to Odoo and manual extraction both supported |
| Clear and adjustable evaluation logic | Configurable scoring with transparent criteria and weights |
| Clear setup and operation documentation | Setup guide with .env configuration instructions |
| Minimum security and credential protection | .env for secrets, Supabase auth, no hardcoded keys |

---

## Constraints

- **Timeline:** 3 days (Thursday Feb 5 → Sunday Feb 8)
- **Budget:** Zero — free tier APIs and tools only
- **Scope:** Competition MVP — functional demo, not production-scale
- **AI:** Google Gemini Flash free tier (rate limits apply)
- **CRM:** Odoo push via .env (EnfraTech’s CRM) and manual extraction (Excel) — both required features.
