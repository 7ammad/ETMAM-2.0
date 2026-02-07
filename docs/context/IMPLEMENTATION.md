# IMPLEMENTATION.md — Etmam 2.0 Build Plan

> **Source of truth:** PRD.md. Acceptance criteria, features, and priorities come from PRD. See PRD-SOT-MAP.md.
>
> AI-Powered Tender Management System | Competition: EnfraTech | Deadline: Sunday Feb 8, 2026
> Build Window: 3 Days (Thursday Feb 5 – Sunday Feb 8) | Demo: Sunday Feb 8, 2026

---

## Build Philosophy

**3 rules for the next 72 hours:**

1. **Working > Perfect** — Ship features that work, not features that dazzle. The judges score functionality first. A working CSV/Excel + PDF input → evaluate → push to Odoo and Excel export beats a gorgeous dashboard with broken flows.

2. **Backend-first, UI-last** — Data flow must work before pixels look pretty. Day 1 is plumbing. Day 2 is AI brain. Day 3 is polish and demo prep.

3. **Test the demo flow every night** — Before sleeping, run the full demo end-to-end: upload → analyze → review → push. If it breaks, that's tomorrow's first fix.

---

## Pre-Build Checklist (Before Writing Any Code)

```
□ Node.js 22+ installed
□ pnpm installed globally
□ Supabase CLI installed (npx supabase init)
□ Git repo initialized
□ .env.local created with:
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    GEMINI_API_KEY=
    GROQ_API_KEY=
    AI_PROVIDER=gemini
□ Gemini API key obtained (ai.google.dev)
□ Groq API key obtained (console.groq.com)
□ Supabase project created (local or cloud — .env configurable)
□ Sample tender CSV/Excel file ready for testing (5-10 rows minimum)
□ All 6 context docs in C:\Users\7amma\.cursor\context\
□ Cursor agents configured and ready
```

---

## Day 1: Foundation & Data Pipeline

**Date:** Thursday, February 5, 2026
**Goal:** Project scaffolding + Database + Auth + Tender CRUD + File Upload
**Success Criteria:** Can register, login, upload a CSV, see tenders in a table

### Phase 1.1 — Project Scaffolding (1-2 hours)

```
Priority: 🔴 CRITICAL
Agent: senior-full-stack or project-lead
```

**Tasks:**

1. **Initialize Next.js project**
   ```bash
   pnpm create next-app@latest etmam --typescript --tailwind --eslint --app --src-dir --turbopack
   cd etmam
   ```

2. **Install core dependencies**
   ```bash
   # Database
   pnpm add @supabase/supabase-js @supabase/ssr

   # State management
   pnpm add zustand

   # Utilities
   pnpm add zod clsx tailwind-merge
   pnpm add papaparse         # CSV parsing
   pnpm add xlsx               # Excel parsing

   # AI SDKs
   pnpm add @google/generative-ai  # Gemini
   pnpm add groq-sdk               # Groq

   # Dev
   pnpm add -D @types/papaparse supabase
   ```

3. **Create folder structure** (match FRONTEND.md component tree exactly)
   ```
   src/
   ├── app/
   │   ├── layout.tsx
   │   ├── page.tsx
   │   ├── (auth)/login/page.tsx
   │   ├── (auth)/register/page.tsx
   │   └── (dashboard)/
   │       ├── layout.tsx
   │       ├── dashboard/page.tsx
   │       ├── tenders/page.tsx
   │       ├── tenders/upload/page.tsx
   │       ├── tenders/[id]/page.tsx
   │       └── settings/page.tsx
   ├── components/ui/
   ├── components/layout/
   ├── components/auth/
   ├── components/tender/
   ├── components/analysis/
   ├── components/dashboard/
   ├── components/settings/
   ├── lib/supabase/
   ├── lib/ai/
   ├── lib/utils/
   ├── stores/
   ├── types/
   └── hooks/
   ```

4. **Configure Tailwind** with design tokens from FRONTEND.md
   - Add custom colors (navy, gold, confidence, status)
   - Add custom fonts (Cairo + Noto Kufi Arabic + JetBrains Mono)
   - Add custom animations

5. **Setup Supabase clients**
   - `lib/supabase/client.ts` — Browser client
   - `lib/supabase/server.ts` — Server Component client
   - `lib/supabase/middleware.ts` — Supabase session helper used by proxy (not root middleware)

