# Etmam 2.0 — Product Requirements Document (PRD)

## Document Info
- **Version:** 2.1
- **Last Updated:** February 7, 2026
- **Author:** Hammad
- **Status:** Active — 3-Day Sprint
- **Change Log:** v2.1 — All features P0, auth corrected, extraction schema aligned to 12-section template, CRM: Odoo push + manual extraction (both equal)
- **Reference:** See IDEA.md for full context

---

## 1. Executive Summary

Etmam is an AI-powered tender management MVP for the EnfraTech competition. It takes tender data from two equally important sources (CSV/Excel and Arabic PDF), analyzes and evaluates it, estimates costs using uploaded rate cards, and supports two equally important CRM outputs: push to Odoo (EnfraTech’s CRM) via .env integration and manual extraction (Excel export).

**Build Window:** Thursday Feb 5 → Sunday Feb 8 (3 days)
**Demo:** 10-minute live presentation on Sunday

---

## 2. User Personas

### Primary: Procurement Manager (Ahmed)
- Works at a mid-size Saudi company bidding on Etimad tenders
- Reviews 10-15 tenders per month
- Currently uses Excel to track everything
- Uses Odoo (EnfraTech’s CRM); needs tenders pushed there or exported for manual entry
- Receives monthly rate cards from 3-4 distributors as Excel files
- Arabic-speaking, uses Windows, moderate tech literacy

### Secondary: Business Owner (Khalid)
- Owns a company that bids on government tenders
- Wants a quick Go/No-Go assessment before his team invests hours
- Cares about the score and estimated profit margin
- Doesn't want to learn complex tools

---

## 3. Feature Specifications

### Priority Legend
- **P0 — Must work for demo.** If this breaks, demo fails.

> **Note:** All features are P0. Per IDEA.md, every feature is part of the end-to-end pipeline: Input → AI Analysis → **Cost Estimation** → **Evaluation** → CRM Export. There are no P1 or P2 features.

---

### Feature 1: Tender Input (CSV/Excel + PDF, both P0)
**Priority:** P0 — CSV/Excel and PDF are equally important input sources; both must be in the pipeline.

#### 1A: CSV/Excel Upload (P0)
**Description:** User uploads a CSV or Excel file containing tender data. System parses and structures it. Equally important with PDF input — both sources must be in the pipeline.

**Input Format (expected columns):**
| Column (Arabic) | Column (English) | Type | Required |
|---|---|---|---|
| الجهة | entity | string | ✅ |
| عنوان المنافسة | tender_title | string | ✅ |
| رقم المنافسة | tender_number | string | ✅ |
| الموعد النهائي | deadline | date | ✅ |
| قيمة تقديرية | estimated_value | number | ✅ |
| الوصف | description | string | ❌ |
| المتطلبات | requirements | string | ❌ |
| رابط المنافسة | tender_url | string | ❌ |

**Acceptance Criteria:**
- [ ] Upload .csv, .xlsx, or .xls file via drag-and-drop or file picker
- [ ] System detects Arabic or English column headers automatically
- [ ] Parsed data displayed in a table for user review before proceeding
- [ ] User can edit any cell inline before confirming
- [ ] Handles 1 tender or multiple tenders per file
- [ ] Error state: clear message if file format is wrong or required columns missing
- [ ] Loading state while parsing

#### 1B: Manual Entry Form (P0)
**Description:** User enters tender data manually via a form when no file (CSV/Excel or PDF) is available.

**Acceptance Criteria:**
- [ ] Form with all fields from the table above
- [ ] Arabic labels with proper RTL alignment
- [ ] Validation on required fields
- [ ] "Add Tender" button saves to the system
- [ ] Can add multiple tenders one at a time

#### 1C: PDF Upload with AI Extraction (P0)
**Description:** User uploads a كراسة الشروط PDF. Gemini Flash AI reads and extracts structured data. Equally important with CSV/Excel input — both sources must be in the pipeline.

