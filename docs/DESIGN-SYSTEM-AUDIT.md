# Design System Audit — Why the UI Looks Bad and What We Have

**Purpose:** Show exactly what design system exists, where it’s used (or not), and why pages still look inconsistent and low-quality.

---

## 1. What We Actually Have

### 1.1 Dependencies (no full UI library)

| Package | Role |
|--------|------|
| **Tailwind CSS 4** | Utility-first CSS |
| **class-variance-authority (cva)** | Variant styles (e.g. button variants) |
| **clsx + tailwind-merge** | `cn()` for class merging |
| **lucide-react** | Icons |
| **sonner** | Toasts |

There is **no** shadcn/ui, Radix primitives, or MUI. The “design system” is **custom components** in `src/components/ui/` (22 components) plus tokens in `globals.css`.

### 1.2 Tokens (`src/app/globals.css`)

- **Colors:** Navy scale (50–950), gold scale (50–900), semantic (background, foreground, card, border, primary, muted, destructive, etc.), status, confidence.
- **Typography:** `--font-sans` (Cairo + Noto Kufi Arabic), `--font-arabic`, no type scale (no `--text-h1`, `--text-body`, etc.).
- **Radius:** sm, md, lg, full.
- **Shadows:** sm, md, lg, glow.
- **Spacing:** 0–24 in rem.
- **Transitions / animations:** fadeIn, slideUp, pulseGold, scoreFill, shimmer, etc.

So we have a **real token set** (navy/gold, dark-only) but **no typography scale** and **no layout tokens** (section spacing, page max-width, etc.).

### 1.3 Design tokens in JS (`src/lib/design-tokens.ts`)

- **Out of sync with CSS:** Defines `fontFamily.sans: "Inter", "Noto Sans Arabic"` while `globals.css` uses **Cairo + Noto Kufi Arabic**. So we have two different “sources of truth” for type.
- Used mainly for non-Tailwind contexts (e.g. charts). Most of the app uses Tailwind + CSS variables, so this file adds confusion, not consistency.

### 1.4 UI components (`src/components/ui/`)

| Category | Components |
|----------|------------|
| **Atoms** | Button, Badge, Input, Textarea, Label, Spinner, Avatar, Separator |
| **Molecules** | Card, FormField, Select, Tabs, Dialog, Tooltip, Dropzone, Toast |
| **Organisms** | DataTable, ScoreBadge, StatusBadge, EmptyState, Alert, Progress |
| **Layout** | Container, PageHeader, Section |
| **Skeletons** | Skeleton, SkeletonText, SkeletonCard |

So we have a **full set of primitives** (navy/gold, RTL-friendly, with variants). The problem is **where they’re used**.

---

## 2. Why the Pages Look Bad

### 2.1 Design system is barely used in the app shell and dashboard

| Page / area | Uses design system? | What’s actually used |
|-------------|---------------------|------------------------|
| **Landing** | ✅ Yes | Container, Section, Card, CardContent, Badge, buttonVariants |
| **Dashboard layout** | ❌ No | Raw `<aside>`, raw `<Link>` with ad-hoc classes, no Container/Section |
| **Dashboard page** | ⚠️ Partial | StatsRow/StatCard (custom, not Card), raw `<Link>` for CTA, no PageHeader, no Card layout |
| **Tenders page** | ❌ No | Raw `<div>`, raw `<Link>`, TenderListClient with **custom** StatusBadge and **custom table** (not DataTable) |
| **Settings page** | ❌ No | Raw `<main>`, raw `<h1>`, SettingsTabs only |
| **Login / Register** | ❌ No | Raw `<main>`, raw `<input>` and `<button>` (not Input/Button), no Card, no Container |
| **Header** | ❌ No | Raw `<button>` for logout (not design system Button) |

So the **only** place that consistently uses the design system is the **landing page**. Everywhere else is **ad-hoc layout + raw Tailwind**, so the “multiple UI libraries” (the 22 components) are **underused**.

### 2.2 Inconsistent “primary” actions

Same intent (primary CTA) is styled differently:

- **Dashboard:** `bg-primary … hover:bg-primary/90`
- **Tenders:** `bg-primary … hover:bg-gold-600`
- **LoginForm:** `bg-primary … hover:bg-gold-600`

So we have **two different hovers** for the same kind of button. The design system has `buttonVariants({ variant: "primary" })` with a single hover; pages bypass it and invent their own.

### 2.3 Sidebar and header feel like a different product

- **Sidebar:** No icons (Phase 3.4 asked for Lucide icons), no active state (e.g. gold left border + background). Just text links with `hover:bg-muted`. Looks like an unstyled nav.
- **Header:** Plain border, no use of design system Button or spacing tokens. Logout is a custom-styled button.

So the **shell** (sidebar + header) doesn’t follow the same language as the design system (no Card, no Button, no gold accent for active state).

### 2.4 Duplication instead of design system