6. **Create proxy.ts** — Route protection (Next.js 16: no middleware.ts)
   - Redirect unauthenticated users to `/login`
   - Redirect authenticated users from `/login` to `/dashboard`

**Acceptance Test:**
```
✅ pnpm dev runs without errors
✅ Visiting /login shows a page (even if unstyled)
✅ Visiting /dashboard redirects to /login
✅ Tailwind custom colors work (test bg-navy-900)
```

### Phase 1.2 — Database Schema (1-2 hours)

```
Priority: 🔴 CRITICAL
Agent: senior-backend
Reference: BACKEND.md (8 tables, RLS policies)
```

**Tasks:**

1. **Create migration file** — All 8 tables from BACKEND.md
   ```bash
   npx supabase migration new initial_schema
   ```

2. **Tables to create (in order — respect foreign keys):**
   ```
   1. profiles           — extends auth.users
   2. evaluation_presets  — saved criteria configurations
   3. tenders            — core tender data
   4. evaluations        — scoring data per tender
   5. cost_items         — line items per tender
   6. rate_cards         — uploaded price lists
   7. rate_card_items    — individual prices in rate cards
   8. extraction_cache   — cached AI extractions (by hash)

   Optional (per PRD: CRM = Push to Odoo + Excel; no internal pipeline board required):
   9. export_log or tender.pushed_to_odoo_at — track what was pushed to Odoo (for duplicate detection)
   ```

3. **Enable RLS on ALL tables** — Every table gets:
   - SELECT policy: user can read own data
   - INSERT policy: user can create with their ID
   - UPDATE policy: user can update own records
   - DELETE policy: soft delete only (update deleted_at)

4. **Create triggers:**
   - `updated_at` auto-update trigger on all tables
   - Profile auto-creation on auth.users insert

5. **Create indexes** per BACKEND.md specifications

6. **Run migration:**
   ```bash
   npx supabase db push   # Cloud
   # OR
   npx supabase start && npx supabase db reset  # Local
   ```

7. **Generate TypeScript types:**
   ```bash
   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
   ```

**Acceptance Test:**
```
✅ All 8 tables visible in Supabase dashboard
✅ RLS enabled on every table (check via SQL: SELECT tablename FROM pg_tables WHERE schemaname = 'public')
✅ TypeScript types generated and importable
✅ Can insert a test row via Supabase dashboard
```

### Phase 1.3 — Authentication (1-2 hours)

```
Priority: 🔴 CRITICAL
Agent: senior-full-stack
```

**Tasks:**

1. **Build LoginForm component**
   - Email + password inputs
   - Submit button with loading state
   - Error message display
   - Link to register page
   - Styled with navy/gold design tokens

2. **Build RegisterForm component**
   - Email + password + confirm password
   - Full name field
   - Submit with loading state
   - Link to login page

3. **Create Server Actions:**
   ```typescript
   // app/actions/auth.ts
   'use server'
   export async function login(formData: FormData) { ... }
   export async function register(formData: FormData) { ... }
   export async function logout() { ... }
   ```

4. **Wire up proxy** — Protect all `/dashboard/*` routes (proxy.ts)

5. **Build Header component** — User name display + logout button

**Acceptance Test:**
```
✅ Can register a new account
✅ Can login with registered account
✅ Redirected to /dashboard after login
✅ Can logout → redirected to /login
✅ Visiting /dashboard without auth → redirected to /login
✅ Profile auto-created in profiles table
```

### Phase 1.4 — Tender Upload & List (2-3 hours)

```
Priority: 🔴 CRITICAL
Agent: senior-full-stack
```

**Tasks:**

1. **Build TenderUpload component**
   - Drag-and-drop zone (styled with dashed border, navy bg)
   - Accept `.csv`, `.xlsx`, `.xls` files
   - File size limit: 10MB
   - Parse CSV using PapaParse
   - Parse Excel using xlsx library
   - Show preview table of parsed rows (first 5 rows)
   - Validate required fields exist: title, entity_name, tender_number
   - Submit button to save all parsed tenders to DB
   - Error display for invalid rows

2. **Create CSV parser utility**
   ```typescript
   // lib/utils/csv-parser.ts
   // Input: File → Output: ParsedTender[]
   // Maps CSV columns to tender fields
   // Handles Arabic column names: عنوان المنافسة → title
   // Returns { valid: ParsedTender[], errors: ParseError[] }
   ```

