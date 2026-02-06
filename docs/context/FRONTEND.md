# FRONTEND.md — Etmam 2.0 UI Architecture

> AI-Powered Tender Management System
> Competition: EnfraTech | Deadline: Sunday Feb 8, 2026
> Stack: Next.js 16.1 + TypeScript + Tailwind CSS + Zustand

---

## 1. Design System — "Etmam Professional"

### 1.1 Design Philosophy

No AI slob. No gradient cards with sparkle emojis. Etmam looks like enterprise software built by a real design team — clean, data-dense, and trustworthy. Think Bloomberg Terminal meets modern SaaS dashboard.

**Principles:**
- Data density over whitespace — users need information, not padding
- Confidence is communicated visually — color-coded scores, evidence quotes visible
- Arabic-first RTL layout with seamless LTR fallback
- Every AI output has a visible trust indicator — never hide the machine behind magic

### 1.2 Design Tokens

```typescript
// lib/design-tokens.ts

export const colors = {
  // Primary — Deep Navy (trust, authority, government-grade)
  navy: {
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68',
    800: '#243b53',
    900: '#102a43',
    950: '#0a1929',
  },

  // Accent — Gold (premium, achievement, Saudi cultural resonance)
  gold: {
    50: '#fffbea',
    100: '#fff3c4',
    200: '#fce588',
    300: '#fadb5f',
    400: '#f7c948',
    500: '#f0b429',
    600: '#de911d',
    700: '#cb6e17',
    800: '#b44d12',
    900: '#8d2b0b',
  },

  // Semantic — Confidence Scores
  confidence: {
    high: '#10B981',     // Emerald 500 — score >= 75
    medium: '#F59E0B',   // Amber 500 — score 50-74
    low: '#EF4444',      // Red 500 — score < 50
    unknown: '#6B7280',  // Gray 500 — not yet scored
  },

  // Status Colors
  status: {
    draft: '#6B7280',
    active: '#3B82F6',
    scored: '#8B5CF6',
    pushed: '#10B981',
    rejected: '#EF4444',
    expired: '#9CA3AF',
  },

  // Backgrounds
  bg: {
    primary: '#0a1929',      // Main app background
    secondary: '#102a43',    // Cards, panels
    tertiary: '#243b53',     // Hover states, active items
    surface: '#334e68',      // Elevated surfaces
    overlay: 'rgba(10,25,41,0.8)', // Modals backdrop
  },

  // Text
  text: {
    primary: '#f0f4f8',
    secondary: '#9fb3c8',
    muted: '#627d98',
    inverse: '#102a43',
    gold: '#f0b429',
  },

  // Borders
  border: {
    default: '#334e68',
    hover: '#486581',
    focus: '#f0b429',
    error: '#EF4444',
  },

  // Light theme overrides (applied when dark class is NOT present)
  light: {
    bg: {
      primary: '#f8f9fb',       // Main app background
      secondary: '#ffffff',     // Cards, panels
      tertiary: '#f0f4f8',      // Hover states, active items
      surface: '#e2e8f0',       // Elevated surfaces
      overlay: 'rgba(248,249,251,0.8)',
    },
    text: {
      primary: '#102a43',
      secondary: '#486581',
      muted: '#829ab1',
      inverse: '#f0f4f8',
      gold: '#b44d12',
    },
    border: {
      default: '#d9e2ec',
      hover: '#bcccdc',
      focus: '#de911d',
      error: '#EF4444',
    },
  },
} as const

export const typography = {
  // Font families — system stack for speed, Arabic support built in
  fontFamily: {
    sans: '"Cairo", "Noto Kufi Arabic", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    arabic: '"Noto Kufi Arabic", "Cairo", "Segoe UI", "Tahoma", sans-serif',
  },

  // Font sizes (rem)
  fontSize: {
    xs: '0.75rem',    // 12px — labels, metadata
    sm: '0.875rem',   // 14px — body small, table cells
    base: '1rem',     // 16px — body text
    lg: '1.125rem',   // 18px — section headers
    xl: '1.25rem',    // 20px — page subtitles
    '2xl': '1.5rem',  // 24px — page titles
    '3xl': '1.875rem',// 30px — hero numbers (dashboard stats)
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

export const spacing = {
  // Based on 4px grid
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
} as const

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px — small elements (badges, chips)
  md: '0.5rem',     // 8px — cards, inputs
  lg: '0.75rem',    // 12px — panels, modals
  full: '9999px',   // pills, avatars
} as const

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 6px rgba(0,0,0,0.3)',
  lg: '0 10px 15px rgba(0,0,0,0.3)',
  glow: '0 0 20px rgba(240,180,41,0.15)', // Gold glow for focus/active
} as const

export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '350ms ease',
} as const
```

