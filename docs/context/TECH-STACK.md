# Etmam 2.0 — Tech Stack

## Document Info
- **Version:** 2.0
- **Last Updated:** February 5, 2026
- **Reference:** See IDEA.md, PRD.md, APP-FLOW.md

---

## 1. Stack Overview

```
┌─────────────────────────────────────────────────┐
│                    FRONTEND                      │
│  Next.js 16.1 (App Router) + TypeScript          │
│  Custom Design System (NOT generic AI slob)      │
│  Custom Components (Radix patterns) + Tailwind CSS + RTL │
│  Zustand (state) + React Hook Form + Zod         │
├─────────────────────────────────────────────────┤
│                   BACKEND                        │
│  Next.js API Routes (serverless)                 │
│  Supabase LOCAL (dev) → User's own cloud (prod)  │
│  Supabase Auth (basic auth — competition req)    │
├─────────────────────────────────────────────────┤
│                 INTEGRATIONS                     │
│  Google Gemini 2.5 Flash (AI extraction)         │
│  → Via AI Studio FREE tier (no Cloud billing)    │
│  Odoo XML-RPC API (CRM push)                     │
│  SheetJS (Excel read/write)                      │
├─────────────────────────────────────────────────┤
│               DEPLOYMENT / HANDOVER              │
│  Vercel (frontend + API routes)                  │
│  Supabase: User configures own instance via .env │
│  All cloud services: .env configurable           │
└─────────────────────────────────────────────────┘
```

---

## 2. Frontend

### Next.js 16.1 (App Router)
**What:** React meta-framework with server-side rendering, API routes, and file-based routing.
**Why:**
- You know it — zero learning curve in a 3-day sprint
- App Router gives us Server Components (faster page loads for the demo)
- API routes = no separate backend needed
- Built-in file-based routing matches our page map exactly
- Vercel deployment in minutes
- Turbopack stable by default (faster dev builds)

**Version:** 16.1.x (latest stable as of Feb 2026)

**Key Config:**
```javascript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // RTL support
  i18n: {
    locales: ['ar'],
    defaultLocale: 'ar',
  },
  // React Compiler for auto-memoization (optional, increases build time)
  // reactCompiler: true,
}

export default nextConfig
```

### TypeScript
**What:** Type-safe JavaScript.
**Why:** Catches bugs at build time. Critical when moving fast — types prevent the stupid mistakes that cost hours debugging.

**Strict mode:** Yes. `"strict": true` in tsconfig.json.

### Custom UI Components (Radix-Inspired)
**What:** Custom-built component library inspired by Radix UI patterns. NOT using shadcn/ui as a dependency.
**Why:**
- Not a dependency — components live in your codebase
- Fully customizable, works with Tailwind
- RTL-compatible out of the box (Radix primitives support direction)
- Starting point only — we CUSTOMIZE heavily (see Design Philosophy below)
- Cursor agents already know it from your .cursorrules

**Components we'll use:**
| Component | Where |
|---|---|
| Button | Everywhere |
| Card | Dashboard stats, summary cards |
| Table | Tender list, cost items, rate cards |
| Tabs | Tender detail, settings, upload page |
| Dialog / Sheet | Criteria editor, confirmations |
| Input / Textarea | Forms, inline editing |
| Select | Dropdowns, filters |
| Slider | Evaluation scores, profit margin, weights |
| Badge | Score badges (🟢🟡🔴), source labels |
| Toast | Success/error notifications |
| Skeleton | Loading states |
| Alert | Error messages, warnings |
| Progress | AI extraction loading |
| DropZone | File upload areas (custom, uses react-dropzone) |

---

## 2.5 UI Design Philosophy — NO GENERIC AI SLOB

**Critical requirement from Hammad:** This must NOT look like every other AI app. No gradient backgrounds, no floating chat bubbles, no "thinking..." spinners with pulsing dots, no purple-to-blue gradients, no generic sans-serif minimalism.

### Design Principles

**1. Business Tool, Not AI Toy**
- Looks like a professional enterprise dashboard, not a consumer AI product
- Dense information display (tables, numbers, data) — not big empty cards
- Functional UI — every pixel serves a purpose