**Acceptance Criteria:**
- [ ] Upload .pdf file via drag-and-drop or file picker
- [ ] PDF sent to Gemini Flash API with structured extraction prompt
- [ ] Extracted data presented in the same table format as CSV upload
- [ ] User can review and edit extracted data before confirming
- [ ] Works with Arabic PDFs (كراسة الشروط)
- [ ] Works with scanned PDFs (Gemini handles OCR natively)
- [ ] Loading state with progress indication ("Analyzing document...")
- [ ] Error handling: graceful failure if AI extraction fails, with option to enter manually
- [ ] Max file size: 20MB (Gemini limit)

**AI Extraction Prompt Requirements:**
The AI must extract and return JSON with (schema aligned to TENDER-STRUCTURE-v3.0-VERIFIED.md, 12 sections):
```json
{
  "_meta": {
    "extraction_model": "gemini-2.5-flash",
    "confidence": 85,
    "sections_found": [1, 5, 6, 7, 8, 9],
    "sections_missing": [2, 3, 4, 10, 11, 12],
    "warnings": []
  },
  "section_1_introduction": {
    "entity": "الجهة الحكومية",
    "tender_number": "رقم الكراسة",
    "tender_title": "اسم المنافسة",
    "document_purchase_fee": null,
    "dates": {
      "document_issue": "DD/MM/YYYY",
      "questions_deadline": "DD/MM/YYYY",
      "bid_submission_deadline": "DD/MM/YYYY",
      "bid_opening": "DD/MM/YYYY",
      "award_date": "DD/MM/YYYY",
      "work_start": "DD/MM/YYYY"
    },
    "required_licenses": [],
    "entity_representative": {
      "name": "", "position": "", "phone": "", "email": ""
    }
  },
  "section_5_evaluation": {
    "evaluation_method": "أقل سعر | الجودة والتكلفة",
    "financial_weight": null,
    "technical_weight": null,
    "scoring_formula": "EXTRACT VERBATIM",
    "local_content_target": null,
    "minimum_technical_score": null,
    "price_cap_rule": null
  },
  "section_6_contract": {
    "performance_guarantee_percent": null,
    "advance_payment_guarantee_percent": null,
    "penalty_delay_per_day": null,
    "penalty_max_percent": null,
    "payment_terms": null,
    "insurance_requirements": []
  },
  "section_7_scope": {
    "duration": "",
    "location": { "city": "", "region": "" },
    "bill_of_quantities": [
      {
        "item_number": 1,
        "category": "",
        "item_name": "",
        "unit": "",
        "description": "",
        "quantity": 0,
        "specs_reference": ""
      }
    ]
  },
  "section_8_specifications": {
    "team_requirements": [],
    "materials": [],
    "equipment": [],
    "quality_standards": [],
    "execution_methodology": null
  },
  "section_9_local_content": {
    "target_percentage": null,
    "mandatory_items": [],
    "calculation_method": null,
    "penalties": null
  },
  "estimated_value": null,
  "description": "",
  "requirements": [],
  "eligibility_criteria": [],
  "submission_requirements": []
}
```

---

### Feature 2: Company Profile & Rate Cards
**Priority:** P0

#### 2A: Rate Card Upload (P0)
**Description:** User uploads their own service rate cards and distributor rate cards as Excel/CSV files. These are stored and used by the Cost Estimator.

**Rate Card Format (expected):**
| Column | Type | Required |
|---|---|---|
| Item / البند | string | ✅ |
| Category / التصنيف | string | ❌ |
| Unit / الوحدة | string | ✅ |
| Unit Price / سعر الوحدة | number | ✅ |
| Source / المصدر | string | ❌ |
| Valid Until / صالح حتى | date | ❌ |