### 1.3 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class', // Dual theme — toggle between dark and light
  theme: {
    extend: {
      colors: {
        navy: { /* ...colors.navy */ },
        gold: { /* ...colors.gold */ },
        confidence: { /* ...colors.confidence */ },
        status: { /* ...colors.status */ },
      },
      fontFamily: {
        sans: ['Cairo', 'Noto Kufi Arabic', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        arabic: ['Noto Kufi Arabic', 'Cairo', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'score-fill': 'scoreFill 1s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(240,180,41,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(240,180,41,0)' } },
        scoreFill: { '0%': { width: '0%' }, '100%': { width: 'var(--score-width)' } },
      },
    },
  },
  plugins: [],
}

export default config
```

### 1.4 RTL / Arabic Support

```typescript
// lib/rtl.ts
// Direction is determined by locale — no manual toggle needed for MVP

export function getDirection(locale: string): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

// CSS utility: Use logical properties everywhere
// ✅ ps-4 (padding-inline-start) NOT pl-4
// ✅ me-2 (margin-inline-end) NOT mr-2
// ✅ start-0 NOT left-0
// ✅ text-start NOT text-left
```

**RTL Rules for All Components:**
- Use Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`)
- Never use `left`/`right` — use `start`/`end`
- Icons that have directionality (arrows, chevrons) must flip in RTL
- Numbers always render LTR even in RTL context (`direction: ltr` on number elements)
- Arabic text uses `font-arabic` class for proper rendering

---

## 2. Component Architecture

### 2.1 Component Tree Overview

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, providers, metadata)
│   ├── page.tsx                  # Landing page (public, presentation-style)
│   ├── (auth)/                   # Auth group (no sidebar)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/              # Dashboard group (with sidebar)
│       ├── layout.tsx            # Sidebar + header wrapper
│       ├── dashboard/page.tsx    # Main dashboard
│       ├── tenders/
│       │   ├── page.tsx          # Tender list
│       │   ├── upload/page.tsx   # Upload CSV/Excel
│       │   └── [id]/page.tsx     # Tender detail + AI analysis
│       ├── pipeline/page.tsx     # CRM pipeline board
│       └── settings/page.tsx     # AI config, CRM config, profile
│
├── components/
│   ├── ui/                       # Base UI primitives (custom, NOT shadcn)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Tabs.tsx
│   │   ├── Toast.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ConfirmDialog.tsx
│   │
│   ├── layout/                   # Layout components
│   │   ├── Sidebar.tsx           # Main navigation sidebar
│   │   ├── Header.tsx            # Top bar (user menu, notifications)
│   │   ├── PageHeader.tsx        # Page title + actions bar
│   │   └── MobileNav.tsx         # Mobile hamburger menu
│   │
│   ├── auth/                     # Authentication
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthGuard.tsx         # Client-side auth check wrapper
│   │
│   ├── tender/                   # Tender-specific components
│   │   ├── TenderTable.tsx       # Sortable, filterable table
│   │   ├── TenderRow.tsx         # Single row in table
│   │   ├── TenderCard.tsx        # Card view (alternative)
│   │   ├── TenderDetail.tsx      # Full tender detail panel
│   │   ├── TenderUpload.tsx      # CSV/Excel upload dropzone
│   │   ├── TenderFilters.tsx     # Filter bar (status, score, date)
│   │   ├── TenderBulkActions.tsx # Multi-select actions
│   │   └── TenderStatusBadge.tsx # Color-coded status badge
│   │
│   ├── analysis/                 # AI Analysis components
│   │   ├── AnalysisPanel.tsx     # Full analysis view for a tender
│   │   ├── ScoreGauge.tsx        # Visual confidence score (0-100)
│   │   ├── ScoreBreakdown.tsx    # Category-by-category scores
│   │   ├── EvidenceQuotes.tsx    # Source quotes from tender text
│   │   ├── RecommendationCard.tsx# Go/No-go recommendation
│   │   ├── ConfidenceBadge.tsx   # HIGH/MEDIUM/LOW confidence
│   │   ├── AnalyzeButton.tsx     # Trigger AI analysis
│   │   └── AnalysisHistory.tsx   # Past analyses for comparison
│   │
│   ├── pipeline/                 # CRM Pipeline components
│   │   ├── PipelineBoard.tsx     # Kanban-style board
│   │   ├── PipelineColumn.tsx    # Single column (stage)
│   │   ├── PipelineCard.tsx      # Tender card in pipeline
│   │   ├── PushToCRM.tsx         # CRM push action + status
│   │   └── CRMFieldMapping.tsx   # Field mapping display
│   │
│   ├── dashboard/                # Dashboard widgets
│   │   ├── StatsRow.tsx          # Key metrics (4 cards)
│   │   ├── StatCard.tsx          # Single stat with trend
│   │   ├── RecentTenders.tsx     # Latest uploaded tenders
│   │   ├── ScoreDistribution.tsx # Chart: score histogram
│   │   ├── PipelineSummary.tsx   # Pipeline stages overview
│   │   └── QuickActions.tsx      # Common action buttons
│   │
│   └── settings/                 # Settings components
│       ├── AIProviderConfig.tsx  # Gemini/Groq toggle
│       ├── ScoringWeights.tsx    # Adjustable scoring criteria
│       ├── CRMConfig.tsx         # CRM connection settings
│       ├── ThemeToggle.tsx        // Dark/light mode switch
│       └── ProfileForm.tsx       # User profile
│
├── landing/                      # Landing page (presentation for judges)
│   ├── HeroSection.tsx           // Logo, tagline, CTA buttons
│   ├── ProblemStatement.tsx      // The problem Etmam solves
│   ├── SolutionOverview.tsx      // How Etmam works (3-step visual)
│   ├── FeatureHighlights.tsx     // Key features with icons
│   ├── TechStack.tsx             // Tech stack badges
│   └── CTAFooter.tsx             // Login/Register buttons
│
├── lib/                          # Utilities and configuration
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (Server Components)
│   │   └── middleware.ts         # Auth middleware client
│   ├── ai/
│   │   ├── provider.ts           # AI provider factory (Gemini/Groq)
│   │   ├── prompts.ts            # All AI prompts (centralized)
│   │   └── parser.ts             # Parse AI responses → typed objects
│   ├── utils/
│   │   ├── format.ts             # Number, date, currency formatting
│   │   ├── csv-parser.ts         # CSV/Excel parsing logic
│   │   └── validation.ts         # Zod schemas (shared)
│   ├── design-tokens.ts          # Design system tokens
│   └── constants.ts              # App-wide constants
│
├── stores/                       # Zustand state management
│   ├── tender-store.ts
│   ├── analysis-store.ts
│   ├── pipeline-store.ts
│   ├── settings-store.ts
│   └── ui-store.ts
│
├── types/                        # TypeScript types
│   ├── database.ts               # Supabase-generated types
│   ├── api.ts                    # API request/response types
│   ├── ai.ts                     # AI analysis types
│   └── ui.ts                     # UI-specific types
│
└── hooks/                        # Custom React hooks
    ├── use-tenders.ts            # Tender CRUD operations
    ├── use-analysis.ts           # AI analysis operations
    ├── use-pipeline.ts           # Pipeline operations
    ├── use-auth.ts               # Auth state and operations
    ├── use-toast.ts              # Toast notifications
    └── use-keyboard.ts           # Keyboard shortcuts