**2. Saudi Professional Aesthetic**
- Clean, serious, trustworthy
- RTL-first — Arabic text is primary, not an afterthought
- Deep blues, warm neutrals, gold accents (not tech purple/cyan)
- Typography: 
  - Arabic: Noto Kufi Arabic (traditional Kufic, professional)
  - English/Numbers: Cairo (clean, modern, Arabic-friendly Latin)

**3. Custom Color Palette (NOT shadcn defaults)**
```css
:root {
  /* Primary — Deep Navy (trust, professionalism) */
  --primary: 222 47% 20%;
  --primary-foreground: 0 0% 98%;
  
  /* Secondary — Warm Sand (Saudi desert, warmth) */
  --secondary: 35 30% 90%;
  --secondary-foreground: 222 47% 20%;
  
  /* Accent — Gold (success, achievement, Saudi flag) */
  --accent: 45 93% 47%;
  --accent-foreground: 222 47% 20%;
  
  /* Muted backgrounds */
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  
  /* Semantic colors */
  --success: 142 71% 45%;      /* Green — موصى بها */
  --warning: 38 92% 50%;       /* Amber — مراجعة */
  --danger: 0 84% 60%;         /* Red — تجاوز */
  
  /* Cards and surfaces */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 15%;
  --border: 220 13% 91%;
}

/* Dark theme */
[data-theme="dark"] {
  --primary: 210 50% 10%;
  --primary-foreground: 210 20% 95%;

  --secondary: 35 15% 20%;
  --secondary-foreground: 35 30% 90%;

  --accent: 45 93% 47%;
  --accent-foreground: 210 50% 10%;

  --muted: 215 20% 16%;
  --muted-foreground: 215 15% 60%;

  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --danger: 0 84% 60%;

  --card: 210 50% 12%;
  --card-foreground: 210 20% 90%;
  --border: 215 20% 25%;
}
```

**4. Distinctive UI Patterns**
- **Score display:** Large numeric with Arabic label, not progress bars
- **Tables:** Zebra striping, sticky headers, inline actions on hover
- **Cards:** Subtle shadows, 1px borders, no rounded-3xl blobs
- **Buttons:** Solid fills, clear hierarchy (primary/secondary/ghost)
- **Forms:** Labels above inputs (better for Arabic), clear validation states
- **Empty states:** Helpful illustrations, not sad face emojis

**5. What We Avoid (Generic AI Slob)**
❌ Gradient backgrounds (purple-to-blue, pink-to-orange)
❌ Floating chat bubbles / conversational UI
❌ "Thinking..." with bouncing dots
❌ Glassmorphism / blur effects
❌ Oversized rounded corners (rounded-3xl)
❌ Animated gradient borders
❌ Minimalist empty designs with too much whitespace
❌ Generic hero sections with "Powered by AI" taglines

**6. What We Build (Professional Dashboard)**
✅ Dense data tables with sorting/filtering
✅ Clear visual hierarchy with proper headings
✅ Inline editing without modal popups
✅ Summary cards with actual numbers (not just icons)
✅ Breadcrumb navigation
✅ Consistent iconography (Lucide icons)
✅ Form validation inline (not just toast notifications)
✅ Dual theme — dark and light mode with user toggle

### Tailwind CSS
**What:** Utility-first CSS framework.
**Why:** Fast styling, consistent spacing, responsive, works perfectly with shadcn/ui.

**RTL Setup:**
```javascript
// tailwind.config.js
{
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Noto Kufi Arabic', 'sans-serif'],  // Cairo for English, Kufi for Arabic
        kufi: ['Noto Kufi Arabic', 'sans-serif'],           // Pure Arabic
      }
    }
  },
  plugins: [
    require('tailwindcss-rtl'), // adds rtl: and ltr: variants
  ]
}
```

**Fonts:** 
- Cairo — clean, modern, excellent for numbers and English text
- Noto Kufi Arabic — traditional Kufic style for Arabic text
Load both via Google Fonts.

### Zustand
**What:** Lightweight state management.
**Why:**
- Simpler than Redux — one file, no boilerplate
- Perfect for MVP scope
- Handles our global state: tenders, rate cards, evaluation presets, Odoo config
- Works with Next.js App Router (no provider wrapping issues)

**Alternative considered:** React Context — rejected because it re-renders too aggressively for our cost calculator real-time updates.

