# دليل الإعداد والتشغيل — Etmam 2.0
# Setup & Operation Guide — Etmam 2.0

> MVP: Etimad → Evaluation → CRM Pipeline

---

## المتطلبات الأساسية | Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| pnpm | 9+ | Package manager |
| Supabase CLI | 2.x | Local database |
| Docker Desktop | Latest | Required by Supabase CLI |
| Git | Latest | Version control |

---

## 1. استنساخ المستودع | Clone Repository

```bash
git clone <repository-url> etmam-2.0
cd etmam-2.0
```

## 2. تثبيت الحزم | Install Dependencies

```bash
pnpm install
```

## 3. إعداد قاعدة البيانات | Database Setup

Start the local Supabase instance (requires Docker):

```bash
npx supabase start
```

This will output connection details including:
- `API URL` → use as `NEXT_PUBLIC_SUPABASE_URL`
- `anon key` → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role key` → use as `SUPABASE_SERVICE_ROLE_KEY`

The migrations in `supabase/migrations/` run automatically and create:
- `profiles` — User profiles (extends Supabase Auth)
- `tenders` — Tender records (entity, title, number, deadline, value, score, recommendation)
- `evaluations` — AI evaluation results with per-criterion scores
- `evaluation_presets` — Editable scoring weight presets
- `cost_items` — Cost estimation line items (direct/indirect)
- `rate_cards` / `rate_card_items` — Reusable pricing templates
- `pipeline_stages` / `pipeline_entries` — CRM pipeline board stages
- `extraction_cache` — PDF extraction cache for performance
- Storage buckets for tender PDFs and rate card files

All tables have Row Level Security (RLS) enabled — users can only access their own data.

## 4. إعداد المتغيرات البيئية | Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# --- Supabase (Required) ---
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>

# --- AI Provider (Required for tender analysis) ---
# Primary: DeepSeek (recommended)
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=<your-key>

# Alternative providers:
# GEMINI_API_KEY=<your-key>     # Required for PDF extraction
# GROQ_API_KEY=<your-key>       # Fast fallback

# For local dev without AI keys:
# MOCK_AI=true

# --- Odoo CRM (Optional) ---
# Leave blank to use Excel export as primary CRM method
ODOO_URL=
ODOO_DB=
ODOO_USERNAME=
ODOO_API_KEY=

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### مفاتيح الـ AI | AI Provider Keys

| Provider | Get Key From | Use Case |
|----------|-------------|----------|
| DeepSeek | https://platform.deepseek.com/api_keys | Primary analysis (Arabic-optimized) |
| Gemini | https://ai.google.dev/ | PDF text extraction |
| Groq | https://console.groq.com/ | Fast fallback |

> **ملاحظة**: يمكنك تعيين `MOCK_AI=true` للتطوير المحلي بدون مفاتيح AI.
> **Note**: Set `MOCK_AI=true` for local development without any AI keys.

## 5. تشغيل التطبيق | Run the Application

```bash
pnpm dev
```

Open http://localhost:3000

## 6. إنشاء حساب | Create Account

1. Navigate to http://localhost:3000/register
2. Register with email and password
3. For local Supabase, email confirmation is auto-approved

---

## سير العمل الكامل | End-to-End Workflow

### الخطوة 1: إدخال المنافسات | Step 1: Ingest Tenders

Navigate to **المنافسات (Tenders)** page and upload tenders via:

- **PDF** — Arabic tender documents; AI extracts entity, title, number, deadline, value, requirements
- **Excel/CSV** — Bulk import from spreadsheet files
- **Manual entry** — Fill in tender fields directly

Supported fields per tender:
| Field | Arabic | Required |
|-------|--------|----------|
| Entity | الجهة | Yes |
| Tender Title | عنوان المنافسة | Yes |
| Tender Number | رقم المنافسة | Yes |
| Deadline | الموعد النهائي | Yes |
| Estimated Value | القيمة التقديرية | No |
| Description | الوصف | No |
| Requirements | المتطلبات | No |

### الخطوة 2: تقييم المنافسات | Step 2: Evaluate Tenders

1. Open a tender detail page
2. Click **تحليل (Analyze)** button
3. AI evaluates the tender using configurable weighted criteria:
   - Alignment with company capabilities
   - Profitability potential
   - Risk assessment
   - Timeline feasibility
   - Competition level
4. Result: Overall score (0-100) + recommendation (Proceed / Review / Skip) + evidence quotes

**Editable scoring weights**: Go to **الإعدادات (Settings)** → Scoring Weights tab to adjust criteria weights.

### الخطوة 3: تقدير التكاليف | Step 3: Cost Estimation (Optional)

1. On tender detail, go to **التكاليف (Costs)** tab
2. Add direct and indirect cost line items
3. Link to rate cards for consistent pricing
4. Set proposed price and view margin analysis

### الخطوة 4: لوحة CRM | Step 4: CRM Pipeline

1. Navigate to **خط الأنابيب (Pipeline)** page
2. Tenders flow through stages: New → Scored → Approved → Pushed to CRM → Won/Lost
3. Drag-and-drop to move tenders between stages
4. **Push to CRM**: Click to export opportunity data to Odoo CRM (or use Excel export)

CRM opportunity fields mapped:
| Etmam Field | CRM Field |
|-------------|-----------|
| الجهة (Entity) | Partner Name |
| عنوان المنافسة (Title) | Opportunity Name |
| رقم المنافسة (Number) | Reference |
| الموعد النهائي (Deadline) | Expected Close Date |
| القيمة التقديرية (Value) | Expected Revenue |
| درجة التقييم (Score) | In description |
| التوصية (Recommendation) | In description |

### الخطوة 5: التصدير | Step 5: Export

- **Excel export** — Download tender data with evaluations as .xlsx
- **Odoo CRM** — Push directly via XML-RPC API (configure in Settings → Odoo)

---

## إعداد Odoo CRM (اختياري) | Odoo CRM Setup (Optional)

1. Go to **الإعدادات (Settings)** → **Odoo CRM** tab
2. Enter your Odoo server URL, database name, username, and API key
3. Click **اختبار الاتصال (Test Connection)** to verify
4. Once connected, use **Push to CRM** button on pipeline cards

---

## البنية التقنية | Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| UI | React 19 + Tailwind CSS 4 + Lucide Icons |
| State | Zustand stores |
| Database | Supabase (PostgreSQL + Auth + Storage + RLS) |
| AI Analysis | DeepSeek (primary) / Gemini / Groq (fallback) |
| CRM Integration | Odoo via XML-RPC (native, no external xmlrpc package) |
| PDF Parsing | pdf-parse + Gemini AI extraction |
| Spreadsheets | xlsx + papaparse |
| Language | TypeScript (strict) |
| Validation | Zod v4 |
| Testing | Playwright (E2E) |

---

## الأوامر المتاحة | Available Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
npx supabase start   # Start local Supabase
npx supabase stop    # Stop local Supabase
npx supabase db reset # Reset database (re-run all migrations)
```

---

## الأمان | Security

- All API keys stored in `.env.local` (excluded from git via `.gitignore`)
- Supabase Row Level Security on all tables — users only access own data
- Server Actions validate authentication before every operation
- Odoo credentials stored locally per-user, never exposed to client
- No secrets in client-side code (`NEXT_PUBLIC_` prefix only for Supabase URL/anon key)

---

## استكشاف الأخطاء | Troubleshooting

| Issue | Solution |
|-------|---------|
| `supabase start` fails | Ensure Docker Desktop is running |
| AI analysis returns error | Check API key in `.env.local`; use `MOCK_AI=true` for testing |
| PDF extraction fails | Ensure `GEMINI_API_KEY` is set (Gemini handles PDF text extraction) |
| Odoo connection fails | Verify URL format includes `https://`, test credentials in Settings |
| Missing tables | Run `npx supabase db reset` to re-apply all migrations |