```

### 2.2 Component Specifications

#### Base UI Components (Custom — NOT shadcn/ui)

Every component follows these rules:
- TypeScript with strict props interface
- Supports `className` prop for overrides via `cn()` utility
- Dual theme — all components support both dark and light mode via CSS variables
- RTL-aware using logical properties
- Accessible (proper ARIA attributes, keyboard navigation)
- No external UI library dependencies

```typescript
// components/ui/Button.tsx — Example specification
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'
  fullWidth?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

// Variant styles:
// primary  → bg-gold-500 text-navy-950 hover:bg-gold-400
// secondary → bg-navy-700 text-navy-100 hover:bg-navy-600 border border-navy-500
// ghost    → bg-transparent text-navy-200 hover:bg-navy-800
// danger   → bg-red-600 text-white hover:bg-red-500
// gold     → bg-transparent text-gold-400 border border-gold-500 hover:bg-gold-500/10
```

```typescript
// components/ui/Badge.tsx — Status/confidence badges
interface BadgeProps {
  variant: 'status' | 'confidence' | 'default'
  value: string  // e.g., 'active', 'high', 'draft'
  size?: 'sm' | 'md'
  dot?: boolean  // Show color dot prefix
  className?: string
}

// Auto-maps value to color:
// status:active → blue, status:scored → purple, status:pushed → green
// confidence:high → green, confidence:medium → amber, confidence:low → red
```

```typescript
// components/ui/Table.tsx — Data table
interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  emptyMessage?: string
  selectable?: boolean
  onSelectionChange?: (ids: string[]) => void
  sortable?: boolean
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
}

// Features:
// - Sticky header
// - Row hover highlight (bg-navy-800)
// - Checkbox selection column
// - Sort arrows on column headers
// - Loading skeleton rows
// - Empty state with illustration
```

#### Tender Components

```typescript
// components/tender/TenderUpload.tsx
// Drag-and-drop zone for CSV/Excel files
// Shows file preview after upload
// Validates format before submission
// Progress bar during processing
// Error display for invalid rows