3. **Create Server Action: uploadTenders**
   ```typescript
   // app/actions/tenders.ts
   'use server'
   export async function uploadTenders(tenders: CreateTenderInput[]) {
     // Validate with Zod
     // Batch insert into tenders table
     // Return { created: number, errors: string[] }
   }
   ```

4. **Build TenderTable component**
   - Columns: Title, Entity, Number, Deadline, Status, Score, Actions
   - Sortable columns (click header to sort)
   - Status badge with color coding
   - Row click → navigate to detail page
   - Empty state when no tenders

5. **Build Tenders list page** (Server Component)
   - Fetch tenders from DB
   - Pass to TenderTable client component
   - PageHeader with "Upload" button

6. **Create Zod validation schemas**
   ```typescript
   // lib/utils/validation.ts
   export const createTenderSchema = z.object({
     title: z.string().min(1).max(500),
     entity_name: z.string().min(1).max(200),
     tender_number: z.string().min(1).max(100),
     deadline: z.string().datetime().optional(),
     estimated_value: z.number().positive().optional(),
     description: z.string().optional(),
     raw_content: z.string().optional(),
   })
   ```

**Acceptance Test:**
```
✅ Can upload a CSV file with tender data
✅ CSV is parsed and preview shown before saving
✅ Tenders appear in table after upload
✅ Invalid rows show error messages
✅ Table sorts by column headers
✅ Empty state shown when no tenders exist
✅ Can click a tender row (even if detail page is empty)
```

### Day 1 — End of Day Checkpoint

```
✅ Full auth flow working (register → login → logout)
✅ Database schema deployed with RLS
✅ Can upload CSV/Excel and see tenders in table
✅ Basic layout with sidebar navigation working
✅ Design tokens applied (navy/gold theme visible)

⏱ Total Day 1: ~7-9 hours of focused coding
🛏 Before bed: Run full flow once — register, login, upload, view tenders
```

---

## Day 2: AI Brain & CRM (Odoo + Excel)

**Date:** Friday, February 7, 2026
**Goal:** AI analysis engine + Push to Odoo + Excel export (both equal per PRD)
**Success Criteria:** Can analyze a tender with AI, see scores + evidence, push to Odoo and/or export to Excel

### Phase 2.1 — AI Provider Setup (1-2 hours)

```
Priority: 🔴 CRITICAL
Agent: senior-backend + prompt-engineer
Reference: TECH-STACK.md (Gemini primary, Groq backup)
```

**Tasks:**

1. **Create AI provider factory**
   ```typescript
   // lib/ai/provider.ts
   // Reads AI_PROVIDER from env
   // Returns unified interface for both Gemini and Groq
   // Handles: sendPrompt(system, user) → string
   // Handles: errors, retries (1 retry), timeouts (30s)
   
   export interface AIProvider {
     analyze(tender: TenderForAnalysis): Promise<AIAnalysisResult>
   }
   
   export function getAIProvider(): AIProvider {
     const provider = process.env.AI_PROVIDER || 'gemini'
     if (provider === 'groq') return new GroqProvider()
     return new GeminiProvider()
   }
   ```

2. **Create Gemini provider**
   ```typescript
   // lib/ai/providers/gemini.ts
   // Uses @google/generative-ai SDK
   // Model: gemini-2.5-flash (fast, cheap, good enough)
   // Temperature: 0.3 (low creativity, high accuracy)
   // Max tokens: 2000
   ```

3. **Create Groq provider**
   ```typescript
   // lib/ai/providers/groq.ts
   // Uses groq-sdk
   // Model: llama-3.3-70b-versatile
   // Temperature: 0.3
   // Max tokens: 2000
   ```