**Store structure:**
```typescript
// stores/app-store.ts
interface AppStore {
  tenders: Tender[]
  rateCards: RateCard[]
  evaluationPresets: EvaluationPreset[]
  odooConfig: OdooConfig | null
  activePresetId: string | null
  
  // Actions
  addTender: (tender: Tender) => void
  updateTender: (id: string, data: Partial<Tender>) => void
  addRateCard: (rateCard: RateCard) => void
  removeRateCard: (id: string) => void
  setOdooConfig: (config: OdooConfig) => void
  // ... etc
}
```

### React Hook Form + Zod
**What:** Form handling + schema validation.
**Why:**
- React Hook Form = performant forms with minimal re-renders (important for cost table inline editing)
- Zod = type-safe validation that generates TypeScript types
- Together they give us validated forms with zero boilerplate

**Where used:**
- Manual tender entry form
- Settings forms (Odoo config)
- Inline editing in cost table
- Rate card upload label form

### react-dropzone
**What:** File drag-and-drop library.
**Why:** Clean drag-and-drop upload UX. Small library, well maintained, handles file type validation.

**Where used:** All upload areas (CSV/Excel, PDF, rate cards)

---

## 3. Backend

### Next.js API Routes
**What:** Serverless API endpoints inside the Next.js app.
**Why:**
- No separate backend to deploy or maintain
- Same codebase, same deployment
- Automatic serverless scaling on Vercel
- TypeScript end-to-end

**Route structure:**
```
/app/api/
├── tenders/
│   ├── route.ts              GET (list) / POST (create)
│   ├── [id]/route.ts         GET / PUT / DELETE (single tender)
│   └── import/route.ts       POST (CSV/Excel import)
├── ai/
│   └── extract/route.ts      POST (PDF → Gemini extraction)
├── evaluation/
│   ├── route.ts              POST (calculate score)
│   └── presets/route.ts      GET / POST / DELETE (criteria presets)
├── costs/
│   ├── route.ts              POST (generate cost items)
│   └── match/route.ts        POST (rate card matching)
├── rate-cards/
│   ├── route.ts              GET (list) / POST (upload)
│   └── [id]/route.ts         DELETE (remove)
├── export/
│   ├── excel/route.ts        POST (generate Excel)
│   └── odoo/route.ts         POST (push to Odoo)
└── settings/
    └── odoo/
        ├── route.ts           GET / PUT (config)
        └── test/route.ts      POST (test connection)
```

### Supabase (Local Dev + User-Configured Cloud)
**What:** Open-source Firebase alternative — PostgreSQL database, file storage, auth, real-time.
**Why:**
- You know it well — zero learning curve
- Local development with Supabase CLI (no cloud dependency during dev)
- User configures their own Supabase instance via .env at deployment
- PostgreSQL = proper relational database for tender data
- Storage for uploaded PDFs and rate card files
- RLS for security (competition requirement)
- **Auth included** (competition requirement: basic auth to protect users)

**Development Approach: LOCAL FIRST**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in project
supabase init

# Start local Supabase (PostgreSQL, Auth, Storage — all local)
supabase start

# Local dashboard at http://localhost:54323
# Local API at http://localhost:54321
```

**We use:**
| Supabase Feature | What For |
|---|---|
| PostgreSQL | All structured data (tenders, evaluations, costs, rate cards) |
| Storage | PDF uploads, rate card source files |
| RLS | Row-level security on all tables (competition security requirement) |
| Auth | Basic email/password auth (competition requirement) |

**Auth Implementation (Basic — Competition Requirement):**
- Email/password signup and login
- Protected routes (proxy checks session)
- User ID attached to all data (RLS enforced)
- Logout functionality
- No OAuth/social login for MVP (keeps it simple)

**Handover Configuration (.env for user's own Supabase):**
```bash
# User provides their own Supabase instance at deployment
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Setup Guide includes:**
1. Create free Supabase project at supabase.com
2. Run our migration SQL to create tables
3. Copy URL and keys to .env
4. Deploy to Vercel

**Supabase Client Setup:**
```typescript
// lib/supabase/client.ts — browser client
// lib/supabase/server.ts — server client (API routes)
// lib/supabase/middleware.ts — session refresh helper for proxy
```

---

## 4. AI Integration