**Acceptance Criteria:**
- [ ] Upload multiple rate card files (Excel/CSV)
- [ ] Label each rate card (e.g., "Dell Distributor Q1 2026", "Internal Services")
- [ ] System parses and stores all items with prices
- [ ] View uploaded rate cards in a list with item count
- [ ] Delete or replace a rate card
- [ ] Rate card items searchable by the Cost Estimator
- [ ] If no rate cards uploaded, Cost Estimator works with manual entry only

#### 2B: Company Capabilities (P0)
**Description:** User uploads or enters their company's service/product capabilities.

**Acceptance Criteria:**
- [ ] Simple text input or document upload describing what the company offers
- [ ] Used by AI to match tender requirements against company capabilities
- [ ] Feeds into evaluation scoring (alignment criterion)
- [ ] Optional — system works without it

---

### Feature 3: AI-Powered Tender Analysis
**Priority:** P0 (extends Feature 1C extraction)

**Description:** After PDF extraction, AI provides deeper analysis beyond raw field extraction.

**Acceptance Criteria:**
- [ ] AI identifies key risks and red flags in the tender
- [ ] AI suggests which line items from rate cards match the requirements
- [ ] AI generates a brief summary (3-5 sentences) of the tender in Arabic
- [ ] Results displayed in a "Tender Analysis" card/section
- [ ] All AI-generated content clearly marked as AI-generated
- [ ] User can dismiss or edit AI suggestions

**Note:** This feature is an extension of Feature 1C. If 1C works, this is additional prompting on the same Gemini call. Low extra effort.

---

### Feature 4: Tender Evaluation System
**Priority:** P0

**Description:** Score each tender 0-100 with configurable criteria and weights. Provide Go/No-Go recommendation.

#### 4A: Default Evaluation Criteria
The system ships with these default criteria (user can modify):

| Criterion | Default Weight | Description |
|---|---|---|
| Alignment (التوافق) | 25% | Does this match our capabilities? |
| Profit Potential (الربحية) | 25% | Is the estimated margin attractive? |
| Timeline (الجدول الزمني) | 20% | Is the deadline realistic? |
| Competition (المنافسة) | 15% | How competitive is this tender likely to be? |
| Strategic Value (القيمة الاستراتيجية) | 15% | Does this align with company goals? |

#### 4B: Customization
**Acceptance Criteria:**
- [ ] User can add new criteria (name + description)
- [ ] User can remove criteria
- [ ] User can adjust weights using sliders — weights must sum to 100%
- [ ] System auto-adjusts remaining weights when one changes (proportional redistribution)
- [ ] User can score each criterion per tender (0-100 per criterion)
- [ ] Overall score calculated as weighted average
- [ ] Score displayed with color coding:
  - 🟢 70-100: "Recommended — تقدم"
  - 🟡 40-69: "Review — مراجعة"  
  - 🔴 0-39: "Skip — تجاوز"
- [ ] Brief auto-generated reasoning based on individual scores (when bid price exists from Cost Estimator, Profit Potential and reasoning may use it)
- [ ] User can override the recommendation manually
- [ ] Criteria presets can be saved and loaded for reuse

#### 4C: AI-Assisted Scoring (P0)
**Acceptance Criteria:**
- [ ] If tender was uploaded via PDF (Feature 1C), AI can suggest scores per criterion
- [ ] AI scoring is a suggestion — user always has final say
- [ ] AI explains its reasoning for each suggested score

---

### Feature 5: Cost Estimator
**Priority:** P0

**Description:** Generate a cost breakdown for the tender with line items, using uploaded rate cards for pricing.

#### 5A: Cost Line Items
**Data Model:**
```
CostItem {
  id: string
  category: "direct" | "indirect"
  subcategory: string (e.g., "materials", "labor", "overhead")
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number (quantity × unit_price)
  source: "rate_card" | "manual" | "ai_suggested"
  rate_card_match: string | null (reference to rate card item)
  notes: string
}
```

