# Etmam 2.0 — Orchestration Brief: Site Map & Backend Stages

**Lead:** System-architect  
**Supporting:** Senior-full-stack, Senior-frontend, Senior-backend  
**Source of truth:** PRD.md (docs/context/PRD.md)  
**Purpose:** Single reference for site map, backend stages, and agent responsibilities. Use this when invoking system-architect (lead) and senior-full-stack / senior-frontend / senior-backend.

---

## 1. Role of Each Agent

| Role | Lead/Support | Responsibility |
|------|----------------|----------------|
| **System-architect** | **Lead** | Own site map, route–backend mapping, and data-flow consistency. Resolve conflicts between frontend routes and backend APIs. Sign off on nav and API surface. |
| **Senior-full-stack** | Support | Implement cross-cutting flows (auth, proxy, Server Actions vs API). Ensure Dashboard, Tender Detail tabs, and Export use correct backend. |
| **Senior-frontend** | Support | Pages, layout, sidebar, Tender Detail tabs (Overview, Cost Estimate, Evaluation, Export). No /pipeline in sidebar per PRD. |
| **Senior-backend** | Support | API routes (or Server Actions), Supabase schema, RLS, export/excel, export/odoo, rate-cards, settings/odoo. |

**Orchestration order:** System-architect produces or validates the canonical site map and backend stage list → senior-backend aligns routes and contracts → senior-frontend aligns pages and nav → senior-full-stack wires flows and fixes gaps.

---

## 2. Canonical Site Map (from PRD §5)

**Authority:** PRD.md Section 5 — Pages & Navigation. No /pipeline page.  
**Validation:** Checked against PRD §5 (Page Map, Dashboard, Tender Detail tabs, Settings areas, Batch export). Auth routes (/login, /register) are implied by PRD NFR (Supabase email/password) and are included for nav completeness.

```
/                     → Dashboard (single view, no tabs)
/login                → Login (auth)
/register             → Register (auth)
/upload               → Tender Input (CSV/Excel + PDF + Manual — all P0)
/tenders              → Tender List (scores, filters, batch actions)
/tenders/[id]         → Tender Detail (4 tabs: Overview | Cost Estimate | Evaluation | Export)
/settings             → Settings (3 areas: Rate Cards | Evaluation Criteria | Odoo/CRM config)
/export               → Batch export (Export All / Push All Qualified)
```

**Dashboard (/)** — Single view, no tabs:
- Total tenders count
- Score distribution (🟢🟡🔴)
- Recent tenders list with quick scores
- Quick action buttons: Upload, Export All

**Tender Detail (/tenders/[id])** — 4 tabs (Cost before Evaluation per PRD §5):
1. **Overview** — extracted/entered data
2. **Cost Estimate** — line items, rate card matching, totals, bid price
3. **Evaluation** — scoring, criteria sliders, recommendation (Profit Potential uses bid price when available)
4. **Export** — Excel download + Push to Odoo (both equal; PRD 6A/6B)

**Settings** — 3 areas (tabs or sections):
- Rate Cards management (F2A)
- Evaluation Criteria presets (F4)
- Odoo / CRM configuration (connection test, .env-backed)

**Explicitly out of scope for nav:** `/pipeline` — not in PRD page map. Export is on Tender Detail + batch on /export. Remove pipeline from sidebar if present.

---

## 3. Backend Stages (API Surface)

**Authority:** BACKEND.md (§2 Route Map) + TECH-STACK.md (§3 Backend). Implementation may use Server Actions instead of API routes where documented in §3.1; export must be implementable (API or Server Action).

| Stage | Route / surface | Purpose | Owner |
|-------|------------------|--------|--------|
| **Tenders** | `/api/tenders` GET, POST; `/api/tenders/[id]` GET, PUT, DELETE; `/api/tenders/import` POST | CRUD + CSV/Excel import | Backend |
| **AI** | `/api/ai/extract` POST | PDF → Gemini extraction | Backend |
| **Evaluation** | `/api/evaluation` POST; `/api/evaluation/presets` GET, POST, PUT, DELETE | Score calc; criteria presets CRUD | Backend |
| **Costs** | `/api/costs` GET, POST, PUT, DELETE; `/api/costs/match` POST | Cost items CRUD; rate card matching | Backend |
| **Rate cards** | `/api/rate-cards` GET, POST; `/api/rate-cards/[id]` GET, DELETE | Upload, list, delete rate cards | Backend |
| **Export** | `/api/export/excel` POST; `/api/export/odoo` POST | Excel 3-sheet export; Push to Odoo | Backend |
| **Settings** | `/api/settings/odoo` GET, PUT; `/api/settings/odoo/test` POST | Odoo config, connection test | Backend |

**Data flow (high level):**
- Upload → tenders/import (CSV/Excel) or ai/extract (PDF) → tenders
- Tender Detail → costs → cost_items; evaluation (score) → evaluations table; export → excel/odoo
- Settings → rate-cards, settings/odoo (persist in DB or .env as per TECH-STACK)

### 3.1 Server Action vs API Route Decisions

**Canonical surface:** BACKEND.md defines API routes as the contract. Either API routes or Server Actions may implement each stage; the table below records the **decided** surface for senior-full-stack and senior-backend.