### Google Gemini 2.5 Flash (via AI Studio — NOT Google Cloud)
**What:** Google's fast, multimodal AI model.
**Why:**
- **Free tier via AI Studio:** Separate from GCP billing — your $200 debt won't affect this
- **Arabic PDF native:** Handles Arabic text extraction natively, including scanned docs
- **Multimodal:** Accepts PDF files directly — no preprocessing needed
- **Fast:** Flash model is optimized for speed (< 10s for most documents)
- **Structured output:** Supports JSON mode for clean extraction

**IMPORTANT — AI Studio vs Google Cloud:**
- Get your API key from **ai.google.dev** (AI Studio), NOT console.cloud.google.com
- AI Studio free tier is separate billing — your GCP debt doesn't block it
- Free tier: 15 RPM, 1500 requests/day — plenty for demo

**Model:** `gemini-2.5-flash-preview-05-20` (latest as of Feb 2026)

**API Setup:**
```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash-preview-05-20',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.1,  // LOW temperature = less creative = less hallucination
  }
})
```

---

### Anti-Hallucination Strategy (CRITICAL)

The AI must NEVER invent information. We use a **deterministic extraction + human verification** approach:

**1. Constrained JSON Schema Output**
```typescript
// Force AI to output ONLY these fields — nothing more
const extractionSchema = z.object({
  entity: z.string().nullable(),              // null if not found
  tender_title: z.string().nullable(),
  tender_number: z.string().nullable(),
  deadline: z.string().nullable(),            // ISO date or null
  estimated_value: z.number().nullable(),
  
  // Confidence scores per field (0-100)
  confidence: z.object({
    entity: z.number(),
    tender_title: z.number(),
    tender_number: z.number(),
    deadline: z.number(),
    estimated_value: z.number(),
  }),
  
  // Raw quotes from document that support each extraction
  evidence: z.object({
    entity: z.string().nullable(),
    tender_title: z.string().nullable(),
    tender_number: z.string().nullable(),
    deadline: z.string().nullable(),
    estimated_value: z.string().nullable(),
  }),
  
  // Line items (if found)
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    confidence: z.number(),
  })),
  
  // What the AI couldn't find
  not_found: z.array(z.string()),
  
  // Overall extraction quality
  overall_confidence: z.number(),
  warnings: z.array(z.string()),
})
```

**2. Extraction Prompt (Anti-Hallucination)**
```typescript
const EXTRACTION_PROMPT = `
أنت مستخرج بيانات دقيق. استخرج المعلومات من وثيقة المنافسة المرفقة.

قواعد صارمة:
1. استخرج فقط المعلومات الموجودة فعلياً في الوثيقة
2. إذا لم تجد معلومة، اكتب null — لا تخمن أبداً
3. لكل حقل، اذكر النص الأصلي من الوثيقة كدليل
4. أعطِ درجة ثقة (0-100) لكل حقل
5. إذا كانت المعلومة غير واضحة أو متناقضة، اذكر ذلك في warnings
6. لا تُضف أي معلومات من خارج الوثيقة
7. لا تُكمل الأرقام الناقصة أو التواريخ الجزئية

المخرجات المطلوبة (JSON):
- entity: اسم الجهة الحكومية (أو null)
- tender_title: عنوان المنافسة (أو null)
- tender_number: رقم المنافسة (أو null)  
- deadline: الموعد النهائي بصيغة YYYY-MM-DD (أو null)
- estimated_value: القيمة التقديرية بالريال (رقم فقط، بدون فواصل) (أو null)
- confidence: درجة ثقة لكل حقل (0-100)
- evidence: النص الأصلي من الوثيقة لكل حقل
- line_items: البنود والكميات إن وجدت
- not_found: قائمة الحقول التي لم يتم العثور عليها
- overall_confidence: درجة الثقة الإجمالية
- warnings: أي ملاحظات أو تحذيرات

أجب بـ JSON فقط، بدون أي نص إضافي.
`
```