interface TenderUploadProps {
  onUploadComplete: (tenders: ParsedTender[]) => void
  onError: (error: string) => void
  maxFileSize?: number  // Default: 10MB
  acceptedFormats?: string[]  // Default: ['.csv', '.xlsx', '.xls']
}
```

```typescript
// components/analysis/ScoreGauge.tsx
// Circular gauge showing 0-100 score
// Color transitions: red (0-49) → amber (50-74) → green (75-100)
// Animated fill on mount
// Center shows score number
// Below shows confidence level text

interface ScoreGaugeProps {
  score: number
  confidence: 'high' | 'medium' | 'low'
  size?: 'sm' | 'md' | 'lg'  // 64px, 96px, 128px
  animated?: boolean
  label?: string
}
```

```typescript
// components/analysis/EvidenceQuotes.tsx
// Shows extracted quotes from tender document that support the score
// Each quote has: text, relevance tag, page/section reference
// Anti-hallucination: shows source, not AI interpretation

interface EvidenceQuotesProps {
  quotes: {
    text: string
    relevance: 'supporting' | 'concerning' | 'neutral'
    source: string  // e.g., "Section 3.2, Page 5"
  }[]
  maxVisible?: number  // Default: 3, expandable
}
```

```typescript
// components/pipeline/PipelineBoard.tsx
// Kanban board with columns: New → Scored → Approved → Pushed to CRM → Won/Lost
// Cards show: tender title, entity, score badge, deadline
// Drag-and-drop between columns (stretch goal — use click-to-move for MVP)
// Column counts and totals

interface PipelineBoardProps {
  // Data comes from Zustand store, not props
}

// Columns defined as constants:
const PIPELINE_STAGES = [
  { id: 'new', label: 'New', labelAr: 'جديد', color: 'gray' },
  { id: 'scored', label: 'Scored', labelAr: 'مُقيّم', color: 'purple' },
  { id: 'approved', label: 'Approved', labelAr: 'معتمد', color: 'blue' },
  { id: 'pushed', label: 'Pushed to CRM', labelAr: 'تم الدفع', color: 'green' },
  { id: 'won', label: 'Won', labelAr: 'فاز', color: 'gold' },
  { id: 'lost', label: 'Lost', labelAr: 'خسر', color: 'red' },
] as const
```

---

## 3. State Management — Zustand

### 3.1 Why Zustand (Not Redux, Not Context)

- Zero boilerplate — define stores in 20 lines, not 200
- No provider wrapping — works outside React tree (useful for AI service calls)
- Built-in devtools support
- Tiny bundle (1KB) — matters for competition demo speed
- TypeScript-first with excellent inference

### 3.2 Store Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ tender-store │────▶│analysis-store│────▶│pipeline-store │
│              │     │              │     │               │
│ - tenders[]  │     │ - analyses{} │     │ - stages{}    │
│ - filters    │     │ - loading    │     │ - dragState   │
│ - selected   │     │ - queue      │     │               │
│ - pagination │     │              │     │               │
└─────────────┘     └──────────────┘     └───────────────┘
       │                                         │
       ▼                                         ▼
┌─────────────┐                         ┌───────────────┐
│ ui-store    │                         │settings-store │
│             │                         │               │
│ - sidebar   │                         │ - aiProvider  │
│ - modals    │                         │ - weights     │
│ - toasts    │                         │ - crmConfig   │
│ - loading   │                         │               │
└─────────────┘                         └───────────────┘
```

### 3.3 Store Definitions

```typescript
// stores/tender-store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Tender, TenderStatus } from '@/types/database'

interface TenderFilters {
  status: TenderStatus | 'all'
  scoreRange: [number, number]  // [min, max]
  dateRange: [string, string] | null
  search: string
  sortBy: 'created_at' | 'deadline' | 'score' | 'title'
  sortOrder: 'asc' | 'desc'
}

interface TenderStore {
  // State
  tenders: Tender[]
  selectedIds: string[]
  filters: TenderFilters
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  loading: boolean
  error: string | null

  // Actions
  setTenders: (tenders: Tender[]) => void
  addTenders: (tenders: Tender[]) => void
  updateTender: (id: string, updates: Partial<Tender>) => void
  removeTender: (id: string) => void
  setFilters: (filters: Partial<TenderFilters>) => void
  resetFilters: () => void
  setSelectedIds: (ids: string[]) => void
  toggleSelected: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setPage: (page: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const DEFAULT_FILTERS: TenderFilters = {
  status: 'all',
  scoreRange: [0, 100],
  dateRange: null,
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
}

export const useTenderStore = create<TenderStore>()(
  devtools(
    (set, get) => ({
      tenders: [],
      selectedIds: [],
      filters: DEFAULT_FILTERS,
      pagination: { page: 1, pageSize: 20, total: 0 },
      loading: false,
      error: null,

      setTenders: (tenders) => set({ tenders }),
      addTenders: (newTenders) =>
        set((state) => ({ tenders: [...state.tenders, ...newTenders] })),
      updateTender: (id, updates) =>
        set((state) => ({
          tenders: state.tenders.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      removeTender: (id) =>
        set((state) => ({
          tenders: state.tenders.filter((t) => t.id !== id),
          selectedIds: state.selectedIds.filter((sid) => sid !== id),
        })),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }, // Reset page on filter change
        })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      setSelectedIds: (ids) => set({ selectedIds: ids }),
      toggleSelected: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        })),
      selectAll: () =>
        set((state) => ({
          selectedIds: state.tenders.map((t) => t.id),
        })),
      clearSelection: () => set({ selectedIds: [] }),
      setPage: (page) =>
        set((state) => ({ pagination: { ...state.pagination, page } })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'tender-store' }
  )
)
```

