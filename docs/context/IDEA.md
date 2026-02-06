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
4. **CRM is disconnected** — Qualified opportunities are tracked in spreadsheets instead of flowing automatically into Odoo CRM.

---

## Solution

Etmam is an AI-powered tender management tool that takes tender data (from CSV/Excel or PDF), evaluates it, estimates costs, and pushes qualified opportunities into Odoo CRM.

### Core Flow
```
Setup: Upload Company Profile + Rate Cards (once)
  ↓
Input (CSV/Excel or PDF) → AI Analysis & Extraction → Evaluation (0-100, custom criteria & weights) → Cost Estimator (uses rate cards) → CRM Export (Odoo or Excel)
```

### Architecture: Two Input Paths

**Path A — Base (Required, Must Work 100%)**
```
CSV/Excel Upload → Parse & Structure → Evaluate → Cost Estimate → Export to Odoo/Excel
```
This is the safe path. It directly meets competition requirements. Manual data entry as fallback.

**Path B — AI Enhancement (Differentiator)**
```
PDF Upload (كراسة الشروط) → Gemini AI Extraction → Same pipeline as Path A
```
This is the wow factor. AI reads the Arabic RFP document and auto-extracts structured data, then feeds into the same evaluation and costing pipeline.

---

## Competition MVP Requirements (from brief)

| # | Requirement | Our Approach |
|---|-----------|--------------|
| 1 | Fetch tender data from Etimad, or start with Excel/CSV | Both: CSV/Excel as base + AI PDF extraction as enhancement |
| 2 | Evaluate each tender with adjustable model (0-100 score + brief reasons) | Simple scoring system with configurable criteria and weights |
| 3 | Auto-create CRM opportunity with required fields | Odoo API integration (configurable via .env) + Excel export as fallback |
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

### 1. Dual-Mode Tender Input
**Base Mode:** Upload CSV/Excel with tender data (columns matching required fields)
**AI Mode:** Upload كراسة الشروط PDF → Gemini Flash extracts and structures all data automatically
**Manual Entry:** Form-based input as fallback

### 2. Company Profile & Rate Cards Upload
- Upload company capabilities document (what services/products they offer)
- Upload internal services rate card (their own pricing)
- Upload distributor rate cards (the monthly Excel files they receive from distis)
- Rate cards are stored and referenced by the Cost Estimator for accurate pricing
- This ensures cost estimates use REAL internal/disti pricing, not retail web prices that could lose a tender
- Multiple rate cards supported (different distis, different product lines)

### 3. AI-Powered Tender Analysis (Path B Enhancement)
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

### 6. CRM Integration
- **Primary:** Odoo API integration — auto-creates opportunity records
  - Configurable via .env (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY)
  - Maps all required fields to Odoo opportunity model
- **Fallback:** Excel export formatted for Odoo import
  - Always available regardless of Odoo configuration
  - Includes all required fields + cost breakdown + evaluation

---

## Target Users

**Primary:** Small-to-medium Saudi businesses bidding on government tenders through Etimad.

**User Profile:**
- Business development managers, procurement officers, company owners
- Arabic-speaking, working with Arabic-language RFP documents
- Use Odoo for CRM/pipeline tracking
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

1. **Dual Input** — Works with simple CSV/Excel AND intelligent PDF extraction
2. **Arabic-First AI** — Built specifically for Saudi government tender documents
3. **Real Pricing, Not Guesswork** — Uses uploaded company & distributor rate cards for cost estimation, not web-scraped retail prices
4. **Your Evaluation, Your Rules** — Fully customizable scoring criteria and weights, not a one-size-fits-all model
5. **End-to-End** — Not just extraction OR evaluation — the complete tender-to-CRM pipeline
6. **Configurable** — Rate cards, evaluation criteria, cost categories, and CRM connection all adjustable
7. **Production-Ready Architecture** — .env configuration means it connects to any Odoo instance

---

## Technical Approach (High-Level)

- **Frontend:** Next.js (latest stable) + shadcn/ui + Tailwind CSS
- **Backend:** Next.js API routes + Supabase (PostgreSQL + Auth + Storage)
- **AI Engine:** Google Gemini Flash (free tier — Arabic PDF analysis)
- **CRM:** Odoo XML-RPC API (configurable) + SheetJS Excel export (fallback)
- **Language:** Full Arabic RTL support

---

## Competition Evaluation Criteria (from brief)

| Criteria | How We Address It |
|----------|------------------|
| End-to-end workflow (input → CRM opportunity) | Complete pipeline with both input paths |
| Ease of operation and reliability | Simple UI, clear flow, Excel fallback ensures reliability |
| Clear and adjustable evaluation logic | Configurable scoring with transparent criteria and weights |
| Clear setup and operation documentation | Setup guide with .env configuration instructions |
| Minimum security and credential protection | .env for secrets, Supabase auth, no hardcoded keys |

---

## Constraints

- **Timeline:** 3 days (Thursday Feb 5 → Sunday Feb 8)
- **Budget:** Zero — free tier APIs and tools only
- **Scope:** Competition MVP — functional demo, not production-scale
- **AI:** Google Gemini Flash free tier (rate limits apply)
- **CRM:** Odoo integration via .env — judges provide their own credentials or see Excel export