**3. Post-Extraction Validation (Deterministic)**
```typescript
// lib/extraction-validator.ts
function validateExtraction(result: ExtractionResult): ValidationResult {
  const issues: string[] = []
  
  // Date validation
  if (result.deadline) {
    const date = new Date(result.deadline)
    if (isNaN(date.getTime())) {
      issues.push('التاريخ غير صالح')
      result.deadline = null
    }
    if (date < new Date()) {
      issues.push('الموعد النهائي في الماضي — تحقق من السنة')
    }
  }
  
  // Value validation
  if (result.estimated_value !== null) {
    if (result.estimated_value < 1000) {
      issues.push('القيمة منخفضة جداً — قد تكون بالآلاف')
    }
    if (result.estimated_value > 10_000_000_000) {
      issues.push('القيمة مرتفعة جداً — تحقق من الأصفار')
    }
  }
  
  // Confidence thresholds
  const LOW_CONFIDENCE_THRESHOLD = 70
  for (const [field, score] of Object.entries(result.confidence)) {
    if (score < LOW_CONFIDENCE_THRESHOLD) {
      issues.push(`ثقة منخفضة في ${field}: ${score}%`)
    }
  }
  
  // Tender number format check (common patterns)
  if (result.tender_number) {
    // Remove if it looks like a page number or section number
    if (/^[0-9]{1,2}$/.test(result.tender_number)) {
      issues.push('رقم المنافسة يبدو كرقم صفحة')
      result.tender_number = null
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    result,
    requiresReview: result.overall_confidence < 80 || issues.length > 0
  }
}
```

**4. UI Enforcement: Human Review Always**
- AI extraction results are ALWAYS shown in an editable preview
- Low-confidence fields are highlighted in yellow
- Missing fields are shown as empty inputs (not guessed)
- User must click "تأكيد" before data is saved
- Evidence quotes shown alongside extracted values

**5. Fallback Chain**
```
PDF → Gemini → Validation → User Review → Save
         ↓ (if fails)
      Manual Entry Form
```

If Gemini fails or confidence is too low, we don't show garbage — we show the manual entry form with a note: "تعذر استخراج البيانات تلقائياً — يرجى الإدخال يدوياً"

**Package:** `@google/generative-ai` (official SDK)

---

### Backup AI Provider (If Gemini Blocked)

If your Google account is completely blocked, we can swap to **Groq** (free, fast, Llama 3.3 70B has decent Arabic):

```typescript
// lib/ai-provider.ts — Abstraction layer
interface AIProvider {
  extractTender(pdfBuffer: Buffer): Promise<ExtractionResult>
}

// Switch via .env
const provider = process.env.AI_PROVIDER === 'groq' 
  ? new GroqProvider() 
  : new GeminiProvider()
```

**.env options:**
```bash
AI_PROVIDER=gemini  # or "groq"
GEMINI_API_KEY=...  # if using Gemini
GROQ_API_KEY=...    # if using Groq
```

---

## 5. File Processing

### SheetJS (xlsx)
**What:** JavaScript library for reading and writing Excel/CSV files.
**Why:**
- Reads .xlsx, .xls, .csv — all formats we need
- Writes formatted .xlsx with multiple sheets (our export)
- Works in both browser and Node.js
- No external dependencies
- Handles Arabic text correctly

**Package:** `xlsx` (npm)

**Usage:**
| Operation | Where |
|---|---|
| Read CSV/Excel (tender import) | `/api/tenders/import` |
| Read Excel (rate card import) | `/api/rate-cards` |
| Write Excel (tender export) | `/api/export/excel` |

**Export format:**
```typescript
// 3 sheets in output Excel
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, tenderOverviewSheet, 'بيانات المنافسة')
XLSX.utils.book_append_sheet(wb, evaluationSheet, 'التقييم')
XLSX.utils.book_append_sheet(wb, costBreakdownSheet, 'التكاليف')
```

### PDF handling
**What:** PDF file handling for AI extraction.
**Why:** We need to send PDFs to Gemini. We do NOT need to parse PDFs ourselves — Gemini handles that.

**Approach:** 
- Upload PDF via react-dropzone → send to API route as FormData
- API route stores in Supabase Storage → gets public URL or reads as buffer
- Buffer sent to Gemini as inline data (base64)
- No PDF parsing library needed — Gemini does it all

**No pdf.js or pdfparse needed.** Gemini is our PDF parser.

---

## 6. CRM Integration

### Odoo XML-RPC
**What:** Odoo's external API for creating and managing records.
**Why:**
- Odoo's standard external integration method
- Works with any Odoo instance (on-premise or cloud)
- No Odoo module installation required
- User just provides URL + credentials in .env