```typescript
// stores/analysis-store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TenderAnalysis, AnalysisStatus } from '@/types/ai'

interface AnalysisStore {
  // State — keyed by tender ID
  analyses: Record<string, TenderAnalysis>
  activeAnalysisId: string | null  // Currently viewing
  queue: string[]                   // Tender IDs queued for analysis
  processing: string | null         // Currently processing tender ID

  // Actions
  setAnalysis: (tenderId: string, analysis: TenderAnalysis) => void
  removeAnalysis: (tenderId: string) => void
  setActiveAnalysis: (tenderId: string | null) => void
  addToQueue: (tenderIds: string[]) => void
  removeFromQueue: (tenderId: string) => void
  setProcessing: (tenderId: string | null) => void
  getAnalysis: (tenderId: string) => TenderAnalysis | null
}

export const useAnalysisStore = create<AnalysisStore>()(
  devtools(
    (set, get) => ({
      analyses: {},
      activeAnalysisId: null,
      queue: [],
      processing: null,

      setAnalysis: (tenderId, analysis) =>
        set((state) => ({
          analyses: { ...state.analyses, [tenderId]: analysis },
        })),
      removeAnalysis: (tenderId) =>
        set((state) => {
          const { [tenderId]: _, ...rest } = state.analyses
          return { analyses: rest }
        }),
      setActiveAnalysis: (tenderId) => set({ activeAnalysisId: tenderId }),
      addToQueue: (tenderIds) =>
        set((state) => ({
          queue: [...new Set([...state.queue, ...tenderIds])],
        })),
      removeFromQueue: (tenderId) =>
        set((state) => ({
          queue: state.queue.filter((id) => id !== tenderId),
        })),
      setProcessing: (tenderId) => set({ processing: tenderId }),
      getAnalysis: (tenderId) => get().analyses[tenderId] ?? null,
    }),
    { name: 'analysis-store' }
  )
)
```

```typescript
// stores/pipeline-store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type PipelineStage = 'new' | 'scored' | 'approved' | 'pushed' | 'won' | 'lost'

interface PipelineStore {
  // State — tender IDs grouped by stage
  stages: Record<PipelineStage, string[]>
  
  // Actions
  setStages: (stages: Record<PipelineStage, string[]>) => void
  moveTender: (tenderId: string, from: PipelineStage, to: PipelineStage) => void
  addToStage: (tenderId: string, stage: PipelineStage) => void
}

export const usePipelineStore = create<PipelineStore>()(
  devtools(
    (set) => ({
      stages: {
        new: [],
        scored: [],
        approved: [],
        pushed: [],
        won: [],
        lost: [],
      },

      setStages: (stages) => set({ stages }),
      moveTender: (tenderId, from, to) =>
        set((state) => ({
          stages: {
            ...state.stages,
            [from]: state.stages[from].filter((id) => id !== tenderId),
            [to]: [...state.stages[to], tenderId],
          },
        })),
      addToStage: (tenderId, stage) =>
        set((state) => ({
          stages: {
            ...state.stages,
            [stage]: [...state.stages[stage], tenderId],
          },
        })),
    }),
    { name: 'pipeline-store' }
  )
)
```

