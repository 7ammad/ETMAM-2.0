# Prompt: A3 Full — Rate Cards + Odoo/CRM (No Placeholders)

**Use this after the 4-tab Settings shell is in place.** Everything is needed now; no "قريباً" placeholders.

---

**Invoke:** @senior-full-stack (or @senior-backend for APIs + @senior-frontend for UI)

**Prompt:**

```
You are senior-full-stack. Implement the FULL Settings Rate Cards and Odoo/CRM tabs. No placeholders — everything is required now.

**1. Read first**
- docs/reports/IRONCLAD-IMPLEMENTATION-PLAN.md (§2 A3)
- docs/context/BACKEND.md (rate_cards, rate_card_items tables; API map: rate-cards GET/POST, rate-cards/[id] GET/DELETE; settings/odoo GET, PUT, settings/odoo/test POST)
- docs/ORCHESTRATION-BRIEF.md (§3 backend stages)
- PRD: Odoo via ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY

**2. Rate Cards tab (full)**
- **Backend:** Server Actions or API routes per BACKEND.md:
  - List: get current user's rate_cards (id, name, file_name, item_count, valid_until, created_at).
  - Upload: accept CSV/Excel file; parse rows (item_name, category, unit, unit_price — map Arabic headers if present); store file in Supabase Storage (or keep in DB if project uses no Storage); insert one row in rate_cards (name, file_path, file_name, user_id); insert rows in rate_card_items (rate_card_id, user_id, item_name, category, unit, unit_price). Use existing types from src/types/database.ts (RateCard, RateCardItem).
  - Delete: delete rate card by id (cascade deletes rate_card_items per schema).
- **Frontend:** In Settings, Rate Cards tab:
  - Upload zone (drag-drop or file input): accept .csv, .xlsx, .xls; optional name/label; submit → call upload action → refetch list.
  - List: table or cards of rate cards (name, file name, item count, date); delete button per row; empty state when none.
  - RTL-friendly; use existing design tokens (navy/gold).

**3. Odoo/CRM tab (full)**
- **Backend:** Server Actions or API routes per BACKEND.md:
  - GET config: return { url, db, username, hasApiKey } (read from process.env ODOO_URL, ODOO_DB, ODOO_USERNAME; do not send ODOO_API_KEY to client; only indicate if set).
  - PUT config: if project has a settings table or server-side config store, persist url, db, username, apiKey (encrypted or env); else document that production config is via .env and show read-only form + Test.
  - POST test: call Odoo XML-RPC (or existing lib) with current config; return success or error message (e.g. تعذر الاتصال بـ Odoo).
- **Frontend:** In Settings, Odoo/CRM tab:
  - Form: ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY (password field). Labels in Arabic optional.
  - "Test connection" button → call test endpoint → show success or error message.
  - If PUT is implemented: "Save" button to persist config; else show note "Configure via .env (ODOO_*)" and only Test.
  - RTL-friendly.

**4. Wiring**
- Replace the placeholder content in src/components/settings/SettingsTabs.tsx for rate-cards and odoo-crm with the new components (e.g. RateCardsTab, OdooConfigTab).
- No new npm dependencies unless already in package.json (use existing xlsx/papaparse for rate card parse if already used for tenders).

**5. Acceptance**
- Rate Cards: can upload a CSV/Excel, see it in the list, delete it. Data in rate_cards and rate_card_items.
- Odoo/CRM: can see current config (or placeholders), click Test and see result. If PUT implemented, can save and test.
- No "قريباً" placeholders in these two tabs.
- Lints clean; existing Evaluation Criteria and General tabs unchanged.
```

---

Use this prompt in a new turn after the 4-tab Settings shell (Rate Cards, Evaluation Criteria, Odoo/CRM, General) is done.