**Package:** `xmlrpc` (npm) — lightweight XML-RPC client

**Connection flow:**
```typescript
// lib/odoo.ts
// 1. Authenticate
const uid = await xmlrpc.call(url + '/xmlrpc/2/common', 'authenticate', [db, username, apiKey, {}])

// 2. Create CRM lead
const leadId = await xmlrpc.call(url + '/xmlrpc/2/object', 'execute_kw', [
  db, uid, apiKey,
  'crm.lead', 'create',
  [{
    name: tender.title,
    expected_revenue: tender.estimatedValue,
    date_deadline: tender.deadline,
    ref: tender.tenderNumber,
    description: `التقييم: ${tender.score}/100\nالتوصية: ${tender.recommendation}`,
    // ... mapped fields
  }]
])
```

**Configuration (.env):**
```
ODOO_URL=https://company.odoo.com
ODOO_DB=company_database
ODOO_USERNAME=user@company.com
ODOO_API_KEY=your-api-key-here
```

**Fallback:** If any .env variable is missing, Odoo features are disabled and Excel export is shown as primary option. No errors, no broken UI.

---

## 7. Deployment & Handover

### Development: Everything Local
```bash
# Start local Supabase (PostgreSQL, Auth, Storage)
supabase start

# Start Next.js dev server
pnpm dev

# Local URLs:
# - App: http://localhost:3000
# - Supabase Dashboard: http://localhost:54323
# - Supabase API: http://localhost:54321
```

**No cloud accounts needed during development.**

### Production: User Configures Their Own Services

**Philosophy:** All cloud services are configured via `.env`. The handover includes:
1. Working code (repo link)
2. `.env.example` with all required variables
3. Setup guide explaining how to get each credential
4. SQL migration files for database setup

**User provisions their own:**
| Service | Why User-Owned | Setup Guide Includes |
|---|---|---|
| Supabase | Their data, their compliance | Create project, run migrations, copy keys |
| Gemini API | Their quota, their API key | Get key from ai.google.dev (free) |
| Odoo | Their CRM, their credentials | XML-RPC API key generation steps |
| Vercel | Their deployment, their domain | One-click deploy from GitHub |

### Vercel Deployment
**What:** Serverless hosting platform, built for Next.js.
**Why:**
- One-click deployment from GitHub
- Free tier handles demo traffic
- Automatic HTTPS
- Preview deployments for testing
- Environment variables UI for .env management

**Deploy options:**
1. **Demo (judges):** We deploy to our Vercel, provide URL
2. **Handover:** User deploys to their own Vercel using their `.env`