```typescript
// stores/settings-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface ScoringWeights {
  alignment: number        // 0-100, does this match our capabilities?
  profitability: number    // 0-100, is the estimated margin attractive?
  timeline: number         // 0-100, is the deadline realistic?
  competition: number      // 0-100, how competitive is this tender?
  strategic_value: number  // 0-100, strategic alignment with company goals?
}

interface SettingsStore {
  // AI Configuration
  aiProvider: 'gemini' | 'groq'
  geminiModel: string
  groqModel: string
  
  // Scoring Configuration
  scoringWeights: ScoringWeights
  autoAnalyze: boolean        // Auto-analyze on upload
  confidenceThreshold: number // Minimum confidence to show score
  
  // CRM Configuration
  crmEnabled: boolean
  crmAutoCreate: boolean      // Auto-create opportunity on approval
  
  // UI Preferences
  locale: 'en' | 'ar'
  tableView: 'table' | 'card'
  
  // Actions
  setAIProvider: (provider: 'gemini' | 'groq') => void
  setScoringWeights: (weights: Partial<ScoringWeights>) => void
  setLocale: (locale: 'en' | 'ar') => void
  setTableView: (view: 'table' | 'card') => void
  setCRMEnabled: (enabled: boolean) => void
  setCRMAutoCreate: (auto: boolean) => void
  setAutoAnalyze: (auto: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        aiProvider: 'gemini',
        geminiModel: 'gemini-2.5-flash',
        groqModel: 'llama-3.3-70b-versatile',
        
        scoringWeights: {
          alignment: 25,
          profitability: 25,
          timeline: 20,
          competition: 15,
          strategic_value: 15,
        },
        autoAnalyze: false,
        confidenceThreshold: 50,
        
        crmEnabled: true,
        crmAutoCreate: false,
        
        locale: 'en',
        tableView: 'table',
        
        setAIProvider: (provider) => set({ aiProvider: provider }),
        setScoringWeights: (weights) =>
          set((state) => ({
            scoringWeights: { ...state.scoringWeights, ...weights },
          })),
        setLocale: (locale) => set({ locale }),
        setTableView: (view) => set({ tableView: view }),
        setCRMEnabled: (enabled) => set({ crmEnabled: enabled }),
        setCRMAutoCreate: (auto) => set({ crmAutoCreate: auto }),
        setAutoAnalyze: (auto) => set({ autoAnalyze: auto }),
      }),
      { name: 'etmam-settings' }
    ),
    { name: 'settings-store' }
  )
)
```

```typescript
// stores/ui-store.ts
import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number  // ms, default 5000
}

interface UIStore {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Modals
  activeModal: string | null
  modalData: Record<string, unknown> | null
  
  // Toasts
  toasts: Toast[]
  
  // Global loading states
  globalLoading: boolean
  loadingMessage: string | null
  
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  openModal: (modal: string, data?: Record<string, unknown>) => void
  closeModal: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setGlobalLoading: (loading: boolean, message?: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,
  toasts: [],
  globalLoading: false,
  loadingMessage: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openModal: (modal, data) =>
    set({ activeModal: modal, modalData: data ?? null }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  setGlobalLoading: (loading, message) =>
    set({ globalLoading: loading, loadingMessage: message ?? null }),
}))
```

---

## 4. Data Flow Patterns

### 4.1 Server Components (Default — Data Fetching)

```
[Server Component]
    │
    ├── Fetch data via Supabase server client
    ├── Pass data as props to client components
    └── No interactivity — pure data rendering

// Example: Tender list page
// app/(dashboard)/tenders/page.tsx — Server Component
export default async function TendersPage() {
  const supabase = await createServerClient()
  const { data: tenders } = await supabase
    .from('tenders')
    .select('*, tender_analyses(*)')
    .order('created_at', { ascending: false })
  
  return <TenderListClient initialTenders={tenders ?? []} />
}
```

### 4.2 Client Components (Interactive — State + Events)

```
[Client Component]
    │
    ├── Receives initialData as props (from Server Component)
    ├── Hydrates Zustand store on mount
    ├── All user interactions happen here
    ├── Calls Server Actions for mutations
    └── Optimistic updates via Zustand

// Example: Tender list interactivity
// components/tender/TenderListClient.tsx — Client Component
'use client'
export function TenderListClient({ initialTenders }: { initialTenders: Tender[] }) {
  const { tenders, setTenders, filters } = useTenderStore()
  
  // Hydrate store once on mount
  useEffect(() => {
    setTenders(initialTenders)
  }, [initialTenders])
  
  // All interactions: filter, sort, select, analyze, etc.
}
```

### 4.3 Server Actions (Mutations)

```
[Client Event] → [Server Action] → [Database] → [Revalidate] → [UI Update]

// Example: Analyze tender
// app/actions/analyze.ts
'use server'
export async function analyzeTender(tenderId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  // 1. Fetch tender
  // 2. Call AI provider
  // 3. Parse response
  // 4. Save analysis to DB
  // 5. Return result
  
  revalidatePath('/tenders')
  return { success: true, analysis }
}
```