**Acceptance Criteria:**
- [ ] Display cost table with all line items
- [ ] Two sections: Direct Costs (مباشرة) and Indirect Costs (غير مباشرة)
- [ ] Each row: description, quantity, unit, unit price, total, source
- [ ] Inline editing for all fields
- [ ] Add new row button per section
- [ ] Delete row with confirmation
- [ ] Auto-calculate row total (qty × unit price)
- [ ] Auto-calculate section subtotals
- [ ] Auto-calculate grand total
- [ ] Profit margin input (%) — applied on top of grand total
- [ ] Final price = grand total + profit margin
- [ ] Highlight items with no rate card match in yellow (needs manual pricing)

#### 5B: Rate Card Matching (P0)
**Acceptance Criteria:**
- [ ] When generating cost items from tender requirements, system searches uploaded rate cards
- [ ] If match found: auto-fill unit price from rate card, mark source as "rate_card"
- [ ] If multiple matches: show dropdown for user to select correct one
- [ ] If no match: leave unit price empty, mark source as "manual", highlight yellow
- [ ] User can override any rate card price

#### 5C: AI Cost Generation (P0)
**Acceptance Criteria:**
- [ ] If tender uploaded via PDF, AI suggests cost line items based on extracted requirements
- [ ] AI-suggested items marked with source "ai_suggested"
- [ ] User can accept, modify, or remove AI suggestions
- [ ] AI suggestions cross-referenced with rate cards for pricing

#### 5D: Cost Summary
**Acceptance Criteria:**
- [ ] Summary card showing:
  - Total Direct Costs
  - Total Indirect Costs
  - Subtotal
  - Profit Margin (%)
  - Profit Amount
  - Final Bid Price
- [ ] Printable / exportable as part of the Excel output

---

### Feature 6: CRM Integration & Export
**Priority:** P0

#### 6A: Manual Extraction — Excel Export (P0)
**Description:** Export tender data + evaluation + cost estimate as a formatted Excel file. Equally important with push to Odoo; not a fallback.

**Excel Output Structure:**
Sheet 1 — Tender Overview:
| Field | Value |
|---|---|
| الجهة | Entity name |
| عنوان المنافسة | Tender title |
| رقم المنافسة | Tender number |
| الموعد النهائي | Deadline |
| قيمة تقديرية | Estimated value |
| درجة التقييم | Evaluation score |
| التوصية | Recommendation |
| سعر العرض | Bid price (from cost estimator) |

Sheet 2 — Evaluation Details:
| Criterion | Weight | Score | Notes |
|---|---|---|---|

Sheet 3 — Cost Breakdown:
| Category | Description | Qty | Unit | Price | Total | Source |
|---|---|---|---|---|---|---|

**Acceptance Criteria:**
- [ ] "Export to Excel" button on tender detail page
- [ ] "Export All" button on dashboard for multiple tenders
- [ ] File downloads immediately as .xlsx
- [ ] Arabic headers and content properly formatted
- [ ] File named: `Etmam_[TenderNumber]_[Date].xlsx`
- [ ] Works standalone (no Odoo required for this feature)

#### 6B: Push to Odoo CRM (P0)
**Description:** Push qualified tenders to Odoo (EnfraTech’s CRM) as opportunities via .env integration (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY). Equally important with manual extraction; not a fallback.

**CRM Field Mapping (Etmam → Odoo opportunity):**
| Etmam Field | Odoo Field | Notes |
|---|---|---|
| tender_title | name | Display title |
| entity | entity | Issuing body |
| estimated_value | value | Expected revenue |
| deadline | deadline | Bid deadline |
| tender_number | ref | Tender reference |
| evaluation_score | score | Mapped to priority |
| recommendation | recommendation | Go/No-Go |
| bid_price | bid_price | From cost estimator |