4. **Create analysis prompt** (THE MOST IMPORTANT PIECE)
   ```typescript
   // lib/ai/prompts.ts
   export const TENDER_ANALYSIS_PROMPT = `
   You are an expert Saudi government tender analyst.
   
   TASK: Analyze this tender and provide a structured evaluation.
   
   INPUT TENDER:
   {tenderContent}
   
   SCORING WEIGHTS (user-configurable):
   - Relevance: {relevanceWeight}%
   - Budget Fit: {budgetWeight}%
   - Timeline Feasibility: {timelineWeight}%
   - Competition Level: {competitionWeight}%
   - Strategic Alignment: {strategicWeight}%
   
   OUTPUT FORMAT (JSON only, no markdown):
   {
     "overall_score": <0-100>,
     "confidence": "<high|medium|low>",
     "scores": {
       "relevance": { "score": <0-100>, "reasoning": "<1-2 sentences>" },
       "budget_fit": { "score": <0-100>, "reasoning": "<1-2 sentences>" },
       "timeline": { "score": <0-100>, "reasoning": "<1-2 sentences>" },
       "competition": { "score": <0-100>, "reasoning": "<1-2 sentences>" },
       "strategic": { "score": <0-100>, "reasoning": "<1-2 sentences>" }
     },
     "evidence": [
       { "text": "<exact quote from tender>", "relevance": "<supporting|concerning|neutral>", "source": "<section reference>" }
     ],
     "recommendation": "<pursue|review|skip>",
     "recommendation_reasoning": "<2-3 sentences>",
     "red_flags": ["<list of concerns if any>"],
     "key_dates": ["<extracted deadlines>"]
   }
   
   RULES:
   - Score MUST reflect the weighted criteria above
   - Evidence MUST be direct quotes from the tender text
   - If you cannot find evidence for a score, set confidence to "low"
   - Do NOT invent information not present in the tender
   - If tender is too short or unclear, say so in recommendation_reasoning
   `
   ```

5. **Create AI response parser**
   ```typescript
   // lib/ai/parser.ts
   // Input: raw AI string → Output: typed AIAnalysisResult
   // Handles: JSON extraction from markdown blocks
   // Handles: validation with Zod schema
   // Handles: fallback if parsing fails → { error: true, raw: string }
   ```

**Acceptance Test:**
```
✅ Can call Gemini API and get a response
✅ Can call Groq API and get a response
✅ Switching AI_PROVIDER env var switches the provider
✅ Response parses into typed AIAnalysisResult
✅ Invalid AI responses are caught and return error state
```

### Phase 2.2 — Analysis Server Action & UI (2-3 hours)

```
Priority: 🔴 CRITICAL
Agent: senior-full-stack
```

**Tasks:**

1. **Create analyzeTender Server Action**
   ```typescript
   // app/actions/analyze.ts
   'use server'
   export async function analyzeTender(tenderId: string) {
     // 1. Auth check
     // 2. Fetch tender from DB
     // 3. Fetch scoring weights from settings
     // 4. Build prompt with tender content + weights
     // 5. Call AI provider
     // 6. Parse response
     // 7. Save analysis to tender_analyses table
     // 8. Save evidence quotes to analysis_evidence table
     // 9. Update tender status to 'scored'
     // 10. Return analysis result
   }
   ```

2. **Create analyzeBulk Server Action** (analyze multiple tenders)
   ```typescript
   // Process sequentially (not parallel — API rate limits)
   export async function analyzeBulk(tenderIds: string[]) { ... }
   ```

3. **Build ScoreGauge component**
   - Circular SVG gauge, 0-100
   - Color: red → amber → green based on score
   - Animated fill on mount
   - Center: score number + confidence badge

4. **Build ScoreBreakdown component**
   - Horizontal bar for each category
   - Score label + bar + number
   - Color-coded bars

5. **Build EvidenceQuotes component**
   - List of quoted text with source reference
   - Color-coded by relevance (green/amber/red)
   - Collapsible (show 3, expand for more)

6. **Build RecommendationCard component**
   - Big recommendation: PURSUE / REVIEW / SKIP
   - Color-coded (green/amber/red)
   - Reasoning text below
   - Red flags list (if any)

7. **Build AnalysisPanel component**
   - Combines: ScoreGauge + ScoreBreakdown + EvidenceQuotes + RecommendationCard
   - Shows "AI-generated, pending human review" disclaimer
   - Shows AI provider used (Gemini/Groq)
   - Shows analysis timestamp

8. **Build AnalyzeButton component**
   - Button with loading state (spinner + "Analyzing...")
   - Disabled while processing
   - Shows "Re-analyze" if already analyzed

9. **Build Tender Detail page** (`tenders/[id]/page.tsx`)
   - Two-panel layout: Tender info (left) + Analysis (right)
   - If not analyzed: show AnalyzeButton
   - If analyzed: show full AnalysisPanel

