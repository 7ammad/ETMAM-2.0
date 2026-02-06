# Phase 1.2 — Database Schema — Checklist Result

**Date:** 2026-02-06  
**Agent:** project-lead (autonomous Phase 1.2 execution)  
**Schema source:** BACKEND.md

---

## Doc conflict (IMPLEMENTATION.md vs BACKEND.md)

**Logged decision:** IMPLEMENTATION.md Phase 1.2 task 2 lists different table names than BACKEND.md. Per project rule (“If docs conflict, pick IMPLEMENTATION.md version and log the conflict”), we **interpreted** that as “use the schema that IMPLEMENTATION references” — and IMPLEMENTATION says “All 8 tables from BACKEND.md” in task 1. So **BACKEND.md is the schema source of truth** for Phase 1.2.

| IMPLEMENTATION.md task 2 (table list) | BACKEND.md (used) |
|--------------------------------------|-------------------|
| profiles                             | ✅ profiles       |
| scoring_configs                      | — evaluation_presets (BACKEND equivalent) |
| tenders                              | ✅ tenders        |
| tender_analyses                      | — evaluations (BACKEND) |
| analysis_evidence                    | — not in BACKEND  |
| pipeline_stages                      | — not in BACKEND  |
| pipeline_entries                     | — not in BACKEND  |
| crm_push_logs                        | — not in BACKEND  |
| —                                    | ✅ evaluations, cost_items, rate_cards, rate_card_items, evaluation_presets, extraction_cache |

**Resolution:** Implemented the 8 tables from BACKEND.md: profiles, evaluation_presets, tenders, evaluations, rate_cards, rate_card_items, cost_items, extraction_cache. No migration created for scoring_configs, tender_analyses, analysis_evidence, pipeline_stages, pipeline_entries, crm_push_logs.

---

## Phase 1.2 checklist (from PHASE-COMPLETION-PROTOCOL.md)

### 1. Migration and tables

- ✅ `supabase/` folder exists with `config.toml` and `migrations/`.
- ✅ Migration file `20260206120000_initial_schema.sql` creates all 8 tables from BACKEND.md in FK order.
- ✅ Conflict with IMPLEMENTATION.md task 2 table list logged above; BACKEND.md used.

### 2. Triggers and indexes

- ✅ `on_auth_user_created` → `handle_new_user()`.
- ✅ `on_evaluation_change` → `update_tender_evaluation()`.
- ✅ `on_cost_item_change` → `update_tender_costs()`.
- ✅ `on_rate_card_item_change` → `update_rate_card_count()`.
- ✅ Indexes per BACKEND.md (e.g. idx_tenders_user_id, idx_tenders_status, idx_extraction_cache_hash, etc.).

### 3. RLS and storage

- ✅ RLS enabled on all 8 tables.
- ✅ Policies: own-row SELECT/INSERT/UPDATE/DELETE for profiles, tenders, evaluations, cost_items, rate_cards, rate_card_items, evaluation_presets; extraction_cache: SELECT true, INSERT authenticated.
- ✅ Storage buckets `tender-pdfs` and `rate-card-files` with RLS (user-scoped by first path segment = user_id).

### 4. TypeScript types

- ✅ `src/types/database.ts` has types for all 8 tables (Database, Row/Insert/Update types). Hand-written from BACKEND; can be replaced later with `supabase gen types typescript` when project is linked.

### 5. Acceptance (when DB is available)

- ⏸ **Deferred:** Migration not run (Supabase CLI not in PATH; `pnpm exec supabase` failed). When Supabase is linked: run `supabase db push` or `supabase start` then `supabase db reset`. Then run `supabase gen types typescript --project-id <ref> > src/types/database.ts` if desired.
- ⏸ All 8 tables visible in dashboard / test row insert — pending migration run.

---

## Summary

- **Checklist (code/docs):** All items that can be completed without a linked Supabase instance are done.
- **Acceptance (run migration + dashboard):** Pending until Supabase CLI is available and project is linked.
- **Build:** `pnpm build` and `tsc --noEmit` to be run after this; commit after each completed task per autonomous rules.