**Acceptance Criteria:**
- [ ] "Push to Odoo" button on tender detail page
- [ ] "Push All Qualified" button on dashboard (only tenders scored 70+; creates opportunities in Odoo)
- [ ] Connection test on .env (show clear message if Odoo not configured)
- [ ] All competition-required CRM fields mapped to Odoo opportunity
- [ ] Success confirmation after push
- [ ] Error handling: if push fails, show message; Excel export still available (equal feature)
- [ ] Duplicate detection: warn if tender number already exists in Odoo

---

## 4. Non-Functional Requirements

### Performance
- CSV/Excel parsing: < 3 seconds for 50 tenders
- PDF AI extraction: < 30 seconds per document
- Page load: < 2 seconds
- Cost calculation: real-time (instant on edit)

### Security (Competition Minimum)
- All API keys and credentials in .env (never in code)
- .env in .gitignore
- Supabase RLS enabled on all tables
- Supabase email/password authentication required (competition requirement)
- HTTPS in production deployment

### Language & UI
- Full Arabic RTL layout as default
- Arabic labels on all UI elements
- English fallback where Arabic translation not available
- shadcn/ui components with RTL support
- Responsive but desktop-first (demo will be on laptop)

### Reliability
- Excel export (manual extraction) ALWAYS works (no external dependencies)
- Push to Odoo works when .env is configured; both push and manual extraction are required features
- If AI fails, manual entry remains available for input
- Every feature has a manual fallback path where applicable

---

## 5. Pages & Navigation

### Page Map
```
/ (Dashboard)
├── /upload (Tender Input — CSV/Excel/PDF/Manual)
├── /tenders (Tender List with scores)
│   └── /tenders/[id] (Tender Detail — analysis, evaluation, costs)
├── /settings
│   ├── Rate Cards management
│   ├── Evaluation Criteria presets
│   └── Odoo / CRM configuration
└── /export (Batch export)
```

### Dashboard (/)
- Total tenders count
- Score distribution (how many 🟢🟡🔴)
- Recent tenders list with quick scores
- Quick action buttons: Upload, Export All

### Tender Detail (/tenders/[id])
- Tabs or sections (order: Cost before Evaluation so score can use estimated value):
  1. **Overview** — all extracted/entered data
  2. **Cost Estimate** — line items table, rate card matching, bid price
  3. **Evaluation** — scoring with criteria sliders (Profit Potential uses bid price when available)
  4. **Export** — Excel download + push to Odoo buttons (both equal)

---

## 6. Build Schedule

### Day 1 — Thursday (Foundation + Core Pipeline)
**Goal:** CSV/Excel and PDF paths both work; see tenders → basic evaluation → Excel export works end-to-end

| Time Block | Task | Feature | Priority |
|---|---|---|---|
| Morning | Project setup (Next.js, Supabase, shadcn/ui, RTL) | Infra | P0 |
| Morning | Database schema + Supabase tables + RLS | Infra | P0 |
| Midday | CSV/Excel upload + parsing | F1A | P0 |
| Midday | Manual entry form | F1B | P0 |
| Afternoon | Tender list page + detail page | Nav | P0 |
| Afternoon | Basic evaluation system (default criteria, scoring) | F4A | P0 |
| Evening | Excel export (all 3 sheets) | F6A | P0 |
| Evening | Test full pipeline end-to-end | QA | P0 |

**Day 1 Checkpoint:** CSV/Excel path: upload file, see tenders, score them, download Excel. Day 2 adds PDF path. Both input sources must be in the pipeline for demo.

### Day 2 — Friday (Enhancement + Intelligence)
**Goal:** Add AI PDF extraction, rate cards, custom evaluation, cost estimator

| Time Block | Task | Feature | Priority |
|---|---|---|---|
| Morning | PDF upload + Gemini AI extraction | F1C | P0 |
| Morning | AI extraction prompt engineering + testing | F1C | P0 |
| Midday | Rate card upload + storage | F2A | P0 |
| Midday | Cost estimator with line items | F5A | P0 |
| Afternoon | Rate card matching in cost estimator | F5B | P0 |
| Afternoon | Custom evaluation criteria + weights | F4B | P0 |
| Evening | Odoo CRM integration (push via .env) | F6B | P0 |
| Evening | Test full flow with AI path | QA | P0 |

