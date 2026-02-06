# Etmam 2.0 — Product Requirements Document (PRD)

## Document Info
- **Version:** 2.0
- **Last Updated:** February 5, 2026
- **Author:** Hammad
- **Status:** Active — 3-Day Sprint
- **Reference:** See IDEA.md for full context

---

## 1. Executive Summary

Etmam is an AI-powered tender management MVP for the EnfraTech competition. It takes tender data (CSV/Excel or Arabic PDF), analyzes and evaluates it, estimates costs using uploaded rate cards, and exports qualified opportunities to Odoo CRM or Excel.

**Build Window:** Thursday Feb 5 → Sunday Feb 8 (3 days)
**Demo:** 10-minute live presentation on Sunday

---

## 2. User Personas

### Primary: Procurement Manager (Ahmed)
- Works at a mid-size Saudi company bidding on Etimad tenders
- Reviews 10-15 tenders per month
- Currently uses Excel to track everything
- Has Odoo CRM but rarely updates it because it's manual
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
- **P1 — Should work for demo.** Impressive but survivable if missing.
- **P2 — Nice to have.** Only if time permits.

---

### Feature 1: Dual-Mode Tender Input
**Priority:** P0

#### 1A: CSV/Excel Upload (P0 — Build First)
**Description:** User uploads a CSV or Excel file containing tender data. System parses and structures it.

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

#### 1B: Manual Entry Form (P0 — Fallback)
**Description:** User enters tender data manually via a form.

**Acceptance Criteria:**
- [ ] Form with all fields from the table above
- [ ] Arabic labels with proper RTL alignment
- [ ] Validation on required fields
- [ ] "Add Tender" button saves to the system
- [ ] Can add multiple tenders one at a time

#### 1C: PDF Upload with AI Extraction (P1 — Differentiator)
**Description:** User uploads a كراسة الشروط PDF. Gemini Flash AI reads and extracts structured data.

**Acceptance Criteria:**
- [ ] Upload .pdf file via drag-and-drop or file picker
- [ ] PDF sent to Gemini Flash API with structured extraction prompt
- [ ] Extracted data presented in the same table format as CSV upload
- [ ] User can review and edit extracted data before confirming
- [ ] Works with Arabic PDFs (the primary use case)
- [ ] Works with scanned PDFs (Gemini handles OCR natively)
- [ ] Loading state with progress indication ("Analyzing document...")
- [ ] Error handling: graceful failure if AI extraction fails, with option to enter manually
- [ ] Max file size: 20MB (Gemini limit)

**AI Extraction Prompt Requirements:**
The AI must extract and return JSON with:
```json
{
  "entity": "الجهة المصدرة",
  "tender_title": "عنوان المنافسة",
  "tender_number": "رقم المنافسة",
  "deadline": "2026-03-15",
  "estimated_value": 500000,
  "description": "وصف مختصر",
  "requirements": ["متطلب 1", "متطلب 2"],
  "specifications": ["مواصفة 1", "مواصفة 2"],
  "eligibility_criteria": ["شرط 1", "شرط 2"],
  "financial_requirements": {
    "guarantee": "ضمان ابتدائي 2%",
    "payment_terms": "شروط الدفع"
  },
  "submission_requirements": ["مستند 1", "مستند 2"],
  "line_items": [
    {"item": "بند 1", "quantity": 10, "unit": "وحدة", "specs": "المواصفات"}
  ]
}
```

---

### Feature 2: Company Profile & Rate Cards
**Priority:** P1

#### 2A: Rate Card Upload (P1)
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

#### 2B: Company Capabilities (P2)
**Description:** User uploads or enters their company's service/product capabilities.

**Acceptance Criteria:**
- [ ] Simple text input or document upload describing what the company offers
- [ ] Used by AI to match tender requirements against company capabilities
- [ ] Feeds into evaluation scoring (alignment criterion)
- [ ] Optional — system works without it

---

### Feature 3: AI-Powered Tender Analysis
**Priority:** P1 (depends on Feature 1C)

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
- [ ] Brief auto-generated reasoning based on individual scores
- [ ] User can override the recommendation manually
- [ ] Criteria presets can be saved and loaded for reuse

#### 4C: AI-Assisted Scoring (P2)
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

#### 5B: Rate Card Matching (P1)
**Acceptance Criteria:**
- [ ] When generating cost items from tender requirements, system searches uploaded rate cards
- [ ] If match found: auto-fill unit price from rate card, mark source as "rate_card"
- [ ] If multiple matches: show dropdown for user to select correct one
- [ ] If no match: leave unit price empty, mark source as "manual", highlight yellow
- [ ] User can override any rate card price

#### 5C: AI Cost Generation (P1)
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

#### 6A: Excel Export (P0 — Must Work)
**Description:** Export tender data + evaluation + cost estimate as a formatted Excel file.

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
- [ ] Works regardless of whether Odoo is configured

#### 6B: Odoo CRM Integration (P1)
**Description:** Push qualified tenders directly to Odoo as CRM opportunities.

**Configuration (.env):**
```
ODOO_URL=https://your-instance.odoo.com
ODOO_DB=your_database
ODOO_USERNAME=your_email
ODOO_API_KEY=your_api_key
```

**Odoo Field Mapping:**
| Etmam Field | Odoo Field | Odoo Model |
|---|---|---|
| tender_title | name | crm.lead |
| entity | partner_id (lookup/create) | res.partner |
| estimated_value | expected_revenue | crm.lead |
| deadline | date_deadline | crm.lead |
| tender_number | ref | crm.lead |
| evaluation_score | priority (mapped) | crm.lead |
| recommendation | description (appended) | crm.lead |
| bid_price | planned_revenue | crm.lead |