### .env.example (Included in Repo)
```bash
# ===========================================
# Etmam 2.0 Environment Configuration
# ===========================================
# Copy this file to .env.local and fill in your values
# See docs/setup-guide.md for detailed instructions

# --- Supabase (Required) ---
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# --- AI Provider (Required) ---
# Option 1: Gemini (recommended) — Get key from https://ai.google.dev/
# Option 2: Groq — Get key from https://console.groq.com/
AI_PROVIDER=gemini
GEMINI_API_KEY=AI...
# GROQ_API_KEY=gsk_...  # Uncomment if using Groq instead

# --- Odoo CRM (Optional) ---
# Leave blank if not using Odoo — Excel export will be primary
ODOO_URL=
ODOO_DB=
ODOO_USERNAME=
ODOO_API_KEY=

# --- App Settings ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup Guide (docs/setup-guide.md)
Competition deliverable. Includes:
1. Prerequisites (Node.js 20+, pnpm)
2. Clone repository
3. Supabase setup (cloud or local)
4. Run database migrations
5. Get Gemini API key (with screenshots)
6. Configure .env
7. Start development server
8. Optional: Odoo integration
9. Deploy to Vercel

**Target:** App running in < 10 minutes (competition requirement)

---

## 8. Development Tools

| Tool | Purpose |
|---|---|
| **pnpm** | Package manager (faster than npm, disk efficient) |
| **ESLint** | Code linting — Next.js default config |
| **Prettier** | Code formatting — consistent style |
| **Supabase CLI** | Database migrations, type generation |
| **Cursor AI** | IDE with our 20 agents and 10 commands |
| **Git + GitHub** | Version control — competition requires repo link |

### pnpm (not npm)
**Why:** Faster installs, stricter dependency resolution, saves disk space. Critical when you're installing and rebuilding packages frequently in a sprint.

```bash
pnpm create next-app@latest etmam-2.0 --typescript --tailwind --eslint --app --src-dir
```

---

## 9. Package List (Complete)

### Dependencies
```json
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "@google/generative-ai": "^0.x",
    "zustand": "^5.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "xlsx": "^0.18.x",
    "xmlrpc": "^1.x",
    "react-dropzone": "^14.x",
    "lucide-react": "latest",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "tailwindcss-rtl": "^0.x",
    "date-fns": "^3.x",
    "sonner": "^1.x"
  }
}
```

### Dev Dependencies
```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "latest",
    "@types/node": "latest",
    "@types/xmlrpc": "^1.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "prettier": "^3.x",
    "supabase": "latest"
  }
}
```

### Package Rationale (why each one)
| Package | Size | Why Not Alternatives |
|---|---|---|
| zustand | 1.1KB | Redux (too heavy), Jotai (atomic model overkill for this) |
| react-hook-form | 9KB | Formik (heavier, more re-renders) |
| zod | 13KB | Yup (less TypeScript-native), io-ts (harder API) |
| xlsx | 90KB | ExcelJS (heavier, more features we don't need) |
| xmlrpc | 12KB | odoo-await (less maintained), custom fetch (more code) |
| react-dropzone | 8KB | Custom drag-drop (too much code for 3-day sprint) |
| lucide-react | tree-shaken | heroicons (fine too, but shadcn/ui uses lucide) |
| date-fns | tree-shaken | dayjs (fine too), moment (dead, heavy) |
| sonner | 5KB | react-hot-toast (fine too, sonner looks better with shadcn) |

---

## 10. Environment Variables Summary

```bash
# .env.local (development) — copy from .env.example
# .env (Vercel production)

# --- Supabase ---
# For local dev: these are auto-generated by `supabase start`
# For production: user gets from their Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # or https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# --- AI Provider ---
AI_PROVIDER=gemini                # "gemini" or "groq"
GEMINI_API_KEY=AI...              # from ai.google.dev (NOT console.cloud.google.com)
# GROQ_API_KEY=gsk_...            # alternative if Gemini blocked

# --- Odoo CRM (optional) ---
ODOO_URL=https://company.odoo.com
ODOO_DB=company_database
ODOO_USERNAME=user@company.com
ODOO_API_KEY=your-api-key-here

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Rules:**
- `NEXT_PUBLIC_` prefix = accessible in browser (only Supabase anon key + app URL)
- Everything else = server-only (API routes)
- `.env.local` in `.gitignore` — always
- `.env.example` committed with placeholder values — competition deliverable

---

## 11. Folder Structure