### 4.4 AI Analysis Flow (Critical Path)

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Upload   │────▶│ Parse CSV/   │────▶│ Save to DB  │────▶│ Trigger AI   │
│  Tender   │     │ Excel file   │     │ (tenders)   │     │ Analysis     │
└──────────┘     └──────────────┘     └─────────────┘     └──────┬───────┘
                                                                  │
                                                                  ▼
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Display  │◀───│ Save to DB   │◀───│ Validate +   │◀───│ AI Provider  │
│  Results  │    │ (analyses)   │     │ Parse Output │     │ (Gemini/Groq)│
└──────────┘     └──────────────┘     └─────────────┘     └──────────────┘

Anti-Hallucination at every step:
- AI response MUST include confidence score (0-100)
- AI response MUST include evidence quotes from source text
- Scores below confidence threshold show warning badge
- Human review toggle: analysis marked "AI-generated, pending review"
- No score is ever shown without its evidence trail
```

---

## 5. Page Layouts

### 5.1 Dashboard Layout (Shared)

```
┌─────────────────────────────────────────────────────┐
│ Header (sticky)                            [User ▾] │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content Area                       │
│ (240px)  │  (flex-1, scrollable)                    │
│          │                                          │
│ □ Home   │  ┌─ PageHeader ──────────────────────┐   │
│ □ Tender │  │ Title          [Action] [Action]  │   │
│ □ Pipe   │  └───────────────────────────────────┘   │
│ □ Report │                                          │
│ □ Config │  ┌─ Content ─────────────────────────┐   │
│          │  │                                    │   │
│          │  │                                    │   │
│          │  │                                    │   │
│          │  └────────────────────────────────────┘   │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│ (Mobile: sidebar becomes hamburger overlay)         │
└─────────────────────────────────────────────────────┘
```

### 5.2 Dashboard Page

```
┌─ PageHeader ────────────────────────────────────────┐
│ Dashboard                        [Upload Tenders ▾] │
└─────────────────────────────────────────────────────┘

┌── StatsRow ─────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│ │Total     │ │Analyzed  │ │Avg Score │ │Pushed  │  │
│ │Tenders   │ │Today     │ │          │ │to CRM  │  │
│ │   127    │ │    12    │ │   73.4   │ │   45   │  │
│ │ +8 today │ │ ▲ 20%    │ │ ▲ 2.1   │ │ ▲ 5    │  │
│ └──────────┘ └──────────┘ └──────────┘ └────────┘  │
└─────────────────────────────────────────────────────┘

┌── Two-Column Layout ────────────────────────────────┐
│ ┌─ RecentTenders (2/3) ──────┐ ┌─ QuickActions ──┐  │
│ │ Latest uploaded tenders    │ │ • Upload CSV    │  │
│ │ with status + score        │ │ • Analyze All   │  │
│ │                            │ │ • View Pipeline │  │
│ │ [View All →]               │ │ • Settings      │  │
│ └────────────────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────┘

┌── ScoreDistribution + PipelineSummary ──────────────┐
│ ┌─ Score Histogram (1/2) ────┐ ┌─ Pipeline (1/2) ─┐ │
│ │ Bar chart: score ranges    │ │ Stage counts     │ │
│ │ 0-25 | 25-50 | 50-75 | 75+│ │ with progress    │ │
│ └────────────────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.3 Tender Detail Page

```
┌─ PageHeader ────────────────────────────────────────┐
│ ← Back to Tenders    Tender #12345                  │
│                      [Analyze ▾] [Push to CRM]      │
└─────────────────────────────────────────────────────┘

┌── Two-Panel Layout ─────────────────────────────────┐
│ ┌─ Tender Info (1/2) ────────┐ ┌─ Analysis (1/2) ─┐ │
│ │                            │ │                  │ │
│ │ Entity: وزارة المالية      │ │ ┌─ScoreGauge──┐  │ │
│ │ Title: ...                 │ │ │    78/100    │  │ │
│ │ Number: T-2026-0042        │ │ │  ● HIGH      │  │ │
│ │ Deadline: Feb 15, 2026     │ │ └─────────────┘  │ │
│ │ Est. Value: SAR 2.5M       │ │                  │ │
│ │ Status: [Scored ●]         │ │ Score Breakdown: │ │
│ │                            │ │ Relevance  85/100│ │
│ │ ┌─ Raw Content ──────────┐ │ │ Budget     72/100│ │
│ │ │ Full tender text       │ │ │ Timeline   80/100│ │
│ │ │ (scrollable)           │ │ │ Compete    65/100│ │
│ │ │                        │ │ │ Strategic  88/100│ │
│ │ └────────────────────────┘ │ │                  │ │
│ │                            │ │ ┌─Evidence────┐  │ │
│ │                            │ │ │ "Budget is  │  │ │
│ │                            │ │ │ allocated..." │ │ │
│ │                            │ │ │ — Sec 3.2   │  │ │
│ │                            │ │ └─────────────┘  │ │
│ │                            │ │                  │ │
│ │                            │ │ Recommendation:  │ │
│ │                            │ │ [✓ PURSUE]       │ │
│ │                            │ │                  │ │
│ │                            │ │ ⚠ AI-generated   │ │
│ │                            │ │ Pending review   │ │
│ └────────────────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 6. Key UI Patterns

### 6.1 Loading States

Every async operation shows a loading state — never blank screens.

```typescript
// Pattern: Skeleton → Content
function TenderList() {
  if (loading) return <TenderTableSkeleton rows={5} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (tenders.length === 0) return <EmptyState type="tenders" />
  return <TenderTable data={tenders} />
}
```

### 6.2 Error States

```typescript
// ErrorState component variants:
// - network: "Connection lost. Check your internet."
// - auth: "Session expired. Please login again."
// - notFound: "Tender not found."
// - aiError: "AI analysis failed. Try again or switch provider."
// - uploadError: "Invalid file format. Please use CSV or Excel."
// - generic: "Something went wrong. Please try again."