**Acceptance Test:**
```
✅ Click "Analyze" on a tender → shows loading state
✅ Analysis completes → ScoreGauge shows score with correct color
✅ Score breakdown shows all 5 categories
✅ Evidence quotes display actual text from tender
✅ Recommendation shows PURSUE/REVIEW/SKIP
✅ "AI-generated" disclaimer visible
✅ Re-analyze button works (creates new analysis)
✅ Bulk analyze from tender list works
```

### Phase 2.3 — Export & Odoo (6A + 6B per PRD) (2-3 hours)

```
Priority: 🔴 CRITICAL
Agent: senior-full-stack
Reference: PRD §6A (Excel), §6B (Push to Odoo) — both equal features
```

**Tasks:**

1. **Export tab on Tender Detail** (`tenders/[id]` — Export tab)
   - Two equal actions: "تحميل Excel" (Download Excel) and "إرسال إلى Odoo" (Push to Odoo)
   - Per PRD: both are required features; neither is fallback

2. **Excel export (6A)**
   - API route: POST `/api/export/excel` (or Server Action)
   - 3 sheets: Tender Overview, Evaluation Details, Cost Breakdown
   - Arabic headers; file name `Etmam_[TenderNumber]_[Date].xlsx`
   - Works standalone (no Odoo required)

3. **Push to Odoo (6B)**
   - API route: POST `/api/export/odoo` (or Server Action)
   - .env: ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY
   - Map all 7 required CRM fields to Odoo opportunity (crm.lead)
   - Connection test (e.g. GET /api/settings/odoo/test)
   - Duplicate detection by tender number; warn if exists
   - On failure: show message; Excel export still available (equal feature)

4. **Build ExportTab component**
   - Section "تصدير Excel" with [📥 تحميل Excel]
   - Section "إرسال إلى Odoo CRM" with [🚀 إرسال إلى Odoo]
   - If Odoo not configured: show "لم يتم إعداد Odoo" + link to settings + [تحميل Excel بدلاً]

5. **Build CRMFieldMapping display** (for Odoo push preview)
   - Table: CRM Field (Arabic) → Value (الجهة, عنوان المنافسة, رقم المنافسة, الموعد النهائي, قيمة تقديرية, درجة التقييم, التوصية + سعر العرض)

6. **Dashboard / Tender list batch actions**
   - "Export All" (Excel) and "Push All Qualified" (Odoo, only tenders scored 70+)
   - Per PRD 6A/6B acceptance criteria

**Acceptance Test:**
```
✅ "Export to Excel" downloads .xlsx with 3 sheets and Arabic headers
✅ "Push to Odoo" creates opportunity in Odoo when .env configured
✅ Connection test shows clear message if Odoo not configured
✅ Duplicate detection warns when tender number already in Odoo
✅ All 7 required CRM fields mapped; success confirmation shown
✅ If Odoo push fails, user can still use Excel export (both equal)
```

### Day 2 — End of Day Checkpoint

```
✅ AI analysis works end-to-end (upload → analyze → see scores)
✅ Evidence quotes display real text from tenders
✅ Anti-hallucination indicators visible (confidence, disclaimer)
✅ Export tab: Excel download and Push to Odoo both work (per PRD 6A+6B)
✅ All 7 required CRM fields populated in Excel and in Odoo when pushed

⏱ Total Day 2: ~7-9 hours of focused coding
🛏 Before bed: FULL DEMO RUN — upload CSV/Excel or PDF → evaluate → export Excel + push to Odoo
    Record any bugs for Day 3 morning fixes
```

### Phase 2.4 — PDF Upload with AI Extraction (2-3 hours)

```
Priority: 🔴 CRITICAL (P0 — per PRD, PDF equally important with CSV/Excel)
Agent: senior-backend + prompt-engineer
```

**Tasks:**

1. **Update TenderUpload component** — Accept `.pdf` in dropzone (with .csv/.xlsx). Max 20MB. PDF: file info + "Extract with AI" button; CSV/Excel: table preview.
2. **Create API route: /api/ai/extract** — FormData with PDF; buffer → base64 → Gemini; parse JSON; return structured extraction (see BACKEND.md).
3. **Build PDFExtractionPreview component** — Editable extracted fields; confidence per field (color-coded); evidence quotes (collapsible); "AI-generated, please review"; "Save Tender" → creates tender.
4. **Extraction prompt** — Target 12-section template (TENDER-STRUCTURE-v3.0-VERIFIED.md). Return confidence, evidence, warnings.
5. **Validation layer** — Date formats; tender_number not a page number; flag confidence <70%.