- **TenderListClient** implements its own `StatusBadge` and table layout instead of using `StatusBadge` and `DataTable` from `@/components/ui`. So we have **two** status badge styles and **two** table patterns.
- **LoginForm** uses raw `<input>` and `<button>` instead of `Input` and `Button` (or at least `buttonVariants`). So form and buttons don’t match the rest of the system.

### 2.5 No shared layout and rhythm

- **No Container on app pages:** Dashboard, Tenders, Settings are full-bleed `p-6` with no max-width or consistent gutters. Landing uses `Container` and feels structured; app pages don’t.
- **No Section / spacing scale:** Section spacing (e.g. `py-12 sm:py-16`) and content rhythm are only on the landing. Dashboard/tenders/settings have one-off `space-y-6` / `mb-6` with no shared scale.
- **No PageHeader on list/detail pages:** We have a `PageHeader` component (title, description, actions) but dashboard and tenders use a raw `<h1>` + flex. So hierarchy and actions layout are inconsistent.

### 2.6 Typography and hierarchy

- **No type scale in tokens:** Headings are ad-hoc (`text-2xl font-bold`, `text-xl font-semibold`). No `--text-display`, `--text-h1`, `--text-body` etc., so size/weight hierarchy is not systematic.
- **design-tokens.ts** mentions Inter/Noto Sans while the app uses Cairo/Noto Kufi in CSS. So “what’s the design system font?” is ambiguous.

### 2.7 Auth and empty states feel unfinished

- Login/register: Centered form only, no Card, no branding block, no use of Container or Section. Feels like a bare form, not part of the same product as the landing.
- Empty states and loading are not consistently using `EmptyState` and `Skeleton` everywhere, so some screens feel empty or unpolished.

---

## 3. Root Causes (Summary)

1. **Design system is only applied on the landing.** App shell, dashboard, tenders, settings, and auth do not consistently use Container, Section, Card, PageHeader, Button, Input, DataTable, StatusBadge.
2. **Two sources of truth:** `globals.css` (Cairo, navy/gold) vs `design-tokens.ts` (Inter, different font stack). Typography and sometimes colors are inconsistent.
3. **Primary actions don’t use the design system.** Pages use raw `Link`/`button` + custom classes instead of `Button` or `buttonVariants`, so CTAs look inconsistent.
4. **Shell (sidebar + header) is custom-built.** No active state, no icons, no design system Button; so the shell doesn’t match the token/component language.
5. **Tables and status badges are reimplemented.** TenderListClient doesn’t use DataTable or StatusBadge, so list pages don’t benefit from the design system.
6. **No layout system for app pages.** No shared Container, Section, or spacing scale for dashboard/tenders/settings, so layout and rhythm are ad-hoc.

---

## 4. What “good” would look like (short list)

- **One source of truth:** Typography and colors from `globals.css` only; align or remove `design-tokens.ts` so it doesn’t contradict (e.g. fix or delete the Inter reference).
- **App shell uses the design system:** Sidebar with Lucide icons + active state (e.g. gold border + bg); Header uses `Button` (or `buttonVariants`) for logout.
- **All primary CTAs** use `Button` or `buttonVariants` (e.g. dashboard and tenders “رفع منافسة” / “رفع منافسات”) so hover and size are consistent.
- **List/detail pages** use `PageHeader` + `Container` (or a shared layout wrapper) and, where applicable, `DataTable` and `StatusBadge` instead of custom table and custom status badges.
- **Auth pages** use `Card` + `Container` (and optionally `Input`/`Button`) so login/register feel like the rest of the product.
- **Shared layout rhythm:** Same section spacing and content width (e.g. Container + Section or a page layout component) for dashboard, tenders, settings.

---

## 5. Next steps (concrete)

1. **Fix token sync:** In `design-tokens.ts`, set `fontFamily.sans` (and any other type) to match `globals.css` (Cairo + Noto Kufi), or remove typography from that file and use CSS as the only source.
2. **Refactor dashboard layout:** Use design system for sidebar (icons, active state) and header (Button for logout).
3. **Refactor dashboard + tenders + settings:** Use `PageHeader` + `Container`; use `Button`/`buttonVariants` for every primary CTA.
4. **Refactor TenderListClient:** Use `DataTable` and `StatusBadge` from `@/components/ui` instead of custom table and custom StatusBadge.
5. **Refactor auth pages:** Wrap form in `Card` + `Container`; use `Input` and `Button` (or `buttonVariants`) for fields and submit.
6. **Document usage:** Add a short “Design system usage” section (or file) that says: app pages must use Container/Section for layout, PageHeader for title/actions, Button/buttonVariants for CTAs, DataTable/StatusBadge for lists, so the UI doesn’t regress again.

Once these are done, the same design system you have (tokens + 22 components) will actually drive the whole app, and the “worst website design” feeling will come from **inconsistent application**, not from missing libraries.