**Acceptance Criteria:**
- [ ] "Push to Odoo" button on tender detail page
- [ ] "Push All Qualified" button on dashboard (only tenders scored 70+)
- [ ] Connection test button in settings (verifies .env credentials)
- [ ] Success confirmation with link to created Odoo opportunity
- [ ] Error handling: if Odoo is not configured or unreachable, show message and offer Excel export
- [ ] Duplicate detection: warn if tender number already exists in Odoo
- [ ] If Odoo entity (partner) doesn't exist, create it automatically

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
- No authentication required for MVP (single user demo)
- HTTPS in production deployment

### Language & UI
- Full Arabic RTL layout as default
- Arabic labels on all UI elements
- English fallback where Arabic translation not available
- shadcn/ui components with RTL support
- Responsive but desktop-first (demo will be on laptop)

### Reliability
- Excel export ALWAYS works (no external dependencies)
- If AI fails, manual entry remains available
- If Odoo is not configured, Excel export is the default
- Every feature has a manual fallback path

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
│   └── Odoo Configuration
└── /export (Batch export)
```

### Dashboard (/)
- Total tenders count
- Score distribution (how many 🟢🟡🔴)
- Recent tenders list with quick scores
- Quick action buttons: Upload, Export All

### Tender Detail (/tenders/[id])
- Tabs or sections:
  1. **Overview** — all extracted/entered data
  2. **Evaluation** — scoring with criteria sliders
  3. **Cost Estimate** — line items table
  4. **Export** — Excel download + Odoo push buttons

---

## 6. Build Schedule

### Day 1 — Thursday (Foundation + Core Pipeline)
**Goal:** Upload CSV → See tenders → Basic evaluation → Excel export works end-to-end

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

**Day 1 Checkpoint:** Can you upload a CSV, see tenders, score them, and download an Excel file? If yes → Day 1 passed.

### Day 2 — Friday (Enhancement + Intelligence)
**Goal:** Add AI PDF extraction, rate cards, custom evaluation, cost estimator

| Time Block | Task | Feature | Priority |
|---|---|---|---|
| Morning | PDF upload + Gemini AI extraction | F1C | P1 |
| Morning | AI extraction prompt engineering + testing | F1C | P1 |
| Midday | Rate card upload + storage | F2A | P1 |
| Midday | Cost estimator with line items | F5A | P0 |
| Afternoon | Rate card matching in cost estimator | F5B | P1 |
| Afternoon | Custom evaluation criteria + weights | F4B | P0 |
| Evening | Odoo CRM integration | F6B | P1 |
| Evening | Test full pipeline with AI path | QA | P1 |

**Day 2 Checkpoint:** Can you upload a PDF, get AI extraction, score with custom criteria, build a cost estimate with rate card prices, and push to Odoo? If yes → Day 2 passed.

### Day 3 — Saturday (Polish + Demo Prep)
**Goal:** UI polish, edge cases, demo rehearsal, documentation

| Time Block | Task | Feature | Priority |
|---|---|---|---|
| Morning | Dashboard with summary stats | Nav | P0 |
| Morning | UI polish — RTL fixes, loading states, error states | UI | P0 |
| Midday | AI-assisted scoring (P2) + AI cost suggestions (P2) | F4C, F5C | P2 |
| Midday | Company capabilities upload | F2B | P2 |
| Afternoon | Setup guide documentation | Deliverable | P0 |
| Afternoon | Fix any remaining bugs | QA | P0 |
| Evening | Demo rehearsal with Salman | Deliverable | P0 |
| Evening | Prepare 10-minute presentation | Deliverable | P0 |

**Day 3 Checkpoint:** Can Salman run the full demo without you? Is the setup guide clear? Is the repo clean? If yes → Ready to submit.

---

## 7. Demo Script (10 Minutes)

**Minute 0-1:** Problem statement — how tenders are managed today (manual, slow, disconnected)
**Minute 1-2:** Etmam overview — the pipeline from file to CRM opportunity
**Minute 2-4:** Live demo — upload a real كراسة شروط PDF → show AI extraction
**Minute 4-5:** Live demo — upload rate cards → show how prices auto-populate
**Minute 5-7:** Live demo — evaluate the tender with custom criteria → show score + recommendation
**Minute 7-8:** Live demo — cost estimator with rate card matching
**Minute 8-9:** Live demo — export to Excel AND push to Odoo
**Minute 9-10:** Summary + what's next (roadmap for production version)

**Backup plan:** If AI extraction fails during demo, switch to CSV upload path immediately. The judges see the full pipeline regardless.

---

## 8. Out of Scope (NOT building for MVP)

- User authentication / multi-user support
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
| Odoo API connection fails during demo | Missing a feature | Excel export always works. Show Odoo config and explain. |
| Rate card format varies wildly | Parsing breaks | Define a template format. Provide a sample rate card file. |
| 3 days is not enough | Incomplete MVP | P0 features on Day 1. If Day 1 checkpoint passes, we have a working demo. |
| Gemini free tier rate limits | AI stops working mid-demo | Cache AI results. Only call API once per PDF, store result. |

---

## 10. Success Metrics (Competition)

| Metric | Target |
|---|---|
| End-to-end pipeline works | Upload → Evaluate → Cost → Export in one demo flow |
| Demo runs without crashes | Zero errors during 10-minute presentation |
| All required CRM fields exported | 7/7 fields present in Excel and Odoo |
| Evaluation is adjustable | Judges can see criteria and weights being changed live |
| Setup guide is clear | Someone can run the app following the guide in < 10 minutes |