**Acceptance Test:** Upload PDF → "Extract with AI" → loading → editable preview with confidence/evidence → edit → save. Arabic PDFs. Graceful failure → manual entry.

---

## Day 3: Polish, Dashboard & Demo Prep

**Date:** Saturday, February 8, 2026
**Goal:** Dashboard, settings, visual polish, documentation, demo rehearsal
**Success Criteria:** Demo-ready product that can be presented confidently

### Phase 3.1 — Bug Fixes from Day 2 Demo Run (1 hour)

```
Priority: 🔴 CRITICAL
Agent: senior-full-stack
```

**Fix whatever broke during last night's demo run. Common issues:**
- Auth redirect loops
- CSV parsing edge cases (empty rows, special characters, Arabic text)
- AI response parsing failures
- RLS policy blocking expected queries
- UI layout breaks on different screen sizes

### Phase 3.2 — Dashboard Page (1-2 hours)

```
Priority: 🟡 HIGH
Agent: senior-frontend
```

**Tasks:**

1. **Build StatCard component**
   - Big number + label + trend indicator
   - Variants: default (navy), highlight (gold border)

2. **Build StatsRow component** — 4 StatCards:
   - Total Tenders (count from DB)
   - Analyzed (count with analysis)
   - Average Score (mean of all scores)
   - Pushed to CRM (count with push logs)

3. **Build RecentTenders component**
   - Last 5 uploaded tenders
   - Quick status badge
   - "View All →" link

4. **Build ExportStatusSummary component** (optional)
   - Counts: e.g. tenders exported to Excel, pushed to Odoo (if tracked)
   - Or: simple status badges (new, evaluated, costed)

5. **Build ScoreDistribution component**
   - Simple bar chart using CSS (no charting library)
   - 4 buckets: 0-25, 26-50, 51-75, 76-100
   - Shows count in each bucket

6. **Dashboard page assembly** — Grid layout per FRONTEND.md wireframe

**Acceptance Test:**
```
✅ Dashboard shows correct stats from actual data
✅ Stats update after uploading/analyzing tenders
✅ Recent tenders list is clickable
✅ Score distribution chart renders correctly
✅ Page loads in under 2 seconds
```

### Phase 3.3 — Settings Page (1 hour)

```
Priority: 🟡 HIGH
Agent: senior-full-stack
```

**Tasks:**

1. **Build AIProviderConfig component**
   - Toggle switch: Gemini ↔ Groq
   - Shows current model name
   - Test connection button (calls API with simple prompt)
   - Saves to settings store (persisted via Zustand persist)

2. **Build ScoringWeights component**
   - 5 sliders (or number inputs): Relevance, Budget, Timeline, Competition, Strategic
   - Must sum to 100% (or be weighted proportionally)
   - Live preview of weight distribution
   - Reset to defaults button

3. **Settings page assembly** — Tabbed layout: AI Config | Scoring | Profile

**Acceptance Test:**
```
✅ Can switch AI provider → next analysis uses new provider
✅ Scoring weights adjustable → next analysis reflects new weights
✅ Settings persist across page refreshes (localStorage via Zustand)
```

### Phase 3.4 — Visual Polish (1-2 hours)

```
Priority: 🟡 HIGH
Agent: senior-frontend + art-director
```

**Tasks:**

1. **Sidebar polish**
   - Etmam logo/wordmark at top (text-based is fine)
   - Active state: gold left border + lighter background
   - Icons for each nav item (use Lucide icons — already in Next.js)
   - Collapse to icon-only on small screens

2. **Table polish**
   - Hover row highlighting
   - Alternating row backgrounds (subtle)
   - Sticky header
   - Loading skeletons (3-4 animated rows)

3. **Score gauge animation**
   - Smooth fill animation on mount
   - Color transition feels professional

4. **Toast notifications**
   - Positioned bottom-right
   - Slide-in animation
   - Auto-dismiss with progress bar

5. **Empty states**
   - "No tenders yet" → Upload CTA
   - "Not analyzed yet" → Analyze CTA
   - Simple text-based (no illustrations needed for MVP)

6. **Overall theme consistency check**
   - All backgrounds use navy palette
   - All accents use gold
   - All status badges use consistent colors
   - No default white backgrounds anywhere