// Each has: icon, message, action button, optional details toggle
```

### 6.3 Toast Notifications

```typescript
// Toast positions: bottom-right (LTR), bottom-left (RTL)
// Auto-dismiss after 5 seconds (configurable)
// Types: success (green), error (red), warning (amber), info (blue)

// Usage via Zustand:
const { addToast } = useUIStore()
addToast({
  type: 'success',
  title: 'Analysis Complete',
  description: 'Tender scored 78/100 with high confidence',
})
```

### 6.4 Keyboard Shortcuts (Stretch Goal)

```typescript
// Global shortcuts:
// Ctrl+K → Command palette (search tenders, navigate)
// Ctrl+U → Upload tenders
// Ctrl+/ → Toggle sidebar
// Escape → Close modal/panel

// Tender list shortcuts:
// ↑/↓ → Navigate rows
// Space → Toggle selection
// Enter → Open detail
// A → Analyze selected
```

---

## 7. Responsive Breakpoints

```typescript
// Tailwind defaults used:
// sm: 640px    — Stacked cards → side-by-side
// md: 768px    — Mobile nav → sidebar appears
// lg: 1024px   — Single column → two-panel layouts
// xl: 1280px   — Full dashboard layout

// Mobile-first approach:
// 1. Everything stacks vertically by default
// 2. Sidebar becomes hamburger overlay on < md
// 3. Pipeline board scrolls horizontally on mobile
// 4. Tables get horizontal scroll on small screens
// 5. Stats row wraps to 2x2 grid on small screens
```

---

## 8. Font Loading Strategy

```typescript
// app/layout.tsx
import { Cairo, Noto_Kufi_Arabic, JetBrains_Mono } from 'next/font/google'

const cairo = Cairo({
  subsets: ['latin', 'arabic'],
  display: 'swap',
  variable: '--font-cairo',
})

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-kufi',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

// Apply to <html>:
// <html className={`${cairo.variable} ${notoKufiArabic.variable} ${jetbrainsMono.variable}`}>
```

---

## 9. Performance Budget

| Metric | Target | Why |
|--------|--------|-----|
| First Contentful Paint | < 1.5s | Competition demo must feel instant |
| Largest Contentful Paint | < 2.5s | Dashboard with data should load fast |
| Time to Interactive | < 3.0s | User can click within 3 seconds |
| Bundle Size (JS) | < 200KB gzipped | No heavy charting libraries |
| Lighthouse Score | > 90 | Judges may check dev tools |

**Strategies:**
- Server Components by default (zero client JS for data display)
- Dynamic imports for heavy components (Pipeline board, Charts)
- No charting library — use CSS/SVG for simple charts
- Image optimization via Next.js Image (if any images used)
- Font subsetting (only Latin + Arabic characters needed)

---

## 10. Accessibility Minimums (MVP)

- All interactive elements keyboard-accessible
- Color is never the ONLY way to convey information (add icons/text)
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- Focus visible on all interactive elements (gold outline)
- ARIA labels on icon-only buttons
- Screen reader text for score gauges and charts
- Form fields have associated labels

---

## Cross-Reference

| Document | Relevant Sections |
|----------|-------------------|
| IDEA.md | Problem statement → informs empty states and onboarding copy |
| PRD.md | Features + acceptance criteria → component requirements |
| APP-FLOW.md | Page flows → routing structure and navigation |
| TECH-STACK.md | Stack decisions → library choices and constraints |
| BACKEND.md | Tables + API → TypeScript types and data fetching patterns |
| IMPLEMENTATION.md | Build order → which components to build on which day |