```
etmam-2.0/
├── .cursor/
│   ├── agents/          # 20 agents + 5 workflows
│   ├── commands/        # 10 commands
│   └── context/         # IDEA.md, PRD.md, etc. (these docs)
├── .cursorrules         # Project-specific rules
├── .env.local           # Local environment variables (git ignored)
├── .env.example         # Template for env vars (committed)
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts       # Note: .ts not .js in Next.js 16
├── tailwind.config.ts   # Note: .ts not .js
├── postcss.config.js
├── components.json      # shadcn/ui config
├── proxy.ts             # Route protection (Next.js 16; protects routes)
│
├── public/
│   ├── logo.svg
│   └── fonts/           # Cairo + Noto Kufi Arabic (if self-hosted)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (RTL, font, providers)
│   │   ├── page.tsx             # Redirect to /login or /dashboard
│   │   ├── (auth)/              # Auth routes (public)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx       # Auth layout (no nav)
│   │   ├── (protected)/         # Protected routes group
│   │   │   ├── layout.tsx       # Protected layout (with nav)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   ├── tenders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/callback/route.ts
│   │       ├── tenders/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── import/route.ts
│   │       ├── ai/extract/route.ts
│   │       ├── evaluation/
│   │       │   ├── route.ts
│   │       │   └── presets/route.ts
│   │       ├── costs/
│   │       │   ├── route.ts
│   │       │   └── match/route.ts
│   │       ├── rate-cards/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── export/
│   │       │   ├── excel/route.ts
│   │       │   └── odoo/route.ts
│   │       └── settings/odoo/
│   │           ├── route.ts
│   │           └── test/route.ts
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui (CUSTOMIZED colors/styles)
│   │   ├── layout/
│   │   │   ├── nav-bar.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── user-menu.tsx    # Logout, user info
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── signup-form.tsx
│   │   ├── dashboard/
│   │   ├── upload/
│   │   │   ├── file-dropzone.tsx
│   │   │   ├── csv-preview-table.tsx
│   │   │   ├── pdf-extraction-view.tsx
│   │   │   ├── extraction-confidence.tsx  # Shows AI confidence per field
│   │   │   └── manual-entry-form.tsx
│   │   ├── tenders/
│   │   ├── settings/
│   │   └── shared/
│   │       ├── score-badge.tsx
│   │       ├── source-badge.tsx
│   │       ├── confidence-indicator.tsx  # AI confidence display
│   │       ├── empty-state.tsx
│   │       └── loading-spinner.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client
│   │   │   ├── server.ts        # Server client
│   │   │   └── middleware.ts    # Session refresh helper for proxy
│   │   ├── ai/
│   │   │   ├── provider.ts      # AI provider abstraction
│   │   │   ├── gemini.ts        # Gemini client
│   │   │   ├── groq.ts          # Groq backup
│   │   │   ├── extraction-prompt.ts
│   │   │   └── extraction-validator.ts  # Deterministic validation
│   │   ├── odoo.ts
│   │   ├── excel.ts
│   │   ├── evaluation.ts
│   │   ├── rate-card-matcher.ts
│   │   └── utils.ts
│   │
│   ├── stores/
│   │   └── app-store.ts
│   │
│   ├── types/
│   │   ├── tender.ts
│   │   ├── extraction.ts        # AI extraction result types
│   │   ├── rate-card.ts
│   │   ├── evaluation.ts
│   │   ├── odoo.ts
│   │   └── database.ts
│   │
│   └── hooks/
│       ├── use-auth.ts          # Auth state hook
│       ├── use-tenders.ts
│       ├── use-rate-cards.ts
│       ├── use-evaluation.ts
│       └── use-odoo.ts
│
├── supabase/
│   ├── config.toml
│   ├── seed.sql                 # Demo data
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_rls_policies.sql
│
└── docs/
    ├── setup-guide.md           # Competition deliverable
    ├── api-reference.md
    └── sample-data/
        ├── sample-tenders.csv
        ├── sample-rate-card.xlsx
        └── sample-rfp.pdf
```

---

## 12. Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Next.js version | 16.1 (latest stable) | Turbopack stable, App Router mature, proxy.ts for middleware |
| SSR vs SPA | Hybrid (Next.js App Router) | Server Components for fast loads, Client Components for interactivity |
| State management | Zustand | Lightweight, no boilerplate, works with App Router |
| Database | Supabase PostgreSQL (local dev → user cloud) | Free, relational, you know it, RLS for security, easy handover |
| Auth | Supabase Auth (email/password) | Competition requires basic auth, Supabase makes it simple |
| AI provider | Gemini 2.5 Flash via AI Studio | Free tier separate from GCP, Arabic-native, PDF-native, fast |
| AI backup | Groq (Llama 3.3 70B) | Free, fast, decent Arabic, swap via .env |
| Anti-hallucination | Constrained JSON + confidence scores + human review | AI never trusted blindly, always validated |
| CRM integration | Odoo XML-RPC | Standard Odoo API, no module install needed |
| Excel library | SheetJS | Reads and writes, small, no dependencies |
| UI approach | Custom design system (NOT generic AI slob) | Deep navy + gold, professional dashboard aesthetic |
| CSS approach | Tailwind + shadcn/ui (heavily customized) | Fast, consistent, RTL-ready, but NOT default colors |
| Package manager | pnpm | Faster than npm, strict resolution |
| Font | Cairo + Noto Kufi Arabic | Cairo for English/numbers, Kufi for Arabic |
| Deployment | Vercel + user's own Supabase | Free tiers, zero ops, .env-based handover |
| PDF parsing | None (Gemini does it) | No pdf.js needed — AI handles extraction |
| Development DB | Supabase local | No cloud account needed during dev |