### Phase 3.3 — Landing Page (1-2 hours)

```
Priority: 🟡 HIGH
Agent: senior-frontend + art-director
```

**Tasks:**

1. **Build landing page at `/` (public, no auth required)**
   - Presentation-style page for competition judges
   - NOT a typical SaaS marketing page — this is a pitch deck in a webpage

2. **Sections to build (in order, top to bottom):**
   - HeroSection: Logo (إتمام), Arabic tagline, "Login" + "Register" CTAs
   - ProblemStatement: The manual tender problem in Saudi government
   - SolutionOverview: 3-step visual (Upload → AI Analysis → CRM Push)
   - FeatureHighlights: 4-5 key features with icons
   - TechStack: Technology badges (Next.js, Gemini, Supabase, etc.)
   - CTAFooter: Final call to action with login/register buttons

3. **Routing logic in root page.tsx:**
   - If user is authenticated → redirect to /dashboard
   - If not authenticated → show landing page

4. **Design:** Use navy + gold palette. Professional, not flashy. Arabic-first text.

**Acceptance Test:**
```
✅ Landing page loads at / without authentication
✅ All 6 sections render with real content
✅ Login/Register buttons navigate to auth pages
✅ Authenticated users redirected to /dashboard
✅ Page looks like a competition presentation, not a SaaS landing
```

### Phase 3.5 — Documentation (1 hour)

```
Priority: 🔴 CRITICAL (judges score this!)
Agent: tech-writer
```

**Tasks:**

1. **Create README.md** with:
   ```markdown
   # Etmam — AI-Powered Tender Management
   
   ## What It Does
   [2-3 sentence description]
   
   ## Quick Start
   1. Clone repository
   2. Copy .env.example → .env.local
   3. Add your API keys (Gemini + Groq + Supabase)
   4. pnpm install
   5. pnpm dev
   6. Open http://localhost:3000
   
   ## Environment Variables
   [Table of all env vars with descriptions]
   
   ## Features
   - Upload tenders (CSV/Excel and PDF — both P0)
   - AI-powered scoring with confidence levels
   - Evidence-based analysis (anti-hallucination)
   - Push to Odoo + Excel export (both equal, per PRD)
   - Adjustable scoring weights
   - Multi-provider AI (Gemini + Groq)
   
   ## Tech Stack
   [Brief list with versions]
   
   ## Architecture
   [Simple diagram or description]
   
   ## Security
   - Supabase Auth (email/password)
   - Row Level Security on all tables
   - Server-side validation (Zod)
   - No client-side secrets
   
   ## Competition Requirements Met
   ✅ Data ingestion (CSV/Excel)
   ✅ Scoring & evaluation (AI-powered, 0-100, adjustable)
   ✅ CRM integration (Odoo push + Excel export, field mapping)
   ✅ User interface (dashboard + tender management)
   ✅ Documentation (this file)
   ✅ Security (auth + RLS + validation)
   ```

2. **Create .env.example** — All variables with placeholder values

3. **Add inline code comments** on:
   - AI prompt (why each section exists)
   - RLS policies (what they protect)
   - Scoring algorithm (how weights work)

### Phase 3.6 — Demo Preparation (1-2 hours)

```
Priority: 🔴 CRITICAL
Agent: YOU (Hammad) — not the AI
```

**Tasks:**

1. **Prepare demo data**
   - Create 10-15 realistic Saudi government tenders in CSV
   - Mix of high-score, medium-score, and low-score tenders
   - Include Arabic entity names and tender titles
   - Include varying deadlines and budget ranges

2. **Script the demo flow** (5-minute presentation):
   ```
   0:00 — "This is Etmam — AI-powered tender management"
   0:30 — Register/login (show auth works)
   1:00 — Upload CSV with 10 tenders
   1:30 — Show tenders in table, point out Arabic support
   2:00 — Analyze single tender → show score, evidence, recommendation
   2:30 — Show scoring breakdown + anti-hallucination features
   3:00 — Bulk analyze remaining tenders
   3:30 — Show Export tab: Excel download + Push to Odoo (both equal)
   4:00 — Push to Odoo → show field mapping with Arabic labels; or download Excel
   4:30 — Show settings (switch AI provider, adjust weights)
   5:00 — Dashboard overview → "Questions?"
   ```

3. **Rehearse demo 3 times**
   - Once for flow
   - Once for timing
   - Once for catching bugs