| Stage | Decided surface | Rationale |
|-------|------------------|-----------|
| **Tenders** | API routes + Server Actions allowed | CRUD/import: API for external or tooling; Server Actions OK for form-triggered create/update/import (e.g. upload flow). Contract: BACKEND.md. |
| **AI** | API route `/api/ai/extract` | File upload + external Gemini call; API route keeps body/stream handling clear. Server Action alternative OK if it delegates to same server-side logic. |
| **Evaluation** | API routes | POST evaluation, presets CRUD — API preferred for presets (list/update from multiple UIs). Server Action OK for "Save evaluation" from Tender Detail. |
| **Costs** | API routes | Cost items CRUD + match; API allows reuse from Export/batch. Server Action OK for inline "Add row" / "Match rates" from Cost tab. |
| **Rate cards** | API routes or Server Actions | Upload/list/delete; either is fine. API preferred if Settings page and other callers need same contract. |
| **Export** | API routes (recommended) or Server Actions | Excel: stream response; Odoo: JSON response. **Recommend API routes** so batch export (/export page) and Tender Detail Export tab share same endpoints. Server Action acceptable for single-tender export from detail page. |
| **Settings (Odoo)** | API routes or Server Actions | GET/PUT config, test connection. Either; API allows future admin/tooling. |

**Summary:** Implement and verify **API routes** per BACKEND.md for all stages. Frontend may call them via `fetch` or via Server Actions that internally call the same server logic (or proxy to API). Export (excel + odoo) must be callable from both Tender Detail tab and batch /export page — single implementation (API or Server Action) reused in both places.

---

## 4. System-architect Checklist (Lead)

- [x] **Site map vs PRD §5:** Confirmed. No /pipeline in nav; Dashboard single view; Tender Detail 4 tabs (Overview, Cost Estimate, Evaluation, Export); Settings 3 areas (Rate Cards, Evaluation Criteria, Odoo/CRM); /export for batch. Auth routes /login, /register included per NFR.
- [x] **Backend stages vs BACKEND.md + TECH-STACK.md:** Confirmed. All stages listed; evaluation presets GET/POST/PUT/DELETE; costs GET/POST/PUT/DELETE + match POST; export/excel and export/odoo present.
- [x] **Server Action vs API:** Documented in §3.1. Canonical = API routes; Server Actions allowed for form-triggered flows; Export recommended as API for reuse by batch and detail.
- [x] **One-page reference:** See §4.1 below.
### 4.1 One-Page: Site Map + Backend Stages

**Frontend (PRD §5)**

| Route | Page | Notes |
|-------|------|--------|
| `/` | Dashboard | Single view: stats, distribution, recent list, Upload, Export All |
| `/login`, `/register` | Auth | Supabase email/password |
| `/upload` | Tender Input | CSV/Excel + PDF + Manual (all P0) |
| `/tenders` | Tender List | Scores, filters, batch actions |
| `/tenders/[id]` | Tender Detail | 4 tabs: Overview \| Cost Estimate \| Evaluation \| Export |
| `/settings` | Settings | Rate Cards \| Evaluation Criteria \| Odoo/CRM |
| `/export` | Batch export | Export All / Push All Qualified |

**Backend (BACKEND.md)**

| Stage | Endpoints | Purpose |
|-------|-----------|--------|
| Tenders | `tenders` GET,POST; `tenders/[id]` GET,PUT,DELETE; `tenders/import` POST | CRUD + import |
| AI | `ai/extract` POST | PDF extraction |
| Evaluation | `evaluation` POST; `evaluation/presets` GET,POST,PUT,DELETE | Score + presets |
| Costs | `costs` GET,POST,PUT,DELETE; `costs/match` POST | Items + matching |
| Rate cards | `rate-cards` GET,POST; `rate-cards/[id]` GET,DELETE | Upload, list, delete |
| Export | `export/excel` POST; `export/odoo` POST | Excel 3-sheet; Odoo push |
| Settings | `settings/odoo` GET,PUT; `settings/odoo/test` POST | Odoo config + test |

**Out of scope for nav:** `/pipeline`. Export is on Tender Detail (tab) + batch on `/export`.

---

- [x] **Signed off.**

---

## 5. Handoffs to Senior-backend / Senior-frontend / Senior-full-stack

**Senior-backend:** Implement or verify routes (or Server Actions) for: tenders, ai/extract, evaluation, costs, rate-cards, export/excel, export/odoo, settings/odoo. Ensure Odoo XML-RPC and Excel 3-sheet format per PRD 6A/6B.

**Senior-frontend:** Implement or verify: (1) Sidebar nav from site map only (no /pipeline). (2) Tender Detail with 4 tabs: Overview, Cost Estimate, Evaluation, Export. (3) Settings with Rate Cards, Evaluation Criteria, Odoo/CRM. (4) Dashboard single view with stats, distribution, recent list, Upload, Export All.

**Senior-full-stack:** Wire Dashboard and Tender Detail to correct backend; ensure Export tab and batch export use export/excel and export/odoo (or equivalent Server Actions). Resolve auth/proxy and any cross-cutting issues.

---

## 6. References

- **PRD:** docs/context/PRD.md (§5 Page Map, §6 Build Schedule, 6A/6B, Feature 5, Feature 2A)
- **BACKEND:** docs/context/BACKEND.md (routes, contracts, schema)
- **TECH-STACK:** docs/context/TECH-STACK.md (route structure, Odoo, Excel)
- **PRD-SOT-MAP:** docs/context/PRD-SOT-MAP.md (single source of truth)

---

*Use this brief when invoking system-architect as lead and senior-full-stack, senior-frontend, senior-backend for orchestration of site map and backend stages.*