**Day 2 Checkpoint:** Can you upload a PDF, get AI extraction, score with custom criteria, build a cost estimate with rate card prices, and push to Odoo and/or export to Excel? If yes → Day 2 passed.

### Day 3 — Saturday (Polish + Demo Prep)
**Goal:** UI polish, edge cases, demo rehearsal, documentation

| Time Block | Task | Feature | Priority |
|---|---|---|---|
| Morning | Dashboard with summary stats | Nav | P0 |
| Morning | UI polish — RTL fixes, loading states, error states | UI | P0 |
| Midday | AI-assisted scoring (P0) + AI cost suggestions (P0) | F4C, F5C | P0 |
| Midday | Company capabilities upload | F2B | P0 |
| Afternoon | Setup guide documentation | Deliverable | P0 |
| Afternoon | Fix any remaining bugs | QA | P0 |
| Evening | Demo rehearsal with Salman | Deliverable | P0 |
| Evening | Prepare 10-minute presentation | Deliverable | P0 |

**Day 3 Checkpoint:** Can Salman run the full demo without you? Is the setup guide clear? Is the repo clean? If yes → Ready to submit.

---

## 7. Demo Script (10 Minutes)

**Minute 0-1:** Problem statement — how tenders are managed today (manual, slow, disconnected)
**Minute 1-2:** Etmam overview — from file to CRM opportunity (push to Odoo + Excel)
**Minute 2-4:** Live demo — upload a real كراسة شروط PDF → show AI extraction
**Minute 4-5:** Live demo — upload rate cards → show how prices auto-populate
**Minute 5-7:** Live demo — evaluate the tender with custom criteria → show score + recommendation
**Minute 7-8:** Live demo — cost estimator with rate card matching
**Minute 8-9:** Live demo — export to Excel AND push to Odoo (both features)
**Minute 9-10:** Summary + what's next (roadmap for production version)

**Demo both inputs:** Show CSV/Excel upload and PDF upload as two equally important paths. If one fails during demo, show the other; both must be present and working.

---

## 8. Out of Scope (NOT building for MVP)

- Advanced multi-user support (roles, permissions, teams)
- Direct Etimad API integration (scraping/API)
- Historical tender analytics or reporting
- Arabic NLP / sentiment analysis
- Mobile responsive design (desktop demo only)
- Payment processing
- Multi-language UI toggle (Arabic-first, English in code only)
- Automated notifications or alerts
- Tender comparison features
- Bulk PDF processing (one at a time for MVP)

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Gemini AI extraction is inaccurate on Arabic PDFs | Demo looks bad | Test with 3+ real كراسات شروط before Sunday. Always show editable results. |
| Odoo push fails during demo | Missing a feature | Excel export always works. Show Odoo field mapping and explain. |
| Rate card format varies wildly | Parsing breaks | Define a template format. Provide a sample rate card file. |
| 3 days is not enough | Incomplete MVP | P0 features on Day 1. If Day 1 checkpoint passes, we have a working demo. |
| Gemini free tier rate limits | AI stops working mid-demo | Cache AI results. Only call API once per PDF, store result. |

---

## 10. Success Metrics (Competition)

| Metric | Target |
|---|---|
| End-to-end pipeline works | Upload → Cost → Evaluate → Export in one demo flow |
| Demo runs without crashes | Zero errors during 10-minute presentation |
| All required CRM fields exported | 7/7 fields present in Excel and in Odoo (when pushed) |
| Evaluation is adjustable | Judges can see criteria and weights being changed live |
| Setup guide is clear | Someone can run the app following the guide in < 10 minutes |