4. **Prepare backup plan**
   - If Gemini API is down → switch to Groq (show this as a feature!)
   - If upload fails → have pre-loaded data in DB
   - If Odoo push fails → show message; Excel export always available (equal feature)
   - Screenshot/screen recording as last resort

5. **Deploy to Vercel** (or local for demo)
   ```bash
   vercel deploy --prod
   ```

### Day 3 — End of Day Checkpoint

```
✅ Dashboard with real stats
✅ Settings with AI provider toggle + scoring weights
✅ All UI polished with navy/gold theme
✅ README.md complete with setup instructions
✅ Demo data prepared (realistic Saudi tenders)
✅ Demo rehearsed at least twice
✅ Backup plan for every failure mode
✅ Deployed and accessible

⏱ Total Day 3: ~6-8 hours
🎯 READY FOR SUNDAY DEMO
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Gemini API rate limited | Medium | High | Groq backup, pre-analyzed cache |
| CSV parsing fails on Arabic | Medium | Medium | Test with Arabic CSV Day 1 evening |
| RLS blocks needed queries | High | High | Test every query after writing policies |
| AI returns invalid JSON | High | Medium | Robust parser with fallback display |
| Supabase local issues | Low | High | Have cloud project as backup |
| Demo computer issues | Low | Critical | Deploy to Vercel, demo from any browser |
| Run out of time | Medium | Critical | Cut settings page first, then charts |

---

## What to Cut if Behind Schedule

**Cut in this order (last = most expendable):**

1. ~~Reports page~~ — Already a stretch goal, don't even start
2. ~~Keyboard shortcuts~~ — Nice but unnecessary
3. ~~Drag-and-drop pipeline~~ — N/A; Export tab (Odoo + Excel) per PRD
4. ~~Score distribution chart~~ — Replace with simple text stats

**P0 — NEVER cut (includes locked decisions):**
- Auth (competition requirement)
- CSV upload + tender display (core feature)
- AI analysis with scores (core differentiator)
- CRM push with field mapping (competition requirement)
- Anti-hallucination indicators (key differentiator)
- Documentation/README (judges score this)
- Dashboard with full widgets (locked P0 decision)
- Settings page with AI toggle + scoring weights (locked P0 decision)

---

## Cursor Agent Assignments

| Task | Primary Agent | Backup |
|------|--------------|--------|
| Project scaffolding | project-lead | senior-full-stack |
| Database schema | senior-backend | senior-full-stack |
| Auth flow | senior-full-stack | senior-backend |
| CSV parser | senior-backend | senior-full-stack |
| AI providers | senior-backend | prompt-engineer |
| Analysis prompt | prompt-engineer | senior-backend |
| Tender components | senior-frontend | senior-full-stack |
| Export tab (Odoo + Excel) | senior-full-stack | senior-frontend |
| Dashboard widgets | senior-frontend | senior-full-stack |
| Settings page | senior-full-stack | senior-frontend |
| Design polish | art-director | senior-frontend |
| Documentation | tech-writer | project-lead |
| Code review | code-reviewer | gotcha |
| Final QA | qa-engineer | gotcha |

---

## Daily Schedule Template

```
Morning (first 30 min):
  □ Review yesterday's checkpoint
  □ Fix any bugs from last night's test
  □ Plan today's phases in order

Coding blocks (2-hour sprints):
  □ Sprint 1: [Phase X.Y]
  □ Sprint 2: [Phase X.Y]
  □ Sprint 3: [Phase X.Y]
  □ Sprint 4: [Phase X.Y] (if energy remains)

Evening (last 30 min):
  □ Run full demo flow end-to-end
  □ Note any bugs or issues
  □ Commit and push to git
  □ Write tomorrow's first task on a sticky note
```

---

## Cross-Reference

| Document | How It Feeds Implementation |
|----------|----------------------------|
| **PRD.md** | **Source of truth.** Acceptance criteria, features (all P0), CRM = Odoo + Excel, input = CSV/Excel + PDF. See PRD-SOT-MAP.md. |
| IDEA.md | Demo script narrative, README description |
| APP-FLOW.md | Page routing, user journey validation |
| TECH-STACK.md | Exact libraries, versions, configuration |
| BACKEND.md | Migration SQL, RLS policies, API contracts |
| FRONTEND.md | Component specs, design tokens, store definitions |
